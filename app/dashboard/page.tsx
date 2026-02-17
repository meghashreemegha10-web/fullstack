import { auth, signOut } from "@/auth"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
    const session = await auth()

    // REMOVED REDIRECTS FOR GUESTS
    // if (!session?.user) {
    //     redirect("/login")
    // }

    // if (!session.user.approved) {
    //     redirect("/pending")
    // }

    const user = session?.user || { name: "Guest", email: "guest@example.com", role: "GUEST", approved: true };

    return (
        <div className="container mx-auto py-10">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">User Dashboard</h1>
                {session?.user && (
                    <form
                        action={async () => {
                            "use server"
                            await signOut({ redirectTo: "/" })
                        }}
                    >
                        <button type="submit" className="text-sm text-red-600 hover:text-red-800 font-medium border border-red-200 px-3 py-1 rounded hover:bg-red-50 transition-colors">
                            Sign Out
                        </button>
                    </form>
                )}
                {!session?.user && (
                    <a href="/login" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium border border-indigo-200 px-3 py-1 rounded hover:bg-indigo-50 transition-colors">
                        Sign In
                    </a>
                )}
            </div>
            <div className="bg-white shadow rounded-lg p-6">
                <p className="text-gray-700 text-lg">
                    Welcome back, <span className="font-semibold">{user.name}</span>!
                </p>
                <p className="mt-4 text-gray-600">
                    {session?.user ? "You have successfully logged in and your account is approved." : "You are browsing as a guest. Some features may be limited."}
                </p>
                <div className="mt-8 border-t pt-6">
                    <h2 className="text-xl font-semibold mb-4">Available Tools</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-white border rounded-lg p-6 hover:shadow-md transition cursor-pointer group">
                            <h3 className="text-lg font-bold text-gray-800 group-hover:text-indigo-600">Multi-Doc Workspaces</h3>
                            <p className="text-gray-600 mt-2 mb-4">
                                Create workspaces, upload multiple documents, and chat with your entire knowledge base.
                            </p>
                            <a
                                href="/dashboard/workspaces"
                                className="text-indigo-600 font-medium hover:underline"
                            >
                                Open Workspaces &rarr;
                            </a>
                        </div>

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

                        <div className="bg-white border rounded-lg p-6 hover:shadow-md transition cursor-pointer group">
                            <h3 className="text-lg font-bold text-gray-800 group-hover:text-indigo-600">Document Q&A (Legacy)</h3>
                            <p className="text-gray-600 mt-2 mb-4">
                                Upload PDFs or text files and ask questions to get AI-generated answers.
                            </p>
                            <a
                                href="/dashboard/documents"
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
                            <p className="font-medium">{user.email}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Role</p>
                            <p className="font-medium">{user.role}</p>
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
