document.addEventListener('DOMContentLoaded', () => {
    // --- REFERENCES TO HTML ELEMENTS ---
    const tableBody = document.getElementById('request-table-body');
    const noRequestsMessage = document.getElementById('no-requests-message');
    const paginationControls = document.getElementById('pagination-controls');

    // --- PAGINATION STATE ---
    let currentPage = 1;
    const limit = 10; // You can change the number of items per page here

    // --- MAIN FUNCTION TO FETCH AND DISPLAY DATA (PAGINATED) ---
    async function fetchAndDisplayRequests() {
        const donorId = localStorage.getItem('donorId');
        const token = localStorage.getItem('token');

        if (!donorId || !token) {
            alert('Authentication error. Please log in again.');
            return window.location.href = 'login-donor.html';
        }

        tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center;">Loading requests...</td></tr>`;
        noRequestsMessage.style.display = 'none';
        paginationControls.innerHTML = '';

        try {
            // --- API CALL WITH PAGINATION and CORRECTED URL ---
            const response = await apiClient.get(`/requests/donor/${donorId}?page=${currentPage}&limit=${limit}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Safety check for the expected data format
            if (!response.data || !Array.isArray(response.data.requests)) {
               throw new Error("Invalid data format received from server.");
            }

            const { requests, totalPages } = response.data;
            
            // --- YOUR CORE DISPLAY LOGIC IS PRESERVED HERE ---
            displayRequests(requests); // We call your display function with the paginated data
            
            renderPagination(totalPages);

        } catch (error) {
            console.error('Error fetching requests:', error);
            tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: red;">Failed to load requests.</td></tr>`;
        }
    }

    // --- YOUR CORE DISPLAY FUNCTION (UNCHANGED) ---
    // This function now works with the paginated list of requests.
    function displayRequests(requests) {
        tableBody.innerHTML = ''; // Clear existing content

        if (requests.length === 0) {
            noRequestsMessage.style.display = 'block';
            return;
        }

        requests.forEach((request) => {
            const requestRow = document.createElement('tr');
            const statusClass = `status-${request.status}`;

            // This is your exact row HTML, with status badges and correct buttons
            requestRow.innerHTML = `
                <td data-label="NGO Name">${request.ngoName}</td>
                <td data-label="Contact Email">${request.email}</td>
                <td data-label="Description">${request.foodDetails.description}</td>
                <td data-label="Quantity">${request.foodDetails.foodQuantity}</td>
                <td data-label="Status"><span class="status-badge ${statusClass}">${request.status}</span></td>
                <td data-label="Action">
                    <div class="action-buttons">
                        <button class="btn-accept" data-request-id="${request._id}" ${request.status !== 'pending' ? 'disabled' : ''}>Accept</button>
                        <button class="btn-reject" data-request-id="${request._id}" ${request.status !== 'pending' ? 'disabled' : ''}>Reject</button>
                    </div>
                </td>
            `;
            tableBody.appendChild(requestRow);
        });

        // Add listeners to the newly created buttons
        addStatusButtonListeners();
    }

    // --- FUNCTION TO HANDLE STATUS UPDATES (YOUR LOGIC, RESTRUCTURED) ---
    function addStatusButtonListeners() {
        document.querySelectorAll('.btn-accept, .btn-reject').forEach(button => {
            button.addEventListener('click', async (e) => {
                if (button.disabled) return; // Prevent action if already handled

                const requestId = e.target.dataset.requestId;
                const action = e.target.classList.contains('btn-accept') ? 'accept' : 'reject';
                const status = action === 'accept' ? 'accepted' : 'rejected';

                const confirmation = confirm(`Are you sure you want to ${action} this request?`);
                if (!confirmation) return;

                try {
                    // Using PATCH as defined in your router
                    await apiClient.patch(`/requests/${requestId}`, { status: status }, {
                         headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    });

                    alert(`Request has been ${status}!`);
                    fetchAndDisplayRequests(); // Refresh the current page of data to show the change

                } catch (error) {
                    console.error(`Error ${action}ing request:`, error);
                    alert(`Failed to ${action} request. Please try again later.`);
                }
            });
        });
    }

    // --- FUNCTION TO RENDER PAGINATION CONTROLS (UNCHANGED) ---
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

    // --- LOGOUT AND AUTH CHECK (UNCHANGED) ---
    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'login-donor.html';
    });
    
    // Initial fetch when the page loads
    fetchAndDisplayRequests();
});