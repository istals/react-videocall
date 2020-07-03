const http = require('http');
const express = require('express');
const config = require('../config');
const socket = require('./lib/socket');

const app = express();
const server = http.createServer(app);


app.use('/', express.static(`${__dirname}/../client`));
app.use('/robot', express.static(`${__dirname}/../robot_client`));


app.get('/', (req, res) => {
  res.sendFile(__dirname);
});

app.get('/robot', (req, res) => {
  res.sendFile(`${__dirname}/../robot_client/index.html`);
});

server.listen(config.PORT, () => {
  socket(server);
  console.log('Server is listening at :', config.PORT);
});
