const map = L.map('map').setView([20.5937, 78.9629], 5); // Set initial view to India

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
}).addTo(map);

// Marker variable
let marker;

// Function to set the user's current location
function setUserLocation(lat, lng) {
    // Update hidden input fields with latitude and longitude
    document.getElementById('latitude').value = lat;
    document.getElementById('longitude').value = lng;

    // Add a marker to the map
    if (marker) {
        map.removeLayer(marker);
    }
    
    marker = L.marker([lat, lng]).addTo(map)
        .bindPopup('You are donating from this location.')
        .openPopup();
}

// Get user's current location
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            setUserLocation(lat, lng);
            map.setView([lat, lng], 13); // Zoom in on the user's location
        },
        () => {
            alert('Unable to retrieve your location. Please enable location services.');
        }
    );
} else {
    alert('Geolocation is not supported by this browser.');
}

// Capture click event on the map
map.on('click', function(e) {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;
    setUserLocation(lat, lng); // Allow manual location selection
});
