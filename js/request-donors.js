// --- DEBUGGING VERSION of js/request-donors.js ---

document.addEventListener('DOMContentLoaded', () => {
    // This part is likely fine, but we will leave it for now.
    const findDonorsBtn = document.getElementById('findDonorsBtn');
    const donorList = document.getElementById('donorList');
    const resultsSection = document.getElementById('nearby-donors-section');
    const noDonorsMessage = document.getElementById('no-donors-message');
    const paginationControls = document.getElementById('pagination-controls');
    const latitudeInput = document.getElementById('latitude');
    const longitudeInput = document.getElementById('longitude');
    let currentPage = 1;
    const limit = 10;
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                latitudeInput.value = position.coords.latitude;
                longitudeInput.value = position.coords.longitude;
            },
            () => { console.warn('Geolocation permission was denied.'); }
        );
    }
    findDonorsBtn.addEventListener('click', () => {
        currentPage = 1;
        fetchAndDisplayDonors();
    });
    // The functions fetchAndDisplayDonors and renderPagination are here...
    // But the most important part is the function below.

    // --- MAIN DEBUGGING FUNCTION ---
    function addRequestButtonListeners() {
        console.log("DEBUG: addRequestButtonListeners function has started.");
        const requestButtons = document.querySelectorAll('.request-btn');
        console.log(`DEBUG: Found ${requestButtons.length} 'Request Food' buttons.`);

        requestButtons.forEach((button) => {
            button.addEventListener('click', async (event) => {
                // --- CHECKPOINT 1 ---
                console.log('%c--- CHECKPOINT 1: Button Clicked! ---', 'color: green; font-weight: bold;');

                const btn = event.currentTarget;
                const { donorId, quantity, description, donorName } = btn.dataset;

                // --- CHECKPOINT 2 ---
                console.log("--- CHECKPOINT 2: Reading data from button and localStorage ---");
                console.log("   > Donor ID from button:", donorId);
                console.log("   > Quantity from button:", quantity);
                console.log("   > Description from button:", description);
                console.log("   > Donor Name from button:", donorName);
                
                const ngoId = localStorage.getItem('ngoId');
                console.log("   > NGO ID from localStorage:", ngoId);
                
                // --- CHECKPOINT 3 ---
                console.log("--- CHECKPOINT 3: Validating data ---");
                if (!ngoId) {
                    console.error("STOP: NGO ID is missing from localStorage. The code will stop here.");
                    return alert('Your user ID could not be found. Please try logging out and back in again.');
                }
                 if (!donorId) {
                    console.error("STOP: Donor ID is missing from the button's data attribute. The code will stop here.");
                    return alert('Could not find a donor ID for this request. Please refresh.');
                }
                console.log("   > Validation Passed.");

                try {
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
                    
                    // --- CHECKPOINT 4 ---
                    console.log("--- CHECKPOINT 4: Payload to be sent to backend ---");
                    console.log(requestPayload);

                    // --- CHECKPOINT 5 ---
                    console.log("--- CHECKPOINT 5: Sending request to backend via apiClient... ---");
                    
                    await apiClient.post('/requests', requestPayload);

                    // --- CHECKPOINT 6 ---
                    console.log('%c--- CHECKPOINT 6: Request Successful! ---', 'color: green; font-weight: bold;');
                    
                    btn.disabled = true;
                    btn.innerText = 'Request Sent';
                    alert(`Request sent successfully to ${donorName}!`);

                } catch (error) {
                    // --- CHECKPOINT 7 (ERROR) ---
                    console.error('%c--- CHECKPOINT 7: An Error Occurred! ---', 'color: red; font-weight: bold;');
                    console.error("The full error object is:", error);
                    alert(error.response?.data?.message || 'Could not send request. Please try again.');
                }
            });
        });
    }


    // --- UNCHANGED FUNCTIONS ---
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
            const response = await apiClient.get(`/food-donations/donors?latitude=${latitude}&longitude=${longitude}&page=${currentPage}&limit=${limit}`);
            if (!response.data || !Array.isArray(response.data.donors)) { throw new Error("Invalid data format received from server."); }
            const { donors, totalPages } = response.data;
            donorList.innerHTML = '';
            if (donors.length === 0) { noDonorsMessage.style.display = 'block';
            } else {
                donors.forEach((donor) => {
                    const row = document.createElement('tr');
                    row.innerHTML = `<td data-label="Donor Name">${donor.name}</td><td data-label="Food Description">${donor.description}</td><td data-label="Quantity">${donor.quantity}</td><td data-label="Action"><button class="btn-request" data-donor-id="${donor._id}" data-donor-name="${donor.name}" data-quantity="${donor.quantity}" data-description="${donor.description}">Request Food</button></td>`;
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