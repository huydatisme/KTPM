const fs = require('fs');
const PDFDocument = require('pdfkit');

function createPDF(text, outputPath) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument();

        const writeStream = fs.createWriteStream(outputPath);
        doc.pipe(writeStream);
        doc.font('font/Roboto-Regular.ttf')
        .fontSize(14)
        .text(text, 100, 100);
        doc.text(text);
        doc.end();

        writeStream.on('finish', () => {
            resolve();
        });

        writeStream.on('error', (err) => {
            reject(err);
        });
    });
}

module.exports = { createPDF };