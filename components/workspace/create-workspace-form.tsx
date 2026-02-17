"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const formSchema = z.object({
    name: z.string().min(1, "Name is required").max(50, "Name is too long"),
    description: z.string().optional(),
});

export function CreateWorkspaceForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            description: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch("/api/workspaces", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(values),
            });

            if (!response.ok) {
                throw new Error("Failed to create workspace");
            }

            const workspace = await response.json();
            router.push(`/dashboard/workspaces/${workspace.id}`);
            router.refresh();
        } catch (err) {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-lg">
            {error && (
                <div className="p-3 bg-red-50 text-red-500 text-sm rounded-md">
                    {error}
                </div>
            )}

            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Workspace Name
                </label>
                <input
                    {...form.register("name")}
                    type="text"
                    id="name"
                    className="mt-1 block w-full rounded-md border text-gray-900 border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                    placeholder="e.g. Project Alpha"
                />
                {form.formState.errors.name && (
                    <p className="mt-1 text-sm text-red-600">
                        {form.formState.errors.name.message}
                    </p>
                )}
            </div>

            <div>
                <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700"
                >
                    Description (Optional)
                </label>
                <textarea
                    {...form.register("description")}
                    id="description"
                    rows={3}
                    className="mt-1 block w-full rounded-md border text-gray-900 border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                    placeholder="Brief details about this workspace..."
                />
            </div>

            <div className="flex gap-4">
                <button
                    type="submit"
                    disabled={loading}
                    className="flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? "Creating..." : "Create Workspace"}
                </button>
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}
