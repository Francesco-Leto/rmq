const express = require("express")
const app = express()

const amqp = require('amqplib');
const amqpUrl = process.env.AMQP_URL || 'amqp://localhost:5672';

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
            consumerTag: "orders-api"
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
    const message = JSON.stringify({
        customerId: 4,
        orderId: 6,
        number: "111 222 3333"
    });
    const routingKey = 'newOrderRK';
    channel.publish(exchangeName, routingKey, Buffer.from(message));

    console.log(`[x] Sent '${message}' to '${exchangeName}' with routing key '${routingKey}'`);

    return res.send("OK 8000");
})

app.listen(8000, () => {
    console.log("ORDERS API listening on port 8000")
})