import { db } from "../lib/db";
import dotenv from 'dotenv';
import path from 'path';

// Load env from root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Force pgbouncer if not already set (for scripts that might load env differently)
if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("pgbouncer=true")) {
    process.env.DATABASE_URL += "&pgbouncer=true";
}

async function main() {
    try {
        const workspaces = await db.workspace.findMany();
        console.log("Workspaces:", workspaces);
    } catch (error) {
        console.error("Error listing workspaces:", error);
    }
}

main();
