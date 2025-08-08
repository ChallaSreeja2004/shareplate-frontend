let map;
let markers = [];
let userLocation;

function initMap() {
    const options = {
        zoom: 12,
        center: { lat: -34.397, lng: 150.644 }, // Default location
    };

    map = new google.maps.Map(document.getElementById('map'), options);

    const locationButton = document.createElement('button');
    locationButton.textContent = 'Use My Location';
    map.controls[google.maps.ControlPosition.TOP_CENTER].push(locationButton);

    locationButton.addEventListener('click', () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                map.setCenter(userLocation);
                clearMarkers();
                const marker = new google.maps.Marker({
                    position: userLocation,
                    map: map,
                    title: 'Your Location',
                });
                markers.push(marker);
            }, () => {
                alert('Geolocation service failed.');
            });
        } else {
            alert('Browser doesn\'t support geolocation.');
        }
    });

    document.getElementById('findDonorsButton').addEventListener('click', findNearbyDonors);
}

function findNearbyDonors() {
    if (!userLocation) {
        alert('Please set your location first.');
        return;
    }

    // Simulated donor data for demonstration
    const donors = [
        { name: 'Donor 1', mobile: '+91 12345 67890', email: 'donor1@example.com', location: 'Location 1' },
        { name: 'Donor 2', mobile: '+91 09876 54321', email: 'donor2@example.com', location: 'Location 2' },
    ];

    const donorListDiv = document.getElementById('donorList');
    donorListDiv.innerHTML = '<h2>Nearby Donors:</h2>';
    donors.forEach(donor => {
        const donorInfo = document.createElement('div');
        donorInfo.innerHTML = `
            <p><strong>Name:</strong> ${donor.name}</p>
            <p><strong>Mobile:</strong> ${donor.mobile}</p>
            <p><strong>Email:</strong> ${donor.email}</p>
            <p><strong>Location:</strong> ${donor.location}</p>
            <hr>
        `;
        donorListDiv.appendChild(donorInfo);
    });
}

function clearMarkers() {
    markers.forEach(marker => {
        marker.setMap(null);
    });
    markers = [];
}
