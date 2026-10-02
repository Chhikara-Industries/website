import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server"

const isProtected = createRouteMatcher(["/dashboard/(.*)", "/dashboard"])
// Note: /reset-password must not redirect authed users — Convex Auth
// establishes a session authorized for the reset before the page renders.
const isAuthPage = createRouteMatcher(["/login", "/signup", "/forgot-password"])

export const proxy = convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  if (isProtected(request) && !(await convexAuth.isAuthenticated())) {
    const next = request.nextUrl.pathname
    if (request.nextUrl.search) {
      return nextjsMiddlewareRedirect(
        request,
        `/login?next=${encodeURIComponent(next + request.nextUrl.search)}`
      )
    }
    return nextjsMiddlewareRedirect(request, `/login?next=${encodeURIComponent(next)}`)
  }

  if (isAuthPage(request) && (await convexAuth.isAuthenticated())) {
    return nextjsMiddlewareRedirect(request, "/dashboard")
  }
})

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}