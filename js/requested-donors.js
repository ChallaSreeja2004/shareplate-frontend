// requested-donors.js

const ngoId = localStorage.getItem('ngoId');
console.log(ngoId);

// Functicon to fetch requests for the donor
async function fetchRequests() {
  try {
    const response = await axios.get(`/requests/ngo/${ngoId}`);
    console.log(response);
    if (response.length == 0) {
      alert('records not found');
    }
    if (response.status === 200) {
      // alert(response.data.length);
      // alert(response.status);
      displayRequests(response.data);
    } else {
      alert('Failed to fetch requests. Please try again later.');
    }
  } catch (error) {
    console.error('Error fetching requests:', error);
    alert('Error fetching requests. Please try again later.');
  }
}

// Function to display the requests in the HTML table
function displayRequests(requests) {
  const requestTableBody = document.querySelector('#donorTable tbody');
  requestTableBody.innerHTML = ''; // Clear existing content
  //alert(Object.keys(requests).length);
  console.log(requests);

  if (requests.length === 0) {
    requestTableBody.innerHTML =
      '<tr><td colspan="6">No requests available.</td></tr>';
    return;
  }

  requests.data.forEach((request) => {
    const requestRow = document.createElement('tr');

    requestRow.innerHTML = `
            <td>${request.donorName}</td>
            <td>${request.mobileNumber}</td>
            <td>${request.donorEmail}</td>
            <td>${new Date(request.createdAt).toLocaleString()}</td>
            <td>${request.foodDetails.foodQuantity}</td>
            <td>${request.foodDetails.description}</td>
            <td>${request.status}</td>
            <td>
                <button onclick="cancelRequest('${
                  request._id
                }')">Cancel</button>
                
            </td>
        `;

    requestTableBody.appendChild(requestRow);
  });
}

// Function to handle canceling a request
async function cancelRequest(requestId) {
  const confirmation = confirm(`Are you sure you want to cancel this request?`);
  if (!confirmation) return;

  try {
    axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );
    // Sending a PATCH request to update the request status to "cancelled"
    await axios.delete(`/requests/${requestId}`);
    alert(`Request ${requestId} has been cancelled.`);
    fetchRequests(); // Refresh the list of requests after cancellation
  } catch (error) {
    console.error('Error cancelling request:', error);
    alert('Failed to cancel the request. Please try again later.');
  }
}

// Initial fetch of requested donors
fetchRequests();



