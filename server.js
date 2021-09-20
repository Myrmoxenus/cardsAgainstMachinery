// Dependencies
const express = require('express')
const path = require('path')
const http = require('http')
const { Server } = require('socket.io')

//Card Decks
let whiteCardArray = require('./cards/GeneratedWhiteCards.js')

//Sets port to a value
const PORT = process.env.PORT || 4433

// Initializes the variable "app" with express()
const app = express()

//Sets up static folder
app.use(express.static('public'))

//
const server = http.createServer(app)

//
const io = new Server(server)

//Listens, reports to console that a server has successfully started on PORT
server.listen(PORT, () => {
    console.log('Server listening on port: ' + PORT)
  })


//Game logic

function randomUpTo(randomMax) {
  return ((Math.floor(Math.random() * (randomMax + 1))))
}



class player {
  constructor(name, roomName){
    this.name = name
    this.roomName = roomName
    this.hand = []
  }
  //Replaces current hand with hand of 14 cards
  drawHand(){
    let newHand = []
    for(let i = 0; i<14; i++){
      let drawnCard = whiteCardArray[randomUpTo(whiteCardArray.length-1)]
      newHand.push(drawnCard)
    }
    this.hand = newHand
  }
}

let playerMap = new Map()
  
//Socket behavior
io.on('connection', (socket) => {

  socket.on('testButton', function(data){
    let emitData = whiteCardArray[randomUpTo(whiteCardArray.length-1)]
    io.sockets.emit('drawWhiteCard', emitData) 
  })

  socket.on('joinGame', function(data){
    //Creates new player object
    let newPlayer = new player(data.screenName, data.roomName)
    //Adds to playerMap, accessible by socket.id
    playerMap.set(socket.id, newPlayer)
    //Adds player to correct websocket room
    console.log(playerMap)
    socket.join(data.roomName)
    console.log('User connected with socketID: ' + socket.id)
    //
  })

  socket.on('requestNewHand', function(data){
    console.log(socket.id)
    /*let currentPlayer = playerMap.get(socket.id)
    console.log(currentPlayer)
    currentPlayer.drawHand()
    socket.emit('newPlayerHand', currentPlayer.hand)*/
  })

  })

//Handlers
app.get('/game/:roomName', function(req, res){
  res.sendFile(path.join(__dirname, 'public/game', 'index.html'))
  console.log(req.params.roomName)
})
//
app.get('*', function(req, res){
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})
