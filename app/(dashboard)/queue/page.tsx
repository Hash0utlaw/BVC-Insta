import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ExternalLink } from "lucide-react"
import type { QueuedPost } from "@/app/types"

async function getQueuedPosts() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("queued_posts")
    .select("*")
    .in("status", ["queued", "processing"])
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Error fetching queued posts:", error)
    return []
  }
  return data as QueuedPost[]
}

export default async function QueuePage() {
  const posts = await getQueuedPosts()

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-white mb-6">Repost Queue</h1>
      <Card className="bg-black border-gold/20">
        <CardHeader>
          <CardTitle className="text-gold">Posts Awaiting Repost</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b-gold/20 hover:bg-white/5">
                  <TableHead className="text-white">Author</TableHead>
                  <TableHead className="text-white">Status</TableHead>
                  <TableHead className="text-white">Queued At</TableHead>
                  <TableHead className="text-white text-right">Link</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.length > 0 ? (
                  posts.map((post) => (
                    <TableRow key={post.id} className="border-b-gold/20 hover:bg-white/5">
                      <TableCell className="font-medium">@{post.author_username}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            post.status === "queued"
                              ? "bg-blue-500/20 text-blue-300 border-blue-400"
                              : "bg-purple-500/20 text-purple-300 border-purple-400"
                          }
                        >
                          {post.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(post.created_at).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Link href={post.instagram_url} target="_blank" className="text-gold hover:underline">
                          <ExternalLink className="h-4 w-4 inline" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                      The queue is empty.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
