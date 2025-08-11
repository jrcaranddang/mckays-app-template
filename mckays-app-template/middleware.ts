/*
<ai_context>
Contains middleware for protecting routes, checking user authentication, and redirecting as needed.
</ai_context>
*/

import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export default async function middleware(req: NextRequest) {
  if (process.env.DISABLE_CLERK === "1") {
    return NextResponse.next()
  }

  const { clerkMiddleware, createRouteMatcher } = await import(
    "@clerk/nextjs/server"
  )

  const isProtectedRoute = createRouteMatcher(["/todo(.*)"])

  return clerkMiddleware(async (auth, req) => {
    const { userId, redirectToSignIn } = await auth()

    if (!userId && isProtectedRoute(req)) {
      return redirectToSignIn({ returnBackUrl: "/login" })
    }

    if (userId && isProtectedRoute(req)) {
      return NextResponse.next()
    }
  })(req)
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"]
}