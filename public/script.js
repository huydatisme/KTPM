document.querySelector('.file-upload-input').addEventListener('change', function() {
    uploadImage(this);
});

function uploadImage(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();

        reader.onload = function(e) {
            document.querySelector('.image-upload-wrap').style.display = 'none';
            document.querySelector('.file-upload-image').src = e.target.result;
            document.querySelector('.file-upload-content').style.display = 'block';
            document.querySelector('.image-title').textContent = input.files[0].name;

            // Hiện nút "Translate Image" khi ảnh đã được upload
            document.getElementById('translate-btn').style.display = 'block';
        };
        reader.readAsDataURL(input.files[0]);

        // Gửi yêu cầu tải ảnh lên và dịch ảnh
        const formData = new FormData();
        formData.append('image', input.files[0]);
        
        // Đặt listener cho nút "Translate Image"
        document.getElementById('translate-btn').onclick = function() {
            fetch('http://localhost:3000/upload', {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok ' + response.statusText);
                }
                return response.json();
            })
            .then(data => {
                // Hiển thị văn bản đã dịch
                document.getElementById('translated-text').innerText = data.translatedText;
                // Hiển thị nút xuất PDF sau khi có kết quả dịch
                document.getElementById('export-pdf-btn').style.display = 'block';
            })
            .catch(error => {
                console.error('Error:', error);
            });
        };
    }
}

// Tạo file PDF từ văn bản đã dịch
document.getElementById('export-pdf-btn').addEventListener('click', function() {
    const translatedText = document.getElementById('translated-text').innerText;

    fetch('http://localhost:3000/export-pdf', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: translatedText })
    })
    .then(response => response.json())
    .then(data => {
        // Tải file PDF xuống
        window.location.href = `http://localhost:3000/${data.pdfFile}`;
    })
    .catch(error => {
        console.error('Error:', error);
    });
});

function readURL(input) {
    if (input.files && input.files[0]) {
        var reader = new FileReader();
        
        reader.onload = function (e) {
            document.querySelector('.image-upload-wrap').style.display = 'none';
            document.querySelector('.file-upload-image').src = e.target.result;
            document.querySelector('.file-upload-content').style.display = 'block';
            document.querySelector('.image-title').textContent = input.files[0].name;
        };
        
        reader.readAsDataURL(input.files[0]);
    } else {
        removeUpload();
    }
}

function removeUpload() {
    document.querySelector('.file-upload-input').value = null;
    document.querySelector('.file-upload-content').style.display = 'none';
    document.querySelector('.image-upload-wrap').style.display = 'block';
}
