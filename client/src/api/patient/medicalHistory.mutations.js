import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as medicalHistoryApi from './medicalHistory.api';
import { queryKeys } from '../queryClient';


export const userCreateMedicalHistory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data) => medicalHistoryApi.createMedicalHistory(data),
        onSuccess: () => {
            // Invalidate and refetch family history queries
            queryClient.invalidateQueries({
                queryKey: queryKeys.patient.medicalHistory.all(),
            });
        },
    });
};


export const useAddAllergy = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => medicalHistoryApi.addAllergy(data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.patient.medicalHistory.all(),
            });
        },
    });
};

export const useDeleteAllergy = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: medicalHistoryApi.deleteAllergy,
    });
};

export const useUpdateAllergy = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({allergyId, ...data}) => medicalHistoryApi.updateAllergy(allergyId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.patient.medicalHistory.all()
            })
        }
    });
};

export const useAddMedication = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data) => medicalHistoryApi.addMedication(data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.patient.medicalHistory.all()
            })
        }
    });
};

export const useUpdateMedication = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (medicationId, data) => medicalHistoryApi.updateMedication(medicationId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.patient.medicalHistory.all()
            })
        }
    });
};

export const useDiscontinueMedication = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ medicationId, data }) => {
            console.log("discontinueMedication mutation", medicationId, data)
            return medicalHistoryApi.discontinueMedication(medicationId, data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.patient.medicalHistory.all()
            })
        }
    });
};


export const useAddMedicalCondition = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data) => medicalHistoryApi.addMedicalCondition(data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.patient.medicalHistory.all()
            })
        }
    });
};

export const useUpdateMedicalCondition = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({conditionId, ...data}) => medicalHistoryApi.updateMedicalCondition(conditionId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.patient.medicalHistory.all()
            })
        }
    });
};


export const useAddImmunization = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data) => medicalHistoryApi.addImunization(data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.patient.medicalHistory.all()
            })
        }
    });
};

export const useUpdateImmunization = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({immunizationId, ...data}) => medicalHistoryApi.updateImmunization(immunizationId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.patient.medicalHistory.all()
            })
        }
    });
};

export const useDeleteImmunization = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (immunizationId) => medicalHistoryApi.deleteImmunization(immunizationId),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.patient.medicalHistory.all()
            })
        }
    });
};

export const useAddSurgery = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data) => medicalHistoryApi.addSurgery(data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.patient.medicalHistory.all()
            })
        }
    });
}

export const useUpdateSurgery = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (surgeryId, data) => medicalHistoryApi.updateSurgery(surgeryId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.patient.medicalHistory.all()
            })
        }
    });
}
export const useAddHospitalization = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data) => medicalHistoryApi.addHospitalization(data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.patient.medicalHistory.all()
            })
        }
    });
}

export const useAddFamilyHistory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data) => medicalHistoryApi.addFamilyHistory(data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.patient.medicalHistory.all()
            })
        }
    });
}

export const useUpdateFamilyHistory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({recordId, data}) => medicalHistoryApi.updateFamilyHistory(recordId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.patient.medicalHistory.all()
            })
        }
    }); 
}
export const useDeleteFamilyHistory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (recordId) => medicalHistoryApi.deleteFamilyHistory(recordId),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.patient.medicalHistory.all()
            })
        }
    });
}

export const useUpdateHospitaliztion = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (surgeryId, data) => medicalHistoryApi.updateSurgery(surgeryId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.patient.medicalHistory.all()
            })
        }
    });
}

export const useDeleteHospitalization = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (hospitalizationId) => medicalHistoryApi.deleteHospitalization(hospitalizationId),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.patient.medicalHistory.all()
            })
        }
    }); 
}
