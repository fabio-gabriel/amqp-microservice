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

      const { fullName } = purchaseData;

      db.serialize(function () {
        db.run("BEGIN TRANSACTION");

        db.run(
          "INSERT INTO client (full_name) VALUES (?)",
          [fullName],
          function (err) {
            const clientId = this.lastID;
            console.log("clientId: ", clientId);
            setTimeout(() => {}, 1000);

            db.run(
              "INSERT INTO subscription (user_id) VALUES (?)",
              [clientId],
              function (err) {
                if (err) {
                  db.run("ROLLBACK");
                  console.log(
                    "There was an error inserting the database, the message will be requeued",
                    err
                  );
                  channel.nack(message, false, false);
                } else {
                  db.run("COMMIT");
                  console.log(
                    "The data has been successfully inserted in the database"
                  );
                  channel.ack(message);
                }
              }
            );
          }
        );
      });
    });
  } catch (error) {
    console.error("Error starting Purchase Listener:", error);
  }
}
("INSERT INTO subscriptions (userName, type, status, purchaseDate) VALUES (?, ?, ?, ?)");
startPurchaseListener();
