import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { CheckCircle, XCircle, ExternalLink } from "lucide-react"
import type { RepostLog } from "@/app/types"

async function getRepostLogs() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("repost_log")
    .select(
      `
      id,
      created_at,
      status,
      repost_timestamp,
      details,
      queued_posts (
        author_username,
        instagram_url
      )
    `,
    )
    .order("repost_timestamp", { ascending: false })
    .limit(50)

  if (error) {
    console.error("Error fetching repost logs:", error)
    return []
  }
  return data as RepostLog[]
}

export default async function LogsPage() {
  const logs = await getRepostLogs()

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-white mb-6">Repost Logs</h1>
      <Card className="bg-black border-gold/20">
        <CardHeader>
          <CardTitle className="text-gold">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b-gold/20 hover:bg-white/5">
                  <TableHead className="text-white">Status</TableHead>
                  <TableHead className="text-white">Author</TableHead>
                  <TableHead className="text-white">Details</TableHead>
                  <TableHead className="text-white">Timestamp</TableHead>
                  <TableHead className="text-white text-right">Post</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <TableRow key={log.id} className="border-b-gold/20 hover:bg-white/5">
                      <TableCell>
                        <Badge
                          variant={log.status === "success" ? "default" : "destructive"}
                          className={
                            log.status === "success"
                              ? "bg-green-500/20 text-green-300 border-green-400"
                              : "bg-red-500/20 text-red-300 border-red-400"
                          }
                        >
                          {log.status === "success" ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <XCircle className="h-3 w-3 mr-1" />
                          )}
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell>@{log.queued_posts?.author_username || "N/A"}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{log.details}</TableCell>
                      <TableCell>{new Date(log.repost_timestamp).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        {log.queued_posts?.instagram_url && (
                          <Link
                            href={log.queued_posts.instagram_url}
                            target="_blank"
                            className="text-gold hover:underline"
                          >
                            <ExternalLink className="h-4 w-4 inline" />
                          </Link>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                      No logs found.
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
