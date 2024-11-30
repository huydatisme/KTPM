const fs = require('fs');
const PDFDocument = require('pdfkit');

function createPDF(text, outputPath) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument();

        const writeStream = fs.createWriteStream(outputPath);
        doc.pipe(writeStream);

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