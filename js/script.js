// Ensure Axios is included in your HTML if not already
// <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>

document.getElementById('donation-form').addEventListener('submit', async function (event) {
  event.preventDefault(); // Prevent default form submission

  const userId = localStorage.getItem('donorId');
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const mobile = document.getElementById('mobile').value;
  const quantity = document.getElementById('quantity').value;
  const description = document.getElementById('description').value;
  const latitude = document.getElementById('latitude').value;
  const longitude = document.getElementById('longitude').value;

  // Input validation checks (keep any existing validation functions)
  let isValid = true;

  // Name validation (non-empty)
  if (name.trim() === '') {
      showError(document.getElementById('name'), 'Name is required.');
      isValid = false;
  } else {
      clearError(document.getElementById('name'));
  }

  // Email validation (basic format check)
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
      showError(document.getElementById('email'), 'Invalid email format.');
      isValid = false;
  } else {
      clearError(document.getElementById('email'));
  }

  // Mobile number validation (must start with 6, 7, 8, or 9 and be 10 digits)
  const mobilePattern = /^[6-9]\d{9}$/;
  if (!mobilePattern.test(mobile)) {
      showError(document.getElementById('mobile'), 'Mobile number must start with 6, 7, 8, or 9 and be 10 digits.');
      isValid = false;
  } else {
      clearError(document.getElementById('mobile'));
  }

  // Quantity validation (must be a positive number)
  if (quantity <= 0) {
      showError(document.getElementById('quantity'), 'Quantity must be a positive number.');
      isValid = false;
  } else {
      clearError(document.getElementById('quantity'));
  }

  // Description validation (must be at least 15 characters)
  if (description.length < 15) {
      showError(document.getElementById('description'), 'Description must be at least 15 characters long.');
      isValid = false;
  } else {
      clearError(document.getElementById('description'));
  }

  // Proceed only if validation passes
  if (isValid) {
      try {
          const response = await apiClient.post('/food-donations/donate-food', {
              name,
              email,
              mobile,
              quantity,
              description,
              latitude,
              longitude,
              userId,
          });

          alert('Donation request submitted successfully!');
          document.getElementById('donation-form').reset();
      } catch (error) {
          alert(
              (error.response && error.response.data && error.response.data.message) ||
              'Donation request failed. Please try again.'
          );
      }
  }
});
