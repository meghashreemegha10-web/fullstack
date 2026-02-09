import { auth, signOut } from "@/auth"

export default async function DashboardPage() {
    const session = await auth()

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="mx-auto max-w-4xl space-y-8">
                <header className="flex items-center justify-between border-b pb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">User Dashboard</h1>
                        <p className="text-gray-500">Welcome back, {session?.user?.name || session?.user?.email}!</p>
                    </div>
                    <form
                        action={async () => {
                            "use server"
                            await signOut()
                        }}
                    >
                        <button className="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 border">
                            Sign Out
                        </button>
                    </form>
                </header>

                <section className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">My Profile</h2>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="bg-gray-50 p-4 rounded border">
                            <span className="text-xs font-semibold text-gray-500 uppercase">Role</span>
                            <p className="font-mono">{session?.user?.role}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded border">
                            <span className="text-xs font-semibold text-gray-500 uppercase">Email</span>
                            <p>{session?.user?.email}</p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    )
}
