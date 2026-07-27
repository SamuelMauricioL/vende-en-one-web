import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    hasGoogleId: !!process.env.AUTH_GOOGLE_ID,
    hasGoogleSecret: !!process.env.AUTH_GOOGLE_SECRET,
    hasSecret: !!process.env.AUTH_SECRET,
    hasUrl: !!process.env.AUTH_URL,
    url: process.env.AUTH_URL,
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
  })
}
