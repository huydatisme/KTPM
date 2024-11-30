document.querySelector('.file-upload-input').addEventListener('change', function () {
    uploadImages(this);
});

function uploadImages(input) {
    if (input.files && input.files.length > 0) {
        const formData = new FormData();

        for (const file of input.files) {
            formData.append('images', file);
        }

        // Hiển thị chỉ báo tải
        document.getElementById('loading-indicator').style.display = 'block';

        fetch('http://localhost:3000/upload', {
            method: 'POST',
            body: formData
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                // Hiển thị kết quả dịch cho từng ảnh
                const resultsContainer = document.getElementById('results-container');
                resultsContainer.innerHTML = ''; // Xóa nội dung cũ

                const translatedTexts = [];

                data.results.forEach((result, index) => {
                    const resultDiv = document.createElement('div');
                    resultDiv.className = 'result-item';
                    resultDiv.innerHTML = `
                        <h4>File: ${result.filename}</h4>
                        <p>${result.translatedText}</p>
                    `;
                    resultsContainer.appendChild(resultDiv);
                    translatedTexts.push(result.translatedText);
                });

                // Lưu danh sách văn bản đã dịch vào nút Export PDF
                document.getElementById('export-pdf-btn').dataset.texts = JSON.stringify(translatedTexts);
                document.getElementById('export-pdf-btn').style.display = 'block';
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred: ' + error.message);
            })
            .finally(() => {
                document.getElementById('loading-indicator').style.display = 'none';
            });
    }
}



function translateImages() {
    const input = document.querySelector('.file-upload-input');
    if (!input.files || input.files.length === 0) {
        alert('No images selected.');
        return;
    }

    const formData = new FormData();
    for (const file of input.files) {
        formData.append('images', file);
    }

    // Hiển thị chỉ báo tải
    document.getElementById('loading-indicator').style.display = 'block';

    fetch('http://localhost:3000/upload', {
        method: 'POST',
        body: formData,
    })
        .then(response => response.json())
        .then(data => {
            const resultsContainer = document.getElementById('results-container');
            resultsContainer.innerHTML = ''; // Xóa nội dung cũ

            const translatedTexts = [];

            data.results.forEach((result, index) => {
                const resultItem = document.createElement('div');
                resultItem.className = 'result-item';
                resultItem.innerHTML = `
                    <h4>File: ${result.filename}</h4>
                    <p>${result.translatedText}</p>
                `;
                resultsContainer.appendChild(resultItem);
                translatedTexts.push(result.translatedText);
            });

            // Lưu danh sách văn bản dịch vào nút Export PDF
            document.getElementById('export-pdf-btn').dataset.texts = JSON.stringify(translatedTexts);
            document.getElementById('export-pdf-btn').style.display = 'block';
        })
        .catch(error => {
            console.error('Error during translation:', error);
            alert('An error occurred while translating images.');
        })
        .finally(() => {
            document.getElementById('loading-indicator').style.display = 'none';
        });
}

function readURL(input) {
    if (input.files && input.files.length > 0) {
        const previewContainer = document.getElementById('preview-container');
        const imagePreviewList = document.getElementById('image-preview-list');

        imagePreviewList.innerHTML = ''; // Clear any previous previews
        for (const file of input.files) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.alt = file.name;
                img.style = 'width: 100px; height: 100px; margin: 5px; object-fit: cover;';
                imagePreviewList.appendChild(img);
            };
            reader.readAsDataURL(file);
        }

        previewContainer.style.display = 'block';
        document.getElementById('translate-btn').style.display = 'block';
    } else {
        removeAllUploads();
    }
}
document.getElementById('export-pdf-btn').addEventListener('click', function () {
    const texts = JSON.parse(this.dataset.texts);

    if (!texts || texts.length === 0) {
        alert('No translated texts available for export.');
        return;
    }

    fetch('http://localhost:3000/export-pdf', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ texts }),
    })
        .then(response => response.json())
        .then(data => {
            const resultsContainer = document.getElementById('results-container');
            resultsContainer.innerHTML = ''; // Clear previous results

            data.pdfFiles.forEach(file => {
                const link = document.createElement('a');
                link.href = `http://localhost:3000/${file.path}`;
                link.textContent = `Download ${file.filename}`;
                link.target = '_blank';
                resultsContainer.appendChild(link);
                resultsContainer.appendChild(document.createElement('br'));
            });
        })
        .catch(error => {
            console.error('Error during PDF export:', error);
            alert('An error occurred while exporting PDFs.');
        });
});

function removeAllUploads() {
    document.querySelector('.file-upload-input').value = null;
    document.getElementById('preview-container').style.display = 'none';
    document.getElementById('translate-btn').style.display = 'none';
    document.getElementById('results-container').innerHTML = '';
    document.getElementById('export-pdf-btn').style.display = 'none';
}
