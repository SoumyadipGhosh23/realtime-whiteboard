import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher([
    /^\/whiteboard\/[^\/]+$/,
])


export default clerkMiddleware(async (auth, req) => {
    if (isProtectedRoute(req)) await auth.protect()
})

export const config = {
    matcher: [
        // Protect API and TRPC routes
        '/(api|trpc)(.*)',

        // Match dynamic whiteboard routes like /whiteboard/abc/123
        '/whiteboard/:path*',

        // Protect all pages except static files or Next internals
        '/((?!_next|.*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
      ],
}