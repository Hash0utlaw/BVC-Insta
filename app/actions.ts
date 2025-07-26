"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { Post } from "./types"

// Define a type for the state returned by our actions
interface ActionResponse {
  success: boolean
  message: string
  data?: any
}

// Helper to generate mock posts for fallback
const makeMockPosts = (tag: string, reason: string, qty = 3): Post[] => {
  // Log the detailed reason to the server console for debugging
  console.warn(`Falling back to mock data for #${tag}. Reason: ${reason}`)
  const mocks: Post[] = []
  for (let i = 0; i < qty; i++) {
    const likes = Math.floor(Math.random() * 2000)
    const comments = Math.floor(Math.random() * 300)
    const score = likes + comments * 2

    mocks.push({
      id: `${tag}_mock_${i}_${Date.now()}`,
      shortcode: `mock_${i}`,
      url: `https://www.instagram.com/p/mock_${i}/`,
      authorUsername: `mock_user_${i}`,
      caption: `This is a mock post for #${tag}. The live API call failed.`,
      displayUrl: `/placeholder.svg?width=500&height=500&query=${tag}+motorcycle+${i}`,
      isVideo: i % 2 === 0,
      likesCount: likes,
      commentsCount: comments,
      engagementScore: score,
    })
  }
  return mocks
}

// Action to fetch and score posts from HikerAPI
export async function fetchAndScorePosts(prevState: any, formData: FormData): Promise<ActionResponse> {
  const hashtags = formData.get("hashtags") as string
  if (!hashtags) {
    return { success: false, message: "Please provide at least one hashtag." }
  }

  const tags = hashtags.split(",").map((tag) => tag.trim())
  let allPosts: Post[] = []
  const uniquePostIds = new Set<string>()
  let fallbackOccurred = false

  const HIKERAPI_KEY = process.env.HIKERAPI_KEY

  if (!HIKERAPI_KEY) {
    return {
      success: true,
      message: "⚠️ HikerAPI key not found. Please configure your API key for live results.",
      data: makeMockPosts("demo", "API key not configured"),
    }
  }

  // Debug logging
  console.log(`[DEBUG] HikerAPI Key found: ${HIKERAPI_KEY.substring(0, 8)}...`)
  console.log(`[DEBUG] Processing hashtags: ${tags.join(", ")}`)

  for (const tag of tags) {
    try {
      // Based on HikerAPI docs: Use V2 endpoint as primary, V1 as fallback
      const endpoints = [
        {
          url: `https://api.hikerapi.com/v2/hashtag/medias/recent`,
          params: { name: tag },
          version: "v2"
        },
        {
          url: `https://api.hikerapi.com/v1/hashtag/medias/recent`,
          params: { name: tag },
          version: "v1"
        }
      ]

      let response: Response | null = null
      let workingEndpoint = ""

      // Try each endpoint until one works
      for (const endpoint of endpoints) {
        try {
          const queryParams = new URLSearchParams(endpoint.params).toString()
          const fullUrl = `${endpoint.url}?${queryParams}`
          
          console.log(`[DEBUG] Trying ${endpoint.version} endpoint: ${fullUrl}`)
          
          const testResponse = await fetch(fullUrl, {
            method: 'GET',
            headers: {
              "x-access-key": HIKERAPI_KEY,
              "accept": "application/json",
              "user-agent": "BikesVsCops-Curator/1.0"
            },
            next: { revalidate: 300 }, // Cache for 5 minutes
          })
          
          console.log(`[DEBUG] ${endpoint.version} Response status: ${testResponse.status}`)
          console.log(`[DEBUG] ${endpoint.version} Content-Type: ${testResponse.headers.get("content-type")}`)
          
          if (testResponse.ok) {
            const contentType = testResponse.headers.get("content-type") || ""
            if (contentType.includes("application/json")) {
              response = testResponse
              workingEndpoint = `${endpoint.version}: ${fullUrl}`
              console.log(`[SUCCESS] Working endpoint found: ${workingEndpoint}`)
              break
            } else {
              console.log(`[WARNING] ${endpoint.version} returned non-JSON: ${contentType}`)
              const responseText = await testResponse.text()
              console.log(`[DEBUG] ${endpoint.version} Response snippet: ${responseText.substring(0, 200)}...`)
            }
          } else {
            console.log(`[WARNING] ${endpoint.version} failed with status: ${testResponse.status}`)
            if (testResponse.status === 401) {
              console.log(`[ERROR] Authentication failed - check your HIKERAPI_KEY`)
            }
          }
        } catch (endpointError: any) {
          console.log(`[DEBUG] ${endpoint.version} endpoint error:`, endpointError.message)
          continue
        }
      }

      if (!response || !workingEndpoint) {
        fallbackOccurred = true
        const reason = "All HikerAPI endpoints failed. Check API key, rate limits, or endpoint availability."
        console.error(`[ERROR] ${reason}`)
        allPosts = allPosts.concat(makeMockPosts(tag, reason))
        continue
      }

      // Parse the response
      console.log(`[DEBUG] Processing successful response from: ${workingEndpoint}`)
      
      const payload = await response.json()
      console.log(`[DEBUG] Response structure:`, Object.keys(payload))
      
      // HikerAPI hashtag endpoints return an array of media objects
      let mediaArray: any[] = []
      
      if (Array.isArray(payload)) {
        mediaArray = payload
      } else if (payload.data && Array.isArray(payload.data)) {
        mediaArray = payload.data
      } else if (payload.items && Array.isArray(payload.items)) {
        mediaArray = payload.items
      } else {
        console.log(`[WARNING] Unexpected response structure for #${tag}`, payload)
        fallbackOccurred = true
        allPosts = allPosts.concat(makeMockPosts(tag, "Unexpected API response structure"))
        continue
      }

      console.log(`[DEBUG] Found ${mediaArray.length} media items for hashtag #${tag}`)

      // Process each media item
      for (const media of mediaArray) {
        try {
          // HikerAPI media object structure based on documentation
          const mediaId = media.pk || media.id || media.code
          
          if (!mediaId || uniquePostIds.has(mediaId.toString())) {
            continue
          }

          // Extract user information
          const user = media.user || media.owner || {}
          const username = user.username || user.name || `user_${mediaId}`
          
          // Extract media information
          const code = media.code || media.shortcode || mediaId
          const caption = media.caption?.text || media.caption || ""
          
          // Extract engagement metrics
          const likeCount = media.like_count || media.likes_count || 0
          const commentCount = media.comment_count || media.comments_count || 0
          const engagementScore = likeCount + (commentCount * 2)
          
          // Extract media URL
          let displayUrl = ""
          if (media.image_versions2?.candidates?.[0]?.url) {
            displayUrl = media.image_versions2.candidates[0].url
          } else if (media.display_url) {
            displayUrl = media.display_url
          } else if (media.thumbnail_url) {
            displayUrl = media.thumbnail_url
          } else {
            console.log(`[WARNING] No display URL found for media ${mediaId}`)
            continue
          }
          
          // Determine if it's a video
          const isVideo = media.media_type === 2 || 
                          media.is_video === true || 
                          media.type === "video"

          // Create post object
          const post: Post = {
            id: mediaId.toString(),
            shortcode: code.toString(),
            url: `https://www.instagram.com/p/${code}/`,
            authorUsername: username,
            caption: caption,
            displayUrl: displayUrl,
            isVideo: isVideo,
            likesCount: likeCount,
            commentsCount: commentCount,
            engagementScore: engagementScore,
          }

          allPosts.push(post)
          uniquePostIds.add(mediaId.toString())
          
          console.log(`[DEBUG] Added post: ${mediaId} by @${username} (${engagementScore} engagement)`)
          
        } catch (mediaError: any) {
          console.log(`[WARNING] Error processing media item:`, mediaError.message)
          continue
        }
      }
      
    } catch (err: any) {
      fallbackOccurred = true
      console.error(`[ERROR] Failed to process hashtag ${tag}:`, err.message)
      allPosts = allPosts.concat(makeMockPosts(tag, `Network error: ${err.message}`))
    }
  }

  // Sort by engagement score (highest first)
  allPosts.sort((a, b) => b.engagementScore - a.engagementScore)

  const finalMessage = fallbackOccurred
    ? `⚠️ Some API requests failed; showing mix of real and mock data. Check server logs for details. Found ${allPosts.length} posts.`
    : `✅ Successfully fetched ${allPosts.length} unique posts from HikerAPI.`

  console.log(`[DEBUG] Final result: ${allPosts.length} posts, fallback occurred: ${fallbackOccurred}`)

  return {
    success: true,
    message: finalMessage,
    data: allPosts,
  }
}

