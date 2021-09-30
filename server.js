// Dependencies
const express = require('express')
const path = require('path')
const http = require('http')
const { Server } = require('socket.io')

//Card Decks
let whiteCardArray = require('./cards/GeneratedWhiteCards.js')

//Sets port to a value
const PORT = process.env.PORT || 4433

// Initializes the variable 'app' with express()
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

function generatePlayerSessionString(lengthOfString){
  let characters = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z','1','2','3','4','5','6','7','8','9','0']
  let outputString = ''

  while(outputString.length < lengthOfString){
    outputString += characters[randomUpTo(characters.length - 1)]
  }
  return outputString
}

class player {
  constructor(name, roomName, socketID){
    this.name = name
    this.roomName = roomName
    this.socketID = socketID
    this.score = 0
    this.roundPlayerString = generatePlayerSessionString(12)
  }
}

let playerMap = new Map()

class game {
  constructor(roomName){
    this.roomName = roomName
    this.playersJoinedCount = 0
    this.players = []
  }
}

let gameMap = new Map()

//Socket behavior
io.on('connection', (socket) => {

  socket.on('testButton', function(data){
    let emitData = whiteCardArray[randomUpTo(whiteCardArray.length-1)]
    io.sockets.emit('drawWhiteCard', emitData) 
  })

  socket.on('gamePageLoad', function(data){
  
    let currentGame = gameMap.get(data.roomName)
    
    if(!currentGame){
      socket.emit('gameDoesNotExist')
    }
    else{
      let currentPlayer = currentGame.players.find(player => player.roundPlayerString === data.roundPlayerString)
      if(currentPlayer){
        playerMap.delete(currentPlayer.socketID)
        playerMap.set(socket.id, currentPlayer)
        currentPlayer.socketID = socket.id
        //Reconnect player
        console.log('Player reconnect')
        socket.join(currentGame.roomName)
        io.to(currentGame.roomName).emit('updatePlayers', currentGame.players)
        console.log(currentPlayer)
      }
      else if(currentGame.players.length >= 8){
        //If there are too many players...
        console.log('Too many players in ' + currentGame.roomName)
      }
      else{
        //Creates new player
        console.log('New player')
        currentGame.playersJoinedCount += 1
        let newPlayer = new player('Player ' + currentGame.playersJoinedCount, currentGame.roomName, socket.id)
        playerMap.set(socket.id, newPlayer)
        currentGame.players.push(newPlayer)
        socket.emit('assignRoundPlayerString', newPlayer.roundPlayerString)
        socket.join(currentGame.roomName)
        io.to(currentGame.roomName).emit('updatePlayers', currentGame.players)
      }
    }
    
  })

  socket.on('playerNameChange', function(newName){
    let currentPlayer = playerMap.get(socket.id)
    console.log(currentPlayer)
    let currentGame = gameMap.get(currentPlayer.roomName)
    currentPlayer.name = newName
    io.to(currentGame.roomName).emit('updatePlayers', currentGame.players)
    
  })

  socket.on('createGame', function(roomName){
    if(gameMap.get(roomName)){
      socket.emit('gameAlreadyExists')
    }
    else{
    let newGame = new game(roomName)
    gameMap.set(roomName, newGame)
    socket.emit('gameCreated')
    }
  })



  })

//Handlers
app.get('/game/:roomName', function(req, res){
  res.sendFile(path.join(__dirname, 'public/game', 'index.html'))
  //console.log(req.params.roomName)
})

app.get('/nogame/:roomName', function(req, res){
  res.sendFile(path.join(__dirname, 'public/nogame', 'index.html'))
  //console.log(req.params.roomName)
})
//
app.get('*', function(req, res){
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})
