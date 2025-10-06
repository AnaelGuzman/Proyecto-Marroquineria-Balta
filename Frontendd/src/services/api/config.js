const DEFAULT_BASE_URL = 'http://localhost:8080/api';

const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/$/, '');

export { API_BASE_URL };
