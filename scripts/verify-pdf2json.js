const PDFParser = require("pdf2json");
const fs = require("fs");

async function testPdf2Json() {
    console.log("Testing pdf2json...");
    // Create a dummy PDF file (minimal structure)
    // Actually, pdf2json might fail on invalid structure, so let's use a minimal valid PDF if possible
    // or just checking if it loads is good step 1.

    // Minimal PDF 1.0 (approx)
    const pdfContent = `%PDF-1.0
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 3 3]>>endobj
xref
0 4
0000000000 65535 f
0000000010 00000 n
0000000060 00000 n
0000000110 00000 n
trailer<</Size 4/Root 1 0 R>>
startxref
149
%%EOF`;

    const buffer = Buffer.from(pdfContent);
    const pdfParser = new PDFParser(null, 1);

    pdfParser.on("pdfParser_dataError", (errData) => {
        console.error("PDF Parser Error (Expected for dummy file maybe):", errData.parserError);
    });

    pdfParser.on("pdfParser_dataReady", (pdfData) => {
        console.log("PDF Parsed Successfully!");
        console.log("Text Content:", pdfParser.getRawTextContent());
    });

    console.log("Parsing buffer...");
    pdfParser.parseBuffer(buffer);
}

testPdf2Json();
