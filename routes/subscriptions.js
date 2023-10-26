const express = require("express");
const amqp = require("amqplib");
const db = require("../db");

const router = express.Router();

router.post("/", async (req, res) => {
  const { fullName } = req.body;
  const connection = await amqp.connect("amqp://guest:guest@localhost:5672/");
  const channel = await connection.createChannel();

  try {
    // Send the notification message to the queue
    const queueName = "purchase_notifications";
    const message = JSON.stringify({ fullName });
    channel.sendToQueue(queueName, Buffer.from(message), {
      persistent: true,
    });

    res.status(201).json({ message: "Subscription added successfully" });
  } catch (error) {
    console.error("Error enqueuing notification:", error);
    res.status(500).json({ error: "Failed to enqueue notification" });
  }
});

// Get all clients
router.get("/", (req, res) => {
  db.all("SELECT * FROM client", (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    res.json(rows);
  });
});

router.get("/history", (req, res) => {
  db.all("SELECT * FROM activity_history", (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    res.json(rows);
  });
});

// Get an individual subscription by ID
router.get("/:id", (req, res) => {
  const subscriptionId = req.params.id;

  db.get(
    "SELECT * FROM subscription WHERE id = ?",
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

// Update a subscription status
router.put("/:id/status", async (req, res) => {
  const subscriptionId = req.params.id;
  const { newStatus } = req.body;
  const connection = await amqp.connect("amqp://localhost");
  const channel = await connection.createChannel();

  try {
    // Send the notification message to the queue
    const queueName = "update_notifications";
    const message = JSON.stringify({ newStatus, subscriptionId });
    channel.sendToQueue(queueName, Buffer.from(message), {
      persistent: true,
    });

    res.status(200).json({ message: "Subscription updated successfully" });
  } catch (error) {
    console.error("Error enqueuing notification:", error);
    res.status(500).json({ error: "Failed to enqueue notification" });
  }
});

// Delete a subscription by ID
router.delete("/:id", async (req, res) => {
  const subscriptionId = req.params.id;
  const connection = await amqp.connect("amqp://localhost");
  const channel = await connection.createChannel();

  try {
    // Send the notification message to the queue
    const queueName = "canceled_notifications";
    const message = JSON.stringify({ subscriptionId });
    channel.sendToQueue(queueName, Buffer.from(message), {
      persistent: true,
    });

    // TODO:
    // ENVIAR O STATUS SÓ DEPOIS DE A MENSAGEM RECEBER O ACK
    // TESTAR ISSO DEPOIS

    res.status(200).json({ message: "Subscription removed successfully" });
  } catch (error) {
    console.error("Error enqueuing notification:", error);
    res.status(500).json({ error: "Failed to enqueue notification" });
  }
});

module.exports = router;
