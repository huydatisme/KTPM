const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const path = require('path');
const { image2text } = require('./utils/ocr');
const { translate } = require('./utils/translate');
const { createPDF } = require('./utils/pdf');
const fs = require('fs');

const app = express();

// Middleware
app.use(cors());  // Cho phép CORS để frontend và backend giao tiếp
app.use(fileUpload());  // Middleware để xử lý file upload
app.use(express.json());
app.use(express.static('public'));  // Thư mục chứa file tĩnh (HTML, CSS, JS)

// API xử lý upload ảnh và dịch văn bản
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

// API xuất file PDF với văn bản đã dịch
app.post('/export-pdf', (req, res) => {
    try {
        const { text } = req.body;
        const pdfFile = createPDF(text);
        res.json({ pdfFile });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error creating PDF');
    }
});

// Khởi chạy server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
