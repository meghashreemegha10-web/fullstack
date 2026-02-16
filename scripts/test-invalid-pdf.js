const pdf = require('pdf-parse');

async function testInvalidPdf() {
    const buffer = Buffer.from('This is not a PDF file');
    try {
        await pdf(buffer);
        console.log('Error: Should have failed parsing');
    } catch (error) {
        console.log('Success: Caught expected error:', error.message || error);
    }
}

testInvalidPdf();
