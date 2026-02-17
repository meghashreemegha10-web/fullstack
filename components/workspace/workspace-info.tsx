"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, FileText, Trash2, Upload } from "lucide-react";
import { useState } from "react";

interface Document {
    id: string;
    title: string;
    createdAt: Date;
}

interface WorkspaceInfoProps {
    workspaceId: string;
    documents: Document[];
}

export function WorkspaceInfo({ workspaceId, documents }: WorkspaceInfoProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [uploading, setUploading] = useState(false);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;

        setUploading(true);
        const formData = new FormData();
        Array.from(e.target.files).forEach((file) => {
            formData.append("files", file);
        });

        try {
            const res = await fetch(`/api/workspaces/${workspaceId}/upload`, {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error("Upload failed");

            const data = await res.json();
            const failures = data.results.filter((r: any) => r.status === "error");

            if (failures.length > 0) {
                alert(`Failed to upload: ${failures.map((f: any) => `${f.file} (${f.error})`).join(", ")}`);
            }

            router.refresh();
        } catch (error) {
            console.error(error);
            alert("Failed to upload files. Check console for details.");
        } finally {
            setUploading(false);
            // Reset input
            e.target.value = "";
        }
    };

    return (
        <div className="bg-white border-l h-full flex flex-col w-80 shrink-0">
            <div className="p-4 border-b">
                <h2 className="font-semibold text-lg mb-4">Workspace Documents</h2>

                <label className={`block w-full cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="border-2 border-dashed border-indigo-300 rounded-lg p-4 text-center hover:bg-indigo-50 transition-colors">
                        <Upload className="mx-auto h-6 w-6 text-indigo-500 mb-2" />
                        <span className="text-sm text-indigo-600 font-medium">
                            {uploading ? "Uploading..." : "Upload PDF/Text"}
                        </span>
                        <input
                            type="file"
                            multiple
                            accept=".pdf,.txt,.md"
                            className="hidden"
                            onChange={handleUpload}
                            disabled={uploading}
                        />
                    </div>
                </label>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {documents.map((doc) => (
                    <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-100 group"
                    >
                        <div className="flex items-center min-w-0">
                            <FileText className="h-4 w-4 text-gray-400 mr-2 shrink-0" />
                            <div className="truncate text-sm text-gray-700" title={doc.title}>
                                {doc.title}
                            </div>
                        </div>
                        {/* Future: Delete button */}
                    </div>
                ))}
                {documents.length === 0 && (
                    <div className="text-center text-sm text-gray-500 py-8">
                        No documents yet.
                    </div>
                )}
            </div>
        </div>
    );
}
