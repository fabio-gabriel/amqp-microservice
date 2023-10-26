#!/bin/bash

node app.js &

node rbmq-listeners/purchaseListener.js &

node rbmq-listeners/statusListener.js

tail -f /dev/null



