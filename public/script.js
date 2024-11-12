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

            // Hiển thị nút "Translate Image" khi ảnh đã được upload
            document.getElementById('translate-btn').style.display = 'block';
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function translateImage() {
    const formData = new FormData();
    const imageFile = document.querySelector('.file-upload-input').files[0];
    formData.append('image', imageFile);

    // Hiển thị chỉ báo tải
    document.getElementById('loading-indicator').style.display = 'block';
    document.getElementById('translate-btn').disabled = true;

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
        // Kiểm tra nếu có dữ liệu translatedText
        if (data.translatedText) {
            document.getElementById('translated-text').innerText = data.translatedText;
            document.getElementById('export-pdf-btn').style.display = 'block';
        } else {
            console.error('No translated text received:', data);
            alert('Translation failed. No text returned from server.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred: ' + error.message);
    })
    .finally(() => {
        document.getElementById('loading-indicator').style.display = 'none';
        document.getElementById('translate-btn').disabled = false;
    });
}

document.getElementById('export-pdf-btn').addEventListener('click', function() {
    const translatedText = document.getElementById('translated-text').innerText;

    // Kiểm tra nếu translatedText tồn tại trước khi gửi yêu cầu
    if (!translatedText) {
        alert('No translated text available for export.');
        return;
    }

    fetch('http://localhost:3000/export-pdf', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: translatedText })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        // Kiểm tra nếu pdfFile tồn tại trong dữ liệu phản hồi
        if (data.pdfFile) {
            window.location.href = `http://localhost:3000/${data.pdfFile}`;
        } else {
            console.error('No PDF file received:', data);
            alert('Export failed. No PDF file returned from server.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred: ' + error.message);
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
