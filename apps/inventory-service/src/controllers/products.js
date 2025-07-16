const db = require('../utils/db');
const redis = require('../utils/redis');
const Joi = require('joi');

exports.getAll = async (req, res) => {
  const { page = 1, limit = 10, category } = req.query;
  const offset = (page - 1) * limit;

  const where = category ? `WHERE category = $3` : '';
  const values = category ? [limit, offset, category] : [limit, offset];

  const result = await db.query(
    `SELECT * FROM products ${where} LIMIT $1 OFFSET $2`,
    values
  );
  res.json(result.rows);
};

exports.getById = async (req, res) => {
  const id = req.params.id;
  const cacheKey = `product:${id}`;

  const cached = await redis.get(cacheKey);
  if (cached) return res.json(JSON.parse(cached));

  const { rows } = await db.query('SELECT * FROM products WHERE id = $1', [id]);
  if (!rows.length) return res.status(404).send('Not Found');

  await redis.set(cacheKey, JSON.stringify(rows[0]), 'EX', 300);
  res.json(rows[0]);
};

exports.create = async (req, res) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    category: Joi.string().required(),
    price: Joi.number().required(),
    stock: Joi.number().required(),
    description: Joi.string().required(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const { name, category, price, stock, description } = value;
  const { rows } = await db.query(
    'INSERT INTO products (name, category, price, stock, description) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [name, category, price, stock, description]
  );
  res.status(201).json(rows[0]);
};

// Similar structure for update, delete, updateStock (with transaction)
// Update Product
exports.update = async (req, res) => {
  const id = req.params.id;
  const schema = Joi.object({
    name: Joi.string().required(),
    category: Joi.string().required(),
    price: Joi.number().required(),
    stock: Joi.number().required(),
    description: Joi.string().required(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { name, category, price, stock, description } = value;

  try {
    const result = await db.query(
      `UPDATE products
       SET name = $1, category = $2, price = $3, stock = $4, description = $5
       WHERE id = $6 RETURNING *`,
      [name, category, price, stock, description, id]
    );

    if (result.rowCount === 0) return res.status(404).json({ error: 'Product not found' });

    await redis.del(`product:${id}`);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};

// Delete Product
exports.remove = async (req, res) => {
  const id = req.params.id;
  try {
    const result = await db.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);

    if (result.rowCount === 0) return res.status(404).json({ error: 'Product not found' });

    await redis.del(`product:${id}`);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};

// Atomic Stock Update
exports.updateStock = async (req, res) => {
  const id = req.params.id;
  const { quantity } = req.body;

  if (typeof quantity !== 'number' || quantity <= 0)
    return res.status(400).json({ error: 'Quantity must be a positive number' });

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query('SELECT stock FROM products WHERE id = $1 FOR UPDATE', [id]);
    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Product not found' });
    }

    const currentStock = result.rows[0].stock;
    if (currentStock < quantity) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    const newStock = currentStock - quantity;

    await client.query('UPDATE products SET stock = $1 WHERE id = $2', [newStock, id]);
    await client.query('COMMIT');

    await redis.del(`product:${id}`);

    res.json({ message: 'Stock updated', stock: newStock });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.sendStatus(500);
  } finally {
    client.release();
  }
};
