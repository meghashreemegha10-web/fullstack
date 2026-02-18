import FirecrawlApp from '@mendable/firecrawl-js';

const firecrawl = new FirecrawlApp({
    apiKey: process.env.FIRECRAWL_API_KEY
});

export interface SearchResult {
    title: string;
    content: string;
    url: string;
}

export async function searchWeb(query: string): Promise<SearchResult[]> {
    try {
        console.log(`Searching web for: ${query}`);
        const response = await firecrawl.search(query, {
            pageOptions: {
                fetchPageContent: true
            },
            searchOptions: {
                limit: 3
            }
        });

        if (!response.data || response.data.length === 0) {
            console.log("No results found from Firecrawl.");
            return [];
        }

        return response.data.map((item: any) => ({
            title: item.title || "No Title",
            content: item.markdown || item.content || "No Content",
            url: item.url
        }));

    } catch (error) {
        console.error("Firecrawl search failed:", error);
        // Fallback or empty to allow chat to proceed with just docs
        return [];
    }
}
