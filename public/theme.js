document.documentElement.setAttribute(
  'data-theme',
  localStorage.getItem('catalog-theme') === 'dark' ? 'dark' : 'light'
);
