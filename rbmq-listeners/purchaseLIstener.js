const amqp = require("amqplib");
const db = require("../db");

async function startPurchaseListener() {
  try {
    const connection = await amqp.connect("amqp://localhost"); 
    const channel = await connection.createChannel();

    const queueName = "purchase_notifications";
    await channel.assertQueue(queueName, { durable: true });

    console.log("Purchase Listener is waiting for messages...");

    channel.consume(queueName, (message) => {
      const content = message.content.toString();
      const purchaseData = JSON.parse(content);

      console.log("Received a purchase notification:", purchaseData);

      const { userName, type, status, purchaseDate } = purchaseData;

      // Create a statement
      const stmt = db.prepare(
        "INSERT INTO subscriptions (userName, type, status, purchaseDate) VALUES (?, ?, ?, ?)"
      );
      stmt.run(userName, type, status, purchaseDate, (err) => {
        if (err) {
          console.log(
            "There was an error inserting the database, the message will be requeued"
          );
          channel.nack(message, false, true);
        } else {
          console.log(
            "The data has been successfully inserted in the database"
          );
          channel.ack(message);
        }
      });
      stmt.finalize();
    });
  } catch (error) {
    console.error("Error starting Purchase Listener:", error);
  }
}

startPurchaseListener();
