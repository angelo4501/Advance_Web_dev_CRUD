const express = require('express');
const cors = require('cors');

const app = express();
const products = [
  { id: 1, name: 'Laptop', price: 999.99 },
  { id: 2, name: 'Headphones', price: 79.99 },
];

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/products', (_req, res) => {
  res.status(200).json(products);
});

app.post('/api/products', (req, res) => {
  const { name, price } = req.body || {};
  if (!name || price === undefined || price === null) {
    return res.status(400).json({ error: 'Name and price are required' });
  }

  const product = {
    id: products.reduce((maxId, item) => Math.max(maxId, item.id), 0) + 1,
    name,
    price,
  };
  products.push(product);

  return res.status(201).json(product);
});

module.exports = app;
