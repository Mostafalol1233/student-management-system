// Replace content of client/src/lib/queryClient.ts with this:
import { QueryClient } from "@tanstack/react-query";

// API Base URL - uses environment variable for production
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const apiRequest = async (method: string, path: string, data?: any) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Important for session cookies
    body: data ? JSON.stringify(data) : undefined,
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  
  return response;
};

// Create a default fetcher for queries
const defaultFetcher = async ({ queryKey }: { queryKey: any[] }) => {
  const [path] = queryKey;
  const response = await apiRequest("GET", path);
  return response.json();
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: defaultFetcher,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});