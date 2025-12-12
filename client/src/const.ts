export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  // For local development, use local login instead of OAuth
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    console.log('[Login] Using local development login');
    return '/api/local-login';
  }

  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  
  // Debug logging
  console.log('Environment vars:', {
    VITE_OAUTH_PORTAL_URL: oauthPortalUrl,
    VITE_APP_ID: appId,
    allEnv: import.meta.env
  });
  
  if (!oauthPortalUrl) {
    console.error('VITE_OAUTH_PORTAL_URL is not defined');
    return '/api/local-login'; // Fallback to local login
  }
  
  const backendOrigin = import.meta.env.VITE_BACKEND_ORIGIN || window.location.origin;
  const redirectUri = `${backendOrigin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
