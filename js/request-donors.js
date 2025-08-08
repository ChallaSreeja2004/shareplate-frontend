document.addEventListener('DOMContentLoaded', () => {
    // --- REFERENCES TO HTML ELEMENTS ---
    const findDonorsBtn = document.getElementById('findDonorsBtn');
    const donorList = document.getElementById('donorList');
    const resultsSection = document.getElementById('nearby-donors-section');
    const noDonorsMessage = document.getElementById('no-donors-message');
    const paginationControls = document.getElementById('pagination-controls');
    const latitudeInput = document.getElementById('latitude');
    const longitudeInput = document.getElementById('longitude');

    // --- PAGINATION STATE ---
    let currentPage = 1;
    const limit = 10; // You can change this to 5, 15, etc., as you see fit.

    // --- GEOLOCATION LOGIC ---
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                latitudeInput.value = position.coords.latitude;
                longitudeInput.value = position.coords.longitude;
                // Your map.js should ideally center the map on these coordinates
            },
            () => {
                alert('Geolocation permission was denied. Please click on the map to set your location manually.');
            }
        );
    } else {
        alert('Geolocation is not supported by your browser. Please click on the map to set your location manually.');
    }

    // --- EVENT LISTENER FOR THE MAIN SEARCH BUTTON ---
    findDonorsBtn.addEventListener('click', () => {
        currentPage = 1; // Always reset to page 1 for a new search
        fetchAndDisplayDonors();
    });

    // --- MAIN FUNCTION TO FETCH AND DISPLAY DATA ---
    async function fetchAndDisplayDonors() {
        const latitude = latitudeInput.value;
        const longitude = longitudeInput.value;
        const token = localStorage.getItem('token');

        if (!latitude || !longitude) {
            return alert('Please select your location on the map before searching.');
        }
        if (!token) {
            alert('You need to log in first.');
            return window.location.href = '/login-ngo.html';
        }

        // Update UI for loading state
        resultsSection.style.display = 'block';
        noDonorsMessage.style.display = 'none';
        donorList.innerHTML = `<tr><td colspan="4">Loading nearby donors...</td></tr>`;
        paginationControls.innerHTML = '';

        try {
            // This is the API call with pagination parameters
            const response = await apiClient.get(
                `/food-donations/donors?latitude=${latitude}&longitude=${longitude}&page=${currentPage}&limit=${limit}`, {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            // Safety check for the data structure from the backend
            if (!response.data || !Array.isArray(response.data.donors)) {
                console.error("Unexpected response format from server:", response.data);
                throw new Error("Received invalid data from the server.");
            }

            // Destructure the expected response
            const { donors, totalPages } = response.data;
            
            donorList.innerHTML = '';

            if (donors.length === 0) {
                noDonorsMessage.style.display = 'block';
            } else {
                // Your core logic for populating the table
                donors.forEach((donor) => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td data-label="Donor Name">${donor.name}</td>
                        <td data-label="Food Description">${donor.description}</td>
                        <td data-label="Quantity">${donor.quantity}</td>
                        <td data-label="Action">
                            <button class="btn-request" data-donor-id="${donor.donorId}" data-donor-name="${donor.name}" data-donor-email="${donor.email}" data-donor-mobile="${donor.mobile}" data-quantity="${donor.quantity}" data-description="${donor.description}">
                                Request Food
                            </button>
                        </td>
                    `;
                    donorList.appendChild(row);
                });
                addRequestButtonListeners(); 
            }
            
            // Render the page number controls
            renderPagination(totalPages);

        } catch (error) {
            console.error('Error fetching donors:', error);
            donorList.innerHTML = `<tr><td colspan="4" style="color: red; text-align: center;">Error fetching donors. Please try again.</td></tr>`;
        }
    }

    // --- YOUR CORE LOGIC FOR SENDING A REQUEST ---
    function addRequestButtonListeners() {
        document.querySelectorAll('.request-btn').forEach((button) => {
            button.addEventListener('click', async (event) => {
                const btn = event.currentTarget;
                const { donorId, quantity, description, donorName, donorMobile, donorEmail } = btn.dataset;

                // Getting NGO details from localStorage
                const ngoId = localStorage.getItem('ngoId');
                const ngoName = localStorage.getItem('ngoName'); 
                const ngoMobile = localStorage.getItem('ngoMobile');
                const ngoEmail = localStorage.getItem('ngoEmail');

                if (!ngoId || !ngoName || !ngoMobile || !ngoEmail) {
                    return alert('Your NGO details could not be found. Please try logging out and back in again.');
                }

                try {
                    // Building the payload exactly as you specified
                    const requestPayload = {
                        ngoName: ngoName,
                        mobileNumber: ngoMobile,
                        email: ngoEmail,
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
                        donorName: donorName,
                        donorMobile: donorMobile,
                        donorEmail: donorEmail,
                    };

                    const token = localStorage.getItem('token');
                    await apiClient.post('/requests', requestPayload, {
                        headers: { Authorization: `Bearer ${token}` },
                    });

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

    // --- FUNCTION TO RENDER PAGINATION CONTROLS ---
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

        // Previous Button
        paginationControls.appendChild(createButton('« Prev', currentPage - 1, currentPage === 1));

        // Page Number Buttons
        for (let i = 1; i <= totalPages; i++) {
            const pageButton = createButton(i, i);
            if (i === currentPage) {
                pageButton.classList.add('active');
            }
            paginationControls.appendChild(pageButton);
        }
        
        // Next Button
        paginationControls.appendChild(createButton('Next »', currentPage + 1, currentPage === totalPages));
    }
});