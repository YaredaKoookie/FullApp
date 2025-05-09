import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import useMagicLinkCallback from '@/hooks/useMagicLinkCallback';
import LoadingSpinner from '@/components/Loading';
import { Button } from '@chakra-ui/react';

const MagicLinkVerify = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [status, setStatus] = useState('idle');
    const [errorMessage, setErrorMessage] = useState(null);

    const { mutate: verifyMagicLink } = useMagicLinkCallback({
        onSuccess: () => {
            setStatus('success');
            toast.success('Login successful!');
            navigate('/dashboard'); // Redirect to dashboard after successful verification
        },
        onError: (error) => {
            setStatus('error');
            const message = error.response?.data?.message || 'Failed to verify magic link';
            setErrorMessage(message);
            toast.error(message);
        },
    });

    useEffect(() => {
        // Skip if already processing
        if (status !== 'idle') return;

        const params = new URLSearchParams(location.search);
        const token = params.get('token');

        if (!token) {
            setStatus('error');
            setErrorMessage('No verification token found');
            toast.error('Invalid magic link - no token provided');
            navigate('/auth/login', { replace: true });
            return;
        }

        setStatus('verifying');
        verifyMagicLink(token);
    }, [location.search, status, verifyMagicLink, navigate]);

    const handleRetry = () => {
        setStatus('idle');
        setErrorMessage(null);
    };

    const handleGoToLogin = () => {
        navigate('/login', { replace: true });
    };

    if (status === 'verifying') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <LoadingSpinner size="lg" />
                <h1 className="text-2xl font-semibold">Verifying your magic link...</h1>
                <p className="text-muted-foreground">Please wait while we authenticate your session</p>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-4">
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-semibold">Verification Failed</h1>
                    <p className="text-destructive">{errorMessage}</p>
                    <p className="text-muted-foreground">
                        The magic link may have expired or is invalid
                    </p>
                </div>
                <div className="flex gap-4">
                    <Button onClick={handleRetry}>Try Again</Button>
                    <Button variant="outline" onClick={handleGoToLogin}>
                        Go to Login
                    </Button>
                </div>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <h1 className="text-2xl font-semibold">Login Successful!</h1>
                <p className="text-muted-foreground">Redirecting to your dashboard...</p>
            </div>
        );
    }

    return null;
};

export default MagicLinkVerify;