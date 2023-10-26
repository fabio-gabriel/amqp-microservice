# Subscription management microservice

This is a simple microservice built for managing subscriptions in a fictional subscription service. It uses:

- Sqlite
- Express
- Rabbitmq

## Database

The database is created using sqlite3 in the db.js file. There are three tables, one for clients, one for subscriptions and one for recording transaction history using a trigger when the record is updated. The status_id of 1 means the subscription is currently active and if it is 0 it means the subscription is currently inactive.

## Express

The API is built using express. The notifications for creating and updating subscriptions are all based on http requests in the API. It also functions as a producer for the rabbitmq messages pipeline. The messages are created here and are sent to the queue, which is then consumed by the listeners.

## Rabbitmq

The messaging service being used for message queueing. The messages are created in the subscription.js file and sent to two different queues. There is a queue for creating new subscriptions and a queue for updating subscriptions. The listeners consume these messages perform the necessary database operations before sending the acknowledgement to the producer.
