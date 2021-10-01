// Dependencies
const express = require('express')
const path = require('path')
const http = require('http')
const { Server } = require('socket.io')

//Card Decks
let whiteCardArray = require('./cards/GeneratedWhiteCards.js')
let redCardArray = require('./cards/GeneratedRedCards.js')

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
    this.connected = true
    this.hadTurn = false
    this.currentCzar = false
  }
}

let playerMap = new Map()

class game {
  constructor(roomName){
    this.roomName = roomName
    this.playersJoinedCount = 0
    this.players = []
    this.winningScore = 10
  }
  advanceTurn(){
    let connectedPlayers = this.players.filter(player => player.connected)
    if(connectedPlayers.length > 1){
      let previousCzar = connectedPlayers.find(player => player.currentCzar)
      let newCzar = connectedPlayers.find(player => !player.hadTurn)
      if(previousCzar){
        previousCzar.currentCzar = false
      }
      if(newCzar){
        newCzar.currentCzar = true
        newCzar.hadTurn = true
      }
      else{
        this.players.forEach(player => 
          player.hadTurn = false)
          this.advanceTurn()
      }
      io.to(this.roomName).emit('updatePlayers', this.players)
    }

  }
  newRound(){
    this.players.forEach(player => player.hadTurn = false)
    let winningPlayer =this.players.find(player => player.score >= this.winningScore)
    if(winningPlayer){
      io.to(this.roomName).emit('newRound', winningPlayer.name)
      this.players.forEach(player => player.score = 0)
    }
  }
}

let gameMap = new Map()

//Socket behavior
io.on('connection', (socket) => {


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
        currentPlayer.connected = true
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
      }
  
    //If player is first player in room, set them to Card Czar
    if(currentGame.players.length === 1){
    currentGame.players[0].currentCzar = true
    currentGame.players[0].hadTurn = true
          
    io.to(currentGame.roomName).emit('updatePlayers', currentGame.players)
      }
    }    
  })

  socket.on('requestNewHand', function(data){
    let newHandArray = []
    while(newHandArray.length < 14) {
      newHandArray.push(whiteCardArray[randomUpTo(whiteCardArray.length-1)])
    }
    socket.emit('newPlayerHand', newHandArray) 
  })

  socket.on('requestRedCards', function(data){
    let newRedCardArray = []
    while(newRedCardArray.length < 18) {
      newRedCardArray.push(redCardArray[randomUpTo(redCardArray.length-1)])
    }
    socket.emit('newRedCards', newRedCardArray) 
  })

  socket.on('playerNameChange', function(newName){
    let currentPlayer = playerMap.get(socket.id)
    console.log(currentPlayer)
    let currentGame = gameMap.get(currentPlayer.roomName)
    currentPlayer.name = newName
    io.to(currentGame.roomName).emit('updatePlayers', currentGame.players)
    
  })

  socket.on('disconnect', () => {
    let currentPlayer = playerMap.get(socket.id)
    if(currentPlayer){
      let currentGame = gameMap.get(currentPlayer.roomName)
      currentPlayer.connected = false

       //If only one player remains in the room, set them to Card Czar
       let connectedPlayers = currentGame.players.filter(player => player.connected)
       if(connectedPlayers.length === 1){
        connectedPlayers[0].currentCzar = true
        connectedPlayers[0].hadTurn = true
      }

      io.to(currentGame.roomName).emit('updatePlayers', currentGame.players)

      if(currentPlayer.currentCzar){  
        currentPlayer.currentCzar = false
        currentPlayer.hadTurn = true
        currentGame.advanceTurn()
      }
    }
    
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
