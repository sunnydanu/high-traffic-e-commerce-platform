require('dotenv').config();
const express = require('express');
const { connectProducer, publishEvent } = require('./kafka/producer');
const app = express();

app.use(express.json());

app.post('/orders', async (req, res) => {
  const event = {
    event_type: 'order_placed',
    order_id: Date.now().toString(),
    user_id: req.body.user_id,
    items: req.body.items
  };

  await publishEvent('order_placed', event);
  res.status(200).json({ message: 'Order placed', event });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
  await connectProducer();
  console.log(`Order service running on ${PORT}`);
});
