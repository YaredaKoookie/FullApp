import apiClient from "@/lib/apiClient";

export const getUser = async (token) => {
  return await apiClient.get("/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const register = async (data) => {
  return await apiClient.post("/auth/register", data);
};

export const logout = async () => {
  return await apiClient.post("/auth/logout");
};

export const login = async (data) => {
  return await apiClient.post("/auth/login", data);
};

export const googleTokenSignIn = async (data) => {
  return await apiClient.post("/auth/google/token/callback", data);
};

export const magicLinkSignIn = async (data) => {
  return await apiClient.post("/auth/magic-link", data);
};

export const magicLinkCallback = async (token) => {
  return await apiClient.post("/auth/magic-link/verify", { token });
};

export const emailVerify = async (token) => {
  return await apiClient.post("/auth/email/verify", { token });
};

export const refreshToken = async () => {
  return await apiClient.post("/auth/refresh");
};

export const getAppointments = async () => {
  return await apiClient.get("/patient/appointments");
};

export const getApprovedDoctors = async () => {
  return await apiClient.get("/patient/doctors");
};

export const getDoctorProfile = async () => {
  return await apiClient.get("/doctors/profile/me");
};
