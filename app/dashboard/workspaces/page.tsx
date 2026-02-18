import { WorkspaceList } from "@/components/workspace/workspace-list"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Workspaces | AI Dashboard",
    description: "Manage your document workspaces",
}

export default function WorkspacesPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Workspaces</h1>
            </div>
            <WorkspaceList />
        </div>
    )
}
