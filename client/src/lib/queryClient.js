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

export default queryClient;