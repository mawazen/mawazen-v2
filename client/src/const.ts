export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  // Use production OAuth settings
  const oauthPortalUrl = 'https://manus.computer'; // Replace with your actual OAuth URL
  const appId = 'qayd-legal-assistant'; // Replace with your actual app ID
  
  console.log('[Login] Using production OAuth login');
  
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
