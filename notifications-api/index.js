const express = require("express");
const amqp = require('amqplib');
const amqpUrl = process.env.AMQP_URL || 'amqp://localhost:5672';

const app = express();

async function connect() {
  try {
        const connection = await amqp.connect(amqpUrl);
        const channel = await connection.createChannel();
        // dichiarazione dell'exchange e della coda
        const exchangeName = 'orderEx';
        const queueName = 'paidRK';
        await channel.assertExchange(exchangeName, 'direct');
        await channel.assertQueue(queueName, {
            durable: true
        });
        await channel.bindQueue(queueName, exchangeName, queueName);

        // gestione dei messaggi
        console.log('[*] Waiting for messages in "' + queueName + '" queue. To exit press CTRL+C');
        channel.consume(queueName, (msg) => {
            const content = msg.content.toString();
            console.log(`[x] Received '${content}' from '${queueName}'`);

            // riconoscimento del messaggio elaborato
            channel.ack(msg);
        }, {
            noAck: false,
            consumerTag: "notifications-api"
        });
    } catch (error) {
        console.log({
            error
        });
    }
}
connect();

app.get('/', async (req, res) => {
  const connection = await amqp.connect(amqpUrl);
  const channel = await connection.createChannel();

  // dichiarazione dell'exchange e della coda
  const exchangeName = 'orderEx';
  await channel.assertExchange(exchangeName, 'direct', {
    durable: true
  });

  // invio del messaggio all'exchange
  const message = JSON.stringify({ msg: req.body});
  const routingKey = 'notifiedRK';
  channel.publish(exchangeName, routingKey, Buffer.from(message));

  console.log(`[x] Notification: Sent '${message}' to '${exchangeName}' with routing key '${routingKey}'`);


  return res.send("OK 8001");
})


app.listen(8001, () => {
  console.log("NOTIFICATION Listening on PORT 8001");
});