// Action to queue a selected post for reposting
export async function queuePost(post: Post, storeInSupabase: boolean): Promise<ActionResponse> {
  const supabase = createClient()

  try {
    let mediaStoragePath = null
    if (storeInSupabase) {
      // Fetch media and upload to Supabase Storage
      const mediaResponse = await fetch(post.displayUrl)
      if (!mediaResponse.ok) throw new Error("Failed to fetch media from source.")

      const mediaBlob = await mediaResponse.blob()
      const fileExtension = post.displayUrl.split(".").pop()?.split("?")[0] || "jpg"
      const fileName = `${post.authorUsername}_${post.id}.${fileExtension}`
      const filePath = `public/${fileName}`

      const { error: uploadError } = await supabase.storage.from("repost-media").upload(filePath, mediaBlob)

      if (uploadError) throw uploadError
      mediaStoragePath = filePath
    }

    const { error } = await supabase.from("queued_posts").insert({
      instagram_post_id: post.id,
      instagram_url: post.url,
      author_username: post.authorUsername,
      caption: post.caption,
      media_url: post.displayUrl,
      media_type: post.isVideo ? "VIDEO" : "IMAGE",
      engagement_score: post.engagementScore,
      post_data: post as any, // Store the whole post object
      status: "queued",
      media_storage_path: mediaStoragePath,
    })

    if (error) {
      if (error.code === "23505") {
        // unique constraint violation
        return { success: false, message: "This post is already queued." }
      }
      throw error
    }

    revalidatePath("/")
    return { success: true, message: "Post queued successfully!" }
  } catch (error: any) {
    console.error("Error queuing post:", error)
    return { success: false, message: error.message || "Failed to queue post." }
  }
}
