// Dependencies
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

//Sets port to a value
const PORT = process.env.PORT || 4433;

// Initializes the variable "app" with express()
const app = express();

//Sets up static folder
app.use(express.static('public'));

//
const server = http.createServer(app);

//
const io = new Server(server);

//Listens, reports to console that a server has successfully started on PORT
server.listen(PORT, () => {
    console.log('Server listening on port: ' + PORT);
  });

//Socket behavior
io.on('connection', (socket) => {
    console.log('User connected with socketID: ' + socket.id);
  });
  
