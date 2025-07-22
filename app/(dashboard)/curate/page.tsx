"use client"

import { useEffect, useState } from "react"
import { useActionState } from "react"
import { fetchAndScorePosts } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { PostCard } from "@/components/post-card"
import type { Post } from "@/app/types"

const initialState = {
  success: false,
  message: "",
  data: [] as Post[],
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
}

export default function CuratePage() {
  const [state, formAction, isPending] = useActionState(fetchAndScorePosts, initialState)
  const [storeInSupabase, setStoreInSupabase] = useState(true)
  const [posts, setPosts] = useState<Post[]>([])

  // Synchronise posts AFTER render when `state.data` changes
  useEffect(() => {
    if (Array.isArray(state.data)) {
      setPosts(state.data)
    } else {
      // fall back to empty array on error/undefined
      setPosts([])
    }
  }, [state.data])

  const handlePostQueued = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId))
  }

  return (
    <div className="space-y-8">
      <Card className="bg-black border-gold/20">
        <CardHeader>
          <CardTitle className="text-gold">Find & Curate Content</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div>
              <Label htmlFor="hashtags" className="text-white">
                Instagram Hashtags
              </Label>
              <Input
                id="hashtags"
                name="hashtags"
                type="text"
                placeholder="e.g., superbikes, motovlog, bikestagram"
                required
                className="bg-black border-gold/30 focus:border-gold focus:ring-gold"
              />
              <p className="text-sm text-muted-foreground mt-1">Enter comma-separated hashtags.</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="store-media"
                  checked={storeInSupabase}
                  onCheckedChange={setStoreInSupabase}
                  className="data-[state=checked]:bg-gold"
                />
                <Label htmlFor="store-media">Store Media in Supabase</Label>
              </div>
              <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Fetch Posts
              </Button>
            </div>
          </form>
          {state.message && !isPending && (
            <p className={`mt-4 text-sm ${state.success ? "text-green-400" : "text-red-400"}`}>{state.message}</p>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-semibold mb-4 text-white">Fetched Posts</h2>
        {isPending && (
          <div className="text-center p-8 text-muted-foreground">
            Fetching posts... <Loader2 className="inline-block h-5 w-5 animate-spin" />
          </div>
        )}
        <AnimatePresence>
          {posts.length > 0 && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {posts.map((post: Post) => (
                <PostCard key={post.id} post={post} storeInSupabase={storeInSupabase} onPostQueued={handlePostQueued} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        {!isPending && posts.length === 0 && state.message && (
          <div className="text-center text-muted-foreground py-10">No posts found. Try different hashtags.</div>
        )}
      </div>
    </div>
  )
}
