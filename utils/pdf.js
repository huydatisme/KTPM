const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

function createPDF(text) {
    const doc = new PDFDocument();
    const pdfFile = path.join(__dirname, '../output/output.pdf'); // Đảm bảo đường dẫn đúng
    doc.pipe(fs.createWriteStream(pdfFile));
    doc.font('font/Roboto-Regular.ttf')
        .fontSize(14)
        .text(text, 100, 100);
    doc.end();
    return pdfFile; // Trả về đường dẫn tệp PDF
}

module.exports = {
    createPDF
}
