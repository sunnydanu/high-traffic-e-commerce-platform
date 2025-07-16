require('dotenv').config();
const { Kafka } = require('kafkajs');
const db = require('./utils/db');

const kafka = new Kafka({ clientId: 'event-consumer', brokers: [process.env.KAFKA_BROKER] });
const consumer = kafka.consumer({ groupId: 'inventory-group' });

(async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'order_placed', fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const event = JSON.parse(message.value.toString());
      for (const item of event.items) {
        await db.query('BEGIN');
        const stockRes = await db.query('SELECT stock FROM products WHERE id = $1 FOR UPDATE', [item.product_id]);
        if (!stockRes.rows.length) continue;
        const currentStock = stockRes.rows[0].stock;
        const newStock = Math.max(currentStock - item.quantity, 0);
        await db.query('UPDATE products SET stock = $1 WHERE id = $2', [newStock, item.product_id]);
        await db.query('COMMIT');
      }
    }
  });

  console.log('Event consumer running');
})();
