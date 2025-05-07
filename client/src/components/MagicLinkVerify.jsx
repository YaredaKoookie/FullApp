import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import apiClient from '../api/apiClient';
import { toast } from 'react-toastify';

const MagicLinkVerify = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const { mutate: verifyMagicLink } = useMutation({
            mutationFn: (token) => apiClient.post('/auth/magic-link/verify', { token }),
            onSuccess: (data) => {
                if (data?.success) {
                    toast.success("Successfully Logged In");
                    navigate("/"); // Redirect to the home page after successful verification
                }
            },
            onError: (error) => {
                console.error('Error verifying magic link:', error);
                toast.error(error.message);
            },
        }
    );

    const hasVerified = useRef(false);

    useEffect(() => {
        if (hasVerified.current) return;

        const params = new URLSearchParams(location.search);
        const token = params.get('token');

        if (!token) {
            console.error('Token not found in URL');
            navigate("/");
            toast.error("Token not found");
            return;
        }

        hasVerified.current = true;
        verifyMagicLink(token);
    }, [location.search, verifyMagicLink]);


    return <div>Verifying magic link...</div>;
};

export default MagicLinkVerify;
