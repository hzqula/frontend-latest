import axios, { AxiosInstance } from "axios";

const api: AxiosInstance = axios.create({
  baseURL: "http://localhost:5500/api", // Sesuaikan dengan PORT backend
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
