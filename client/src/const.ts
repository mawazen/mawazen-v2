export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Simple login URL for development and production
export const getLoginUrl = () => {
  console.log('[Login] Using simple login form');
  return '/api/local-login';
};
