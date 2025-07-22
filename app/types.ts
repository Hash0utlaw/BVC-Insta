export interface Post {
  id: string
  shortcode: string
  url: string
  authorUsername: string
  caption: string
  displayUrl: string
  isVideo: boolean
  likesCount: number
  commentsCount: number
  engagementScore: number
}

export interface QueuedPost {
  id: string
  created_at: string
  instagram_url: string
  author_username: string
  status: "queued" | "processing" | "reposted" | "failed" | "ignored"
}

export interface RepostLog {
  id: string
  created_at: string
  status: string
  repost_timestamp: string
  details: string
  queued_posts: {
    author_username: string
    instagram_url: string
  } | null
}
