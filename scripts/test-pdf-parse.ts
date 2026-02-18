
const { PDFParse } = require("pdf-parse");

async function main() {
    console.log("Testing pdf-parse v2...");

    try {
        const buffer = Buffer.from("Date: 2024-01-01\nContent: Hello World");

        console.log("Instantiating PDFParse with dummy data...");
        // Using dummy buffer might fail if it expects real PDF structure, but let's see if it instantiates and method exists.
        // Ideally I should catch the specific parsing error, but confirm loading worked.
        const parser = new PDFParse({ data: buffer });

        console.log("Calling getText()...");
        try {
            const result = await parser.getText();
            console.log("Success:", result.text);
        } catch (e: any) {
            console.log("getText failed (expected for non-PDF buffer):", e.message.slice(0, 100));
            if (e.message.includes("InvalidPDFException") || e.message.includes("FormatError")) {
                console.log("✅ API usage seems correct, just invalid data.");
            }
        }

    } catch (error: any) {
        console.error("❌ Test failed:", error.message);
        console.error(error);
    }
}

main();
