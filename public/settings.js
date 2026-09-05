const currencySelect = document.querySelector('#currency-select');
const currencySaved = document.querySelector('#currency-saved');
const themeInputs = document.querySelectorAll('input[name="theme"]');
const savedTheme = localStorage.getItem('catalog-theme') === 'dark' ? 'dark' : 'light';

currencySelect.value = localStorage.getItem('catalog-currency') || 'USD';
themeInputs.forEach((input) => {
  input.checked = input.value === savedTheme;
});

currencySelect.addEventListener('change', () => {
  localStorage.setItem('catalog-currency', currencySelect.value);
  currencySaved.hidden = false;
});

themeInputs.forEach((input) => {
  input.addEventListener('change', () => {
    if (!input.checked) return;
    localStorage.setItem('catalog-theme', input.value);
    document.documentElement.setAttribute('data-theme', input.value);
  });
});
