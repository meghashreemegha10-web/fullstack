import { PDFParse } from 'pdf-parse';

async function main() {
    console.log('🧪 Testing pdf-parse library (v2)...');

    // Minimal valid PDF with "Hello World"
    const pdfContent = `%PDF-1.7
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> >>
endobj
4 0 obj
<< /Length 44 >>
stream
BT /F1 24 Tf 100 700 Td (Hello World) Tj ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000010 00000 n
0000000060 00000 n
0000000157 00000 n
0000000307 00000 n
trailer
<< /Size 5 /Root 1 0 R >>
startxref
401
%%EOF`;

    const buffer = Buffer.from(pdfContent);

    try {
        const parser = new PDFParse({ data: buffer });
        const data = await parser.getText();
        await parser.destroy();

        console.log('✅ PDF parsed successfully!');
        console.log('📄 Text Content:', data.text.trim());

        if (data.text.includes('Hello World')) {
            console.log('🎉 Verification PASSED: Found "Hello World"');
        } else {
            console.error('❌ Verification FAILED: "Hello World" not found');
        }

    } catch (error) {
        console.error('❌ Error parsing PDF:', error);
    }
}

main();
