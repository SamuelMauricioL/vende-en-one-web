import { auth } from "@/lib/auth"

export default auth((req) => {
  if (!req.auth) {
    const signInUrl = new URL("/auth/signin", req.url)
    signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname)
    return Response.redirect(signInUrl)
  }
})

export const config = {
  matcher: ["/app/:path*"],
}
