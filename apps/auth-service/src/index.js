const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const Joi = require('joi');

dotenv.config();
const app = express();
app.use(express.json());

const USERS = [
  { id: 1, username: 'admin', password: 'admin123', role: 'admin' },
  { id: 2, username: 'sunny', password: 'user123', role: 'user' }
];

const schema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required()
});

app.post('/login', (req, res) => {
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const user = USERS.find(
    u => u.username === req.body.username && u.password === req.body.password
  );
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '1h'
  });

  res.json({ token });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Auth service running on port ${PORT}`);
});
