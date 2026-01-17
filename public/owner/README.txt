Owner Dashboard

- URL: /owner
- Login endpoint: POST /api/owner/login { password }
- Uses cookie session: owner_dashboard_session

Required env vars on Railway:
- OWNER_OPEN_ID: firebase-<uid> of the owner user
- OWNER_DASHBOARD_PASSWORD: password for /owner login

Notes:
- This dashboard is served by the backend server (Railway) even in production.
