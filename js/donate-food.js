document.getElementById('donation-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const foodDetails = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        mobile: document.getElementById('mobile').value,
        quantity: document.getElementById('quantity').value,
        description: document.getElementById('description').value,
        location: {
            type: 'Point',
            coordinates: [
                parseFloat(document.getElementById('longitude').value), // Longitude first
                parseFloat(document.getElementById('latitude').value)   // Latitude second
            ]
        },
        donorId: localStorage.getItem('donorId') // Retrieve this dynamically as needed
    };

    console.log(foodDetails); // Check the values before submission

    try {
        const response = await axios.post('/food-donations/donate-food', foodDetails);

        if (response.status === 200) {
            alert('Food donation added successfully.');
            document.getElementById('donation-form').reset(); 
        } else {
            alert('Failed to add food donation.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while adding the donation. Please try again.');
    }
});
