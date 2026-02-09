import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
    const isLoggedIn = !!req.auth
    const isAuthRoute = req.nextUrl.pathname.startsWith("/login") || req.nextUrl.pathname.startsWith("/register")
    const isApiAuthRoute = req.nextUrl.pathname.startsWith("/api/auth")
    const isPublicRoute = req.nextUrl.pathname === "/"
    const isAdminRoute = req.nextUrl.pathname.startsWith("/admin")
    // const isDashboardRoute = req.nextUrl.pathname.startsWith("/dashboard")

    if (isApiAuthRoute) {
        return NextResponse.next()
    }

    if (isAuthRoute) {
        if (isLoggedIn) {
            // @ts-ignore
            if (req.auth?.user?.role === "ADMIN") {
                return NextResponse.redirect(new URL("/admin", req.nextUrl))
            }
            return NextResponse.redirect(new URL("/dashboard", req.nextUrl))
        }
        return NextResponse.next()
    }

    if (!isLoggedIn && !isPublicRoute) {
        return NextResponse.redirect(new URL("/login", req.nextUrl))
    }

    // @ts-ignore
    if (isAdminRoute && req.auth?.user?.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.nextUrl))
    }

    return NextResponse.next()
})

export const config = {
    matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
}
