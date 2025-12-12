export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Simple login URL for development and production
export const getLoginUrl = () => {
  console.log('[Login] Using simple login form');
  const backendOrigin = import.meta.env.VITE_BACKEND_ORIGIN;
  if (backendOrigin) {
    return `${backendOrigin}/api/local-login`;
  }
  return '/api/local-login';
};
