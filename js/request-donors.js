document.addEventListener('DOMContentLoaded', () => {
    // --- AUTHENTICATION CHECK (MOVED FROM HTML) ---
    if (!localStorage.getItem('token')) {
        // This alert is acceptable because it happens before a redirect,
        // so the user will not interact further with this page.
        alert('You are not logged in. Redirecting...');
        window.location.href = 'login-ngo.html';
        return; // Stop the rest of the script from running
    }

    // --- REFERENCES TO HTML ELEMENTS ---
    const findDonorsBtn = document.getElementById('findDonorsBtn');
    const donorList = document.getElementById('donorList');
    const resultsSection = document.getElementById('nearby-donors-section');
    const noDonorsMessage = document.getElementById('no-donors-message');
    const paginationControls = document.getElementById('pagination-controls');
    const latitudeInput = document.getElementById('latitude');
    const longitudeInput = document.getElementById('longitude');
    const modal = document.getElementById('action-modal');
    const modalIcon = document.getElementById('modal-icon');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    // --- STATE ---
    let currentPage = 1;
    const limit = 10;

    // --- SETUP LOGIC ---
    if (navigator.geolocation) { /* ... */ }
    findDonorsBtn.addEventListener('click', () => {
        currentPage = 1;
        fetchAndDisplayDonors();
    });

    // --- MAIN FETCH FUNCTION ---
    async function fetchAndDisplayDonors() {
        const latitude = latitudeInput.value;
        const longitude = longitudeInput.value;
        if (!latitude || !longitude) {
            return showModal('Location Required', 'Please set your location on the map before searching.', false);
        }
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
                    row.innerHTML = `<td data-label="Donor Name">${donor.name}</td><td data-label="Food Description">${donor.description}</td><td data-label="Quantity">${donor.quantity}</td><td data-label="Action"><button class="btn-request" data-donation-id="${donor._id}" data-donor-name="${donor.name}">Request Food</button></td>`;
                    donorList.appendChild(row);
                });
                setTimeout(addRequestButtonListeners, 0);
            }
            renderPagination(totalPages);
        } catch (error) {
            console.error('Error fetching donors:', error);
            donorList.innerHTML = `<tr><td colspan="4" style="color: red; text-align: center;">Error fetching donors. Please try again.</td></tr>`;
        }
    }

    // --- ADD LISTENERS FUNCTION ---
    function addRequestButtonListeners() {
        document.querySelectorAll('.btn-request').forEach((button) => {
            button.addEventListener('click', async (event) => {
                const btn = event.currentTarget;
                const { donationId, donorName } = btn.dataset; // Simplified data needed
                const ngoId = localStorage.getItem('ngoId');

                if (!ngoId) {
                    return showModal('Authentication Error', 'Your user ID could not be found. Please log out and back in again.', false);
                }
                if (!donationId || donationId === 'undefined') {
                    return showModal('Error', 'Could not find a valid donation ID for this request. Please refresh the page.', false);
                }
                try {
                    const requestPayload = {
                        location: { type: 'Point', coordinates: [parseFloat(longitudeInput.value), parseFloat(latitudeInput.value)] },
                        donationId: donationId,
                        ngoId: ngoId,
                        // Note: Food details are now handled by the backend, so we don't need to send them.
                    };
                    await apiClient.post('/requests', requestPayload);
                    btn.disabled = true;
                    btn.innerText = 'Request Sent';
                    showModal('Success!', `Request sent successfully to ${donorName}!`, true);
                } catch (error) {
                    console.error('Error sending request:', error);
                    const errorMessage = error.response?.data?.message || 'Could not send request. Please try again.';
                    showModal('Error', errorMessage, false);
                }
            });
        });
    }

    // --- MODAL HELPER FUNCTIONS ---
    function showModal(title, message, isSuccess = true) {
        if (!modal) return;
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        modalIcon.innerHTML = isSuccess ? `<i class="fa-solid fa-circle-check"></i>` : `<i class="fa-solid fa-circle-xmark"></i>`;
        modalIcon.className = isSuccess ? 'modal-icon success' : 'modal-icon error';
        modal.classList.remove('hidden');
    }

    function hideModal() {
        if (!modal) return;
        modal.classList.add('hidden');
    }

    // Add modal event listeners
    if (modal) {
        modalCloseBtn.addEventListener('click', hideModal);
        modal.addEventListener('click', (e) => { if (e.target === modal) hideModal(); });
    }

    // --- RENDER PAGINATION ---
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

    // --- LOGOUT BUTTON LOGIC (MOVED FROM HTML) ---
    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'login-ngo.html';
    });
});