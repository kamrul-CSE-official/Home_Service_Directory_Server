

function uploadImage() {
    const file = data.img[0];

    const formData = new FormData();
    formData.append('image', file);
    formData.append('expiration', 600); // Set the desired expiration time in seconds

    const url = `https://api.imgbb.com/1/upload?expiration=600&key=${imageHostKey}`;

    fetch(url, {
        method: 'POST',
        body: formData,
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                console.log('Image uploaded successfully.');
                console.log('Image URL:', data.data.url);
                // Perform further actions with the uploaded image URL here
            } else {
                console.error('Image upload failed. Error:', data.error.message);
            }
        })
        .catch((error) => {
            console.error('Error uploading image:', error);
        });
}
