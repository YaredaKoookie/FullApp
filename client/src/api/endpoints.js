export const endpoints = {
    auth: {
        me: () => "/auth/me",
        register: () => "/auth/register",
        login: () => "/auth/login",
        logout: () => "/auth/logout",
        refresh: () => "/auth/refresh",
        emailVerify: () => "/auth/email/verify",
        passwordReset: () => "/auth/password-reset",
        passwordResetConfirm: () => "/auth/password-reset/confirm",
        magicLink: () => "/auth/magic-link",
        magicLinkVerify: () => "/auth/magic-link/verify",
        googleUrl: () => "/auth/google/url",
        googleCallback: () => "/auth/google/callback",
        googleTokenCallback: () => "/auth/google/token/callback",
        sessions: () => "/auth/sessions",
        sessionsById: (id) => `/auth/sessions/${id}`,
    },
    patient: {
        profile: {
            base: () => "/patient/profile",
            image: () => "/patient/profile/image"
        },
        doctors: {
            base: () => "/patient/doctors",
            byId: (id) => `/patient/doctors/${id}`,
            reviews: (id) => `/patient/doctors/${id}/reviews`,
            canReview: (id) => `/patient/doctors/${id}/can-review`,
            statistics: () => `/patient/doctors/statistics`
        },
        appointments: {
            base: () => "/patient/appointments",
            byId: (id) => `/patient/appointments/${id}`,
            book: (doctorId) => `/patient/appointments/${doctorId}/book`,
            cancel: (doctorId) => `/patient/appointments/${doctorId}/cancel`,
            reschedule: (doctorId) => `/patient/appointments/${doctorId}/reschedule`,
            search: () => "/patient/appointments/search"
        },
        payments: {
            base: () => "/patient/payments",
            initiate: (appointmentId) => `/patient/payments/appointments/${appointmentId}`,
            initialize: (paymentId) => `/patient/payment/${paymentId}`
        }
    },
}