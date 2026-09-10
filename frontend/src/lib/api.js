import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const getTelemetry = () => axios.get(`${API}/telemetry`).then((r) => r.data);
export const getBatches = () => axios.get(`${API}/batches`).then((r) => r.data);
export const getBatch = (id) => axios.get(`${API}/batches/${id}`).then((r) => r.data);
export const createBatch = (data) => axios.post(`${API}/batches`, data).then((r) => r.data);
export const updateBatch = (id, data) => axios.patch(`${API}/batches/${id}`, data).then((r) => r.data);
export const getEnergySummary = () => axios.get(`${API}/energy/summary`).then((r) => r.data);
export const getSystemStatus = () => axios.get(`${API}/system/status`).then((r) => r.data);
