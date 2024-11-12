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
        if (!req.files || !req.files.image) {
            return res.status(400).send('No file uploaded');
        }

        const imageFile = req.files.image;
        const imagePath = path.join(__dirname, 'uploads', imageFile.name);

        // Lưu ảnh vào thư mục uploads
        imageFile.mv(imagePath, async (err) => {
            if (err) {
                return res.status(500).send('Error saving file');
            }

            // Chuyển đổi ảnh thành văn bản tiếng Anh
            const text = await image2text(imagePath);

            // Dịch văn bản sang tiếng Việt
            const translatedText = await translate(text);

            // Trả về văn bản đã dịch cho frontend
            res.json({ translatedText });
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error processing image');
    }
});

// API đưa tác vụ tạo PDF vào hàng đợi RabbitMQ
app.post('/export-pdf', (req, res) => {
    try {
        const { text } = req.body;

        // Tạo file PDF từ văn bản đã dịch
        const pdfFile = createPDF(text);

        // Trả về đường dẫn của file PDF cho client
        res.json({ pdfFile: 'output/output.pdf' });
    } catch (error) {
        console.error('Error creating PDF:', error);
        res.status(500).send('Error creating PDF');
    }
});


// Khởi chạy server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
