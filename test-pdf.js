const fs = require('fs');
const PDFDocument = require('pdfkit');
const { PDFParse } = require('pdf-parse');

async function test() {
    const doc = new PDFDocument();
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', async () => {
        const buffer = Buffer.concat(buffers);
        console.log("PDF created, length:", buffer.length);
        
        try {
            const parser = new PDFParse({ data: buffer });
            const result = await parser.getText();
            await parser.destroy();
            console.log("Parsed text:", result.text);
        } catch (err) {
            console.error("Parse error:", err);
        }
    });
    
    doc.text("Hello world! This is a test resume. I am a software engineer with 10 years of experience in JavaScript and Node.js.");
    doc.end();
}

test();
