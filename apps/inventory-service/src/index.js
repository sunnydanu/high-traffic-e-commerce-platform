require('dotenv').config();
const express = require('express');
const productRoutes = require('./routes/products');
 
const rateLimit = require('express-rate-limit');

const app = express();
app.use(express.json());

// Rate limiting
const limiter = rateLimit({ windowMs: 1 * 60 * 1000, max: 100 });
app.use('/products', limiter);

// Routes
app.use('/products', productRoutes);

// Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Inventory service on ${PORT}`));
