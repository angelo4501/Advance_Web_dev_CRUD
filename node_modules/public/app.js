const API = '/api/items';
const form = document.querySelector('#item-form');
const itemIdField = document.querySelector('#item-id');
const nameField = document.querySelector('#name');
const descriptionField = document.querySelector('#description');
const priceField = document.querySelector('#price');
const quantityField = document.querySelector('#quantity');
const searchField = document.querySelector('#search');
const sortPriceButton = document.querySelector('#sort-price');
const itemCount = document.querySelector('#item-count');
const list = document.querySelector('#list');
const itemDialog = document.querySelector('#item-dialog');
const itemDetails = document.querySelector('#item-details');
let items = [];
let totalItems = 0;
let priceSortDirection = 'asc';
let currency = localStorage.getItem('catalog-currency') || 'USD';

function formatPrice(price) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
  }).format(Number(price));
}

async function loadItems() {
  const response = await fetch(API);
  if (!response.ok) throw new Error('Unable to load items');
  const result = await response.json();
  items = result.items;
  totalItems = result.total;
  renderItems();
}
function setError(field, message) {
  const error = document.querySelector(`#${field}-error`);
  error.textContent = message;
  document.querySelector(`#${field}`).classList.toggle('input-error', Boolean(message));
}

function validateForm() {
  const values = {
    name: nameField.value.trim(),
    description: descriptionField.value.trim(),
    price: priceField.value,
    quantity: quantityField.value,
  };
  setError('name', values.name ? '' : 'Name is required.');
  setError('description', values.description ? '' : 'Description is required.');
  setError('price', values.price !== '' && Number(values.price) >= 0 ? '' : 'Enter a valid price.');
  setError('quantity', values.quantity !== '' && Number.isInteger(Number(values.quantity)) && Number(values.quantity) >= 0 ? '' : 'Enter a whole-number quantity.');
  return Object.values(values).every((value) => value !== '') && Number(values.price) >= 0 && Number.isInteger(Number(values.quantity)) && Number(values.quantity) >= 0;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!validateForm()) return;

  const payload = {
    name: nameField.value.trim(),
    description: descriptionField.value.trim(),
    price: Number(priceField.value),
    quantity: Number(quantityField.value),
  };
  const itemId = itemIdField.value;
  const endpoint = itemId ? `${API}/${itemId}` : API;
  const response = await fetch(endpoint, {
    method: itemId ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const result = await response.json();
    setError('name', result.error || 'Unable to add item.');
    return;
  }
  form.reset();
  itemIdField.value = '';
  setFormMode('create');
  ['name', 'description', 'price', 'quantity'].forEach((field) => setError(field, ''));
  await loadItems();
});

searchField.addEventListener('input', renderItems);
sortPriceButton.addEventListener('click', () => {
  priceSortDirection = priceSortDirection === 'asc' ? 'desc' : 'asc';
  sortPriceButton.textContent = `Price: ${priceSortDirection === 'asc' ? 'low to high' : 'high to low'}`;
  renderItems();
});
function renderItems() {
  const query = searchField.value.trim().toLowerCase();
  const visibleItems = items
    .filter((item) => `${item.name} ${item.description}`.toLowerCase().includes(query))
    .sort((firstItem, secondItem) => {
      const difference = Number(firstItem.price) - Number(secondItem.price);
      return priceSortDirection === 'asc' ? difference : -difference;
    });
  itemCount.textContent = `Showing ${visibleItems.length} of ${totalItems} items.`;
  if (!visibleItems.length) {
    list.innerHTML = `<p class="empty-state">${query ? 'No items match your search.' : 'Your catalog is empty. Add the first item.'}</p>`;
    return;
  }
  list.innerHTML = visibleItems.map((item) => `
    <article class="item-card${Number(item.quantity) < 3 ? ' low-stock' : ''}">
      <div>
        <h3>${escapeHtml(item.name)}</h3>
        <p>${escapeHtml(item.description)}</p>
      </div>
      <div class="item-meta">
        <strong>${formatPrice(item.price)}</strong>
        <span class="stock-badge${Number(item.quantity) < 3 ? ' stock-badge--low' : ''}">${item.quantity} in stock</span>
        <div class="item-actions">
          <button type="button" class="btn-ghost" data-view-id="${item._id}">View</button>
          <button type="button" class="btn-ghost" data-edit-id="${item._id}">Edit</button>
          <button type="button" class="btn-danger" data-delete-id="${item._id}">Delete</button>
        </div>
      </div>
    </article>
  `).join('');
}

list.addEventListener('click', (event) => {
  const viewButton = event.target.closest('[data-view-id]');
  if (viewButton) {
    const item = items.find((entry) => entry._id === viewButton.dataset.viewId);
    if (!item) return;
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
    `;
    itemDialog.showModal();
    return;
  }

  const deleteButton = event.target.closest('[data-delete-id]');
  if (deleteButton) {
    const item = items.find((entry) => entry._id === deleteButton.dataset.deleteId);
    if (!item || !window.confirm(`Are you sure you want to delete "${item.name}"?`)) return;
    fetch(`${API}/${item._id}`, { method: 'DELETE' })
      .then((response) => {
        if (!response.ok) throw new Error('Unable to delete item');
        return loadItems();
      })
      .catch(() => window.alert('Unable to delete item.'));
    return;
  }

  const editButton = event.target.closest('[data-edit-id]');
  if (!editButton) return;
  const item = items.find((entry) => entry._id === editButton.dataset.editId);
  if (!item) return;
  itemIdField.value = item._id;
  nameField.value = item.name;
  descriptionField.value = item.description;
  priceField.value = item.price;
  quantityField.value = item.quantity;
  setFormMode('edit');
  nameField.focus();
});

function setFormMode(mode) {
  const isEdit = mode === 'edit';
  const formTitle = document.querySelector('#form-title');
  if (formTitle) formTitle.textContent = isEdit ? 'Update an item' : 'Add an item';
  form.querySelector('button[type="submit"]').textContent = isEdit ? 'Update item' : 'Add item';
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[character]));
}

loadItems().catch(() => {
  list.innerHTML = '<p class="empty-state">Unable to connect to the catalog.</p>';
});

