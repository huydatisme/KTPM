FROM node:18-alpine

RUN apk add --no-cache \
    tesseract-ocr \
    tesseract-ocr-data-eng \
    tesseract-ocr-data-vie \
    build-base \
    g++ \
    cairo-dev \
    pango-dev \
    icu-dev

WORKDIR /app


COPY package*.json ./
COPY . .

RUN npm install

# Mở cổng server
EXPOSE 3000

# Chạy file index.js
CMD ["node", "index.js"]