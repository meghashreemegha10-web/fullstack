import { getWorkspaces } from "@/app/actions/workspace"
import Link from "next/link"
import { Folder, Plus, Clock } from "lucide-react"

export async function WorkspaceList() {
    const workspaces = await getWorkspaces()

    if (workspaces.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <Folder className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">No workspaces</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating a new workspace.</p>
                <div className="mt-6">
                    <Link
                        href="/dashboard/workspaces/new"
                        className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                        <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                        New Workspace
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workspaces.map((workspace) => (
                <Link
                    key={workspace.id}
                    href={`/dashboard/workspaces/${workspace.id}`}
                    className="relative flex items-center space-x-3 rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:border-gray-400 hover:shadow-md transition-all"
                >
                    <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <Folder className="h-6 w-6 text-indigo-600" />
                        </div>
                    </div>
                    <div className="min-w-0 flex-1">
                        <span className="absolute inset-0" aria-hidden="true" />
                        <p className="text-sm font-medium text-gray-900">{workspace.name}</p>
                        <p className="truncate text-sm text-gray-500">{workspace.description || "No description"}</p>
                        <div className="flex items-center mt-1 text-xs text-gray-400">
                            <Clock className="w-3 h-3 mr-1" />
                            {new Date(workspace.createdAt).toLocaleDateString()}
                        </div>
                    </div>
                </Link>
            ))}
            <Link
                href="/dashboard/workspaces/new"
                className="relative flex items-center justify-center space-x-3 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-5 shadow-sm hover:border-gray-400 hover:bg-gray-100 transition-all text-gray-500 hover:text-gray-700"
            >
                <div className="flex flex-col items-center">
                    <Plus className="h-8 w-8 mb-1" />
                    <span className="text-sm font-medium">Create New</span>
                </div>
            </Link>
        </div>
    )
}
