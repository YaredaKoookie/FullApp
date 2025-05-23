import { QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 3, // Retry failed requests up to 3 times
            refetchOnWindowFocus: false, // Disable refetching on window focus
            staleTime: 1000 * 60 * 5, // Data is considered fresh for 5 minutes
        },
    },
});

export const queryKeys = {
    auth: {
        me: () => ["users", "me"]
    },
    patient: {
        profile: () => ["patient", "profile"],
        doctors: {
            list: () => ["patient", "doctors"],
            byId: id => ["patient", "doctors", id],
            reviews: id => ["patient", "doctors", id, "reviews"],
            canReview: id => ["patient", "doctors", id, "can-review"],
            statistics: () => ["patient", "doctors", "statistics"]
        },
        appointments: {
            list: () => ["patient", "appointments"],
            byId: id => ["patient", "appointments", id],
            search: () => ["patient", "appointments", "search"]
        },
        payments: {
            list: () => ["patient", "payments"],
            byId: id => ["patient", "payments", id]
        },
        medicalHistory: {
            all: () => ["patient", "medicalHistory"],
            details: id => ["patient", "medicalHistory", id],
            summary: () => ["patient", "medicalHistory", "summary"],
            timeline: {
                medications: () => ["patient", "medicalHistory", "timeline", "medications"],
                hospitalizations: () => ["patient", "medicalHistory", "timeline", "hospitalizations"]
            },
            immunizations: () => ["patient", "medicalHistory", "immunizations"],
            familyHistory: {
                all: () => ["patient", "medicalHistory", "familyHistory"],
                geneticRisk: () => ["patient", "medicalHistory", "familyHistory", "geneticRisk"]
            }
        },
        reviews: {
            all: (doctorId) => ['reviews', doctorId],
            canReview: (doctorId) => ['canReview', doctorId]
        }
    }
}

export default queryClient;