import axios from 'axios';

const axiosServices = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5005/api/',
  headers: {
    // Skip ngrok browser warning in development only
    ...(process.env.NODE_ENV === 'development' && { 'ngrok-skip-browser-warning': '1' }),
  },
});


// ==============================|| AXIOS - FOR MOCK SERVICES ||============================== //

axiosServices.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response.status === 401 && !window.location.href.includes('/login')) {
      window.location.pathname = '/login';
    }
    return Promise.reject((error.response && error.response.data) || 'Wrong Services');
  }
);

export default axiosServices;
