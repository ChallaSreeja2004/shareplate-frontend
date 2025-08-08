document.addEventListener('DOMContentLoaded', () => {
    // --- AUTHENTICATION CHECK ---
    // If there's no token, redirect to the login page immediately.
    if (!localStorage.getItem('token')) {
        alert('You are not logged in. Redirecting to login page.');
        window.location.href = 'login-ngo.html';
        return; // Stop executing the rest of the script
    }

    // --- REFERENCES TO HTML ELEMENTS ---
    const tableBody = document.querySelector('#donorTable tbody');
    const noRequestsMessage = document.getElementById('no-requests-message');
    const modal = document.getElementById('action-modal');
    const modalIcon = document.getElementById('modal-icon');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    // --- MAIN FUNCTION TO FETCH DATA ---
    async function fetchRequests() {
        const ngoId = localStorage.getItem('ngoId');
        if (!ngoId) {
            showModal('Authentication Error', 'Could not find your NGO ID. Please log in again.', false);
            return;
        }

        tableBody.innerHTML = `<tr><td colspan="8" style="text-align: center;">Loading your requests...</td></tr>`;
        if (noRequestsMessage) noRequestsMessage.style.display = 'none';

        try {
            const response = await apiClient.get(`/requests/ngo/${ngoId}`);
            if (!response.data || !Array.isArray(response.data.data)) {
                throw new Error("Invalid data format received from server.");
            }
            displayRequests(response.data.data);
        } catch (error) {
            console.error('Error fetching requests:', error);
            tableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: red;">Failed to load requests. Please try again.</td></tr>`;
        }
    }

    // --- FUNCTION TO DISPLAY REQUESTS ---
    function displayRequests(requests) {
        tableBody.innerHTML = ''; 
        if (requests.length === 0) {
            if (noRequestsMessage) {
                noRequestsMessage.style.display = 'block';
            } else {
                tableBody.innerHTML = `<tr><td colspan="8" style="text-align: center;">You have not made any requests yet.</td></tr>`;
            }
            return;
        }

        requests.forEach((request) => {
            const requestRow = document.createElement('tr');
            requestRow.dataset.requestId = request._id;

            requestRow.innerHTML = `
                <td data-label="Donor Name">${request.donorName}</td>
                <td data-label="Mobile">${request.donorMobile || 'N/A'}</td>
                <td data-label="Email">${request.donorEmail}</td>
                <td data-label="Date">${new Date(request.createdAt).toLocaleDateString()}</td>
                <td data-label="Quantity">${request.foodDetails.foodQuantity}</td>
                <td data-label="Description">${request.foodDetails.description}</td>
                <td data-label="Status">${request.status}</td>
                <td data-label="Action">
                    <button class="btn-cancel" data-request-id="${request._id}" ${request.status !== 'pending' ? 'disabled' : ''}>Cancel</button>
                </td>
            `;
            tableBody.appendChild(requestRow);
        });
        addCancelButtonListeners();
    }

    // --- FUNCTION TO ADD LISTENERS TO BUTTONS ---
    function addCancelButtonListeners() {
        tableBody.querySelectorAll('.btn-cancel').forEach(button => {
            button.addEventListener('click', (e) => {
                const requestId = e.currentTarget.dataset.requestId;
                handleCancelRequest(requestId, e.currentTarget); 
            });
        });
    }

    // --- FUNCTION TO HANDLE THE CANCEL ACTION ---
    async function handleCancelRequest(requestId, button) {
        if (button.disabled) return;
        try {
            await apiClient.delete(`/requests/${requestId}`);
            showModal('Success!', 'The request has been successfully cancelled.', true);
            const rowToRemove = button.closest('tr');
            if (rowToRemove) {
                rowToRemove.remove();
            }
        } catch (error) {
            console.error('Error cancelling request:', error);
            const errorMessage = error.response?.data?.message || 'Failed to cancel the request.';
            showModal('Error!', errorMessage, false);
        }
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

    // Add modal event listeners only if the modal exists
    if (modal) {
        modalCloseBtn.addEventListener('click', hideModal);
        modal.addEventListener('click', (e) => { 
            if (e.target === modal) hideModal(); 
        });
    }

    // --- LOGOUT BUTTON LOGIC ---
    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('ngoId');
        window.location.href = 'login-ngo.html';
    });

    // --- INITIAL FETCH ---
    fetchRequests();
});