document.addEventListener('DOMContentLoaded', () => {
    // --- REFERENCES TO HTML ELEMENTS (Unchanged) ---
    const findDonorsBtn = document.getElementById('findDonorsBtn');
    const donorList = document.getElementById('donorList');
    const resultsSection = document.getElementById('nearby-donors-section');
    const noDonorsMessage = document.getElementById('no-donors-message');
    const paginationControls = document.getElementById('pagination-controls');
    const latitudeInput = document.getElementById('latitude');
    const longitudeInput = document.getElementById('longitude');

    // --- PAGINATION STATE (Unchanged) ---
    let currentPage = 1;
    const limit = 10;

    // --- GEOLOCATION LOGIC (Unchanged) ---
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                latitudeInput.value = position.coords.latitude;
                longitudeInput.value = position.coords.longitude;
            },
            () => { alert('Geolocation permission was denied. Please click on the map to set your location manually.'); }
        );
    } else {
        alert('Geolocation is not supported by your browser. Please click on the map to set your location manually.');
    }

    // --- EVENT LISTENER (Unchanged) ---
    findDonorsBtn.addEventListener('click', () => {
        currentPage = 1;
        fetchAndDisplayDonors();
    });

    // --- MAIN FETCH FUNCTION (Unchanged) ---
    async function fetchAndDisplayDonors() {
        const latitude = latitudeInput.value;
        const longitude = longitudeInput.value;

        if (!latitude || !longitude) return alert('Please select your location on the map before searching.');
        if (!localStorage.getItem('token')) return window.location.href = '/login-ngo.html';

        resultsSection.style.display = 'block';
        noDonorsMessage.style.display = 'none';
        donorList.innerHTML = `<tr><td colspan="4">Loading nearby donors...</td></tr>`;
        paginationControls.innerHTML = '';

        try {
            const response = await apiClient.get(
                `/food-donations/donors?latitude=${latitude}&longitude=${longitude}&page=${currentPage}&limit=${limit}`
            );

            if (!response.data || !Array.isArray(response.data.donors)) {
                throw new Error("Received invalid data from the server.");
            }

            const { donors, totalPages } = response.data;
            donorList.innerHTML = '';

            if (donors.length === 0) {
                noDonorsMessage.style.display = 'block';
            } else {
                donors.forEach((donor) => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td data-label="Donor Name">${donor.name}</td>
                        <td data-label="Food Description">${donor.description}</td>
                        <td data-label="Quantity">${donor.quantity}</td>
                        <td data-label="Action">
                            <button class="btn-request" data-donor-id="${donor.donorId}" data-donor-name="${donor.name}" data-quantity="${donor.quantity}" data-description="${donor.description}">
                                Request Food
                            </button>
                        </td>
                    `;
                    donorList.appendChild(row);
                });
                addRequestButtonListeners(); 
            }
            renderPagination(totalPages);
        } catch (error) {
            console.error('Error fetching donors:', error);
            donorList.innerHTML = `<tr><td colspan="4" style="color: red; text-align: center;">Error fetching donors. Please try again.</td></tr>`;
        }
    }

   // This is the new addRequestButtonListeners function
function addRequestButtonListeners() {
    document.querySelectorAll('.request-btn').forEach((button) => {
        button.addEventListener('click', async (event) => {
            const btn = event.currentTarget;
            const { donorId, quantity, description, donorName } = btn.dataset;

            // We now only need the logged-in user's ID.
            const ngoId = localStorage.getItem('ngoId');

            if (!ngoId) {
                return alert('Your user ID could not be found. Please try logging out and back in again.');
            }

            try {
                // The payload is now much smaller and more secure.
                const requestPayload = {
                    location: {
                        type: 'Point',
                        coordinates: [parseFloat(longitudeInput.value), parseFloat(latitudeInput.value)],
                    },
                    donorId: donorId,
                    ngoId: ngoId,
                    foodDetails: {
                        foodQuantity: parseInt(quantity, 10),
                        description: description,
                    },
                };

                await apiClient.post('/requests', requestPayload);

                // This code will now be reached.
                btn.disabled = true;
                btn.innerText = 'Request Sent';
                alert(`Request sent successfully to ${donorName}!`);

            } catch (error) {
                console.error('Error sending request:', error);
                alert(error.response?.data?.message || 'Could not send request. Please try again.');
            }
        });
    });
}
    // --- RENDER PAGINATION FUNCTION (Unchanged) ---
    function renderPagination(totalPages) {
        paginationControls.innerHTML = '';
        if (totalPages <= 1) return;

        const createButton = (text, page, isDisabled = false) => {
            const button = document.createElement('button');
            button.innerHTML = text;
            button.disabled = isDisabled;
            button.addEventListener('click', (e) => {
                e.preventDefault();
                currentPage = page;
                fetchAndDisplayDonors();
            });
            return button;
        };

        paginationControls.appendChild(createButton('« Prev', currentPage - 1, currentPage === 1));
        for (let i = 1; i <= totalPages; i++) {
            const pageButton = createButton(i, i);
            if (i === currentPage) pageButton.classList.add('active');
            paginationControls.appendChild(pageButton);
        }
        paginationControls.appendChild(createButton('Next »', currentPage + 1, currentPage === totalPages));
    }
});