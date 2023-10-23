const amqp = require("amqplib");
const db = require("../db");

async function startUpdateListener() {
  try {
    
    const connection = await amqp.connect("amqp://localhost"); 
    const channel = await connection.createChannel();

    const queueName = "update_notifications"; 
    await channel.assertQueue(queueName, { durable: true });

    console.log("update Listener is waiting for messages...");

    channel.consume(queueName, (message) => {
      const content = message.content.toString();
      const updatedData = JSON.parse(content);


      console.log("Received a status update notification:", updatedData);

      const { newStatus, subscriptionId } = updatedData;

      const sql = "UPDATE subscriptions SET status = ? WHERE id = ?";
      db.run(sql, [newStatus, subscriptionId], (err) => {
        if (err) {
          console.log(
            "There was an error updating the database, the message will be requeued"
          );
          channel.nack(message, false, true);
        } else {
          console.log("The data has been successfully updated in the database");
          channel.ack(message);
        }
      });
    });
  } catch (error) {
    console.error("Error starting Purchase Listener:", error);
  }
}

startUpdateListener();
