const amqp = require('amqplib');
const path = require('path');
const fs = require('fs');
const { image2text } = require('./utils/ocr');
const { translate } = require('./utils/translate');
const { createPDF } = require('./utils/pdf');

// Kết nối tới RabbitMQ
async function connectRabbitMQ() {
    const connection = await amqp.connect('amqp://rabbitmq.ktpm.svc.cluster.local:5672');
    const channel = await connection.createChannel();

    // Đảm bảo các hàng đợi tồn tại
    await channel.assertQueue('imageProcessingQueue', { durable: true });
    await channel.assertQueue('pdfCreationQueue', { durable: true });

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
                console.log(`Starting image processing for: ${imagePath}`);
    
                // Chuyển đổi ảnh thành văn bản
                const text = await image2text(imagePath);
                console.log(`Extracted text: ${text}`);
    
                // Dịch văn bản
                const translatedText = await translate(text);
                console.log(`Translated text: ${translatedText}`);
    
                // Trả kết quả về hàng đợi replyTo
                channel.sendToQueue(
                    msg.properties.replyTo,
                    Buffer.from(
                        JSON.stringify({
                            filename: path.basename(imagePath),
                            translatedText,
                        })
                    ),
                    { correlationId: msg.properties.correlationId }
                );
    
                console.log(`Result sent back for file: ${imagePath}`);
            } catch (error) {
                console.error('Error processing image:', error);
            }
    
            // Xác nhận đã xử lý xong thông báo
            channel.ack(msg);
        }
    });

    // Worker xử lý hàng đợi pdfCreationQueue
    channel.consume('pdfCreationQueue', async (msg) => {
        if (msg !== null) {
            const task = JSON.parse(msg.content.toString());
            const { text } = task;

            try {
                console.log(`Starting PDF creation for text: ${text}`);

                // Tạo tên file PDF duy nhất
                const pdfFileName = `output_${Date.now()}.pdf`;
                const pdfFilePath = path.join(__dirname, 'output', pdfFileName);

                // Tạo thư mục nếu chưa tồn tại
                if (!fs.existsSync(path.join(__dirname, 'output'))) {
                    fs.mkdirSync(path.join(__dirname, 'output'), { recursive: true });
                }

                // Tạo file PDF từ văn bản
                await createPDF(text, pdfFilePath);
                console.log(`PDF created and saved to: ${pdfFilePath}`);
            } catch (error) {
                console.error('Error creating PDF:', error);
            }

            // Xác nhận đã xử lý xong thông báo
            channel.ack(msg);
        }
    });

    console.log('Worker started and listening to queues...');
}

// Bắt đầu Worker
startWorker().catch(console.error);