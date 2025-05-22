import apiClient from "../apiClient";
import { endpoints } from "../endpoints";

const {payments} = endpoints.patient

export const getPayments = async () => {
    return await apiClient.get(payments.base());
};

export const createPayment = async () => {
    return await apiClient.post(payments.initiate())
}

export const initializePayment = async (id) => {
    return await apiClient.post(payments.initialize(id));
}