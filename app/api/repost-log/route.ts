import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// Webhook endpoint for n8n to call after a repost attempt
export async function POST(request: Request) {
  const N8N_WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET
  const incomingSecret = request.headers.get("Authorization")?.split(" ")[1]

  // Secure the webhook with a secret key
  if (!N8N_WEBHOOK_SECRET || incomingSecret !== N8N_WEBHOOK_SECRET) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const { queuedPostId, status, details } = await request.json()
    if (!queuedPostId || !status) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    const supabase = createClient()

    // 1. Update the status of the queued post
    const { error: updateError } = await supabase
      .from("queued_posts")
      .update({ status: status === "success" ? "reposted" : "failed" })
      .eq("id", queuedPostId)

    if (updateError) throw updateError

    // 2. Create a log entry
    const { error: logError } = await supabase.from("repost_log").insert({
      queued_post_id: queuedPostId,
      status: status,
      repost_timestamp: new Date().toISOString(),
      details: details,
    })

    if (logError) throw logError

    return NextResponse.json({ success: true, message: "Log updated successfully." })
  } catch (error: any) {
    console.error("Error in repost-log webhook:", error)
    return new NextResponse(`Internal Server Error: ${error.message}`, { status: 500 })
  }
}
