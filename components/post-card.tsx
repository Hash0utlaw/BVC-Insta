"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { useToast } from "@/hooks/use-toast"
import { queuePost } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ThumbsUp, MessageSquare, CloudUpload, Loader2, ExternalLink } from "lucide-react"
import type { Post } from "@/app/types"

const cardVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
    },
  },
}

interface PostCardProps {
  post: Post
  storeInSupabase: boolean
  onPostQueued: (postId: string) => void
}

export function PostCard({ post, storeInSupabase, onPostQueued }: PostCardProps) {
  const [isQueuing, setIsQueuing] = useState(false)
  const { toast } = useToast()

  const handleQueuePost = async () => {
    setIsQueuing(true)
    const result = await queuePost(post, storeInSupabase)
    toast({
      title: result.success ? "Success" : "Error",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    })
    if (result.success) {
      onPostQueued(post.id)
    }
    setIsQueuing(false)
  }

  return (
    <motion.div variants={cardVariants}>
      <Card className="bg-black border border-gold/20 overflow-hidden flex flex-col h-full transition-all duration-300 hover:border-gold hover:shadow-lg hover:shadow-gold/10">
        <CardHeader className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="font-semibold text-white truncate">@{post.authorUsername}</div>
            <Link
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gold hover:underline flex-shrink-0"
            >
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-grow">
          <div className="aspect-square relative">
            <Image
              src={post.displayUrl || "/placeholder.svg"}
              alt={`Instagram post by ${post.authorUsername}`}
              fill
              className="object-cover"
            />
          </div>
          <div className="p-4 space-y-3">
            <p className="text-sm text-muted-foreground line-clamp-2">{post.caption}</p>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Badge variant="secondary" className="flex items-center gap-1">
                <ThumbsUp className="h-3 w-3" /> {post.likesCount}
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" /> {post.commentsCount}
              </Badge>
              <Badge className="bg-gold/20 text-gold border-gold/50">Score: {post.engagementScore}</Badge>
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-4 bg-black/50 mt-auto">
          <Button className="w-full" onClick={handleQueuePost} disabled={isQueuing}>
            {isQueuing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CloudUpload className="mr-2 h-4 w-4" />}
            Queue for Repost
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
