const amqp = require('amqplib');
const path = require('path');
const fs = require('fs');
const { image2text } = require('./utils/ocr');
const { translate } = require('./utils/translate');
const { createPDF } = require('./utils/pdf');

// Kết nối tới RabbitMQ
async function connectRabbitMQ() {
    const connection = await amqp.connect('amqp://localhost');
    const channel = await connection.createChannel();
    await channel.assertQueue('imageProcessingQueue');
    await channel.assertQueue('pdfCreationQueue');
    return channel;
}

async function startWorker() {
    const channel = await connectRabbitMQ();

    // Worker xử lý hàng đợi imageProcessingQueue
    channel.consume('imageProcessingQueue', async (msg) => {
        if (msg !== null) {
            const task = JSON.parse(msg.content.toString());
            const { imagePath } = task;

            try {
                // Chuyển đổi ảnh thành văn bản và dịch
                const text = await image2text(imagePath);
                const translatedText = await translate(text);

                console.log(`Processed image: ${imagePath}, Translated Text: ${translatedText}`);
            } catch (error) {
                console.error('Error processing image:', error);
            }

            channel.ack(msg);  // Xác nhận đã xử lý xong
        }
    });

    // Worker xử lý hàng đợi pdfCreationQueue
    channel.consume('pdfCreationQueue', async (msg) => {
        if (msg !== null) {
            const task = JSON.parse(msg.content.toString());
            const { text } = task;

            try {
                // Tạo file PDF từ văn bản
                const pdfFile = createPDF(text);
                console.log(`PDF created: ${pdfFile}`);
            } catch (error) {
                console.error('Error creating PDF:', error);
            }

            channel.ack(msg);  // Xác nhận đã xử lý xong
        }
    });

    console.log('Worker started and listening to queues...');
}

startWorker().catch(console.error);
