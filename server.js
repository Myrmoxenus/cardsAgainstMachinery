// Dependencies
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

//Card Decks
let whiteCardArray = require('./cards/GeneratedWhiteCardsTest.js')
let testArray = ['fuck', 'you']

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

  function randomUpTo(randomMax) {
    return ((Math.floor(Math.random() * (randomMax + 1))))
  }
  
//Socket behavior
io.on('connection', (socket) => {
  socket.on('testButton', function(data){
    console.log(whiteCardArray[randomUpTo(whiteCardArray.length-1)])
  });
    console.log('User connected with socketID: ' + socket.id);
  });


console.log(typeof whiteCardArray)
console.log(typeof testArray)
console.log(whiteCardArray)
console.log(testArray[0])