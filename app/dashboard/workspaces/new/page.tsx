import { CreateWorkspaceForm } from "@/components/workspace/create-workspace-form";

export default function CreateWorkspacePage() {
    return (
        <div className="container mx-auto py-10">
            <h1 className="text-2xl font-bold mb-6">Create New Workspace</h1>
            <CreateWorkspaceForm />
        </div>
    );
}
