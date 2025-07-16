const { Kafka } = require('kafkajs');
const kafka = new Kafka({ clientId: 'order-service', brokers: [process.env.KAFKA_BROKER] });
const producer = kafka.producer();

async function connectProducer() {
  await producer.connect();
}

async function publishEvent(topic, payload) {
  await producer.send({ topic, messages: [{ value: JSON.stringify(payload) }] });
}

module.exports = { connectProducer, publishEvent };
