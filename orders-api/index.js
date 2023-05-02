const express = require("express")
const app = express()

const amqp = require('amqplib');
const amqpUrl = process.env.AMQP_URL || 'amqp://localhost:5672';

// esempio con piu consumer su coda di tipo direct, roundrobin
/* async function connect() {
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
            consumerTag: "orders-api"
        });
    } catch (error) {
        console.log({
            error
        });
    }
}
connect(); */

app.get('/', async (req, res) => {
    const connection = await amqp.connect(amqpUrl);
const channel = await connection.createChannel();

// dichiarazione dell'exchange come fanout
const exchangeName = 'orderEx';

// creo 2 code diverse per i 2 consumer, ogni consumer avrà la propria copia del messaggio e potrà elaborarla indipendentemente.
const queuePayments = 'payments-queue';
const queueNotification = 'notification-queue';
await channel.assertExchange(exchangeName, 'fanout', {
    durable: true
});

// invio del messaggio all'exchange
const message = JSON.stringify({
    orderId: Math.floor(Math.random() * 999) + 1,
});

 // Creazione delle code e binding all'exchange
 await channel.assertQueue(queuePayments, { durable: true });
 await channel.assertQueue(queueNotification, { durable: true });
 await channel.bindQueue(queuePayments, exchangeName, '');
 await channel.bindQueue(queueNotification, exchangeName, '');

const routingKey = ''; // in una exchange fanout la routing key è ignorata
channel.publish(exchangeName, routingKey, Buffer.from(message));

console.log(`[x] Orders: Sent '${message}' to '${exchangeName}' with routing key '${routingKey}'`);

return res.send("OK 8000");
})

app.listen(8000, () => {
    console.log("ORDERS API listening on port 8000")
})