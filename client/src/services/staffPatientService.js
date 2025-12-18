import axiosInstance from "../api/axiosConfig";

const BASE_URL = "/api/staff/patients";

export const registerPatient = async (patientData) => {
    const response = await axiosInstance.post(`${BASE_URL}/register`, patientData);
    return response.data;
};

export const getAllPatients = async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await axiosInstance.get(`${BASE_URL}?${params}`);
    return response.data;
};

export const getPatientById = async (id) => {
    const response = await axiosInstance.get(`${BASE_URL}/${id}`);
    return response.data;
};

export const updatePatient = async (id, data) => {
    const response = await axiosInstance.put(`${BASE_URL}/${id}`, data);
    return response.data;
};

export const deletePatient = async (id) => {
    const response = await axiosInstance.delete(`${BASE_URL}/${id}`);
    return response.data;
};
