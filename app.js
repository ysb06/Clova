const express = require('express');
const bodyParser = require('body-parser');

const {SERVER_PORT} = require('./config.js');
const clova = require('./clova/index_1');

const app = express();

app.use(bodyParser.json());

app.listen(SERVER_PORT, () => {
  console.log(`Server is running on ${SERVER_PORT} port`);
});

app.get('/', clova.clovaFulfillment);
app.post('/', clova.clovaFulfillment);