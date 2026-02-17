import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';

async function main() {
    const workspaceId = "cmlqnqn870001qu083yg4wl1s"; // Hardcoded for test
    /*
    const workspaceId = process.argv[2];
    if (!workspaceId) {
        console.error("Usage: npx tsx scripts/test-upload-endpoint.ts <workspaceId>");
        process.exit(1);
    }
    */

    const filePath = path.join(__dirname, 'test.pdf');
    if (!fs.existsSync(filePath)) {
        console.log("Creating dummy PDF...");
        fs.writeFileSync(filePath, "This is a test document content.");
    }

    const form = new FormData();
    form.append('files', fs.createReadStream(filePath), {
        filename: 'test.pdf',
        contentType: 'application/pdf',
    });

    console.log(`Uploading to http://localhost:3000/api/workspaces/${workspaceId}/upload ...`);

    try {
        // Check docs before
        const { db } = await import("../lib/db");
        // Force pgbouncer if needed for script env
        if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("pgbouncer=true")) {
            process.env.DATABASE_URL += "&pgbouncer=true";
        }

        const beforeCount = await db.document.count({ where: { workspaceId } });
        console.log(`Documents before: ${beforeCount}`);

        const response = await fetch(`http://localhost:3000/api/workspaces/${workspaceId}/upload`, {
            method: 'POST',
            body: form,
            // headers: form.getHeaders(), // node-fetch/form-data integration
        });

        console.log("Status:", response.status);
        const text = await response.text();
        console.log("Response:", text);

        // Check docs after
        const afterCount = await db.document.count({ where: { workspaceId } });
        console.log(`Documents after: ${afterCount}`);

    } catch (error) {
        console.error("Upload failed:", error);
    }
}

main();
