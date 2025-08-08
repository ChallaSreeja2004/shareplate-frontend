document.addEventListener('DOMContentLoaded', () => {
    // --- REFERENCES TO HTML ELEMENTS ---
    const tableBody = document.getElementById('request-table-body');
    const noRequestsMessage = document.getElementById('no-requests-message');
    const paginationControls = document.getElementById('pagination-controls');

    // --- NEW: MODAL REFERENCES ---
    const modal = document.getElementById('action-modal');
    const modalIcon = document.getElementById('modal-icon');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    // --- PAGINATION STATE ---
    let currentPage = 1;
    const limit = 10;

    // --- MAIN FUNCTION TO FETCH AND DISPLAY DATA ---
    async function fetchAndDisplayRequests() {
        const donorId = localStorage.getItem('donorId');
        if (!donorId) {
            alert('Authentication error. Please log in again.');
            return window.location.href = 'login-donor.html';
        }

        tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center;">Loading requests...</td></tr>`;
        noRequestsMessage.style.display = 'none';
        paginationControls.innerHTML = '';

        try {
            const response = await apiClient.get(`/requests/donor/${donorId}?page=${currentPage}&limit=${limit}`);
            if (!response.data || !Array.isArray(response.data.requests)) {
               throw new Error("Invalid data format received from server.");
            }
            const { requests, totalPages } = response.data;
            displayRequests(requests);
            renderPagination(totalPages);
        } catch (error) {
            console.error('Error fetching requests:', error);
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red;">Failed to load requests.</td></tr>`;
        }
    }

    // --- DISPLAY FUNCTION (NO MAJOR CHANGES) ---
    function displayRequests(requests) {
        tableBody.innerHTML = '';
        if (requests.length === 0 && currentPage === 1) {
            noRequestsMessage.style.display = 'block';
            return;
        }

        requests.forEach((request) => {
            const requestRow = document.createElement('tr');
            requestRow.dataset.requestId = request._id; // Add ID to the row for easy targeting
            const statusClass = `status-${request.status}`;

            let actionCellHTML;
            // If status is pending, show buttons. Otherwise, show the final status label.
            if (request.status === 'pending') {
                actionCellHTML = `
                    <div class="action-buttons">
                        <button class="btn-accept" data-request-id="${request._id}">Accept</button>
                        <button class="btn-reject" data-request-id="${request._id}">Reject</button>
                    </div>`;
            } else {
                actionCellHTML = `<span class="action-status-label ${statusClass}">${request.status}</span>`;
            }

            requestRow.innerHTML = `
                <td data-label="NGO Name">${request.ngoName}</td>
                <td data-label="Contact Email">${request.email}</td>
                <td data-label="Description">${request.foodDetails.description}</td>
                <td data-label="Quantity">${request.foodDetails.foodQuantity}</td>
                <td data-label="Status"><span class="status-badge ${statusClass}">${request.status}</span></td>
                <td data-label="Action">${actionCellHTML}</td>
            `;
            tableBody.appendChild(requestRow);
        });

        addStatusButtonListeners();
    }

    // --- MODIFIED: FUNCTION TO HANDLE STATUS UPDATES ---
    function addStatusButtonListeners() {
        tableBody.querySelectorAll('.btn-accept, .btn-reject').forEach(button => {
            button.addEventListener('click', async (e) => {
                const btn = e.currentTarget;
                const requestId = btn.dataset.requestId;
                const action = btn.classList.contains('btn-accept') ? 'accept' : 'reject';
                const newStatus = action === 'accept' ? 'accepted' : 'rejected';

                try {
                    // Call the API to update the status
                    await apiClient.patch(`/requests/${requestId}`, { status: newStatus });

                    // --- NEW: DYNAMICALLY UPDATE THE UI WITHOUT REFRESHING ---
                    updateRowOnSuccess(btn, newStatus);
                    showModal('Success!', `The request has been successfully ${newStatus}.`, true);

                } catch (error) {
                    console.error(`Error ${action}ing request:`, error);
                    const errorMessage = error.response?.data?.message || `Failed to ${action} the request.`;
                    showModal('Error!', errorMessage, false);
                }
            });
        });
    }

    // --- NEW: HELPER FUNCTION TO UPDATE A SINGLE ROW ---
    function updateRowOnSuccess(button, newStatus) {
        const row = button.closest('tr');
        if (!row) return;

        // 1. Update the status badge
        const statusBadge = row.querySelector('.status-badge');
        statusBadge.textContent = newStatus;
        statusBadge.className = `status-badge status-${newStatus}`; // Reset classes

        // 2. Replace the action buttons with a status label
        const actionCell = button.closest('td');
        actionCell.innerHTML = `<span class="action-status-label status-${newStatus}">${newStatus}</span>`;
    }

    // --- NEW: MODAL HELPER FUNCTIONS ---
    function showModal(title, message, isSuccess = true) {
        modalTitle.textContent = title;
        modalMessage.textContent = message;

        if (isSuccess) {
            modalIcon.innerHTML = `<i class="fa-solid fa-circle-check"></i>`;
            modalIcon.className = 'modal-icon success';
        } else {
            modalIcon.innerHTML = `<i class="fa-solid fa-circle-xmark"></i>`;
            modalIcon.className = 'modal-icon error';
        }
        modal.classList.remove('hidden');
    }

    function hideModal() {
        modal.classList.add('hidden');
    }

    // --- NEW: EVENT LISTENERS FOR MODAL ---
    modalCloseBtn.addEventListener('click', hideModal);
    modal.addEventListener('click', (e) => {
        // Close modal if the overlay (background) is clicked
        if (e.target === modal) {
            hideModal();
        }
    });

    // --- RENDER PAGINATION (NO CHANGES) ---
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
                fetchAndDisplayRequests();
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

    // --- LOGOUT (NO CHANGES) ---
    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'login-donor.html';
    });
    
    // Initial fetch when the page loads
    fetchAndDisplayRequests();
});