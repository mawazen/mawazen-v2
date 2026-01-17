const el = (id) => document.getElementById(id);

async function api(path, options = {}) {
  const res = await fetch(path, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const isJson = (res.headers.get('content-type') || '').includes('application/json');
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    const msg = data?.message || data?.error || `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

function setVisible(id, v) {
  const node = el(id);
  if (!node) return;
  node.style.display = v ? '' : 'none';
}

function renderOverview(data) {
  const wrap = el('overviewKpis');
  if (!wrap) return;

  const items = [
    { label: 'إجمالي المستخدمين', value: data.totalUsers },
    { label: 'المستخدمين النشطين', value: data.activeUsers },
    { label: 'إجمالي المؤسسات', value: data.totalOrganizations },
  ];

  wrap.innerHTML = items
    .map(
      (x) => `
        <div class="kpi">
          <div class="kpiLabel">${x.label}</div>
          <div class="kpiValue">${Number(x.value ?? 0)}</div>
        </div>
      `
    )
    .join('');
}

function renderUsers(users) {
  const tbody = el('usersTbody');
  if (!tbody) return;

  tbody.innerHTML = users
    .map((u) => {
      const active = Boolean(u.isActive);
      const plan = u.subscriptionPlan || 'individual';
      const orgName = u.organization?.name || '—';
      const orgPlan = u.organization?.subscriptionPlan || '—';
      const orgSeat = u.organization?.seatLimit ?? '—';

      const pill = active
        ? `<span class="pill pillOn">نشط</span>`
        : `<span class="pill pillOff">غير نشط</span>`;

      return `
        <tr>
          <td>${u.id}</td>
          <td>${escapeHtml(u.name || '')}</td>
          <td>${escapeHtml(u.email || '')}</td>
          <td>${escapeHtml(u.phone || '')}</td>
          <td>${escapeHtml(u.role || '')}</td>
          <td>${pill}</td>
          <td>${escapeHtml(plan)}</td>
          <td>${escapeHtml(orgName)}<div class="muted" style="margin-top:4px">${escapeHtml(orgPlan)} | seats: ${escapeHtml(String(orgSeat))}</div></td>
          <td>
            <div class="actionRow">
              <button class="actionBtn" data-action="toggleActive" data-id="${u.id}" data-active="${active ? '1' : '0'}">${active ? 'إيقاف' : 'تفعيل'}</button>
              <button class="actionBtn" data-action="setPlan" data-id="${u.id}" data-plan="individual">individual</button>
              <button class="actionBtn" data-action="setPlan" data-id="${u.id}" data-plan="law_firm">law_firm</button>
              <button class="actionBtn" data-action="setPlan" data-id="${u.id}" data-plan="enterprise">enterprise</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join('');
}

function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function loadOverview() {
  const res = await api('/api/owner/overview');
  if (res?.success) renderOverview(res.data);
}

async function loadUsers() {
  const usersError = el('usersError');
  if (usersError) usersError.style.display = 'none';

  const q = (el('q')?.value || '').trim();
  const role = (el('role')?.value || '').trim();
  const active = (el('active')?.value || '').trim();

  const params = new URLSearchParams();
  if (q) params.set('query', q);
  if (role) params.set('role', role);
  if (active) params.set('isActive', active);

  try {
    const res = await api(`/api/owner/users?${params.toString()}`);
    if (res?.success) renderUsers(res.data || []);
  } catch (err) {
    if (usersError) {
      usersError.style.display = '';
      usersError.textContent = err?.message || 'فشل تحميل المستخدمين';
    }
  }
}

async function refreshAll() {
  await Promise.all([loadOverview(), loadUsers()]);
}

async function ensureLoggedIn() {
  const status = await api('/api/owner/status');
  return Boolean(status?.isOwner);
}

async function showLogin() {
  setVisible('loginCard', true);
  setVisible('dashboard', false);
}

async function showDashboard() {
  setVisible('loginCard', false);
  setVisible('dashboard', true);
}

async function handleLoginForm() {
  const form = el('loginForm');
  const error = el('loginError');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (error) error.style.display = 'none';

    const password = el('password')?.value || '';
    try {
      const res = await api('/api/owner/login', {
        method: 'POST',
        body: JSON.stringify({ password }),
      });

      if (!res?.success) {
        throw new Error(res?.message || 'فشل تسجيل الدخول');
      }

      await bootstrap();
    } catch (err) {
      if (error) {
        error.style.display = '';
        error.textContent = err?.message || 'فشل تسجيل الدخول';
      }
    }
  });
}

function wireActions() {
  const logoutBtn = el('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await api('/api/owner/logout', { method: 'POST' });
      } finally {
        window.location.reload();
      }
    });
  }

  const refreshBtn = el('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      await refreshAll();
    });
  }

  const applyFilters = el('applyFilters');
  if (applyFilters) {
    applyFilters.addEventListener('click', async () => {
      await loadUsers();
    });
  }

  const tbody = el('usersTbody');
  if (tbody) {
    tbody.addEventListener('click', async (e) => {
      const btn = e.target?.closest('button');
      if (!btn) return;

      const action = btn.getAttribute('data-action');
      const userId = btn.getAttribute('data-id');
      if (!action || !userId) return;

      if (action === 'toggleActive') {
        const isActive = btn.getAttribute('data-active') === '1';
        await api(`/api/owner/users/${encodeURIComponent(userId)}/active`, {
          method: 'POST',
          body: JSON.stringify({ isActive: !isActive }),
        });
        await refreshAll();
        return;
      }

      if (action === 'setPlan') {
        const plan = btn.getAttribute('data-plan') || '';
        await api(`/api/owner/users/${encodeURIComponent(userId)}/plan`, {
          method: 'POST',
          body: JSON.stringify({ plan }),
        });
        await refreshAll();
        return;
      }
    });
  }
}

async function bootstrap() {
  const loggedIn = await ensureLoggedIn();
  if (!loggedIn) {
    await showLogin();
    return;
  }

  await showDashboard();
  await refreshAll();
}

document.addEventListener('DOMContentLoaded', async () => {
  wireActions();
  await handleLoginForm();
  await bootstrap();
});
