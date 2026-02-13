import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();

  // Remove redirect to allow users to see the landing page
  // if (session?.user) {
  //   redirect("/dashboard");
  // }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex flex-col gap-8">
        <h1 className="text-5xl font-bold text-center">
          Secure Role-Based Dashboard
        </h1>
        <p className="text-xl text-center max-w-2xl text-indigo-100">
          A production-ready Next.js application with robust authentication,
          authorization, and role management.
        </p>

        <div className="flex gap-4 mt-8">
          {session?.user ? (
            <Link
              href={(session.user as any).role === "ADMIN" ? "/admin" : "/dashboard"}
              className="px-6 py-3 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-indigo-50 transition shadow-lg"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="px-6 py-3 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-indigo-50 transition shadow-lg"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="px-6 py-3 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
