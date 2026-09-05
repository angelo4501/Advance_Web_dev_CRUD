const API = '/api/items';
const searchField = document.querySelector('#dashboard-search');
const stockFilter = document.querySelector('#stock-filter');
const dashboardCount = document.querySelector('#dashboard-count');
const dashboardList = document.querySelector('#dashboard-list');
const itemDialog = document.querySelector('#item-dialog');
const itemDetails = document.querySelector('#item-details');
let items = [];
let totalItems = 0;
let currency = localStorage.getItem('catalog-currency') || 'USD';

function formatPrice(price) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
  }).format(Number(price));
}

function stockStatus(quantity) {
  if (Number(quantity) <= 0) return { label: 'Out of stock', className: 'stock-badge stock-badge--out' };
  if (Number(quantity) < 3) return { label: 'Low stock', className: 'stock-badge stock-badge--low' };
  return { label: 'In stock', className: 'stock-badge' };
}

function visibleItems() {
  const query = searchField.value.trim().toLowerCase();
  const filter = stockFilter.value;
  return items.filter((item) => {
    const matchesQuery = `${item.name} ${item.description}`.toLowerCase().includes(query);
    const quantity = Number(item.quantity);
    const matchesFilter = filter === 'low' ? quantity > 0 && quantity < 3
      : filter === 'out' ? quantity <= 0
      : true;
    return matchesQuery && matchesFilter;
  });
}

function renderStats() {
  const units = items.reduce((sum, item) => sum + Number(item.quantity), 0);
  const lowStock = items.filter((item) => Number(item.quantity) > 0 && Number(item.quantity) < 3).length;
  const value = items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
  document.querySelector('#stat-items').textContent = String(totalItems);
  document.querySelector('#stat-units').textContent = String(units);
  document.querySelector('#stat-low').textContent = String(lowStock);
  document.querySelector('#stat-value').textContent = formatPrice(value);
}

function renderDashboard() {
  const visible = visibleItems();
  dashboardCount.textContent = `Showing ${visible.length} of ${totalItems} items.`;
  if (!visible.length) {
    dashboardList.innerHTML = `<tr><td colspan="5"><p class="empty-state">No items match this check.</p></td></tr>`;
    return;
  }
  dashboardList.innerHTML = visible.map((item) => {
    const status = stockStatus(item.quantity);
    return `
      <tr>
        <td>
          <strong>${escapeHtml(item.name)}</strong>
          <p>${escapeHtml(item.description)}</p>
        </td>
        <td>${formatPrice(item.price)}</td>
        <td>${item.quantity}</td>
        <td><span class="${status.className}">${status.label}</span></td>
        <td><button type="button" class="btn-ghost" data-view-id="${item._id}">View</button></td>
      </tr>
    `;
  }).join('');
}

async function loadItems() {
  const response = await fetch(`${API}?limit=100`);
  if (!response.ok) throw new Error('Unable to load items');
  const result = await response.json();
  items = result.items;
  totalItems = result.total;
  renderStats();
  renderDashboard();
}

searchField.addEventListener('input', renderDashboard);
stockFilter.addEventListener('change', renderDashboard);

dashboardList.addEventListener('click', (event) => {
  const viewButton = event.target.closest('[data-view-id]');
  if (!viewButton) return;
  const item = items.find((entry) => entry._id === viewButton.dataset.viewId);
  if (!item) return;
  const status = stockStatus(item.quantity);
  itemDetails.innerHTML = `
    <p class="eyebrow">Item details</p>
    <h2>${escapeHtml(item.name)}</h2>
    <p class="dialog-description">${escapeHtml(item.description)}</p>
    <dl class="detail-grid">
      <div>
        <dt>Price</dt>
        <dd>${formatPrice(item.price)}</dd>
      </div>
      <div>
        <dt>Quantity</dt>
        <dd>${item.quantity}</dd>
      </div>
    </dl>
    <p class="dashboard-status"><span class="${status.className}">${status.label}</span></p>
    <a class="btn--primary dashboard-edit" href="/">Manage in catalog</a>
  `;
  itemDialog.showModal();
});

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[character]));
}

loadItems().catch(() => {
  dashboardList.innerHTML = '<tr><td colspan="5"><p class="empty-state">Unable to connect to the catalog.</p></td></tr>';
});
