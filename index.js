const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const path = require('path');
const fs = require('fs');
const amqp = require('amqplib');
const { createPDF } = require('./utils/pdf');

const app = express();
app.use(cors());
app.use(fileUpload());
app.use(express.json());
app.use(express.static('public'));
app.use('/output', express.static(path.join(__dirname, 'output')));

let channel; // Kênh RabbitMQ
const tasks = {}; // Bộ nhớ tạm lưu trữ trạng thái các yêu cầu

// Kết nối tới RabbitMQ
async function connectRabbitMQ() {
    try {
        const connection = await amqp.connect('amqp://rabbitmq.ktpm.svc.cluster.local:5672');
        channel = await connection.createChannel();
        await channel.assertQueue('imageProcessingQueue'); // Hàng đợi xử lý ảnh
        await channel.assertQueue('responseQueue'); // Hàng đợi phản hồi
        setupResponseQueue(); // Thiết lập xử lý hàng đợi phản hồi
    } catch (error) {
        console.error('Error connecting to RabbitMQ:', error);
        process.exit(1);
    }
}
connectRabbitMQ();

// API upload ảnh
app.post('/upload', async (req, res) => {
    try {
        if (!req.files || !req.files.images) {
            return res.status(400).send('No files uploaded');
        }

        const imageFiles = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
        const correlationId = generateCorrelationId();

        // Lưu trạng thái yêu cầu
        tasks[correlationId] = { results: [], total: imageFiles.length, res };

        for (const imageFile of imageFiles) {
            const imagePath = path.join(__dirname, 'uploads', imageFile.name);

            // Lưu ảnh vào thư mục uploads
            await new Promise((resolve, reject) => {
                imageFile.mv(imagePath, (err) => {
                    if (err) return reject(err);
                    resolve();
                });
            });

            // Gửi task vào hàng đợi imageProcessingQueue
            const task = { imagePath };
            channel.sendToQueue('imageProcessingQueue', Buffer.from(JSON.stringify(task)), {
                correlationId,
                replyTo: 'responseQueue',
            });
        }
    } catch (error) {
        console.error('Error uploading images:', error);
        res.status(500).send('Error processing images');
    }
});

// Thiết lập hàng đợi phản hồi
async function setupResponseQueue() {
    // Thiết lập hàng đợi phản hồi với durable: true
const responseQueue = await channel.assertQueue('responseQueue', { durable: true });


    channel.consume(
        responseQueue.queue,
        (msg) => {
            const correlationId = msg.properties.correlationId;
            const result = JSON.parse(msg.content.toString());

            if (tasks[correlationId]) {
                const { results, total, res } = tasks[correlationId];

                // Thêm kết quả vào danh sách
                results.push(result);

                // Nếu đã xử lý xong tất cả ảnh, trả phản hồi về client
                if (results.length === total) {
                    res.json({ results });
                    delete tasks[correlationId]; // Xóa trạng thái yêu cầu khỏi bộ nhớ tạm
                }
            }
        },
        { noAck: true } // Không cần xác nhận
    );
}

// API tạo file PDF
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

// Hàm tạo correlationId
function generateCorrelationId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Khởi chạy server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});