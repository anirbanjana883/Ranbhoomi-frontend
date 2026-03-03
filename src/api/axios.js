import axios from "axios";

export const serverUrl = "http://localhost:5000";

const API = axios.create({
  baseURL: `${serverUrl}/api`,
  withCredentials: true 
});

// Automatically catch 401/403 errors (Expired Cookie) globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.error("Auth failed, user needs to log in again.");
    }
    return Promise.reject(error);
  }
);

export default API;