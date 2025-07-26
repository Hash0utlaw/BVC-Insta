import { createClient } from "@/lib/supabase/server"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ImageIcon, Video } from "lucide-react"

async function getQueuedPosts() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("queued_posts")
    .select("*")
    .eq("status", "queued")
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Error fetching queued posts:", error)
    return []
  }
  return data
}

export default async function QueuePage() {
  const queuedPosts = await getQueuedPosts()

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="bg-black/50 backdrop-blur-sm border border-gold/20 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gold mb-2">Repost Queue</h1>
            <p className="text-gray-300">These posts are ready to be published by your n8n workflow.</p>
          </div>
          <Button className="bg-gold hover:bg-gold/90 text-black font-bold mt-4 sm:mt-0">Trigger n8n Workflow</Button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b-gold/20 hover:bg-white/5">
                <TableHead className="text-gold">Preview</TableHead>
                <TableHead className="text-gold">Author</TableHead>
                <TableHead className="text-gold">Type</TableHead>
                <TableHead className="text-gold">Score</TableHead>
                <TableHead className="text-gold text-right">Queued At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queuedPosts.map((post) => (
                <TableRow key={post.id} className="border-b-gold/10 hover:bg-white/5">
                  <TableCell>
                    <a href={post.instagram_url} target="_blank" rel="noopener noreferrer">
                      <img
                        src={post.media_url || "/placeholder.svg"}
                        alt={`Post by ${post.author_username}`}
                        className="h-16 w-16 rounded-md object-cover border-2 border-gold/30"
                      />
                    </a>
                  </TableCell>
                  <TableCell>
                    <a
                      href={`https://instagram.com/${post.author_username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-gold transition-colors"
                    >
                      @{post.author_username}
                    </a>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-gold/50 text-gold">
                      {post.media_type === "VIDEO" ? (
                        <Video className="mr-2 h-4 w-4" />
                      ) : (
                        <ImageIcon className="mr-2 h-4 w-4" />
                      )}
                      {post.media_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono">{post.engagement_score}</TableCell>
                  <TableCell className="text-right text-gray-400">
                    {new Date(post.created_at).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {queuedPosts.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>The repost queue is empty.</p>
            <p className="text-sm">Use the "Curate" page to find and queue new content.</p>
          </div>
        )}
      </div>
    </div>
  )
}
