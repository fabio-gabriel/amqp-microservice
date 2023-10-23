const express = require('express');
const bodyParser = require('body-parser');
const db = require('./db'); 
const subscriptionsRouter = require('./routes/subscriptions'); 

const app = express();
const port = 3000; // Port on which the server will run

app.use(bodyParser.json());

// Define routes
app.use('/subscriptions', subscriptionsRouter); // Use the subscriptions route for all subscription-related endpoints

// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
