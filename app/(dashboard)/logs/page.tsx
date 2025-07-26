import { createClient } from "@/lib/supabase/server"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CircleCheck, CircleX } from "lucide-react"

async function getRepostLogs() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("repost_log")
    .select(
      `
      id,
      created_at,
      status,
      message,
      queued_posts (
        id,
        author_username,
        instagram_url
      )
    `,
    )
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) {
    console.error("Error fetching repost logs:", error)
    return []
  }
  return data
}

export default async function LogsPage() {
  const logs = await getRepostLogs()

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="bg-black/50 backdrop-blur-sm border border-gold/20 rounded-xl p-6">
        <h1 className="text-3xl font-bold text-gold mb-2">Repost Logs</h1>
        <p className="text-gray-300 mb-6">History of all repost attempts triggered by your n8n workflow.</p>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b-gold/20 hover:bg-white/5">
                <TableHead className="text-gold">Status</TableHead>
                <TableHead className="text-gold">Post Author</TableHead>
                <TableHead className="text-gold">Details</TableHead>
                <TableHead className="text-gold text-right">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log: any) => (
                <TableRow key={log.id} className="border-b-gold/10 hover:bg-white/5">
                  <TableCell>
                    <Badge
                      variant={log.status === "success" ? "default" : "destructive"}
                      className={
                        log.status === "success" ? "bg-green-600/80 border-green-500" : "bg-red-600/80 border-red-500"
                      }
                    >
                      {log.status === "success" ? (
                        <CircleCheck className="mr-2 h-4 w-4" />
                      ) : (
                        <CircleX className="mr-2 h-4 w-4" />
                      )}
                      {log.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <a
                      href={log.queued_posts.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-gold transition-colors"
                    >
                      @{log.queued_posts.author_username}
                    </a>
                  </TableCell>
                  <TableCell className="text-gray-400">{log.message}</TableCell>
                  <TableCell className="text-right text-gray-400">
                    {new Date(log.created_at).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {logs.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>No logs found.</p>
            <p className="text-sm">Repost attempts will appear here once your n8n workflow runs.</p>
          </div>
        )}
      </div>
    </div>
  )
}
