# CASE STUDY 2
Dưới đây là một chương trình có nhiệm vụ chuyển file ảnh tiếng Anh sang một file `pdf` tiếng Việt. Các bước xử lý lần lượt bao gồm: chuyển đổi ảnh sang text, dịch tiếng Anh sang tiếng Việt, chuyển đổi nội dung text thành file `pdf`. Chương trình chính chỉ demo các tính năng này tuần tự.

## Hướng dẫn cài đặt
Yêu cầu cài đặt trước [tesseract](https://tesseract-ocr.github.io/tessdoc/Installation.html) trên hệ điều hành của bạn. 

```sh
# Cài đặt các gói liên quan
$ npm install
# Tạo folder cho output
$ mkdir output
# Cài rabbit MQ cho node
$ npm install amqplib uuid 
# Cài Server RabbitMq bằng docker
$ docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-manage
đi đến http://localhost:15672/ với user:guest và password guest  để xem bảng dashboard

# Khởi chạy ứng dụng demo
$ node index.js
# Khởi chạy worker node
$ node worker.js
```
d
## Mô Tả
| File | Chức năng |
|--|:--|
| utils/ocr.js | Chuyển đổi ảnh sang text |
| utils/translate.js | Dịch tiếng Anh sang tiếng Việt |
| utils/pdf.js | Chuyển đổi text sang PDF |

## Yêu cầu
 - Hoàn thiện chương trình sử dụng `express.js` cho phép upload một file ảnh và trả về một file `pdf` tương ứng
 - Sử dụng `Pipes and Filters pattern` và `message queue` để hoàn thiện chương trình trên.
