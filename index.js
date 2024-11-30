const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const path = require('path');
const fs = require('fs');
const amqp = require('amqplib');
const { image2text } = require('./utils/ocr');
const { translate } = require('./utils/translate');
const { createPDF } = require('./utils/pdf');

const app = express();
app.use(cors());
app.use(fileUpload());
app.use(express.json());
app.use(express.static('public'));
app.use('/output', express.static(path.join(__dirname, 'output')));

// Kết nối tới RabbitMQ
async function connectRabbitMQ() {
    const connection = await amqp.connect('amqp://localhost');
    const channel = await connection.createChannel();
    await channel.assertQueue('imageProcessingQueue');
    await channel.assertQueue('pdfCreationQueue');
    return channel;
}

let channel;
connectRabbitMQ().then(ch => channel = ch);

// API xử lý upload ảnh và đưa tác vụ vào hàng đợi RabbitMQ
app.post('/upload', async (req, res) => {
    try {
        if (!req.files || !req.files.images) {
            return res.status(400).send('No files uploaded');
        }

        const imageFiles = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
        const results = [];

        for (const imageFile of imageFiles) {
            const imagePath = path.join(__dirname, 'uploads', imageFile.name);

            // Lưu ảnh vào thư mục uploads
            await new Promise((resolve, reject) => {
                imageFile.mv(imagePath, (err) => {
                    if (err) return reject(err);
                    resolve();
                });
            });

            // Chuyển đổi ảnh thành văn bản tiếng Anh
            const text = await image2text(imagePath);

            // Dịch văn bản sang tiếng Việt
            const translatedText = await translate(text);

            results.push({ filename: imageFile.name, translatedText });
        }

        // Trả về danh sách kết quả đã dịch
        res.json({ results });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error processing images');
    }
});
// API đưa tác vụ tạo PDF vào hàng đợi RabbitMQ
app.post('/export-pdf', async (req, res) => {
    try {
        const { texts } = req.body;

        if (!Array.isArray(texts) || texts.length === 0) {
            return res.status(400).send('No texts provided');
        }

        const pdfFiles = [];

        for (let i = 0; i < texts.length; i++) {
            const text = texts[i];
            const pdfFileName = `output_${i + 1}.pdf`;
            const pdfFilePath = path.join(__dirname, 'output', pdfFileName);

            // Tạo file PDF từ văn bản
            await createPDF(text, pdfFilePath);

            pdfFiles.push({ filename: pdfFileName, path: `output/${pdfFileName}` });
        }

        // Trả về danh sách các file PDF đã tạo
        res.json({ pdfFiles });
    } catch (error) {
        console.error('Error creating PDFs:', error);
        res.status(500).send('Error creating PDFs');
    }
});

// Khởi chạy server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
