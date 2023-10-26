const amqp = require("amqplib");
const db = require("../db");

async function startUpdateListener() {
  try {
    const connection = await amqp.connect("amqp://rabbitmq");
    const channel = await connection.createChannel();

    const queueName = "update_notifications";
    await channel.assertQueue(queueName, { durable: true });

    console.log("update Listener is waiting for messages...");

    channel.consume(queueName, (message) => {
      const content = message.content.toString();
      const updatedData = JSON.parse(content);

      console.log("Received a status update notification:", updatedData);

      const { newStatus, subscriptionId } = updatedData;

      console.log("client:", subscriptionId, "status:", newStatus);

      const sql =
        "UPDATE subscription SET status_id = ?, updated_at = CURRENT_TIMESTAMP  WHERE user_id = ?";
      db.run(sql, [newStatus, subscriptionId], (err) => {
        if (err) {
          console.log(
            "There was an error updating the database, the message will be requeued",
            err
          );
          channel.nack(message, false, false);
        } else {
          console.log("The data has been successfully updated in the database");
          channel.ack(message);
        }
      });
    });
  } catch (error) {
    console.error("Error starting Status Listener:", error);
  }
}

startUpdateListener();
