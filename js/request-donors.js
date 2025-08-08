// --- FINAL CORRECTED VERSION of js/request-donors.js ---

document.addEventListener('DOMContentLoaded', () => {
    // All the variable references are correct
    const findDonorsBtn = document.getElementById('findDonorsBtn');
    const donorList = document.getElementById('donorList');
    const resultsSection = document.getElementById('nearby-donors-section');
    const noDonorsMessage = document.getElementById('no-donors-message');
    const paginationControls = document.getElementById('pagination-controls');
    const latitudeInput = document.getElementById('latitude');
    const longitudeInput = document.getElementById('longitude');
    let currentPage = 1;
    const limit = 10;

    // All the setup logic is correct
    if (navigator.geolocation) { /* ... */ }
    findDonorsBtn.addEventListener('click', () => {
        currentPage = 1;
        fetchAndDisplayDonors();
    });

    // --- MAIN FETCH FUNCTION ---
    async function fetchAndDisplayDonors() {
        // ... (your existing fetch logic is correct)
        const latitude = latitudeInput.value;
        const longitude = longitudeInput.value;
        resultsSection.style.display = 'block';
        noDonorsMessage.style.display = 'none';
        donorList.innerHTML = `<tr><td colspan="4">Loading nearby donors...</td></tr>`;
        paginationControls.innerHTML = '';
        try {
            const response = await apiClient.get(`/food-donations/donors?latitude=${latitude}&longitude=${longitude}&page=${currentPage}&limit=${limit}`);
            if (!response.data || !Array.isArray(response.data.donors)) { throw new Error("Invalid data format"); }
            
            const { donors, totalPages } = response.data;
            donorList.innerHTML = '';

            if (donors.length === 0) {
                noDonorsMessage.style.display = 'block';
            } else {
                donors.forEach((donor) => {
                    const row = document.createElement('tr');
                    // CRITICAL FIX: Ensure you are using the correct unique ID from MongoDB, which is `_id`.
                    row.innerHTML = `<td data-label="Donor Name">${donor.name}</td><td data-label="Food Description">${donor.description}</td><td data-label="Quantity">${donor.quantity}</td><td data-label="Action"><button class="btn-request" data-donor-id="${donor._id}" data-donor-name="${donor.name}" data-quantity="${donor.quantity}" data-description="${donor.description}">Request Food</button></td>`;
                    donorList.appendChild(row);
                });

                // --- THE SOLUTION: DELAY THE LISTENER ATTACHMENT ---
                // This pushes the function call to the end of the event queue,
                // ensuring the browser has rendered the buttons before we search for them.
                setTimeout(addRequestButtonListeners, 0);
            }
            renderPagination(totalPages);
        } catch (error) {
            console.error('Error fetching donors:', error);
            donorList.innerHTML = `<tr><td colspan="4" style="color: red; text-align: center;">Error fetching donors. Please try again.</td></tr>`;
        }
    }

    // --- ADD LISTENERS FUNCTION (Now it will find the buttons) ---
    function addRequestButtonListeners() {
        document.querySelectorAll('.btn-request').forEach((button) => {
            button.addEventListener('click', async (event) => {
                const btn = event.currentTarget;
                const { donorId, quantity, description, donorName } = btn.dataset;
                const ngoId = localStorage.getItem('ngoId');

                if (!ngoId) {
                    return alert('Your user ID could not be found. Please log out and back in again.');
                }
                if (!donorId || donorId === 'undefined') {
                    // This is a new safety check. The `_id` fix should prevent this.
                    return alert('Could not find a valid donor ID for this request. Please refresh the page.');
                }

                try {
                    const requestPayload = {
                        location: {
                            type: 'Point',
                            coordinates: [parseFloat(longitudeInput.value), parseFloat(latitudeInput.value)],
                        },
                        donationId: donationId,
                        ngoId: ngoId,
                        foodDetails: {
                            foodQuantity: parseInt(quantity, 10),
                            description: description,
                        },
                    };
                    
                    await apiClient.post('/requests', requestPayload);
                    
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

    // --- RENDER PAGINATION (Unchanged) ---
    function renderPagination(totalPages) {
        paginationControls.innerHTML = '';
        if (totalPages <= 1) return;
        const createButton = (text, page, isDisabled = false) => {
            const button = document.createElement('button');
            button.innerHTML = text;
            button.disabled = isDisabled;
            button.addEventListener('click', (e) => { e.preventDefault(); currentPage = page; fetchAndDisplayDonors(); });
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