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

export const getApprovedDoctors = async (query) => {
  return await apiClient.get("/patient/doctors?"+query);
};

export const getDoctorProfile = async () => {
  return await apiClient.get("/doctors/profile/me");
};


export const getPatientProfile = async () => {
  return await apiClient.get("/patient/profile");
};

export const getPayments = async () => {
  return await apiClient.get("/patient/payments");
};


export const getAppointmentById = async (id) => {
  return await apiClient.get("/patient/appointments/"+id);
};

export const getDoctorStatistics = async () => {
  return await apiClient.get("/patient/doctors/statistics");
};


export const cancelAppointment = async (id, data) => {
  return await apiClient.put(`/patient/appointments/${id}/cancel`, data);
};


export const updateProfile = async (data) => {
  return await apiClient.put("/patient/profile", data, {
    headers: {
      'Content-Type': "multipart/form-data"
    }
  });
};



export const updateProfileImage = async (data) => {
  return await apiClient.put("/patient/profile/image", data, {
    headers: {
      'Content-Type': "multipart/form-data"
    }
  });
}