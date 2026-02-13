import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    if (!session.user.approved) {
        redirect("/pending")
    }

    return (
        <div className="container mx-auto py-10">
            <h1 className="text-3xl font-bold mb-6">User Dashboard</h1>
            <div className="bg-white shadow rounded-lg p-6">
                <p className="text-gray-700 text-lg">
                    Welcome back, <span className="font-semibold">{session.user.name}</span>!
                </p>
                <p className="mt-4 text-gray-600">
                    You have successfully logged in and your account is approved.
                </p>
                <div className="mt-8 border-t pt-6">
                    <h2 className="text-xl font-semibold mb-4">Available Tools</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white border rounded-lg p-6 hover:shadow-md transition cursor-pointer group">
                            <h3 className="text-lg font-bold text-gray-800 group-hover:text-indigo-600">YouTube AI Summarizer</h3>
                            <p className="text-gray-600 mt-2 mb-4">
                                Generate clean study notes and summaries from YouTube videos using AI.
                            </p>
                            <a
                                href="/dashboard/tools/youtube-summarizer"
                                className="text-indigo-600 font-medium hover:underline"
                            >
                                Open Tool &rarr;
                            </a>
                        </div>
                    </div>
                </div>

                <div className="mt-8 border-t pt-6">
                    <h2 className="text-xl font-semibold mb-4">Your Profile</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-500">Email</p>
                            <p className="font-medium">{session.user.email}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Role</p>
                            <p className="font-medium">{session.user.role}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Status</p>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Active
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
