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

  for (const tag of tags) {
    try {
      const url = `https://hikerapi.com/v1/instagram/hashtag/recent-media?hashtag=${encodeURIComponent(tag)}`

      // CORRECTED: Using standard 'Authorization: Bearer' header
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${HIKERAPI_KEY}`,
        },
        next: { revalidate: 300 }, // Cache for 5 minutes
      })

      if (!response.ok) {
        fallbackOccurred = true
        const errorText = await response.text()
        allPosts = allPosts.concat(
          makeMockPosts(tag, `API returned status ${response.status}. Response: ${errorText.slice(0, 200)}...`),
        )
        continue
      }

      const contentType = response.headers.get("content-type") ?? ""
      if (!contentType.includes("application/json")) {
        fallbackOccurred = true
        // ENHANCED LOGGING: Capture the HTML response for debugging
        const responseText = await response.text()
        const reason = `API returned non-JSON response (${contentType}). Snippet: ${responseText.slice(0, 300)}...`
        allPosts = allPosts.concat(makeMockPosts(tag, reason))
        continue
      }

      type HikerApiPayload = { data?: any[] }
      const payload = (await response.json()) as HikerApiPayload
      const data = Array.isArray(payload.data) ? payload.data : []

      for (const post of data) {
        if (!uniquePostIds.has(post.id)) {
          const score = (post.likes_count ?? 0) + (post.comments_count ?? 0) * 2
          allPosts.push({
            id: post.id,
            shortcode: post.shortcode,
            url: `https://www.instagram.com/p/${post.shortcode}/`,
            authorUsername: post.owner.username,
            caption: post.caption,
            displayUrl: post.display_url,
            isVideo: post.is_video,
            likesCount: post.likes_count,
            commentsCount: post.comments_count,
            engagementScore: score,
          })
          uniquePostIds.add(post.id)
        }
      }
    } catch (err: any) {
      fallbackOccurred = true
      allPosts = allPosts.concat(makeMockPosts(tag, `Fetch failed: ${err.message}`))
    }
  }

  allPosts.sort((a, b) => b.engagementScore - a.engagementScore)

  return {
    success: true,
    message: fallbackOccurred
      ? `⚠️ API request failed; showing mock data. Check server logs for details. Found ${allPosts.length} posts.`
      : `Successfully fetched ${allPosts.length} unique posts.`,
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
