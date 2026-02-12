import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

  let dbReachable = false

  if (supabaseUrl && serviceRole) {
    try {
      const admin = createClient(supabaseUrl, serviceRole, {
        auth: { persistSession: false },
      })
      const { error } = await admin.from("profiles").select("id", { count: "exact", head: true })
      dbReachable = !error
    } catch {
      dbReachable = false
    }
  }

  const status = dbReachable ? "ok" : "degraded"
  const httpStatus = dbReachable ? 200 : 503

  return NextResponse.json(
    {
      status,
      timestamp: new Date().toISOString(),
      services: {
        supabase: dbReachable ? "connected" : "unreachable",
      },
    },
    { status: httpStatus },
  )
}
