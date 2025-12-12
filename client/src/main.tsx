import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import "./index.css";

const queryClient = new QueryClient();
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

// Handle token from URL query parameter
const handleTokenFromUrl = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  
  if (token) {
    // Store token in localStorage
    localStorage.setItem('auth_token', token);
    console.log('[Auth] Token stored from URL:', token.substring(0, 20) + '...');
    // Clean the URL
    window.history.replaceState({}, document.title, window.location.pathname);
    console.log('[Auth] Token stored from URL');
  } else {
    // Check if token exists in localStorage
    const existingToken = localStorage.getItem('auth_token');
    if (existingToken) {
      console.log('[Auth] Found existing token in localStorage:', existingToken.substring(0, 20) + '...');
    } else {
      console.log('[Auth] No token found in URL or localStorage');
    }
  }
};

// Handle token from URL on app load
handleTokenFromUrl();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  // Clear token and redirect to home page
  localStorage.removeItem('auth_token');
  window.location.href = "/";
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: API_BASE_URL ? `${API_BASE_URL}/api/trpc` : "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        // Add token to headers if available
        const token = localStorage.getItem('auth_token');
        const headers = {
          ...(init?.headers || {}),
          ...(token && { Authorization: `Bearer ${token}` }),
        };
        
        if (token) {
          console.log('[Auth] Sending Bearer token in headers');
        } else {
          console.log('[Auth] No token available to send');
        }
        
        return globalThis.fetch(input, {
          ...(init ?? {}),
          headers,
          credentials: "include",
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
