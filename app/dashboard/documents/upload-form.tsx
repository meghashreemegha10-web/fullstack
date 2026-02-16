"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DocumentUploadForm() {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const router = useRouter();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/documents/upload", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const data = await res.json();
                console.error("Upload failed", data);
                alert(`Upload failed: ${data.error}`);
            } else {
                router.refresh();
                setFile(null);
            }
        } catch (error) {
            console.error("Error uploading:", error);
            alert("Error uploading file");
        } finally {
            setUploading(false);
        }
    };

    return (
        <form onSubmit={handleUpload} className="mb-8 p-6 bg-white rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Upload New Document</h3>
            <div className="flex gap-4 items-center">
                <input
                    type="file"
                    accept=".pdf,.txt"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2.5 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100
                        cursor-pointer border border-gray-200 rounded-lg p-2"
                />
                <button
                    type="submit"
                    disabled={!file || uploading}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                >
                    {uploading ? "Uploading..." : "Upload"}
                </button>
            </div>
            <p className="mt-2 text-xs text-gray-500">Supported formats: PDF, TXT</p>
        </form>
    );
}
