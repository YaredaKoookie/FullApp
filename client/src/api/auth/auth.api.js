import apiClient from "../apiClient";
import { endpoints } from "../endpoints";

const {auth} = endpoints;

export const register = async (data) => {
    return await apiClient.post(auth.register(), data);
};

export const logout = async () => {
    return await apiClient.post(auth.logout());
};

export const login = async (data) => {
    return await apiClient.post(auth.login(), data);
};

export const googleTokenSignIn = async (data) => {
    return await apiClient.post(auth.googleTokenCallback(), data);
};

export const magicLinkSignIn = async (data) => {
    return await apiClient.post(auth.magicLink(), data);
};

export const magicLinkCallback = async (token) => {
    return await apiClient.post(auth.magicLinkVerify(), { token });
};

export const emailVerify = async (token) => {
    return await apiClient.post(auth.emailVerify(), { token });
};

export const refreshToken = async () => {
    return await apiClient.post(auth.refresh());
};

export const getUser = async (token) => {
    return await apiClient.get(auth.me(), {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};