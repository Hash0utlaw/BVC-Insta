"use client"

import { useState, useTransition } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Post } from "@/app/types"
import { Checkbox } from "./ui/checkbox"
import { Label } from "./ui/label"
import { ArrowUpRight, Heart, MessageCircle, Loader2, ImageIcon, Video } from "lucide-react"

interface PostCardProps {
  post: Post
  index: number
  onQueue: (post: Post, storeInSupabase: boolean) => Promise<void>
}

export default function PostCard({ post, index, onQueue }: PostCardProps) {
  const [storeInSupabase, setStoreInSupabase] = useState(true)
  const [isQueuing, startTransition] = useTransition()

  const handleQueueClick = () => {
    startTransition(async () => {
      await onQueue(post, storeInSupabase)
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      exit={{ opacity: 0, scale: 0.9 }}
      layout
    >
      <Card className="bg-black/50 border-gold/20 overflow-hidden h-full flex flex-col">
        <CardHeader className="p-4">
          <div className="relative">
            <img
              src={post.displayUrl || "/placeholder.svg"}
              alt={`Post by ${post.authorUsername}`}
              className="aspect-square w-full rounded-lg object-cover"
            />
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-2 right-2 bg-black/50 p-2 rounded-full text-white hover:bg-gold hover:text-black transition-all"
            >
              <ArrowUpRight className="h-4 w-4" />
            </a>
            <Badge variant="outline" className="absolute bottom-2 left-2 bg-black/50 border-gold/50 text-gold">
              {post.isVideo ? <Video className="mr-2 h-4 w-4" /> : <ImageIcon className="mr-2 h-4 w-4" />}
              {post.isVideo ? "Video" : "Image"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-grow">
          <CardTitle className="text-lg font-bold text-white mb-2 truncate">@{post.authorUsername}</CardTitle>
          <p className="text-sm text-gray-400 line-clamp-3 mb-4">{post.caption}</p>
          <div className="flex items-center gap-6 text-sm text-gray-300">
            <div className="flex items-center gap-1.5">
              <Heart className="h-4 w-4 text-red-500" />
              <span>{post.likesCount.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MessageCircle className="h-4 w-4 text-blue-400" />
              <span>{post.commentsCount.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-4 bg-black/30 border-t border-gold/20 flex-col items-start gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`store-${post.id}`}
              checked={storeInSupabase}
              onCheckedChange={(checked) => setStoreInSupabase(Boolean(checked))}
              className="border-gold/50 data-[state=checked]:bg-gold data-[state=checked]:text-black"
            />
            <Label htmlFor={`store-${post.id}`} className="text-sm text-gray-300">
              Store media in Supabase
            </Label>
          </div>
          <Button
            onClick={handleQueueClick}
            disabled={isQueuing}
            className="w-full bg-gold hover:bg-gold/90 text-black font-bold"
          >
            {isQueuing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Queue for Repost"}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
