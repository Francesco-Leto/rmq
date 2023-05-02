const express = require("express");
const amqp = require('amqplib');
const amqpUrl = process.env.AMQP_URL || 'amqp://localhost:5672';

const app = express();

async function connect() {
  try {
    const connection = await amqp.connect(amqpUrl);
    const channel = await connection.createChannel();
    // dichiarazione dell'exchange e della coda
    const exchangeName = 'orderExTopic';
    const queueName = 'notification-queue-phone-topic';
    await channel.assertExchange(exchangeName, 'topic', {
      durable: true
    });
    await channel.assertQueue(queueName, {
      durable: true
    });
    await channel.bindQueue(queueName, exchangeName, 'orders.new.phone.*');

    // gestione dei messaggi
    console.log('[*] Waiting for messages in "' + queueName + '" queue. To exit press CTRL+C');
    channel.prefetch(null);
    channel.consume(queueName, (msg) => {
      const content = msg.content.toString();
      console.log(`[x] Received '${content}' from '${queueName}'`);

      // riconoscimento del messaggio elaborato
      channel.ack(msg);

      // invio del messaggio all'exchange per altra coda letta da orders-api
      // buffer to string
      const message = msg.content.toString();
    }, {
      noAck: false,
      consumerTag: "notification-api"
    });
  } catch (error) {
    console.log({
      error
    });
  }
}
connect();


app.listen(8001, () => {
  console.log("NOTIFICATION Listening on PORT 8001");
});