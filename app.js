const express = require('express');

const {SERVER_PORT} = require('./config.js');
const clova = require('./clova');

const app = express();

app.listen(SERVER_PORT, () => {
  console.log(`Server is running on ${SERVER_PORT} port`);
});

app.get('/', clova.clovaFulfillment);
app.post('/', clova.clovaFulfillment);