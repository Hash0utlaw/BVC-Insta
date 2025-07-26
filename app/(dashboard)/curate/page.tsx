"use client"

import { useActionState, useEffect, useState } from "react"
import { fetchAndScorePosts, queuePost } from "@/app/actions"
import type { Post } from "@/app/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import PostCard from "@/components/post-card"
import { AnimatePresence, motion } from "framer-motion"
import { Loader2, Search } from "lucide-react"

const initialState = {
  success: false,
  message: "",
  data: [],
}

export default function CuratePage() {
  const [state, formAction, isPending] = useActionState(fetchAndScorePosts, initialState)
  const [posts, setPosts] = useState<Post[]>([])
  const { toast } = useToast()

  useEffect(() => {
    if (state.success) {
      setPosts(state.data || [])
      if (state.message) {
        toast({
          title: "Fetch Status",
          description: state.message,
        })
      }
    } else if (state.message) {
      toast({
        title: "Error",
        description: state.message,
        variant: "destructive",
      })
    }
  }, [state, toast])

  const handleQueuePost = async (post: Post, storeInSupabase: boolean) => {
    const result = await queuePost(post, storeInSupabase)
    toast({
      title: result.success ? "Success" : "Error",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    })
    if (result.success) {
      // Remove the post from the view after queuing
      setPosts((prevPosts) => prevPosts.filter((p) => p.id !== post.id))
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-black/50 backdrop-blur-sm border border-gold/20 rounded-xl p-6 mb-8"
      >
        <h1 className="text-3xl font-bold text-gold mb-2">Content Curation</h1>
        <p className="text-gray-300 mb-6">Enter hashtags separated by commas to find top-performing content.</p>
        <form action={formAction} className="flex flex-col sm:flex-row gap-4">
          <Input
            name="hashtags"
            placeholder="e.g., superbikes, motolife, bikesvscops"
            className="flex-grow bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:ring-gold"
            required
          />
          <Button type="submit" disabled={isPending} className="bg-gold hover:bg-gold/90 text-black font-bold">
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            Fetch Content
          </Button>
        </form>
      </motion.div>

      <AnimatePresence>
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {posts.map((post, index) => (
            <PostCard key={post.id} post={post} index={index} onQueue={handleQueuePost} />
          ))}
        </motion.div>
      </AnimatePresence>

      {isPending && posts.length === 0 && (
        <div className="flex justify-center items-center mt-10">
          <Loader2 className="h-12 w-12 text-gold animate-spin" />
        </div>
      )}

      {!isPending && posts.length === 0 && state.message && (
        <div className="text-center mt-10 text-gray-400">
          <p>No posts found. Try fetching with different hashtags.</p>
        </div>
      )}
    </div>
  )
}
