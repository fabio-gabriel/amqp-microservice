const express = require("express");
const bodyParser = require("body-parser");
const db = require("./db");
const amqp = require("amqplib");

const app = express();
const port = 3000;

app.use(bodyParser.json());

async function connectToRabbitMQ() {
  try {
    const connection = await amqp.connect('amqp://localhost'); // Replace with your RabbitMQ server URL
    const channel = await connection.createChannel();

    // Create a queue for your notifications
    const queueName = 'subscription_notifications';
    await channel.assertQueue(queueName, { durable: true });

    return { connection, channel };
  } catch (error) {
    console.error('Error connecting to RabbitMQ:', error);
  }
}

// Call this function to connect to RabbitMQ
const { connection, channel } = connectToRabbitMQ();


app.post('/subscriptions', async (req, res) => {
  const { userId, type, status, purchaseDate } = req.body;

  try {
    // Send the notification message to the queue
    const queueName = 'subscription_notifications';
    const message = JSON.stringify({ userId, type, status, purchaseDate });
    await channel.sendToQueue(queueName, Buffer.from(message), { persistent: true });

    res.status(201).json({ message: 'Subscription added successfully' });
  } catch (error) {
    console.error('Error enqueuing notification:', error);
    res.status(500).json({ error: 'Failed to enqueue notification' });
  }
});

// Handle subscription notifications
app.post("/subscriptions", (req, res) => {
  const { userName, type, status, purchaseDate } = req.body;

  // Create a statement
  const stmt = db.prepare(
    "INSERT INTO subscriptions (userName, type, status, purchaseDate) VALUES (?, ?, ?, ?)"
  );
  stmt.run(userName, type, status, purchaseDate, (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(201).json({ message: "Subscription added successfully" });
    }
  });
  stmt.finalize();
});






app.get("/subscriptions", (req, res) => {
  db.all("SELECT * FROM subscriptions", (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    res.json(rows);
  });
});

app.get("/subscriptions/:id", (req, res) => {
  const subscriptionId = req.params.id;

  db.get(
    "SELECT * FROM subscriptions WHERE id = ?",
    subscriptionId,
    (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      if (!row) {
        res.status(404).json({ error: "Subscription not found" });
        return;
      }

      res.json(row);
    }
  );
});

app.delete("/subscriptions/:id", (req, res) => {
  const subscriptionId = req.params.id;

  db.run(
    "DELETE FROM subscriptions WHERE id = ?",
    subscriptionId,
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      res.json({ message: "Subscription deleted" });
    }
  );
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
