"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";

export default function YouTubeSummarizerPage() {
    const [url, setUrl] = useState("");
    const [summary, setSummary] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSummary("");

        try {
            const response = await fetch("/api/summarize", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ url }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to generate summary");
            }

            setSummary(data.summary);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">YouTube AI Summarizer</h1>

            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
                            YouTube Video URL
                        </label>
                        <input
                            type="url"
                            id="url"
                            placeholder="https://www.youtube.com/watch?v=..."
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 px-4 rounded-md text-white font-medium transition-colors ${loading
                                ? "bg-indigo-400 cursor-not-allowed"
                                : "bg-indigo-600 hover:bg-indigo-700"
                            }`}
                    >
                        {loading ? "Analyzing Video..." : "Summarize & Generate Notes"}
                    </button>
                </form>

                {error && (
                    <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md border border-red-200">
                        <strong>Error:</strong> {error}
                    </div>
                )}
            </div>

            {summary && (
                <div className="bg-white p-8 rounded-lg shadow-lg prose prose-indigo max-w-none">
                    <ReactMarkdown>{summary}</ReactMarkdown>
                </div>
            )}
        </div>
    );
}
