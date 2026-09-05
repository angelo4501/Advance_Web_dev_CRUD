const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
    navToggle.textContent = isOpen ? 'Close' : 'Menu';
  });

  navLinks.addEventListener('click', (event) => {
    if (!event.target.closest('a')) return;
    navLinks.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.textContent = 'Menu';
  });
}

function setDbBadge(status) {
  const badges = document.querySelectorAll('[data-db-status]');
  const labels = {
    online: 'MongoDB online',
    connecting: 'MongoDB connecting',
    offline: 'MongoDB offline',
    checking: 'Checking database',
  };
  badges.forEach((badge) => {
    badge.textContent = labels[status] || labels.checking;
    badge.classList.toggle('is-online', status === 'online');
    badge.classList.toggle('is-connecting', status === 'connecting');
    badge.classList.toggle('is-offline', status === 'offline');
    badge.classList.toggle('is-checking', status === 'checking');
  });
}

async function updateDbStatus() {
  const badges = document.querySelectorAll('[data-db-status]');
  if (!badges.length) return;
  setDbBadge('checking');
  try {
    const endpoints = ['/api/health', '/api/items/db-status'];
    for (const endpoint of endpoints) {
      const response = await fetch(endpoint);
      if (!(response.ok || response.status === 503)) continue;
      const result = await response.json().catch(() => null);
      if (!result || !result.status) continue;
      setDbBadge(result.status === 'online' || result.status === 'connecting' ? result.status : 'offline');
      return;
    }
    const fallback = await fetch('/api/items?limit=1');
    setDbBadge(fallback.ok ? 'online' : 'offline');
  } catch {
    setDbBadge('offline');
  }
}

updateDbStatus();
setInterval(updateDbStatus, 20000);
