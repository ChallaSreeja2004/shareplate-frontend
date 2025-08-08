// frontend/js/apiConfig.js

// We will replace this URL later with your live backend URL from Render.
const API_BASE_URL = 'https://shareplate-backend-7aax.onrender.com'; // Keep this for local testing for now

const apiClient = axios.create({
    baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);