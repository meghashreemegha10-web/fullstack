// @ts-ignore
const pdf = require('pdf-parse');

async function testPdfParse() {
    // Create a minimal PDF buffer (start with %PDF-)
    // This probably won't be a valid PDF for parsing content, but might trigger different errors
    // A better test is to see if the require works and function exists
    console.log('PDF Parse Module:', pdf);
    console.log('Type of module:', typeof pdf);

    try {
        const buffer = Buffer.from('%PDF-1.4\n%...');
        // We expect this to fail parsing but pass the "is it a function" test
        await pdf(buffer);
    } catch (e) {
        console.log('Caught expected parsing error (module loaded correctly):', e.message);
    }
}

testPdfParse();
