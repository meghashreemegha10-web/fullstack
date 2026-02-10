import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user
            const isOnDashboard = nextUrl.pathname.startsWith("/dashboard")
            const isOnAdmin = nextUrl.pathname.startsWith("/admin")

            if (isOnAdmin) {
                if (isLoggedIn && auth.user.role === "ADMIN") return true
                return false // Redirect unauthenticated or non-admin users
            }

            if (isOnDashboard) {
                if (isLoggedIn && auth.user.approved) return true
                return false
            }

            if (isLoggedIn) {
                // Redirect authenticated users to dashboard or admin based on role
                // This logic might need to be in the middleware or component if not here
                if (nextUrl.pathname === "/" || nextUrl.pathname === "/login" || nextUrl.pathname === "/register") {
                    if (auth.user.role === "ADMIN") {
                        return Response.redirect(new URL("/admin", nextUrl))
                    }
                    if (auth.user.approved) {
                        return Response.redirect(new URL("/dashboard", nextUrl))
                    }
                    return Response.redirect(new URL("/pending", nextUrl))
                }
            }
            return true
        },
        jwt({ token, user }) {
            if (user) {
                token.role = (user as any).role
                token.approved = (user as any).approved
            }
            return token
        },
        session({ session, token }) {
            if (token && session.user) {
                (session.user as any).role = token.role;
                (session.user as any).approved = token.approved;
            }
            return session
        }
    },
    providers: [], // Configured in auth.ts
} satisfies NextAuthConfig
