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
        medicalHistory: {
            base: () => "/patient/medical-history",
            summary: () => "/patient/medical-history/summary",
            conditions: {
                base: () => "/patient/medical-history/conditions",
                byId: (conditionId) => `/patient/medical-history/conditions/${conditionId}`
            },
            allergies: {
                base: () => "/patient/medical-history/allergies",
                byId: (allergyId) => `/patient/medical-history/allergies/${allergyId}`
            },
            surgeries: {
                base: () => "/patient/medical-history/surgeries",
                byId: (sergeryId) => `/patient/medical-history/surgeries/${sergeryId}`
            },
            medications: {
                base: () => "/patient/medical-history/medications/current",
                byId: (medicationId) => `/patient/medical-history/medications/${medicationId}`,
                discontinue: (medicationId) => `/patient/medical-history/medications/${medicationId}/discontinue`
            },
            immunizations: {
                base: () => "/patient/medical-history/immunizations",
                byId: (immunizationId) => `/patient/medical-history/immunizations/${immunizationId}`
            },
            timeline: {
                medications: () => "/patient/medical-history/timeline/medications",
                hospitalizations: () => "/patient/medical-history/hospitalizations"
            },
            hospitalizations: {
                base: () => "/patient/medical-history/hospitalizations",
                byId: (hospitalizationId) => `/patient/medical-history/hospitalizations/${hospitalizationId}`
            },
            familyHistory: {
                base: () => "/patient/medical-history/family-history",
                byId: (recordId) => `/patient/medical-history/family-history/${recordId}`,
                geneticRisk: () => "/patient/medical-history/genetic-risk"
            }
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
        },
        reviews: {
            base: '/patient/doctors/:doctorId/reviews',
            canReview: '/patient/doctors/:doctorId/can-review',
            submit: '/patient/doctors/:doctorId/review'
        }
    },
}