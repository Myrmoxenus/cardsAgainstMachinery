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
    this.submittedCardsThisTurn = false
    this.submittedCards = []
  }
}

let playerMap = new Map()

class game {
  constructor(roomName){
    this.roomName = roomName
    this.playersJoinedCount = 0
    this.players = []
    this.winningScore = 10
    this.redCardCurrentlySubmitted = false
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
        this.redCardCurrentlySubmitted = false
        setPlayerToCzar(newCzar)
      }
      else{
        this.players.forEach(player => 
          player.hadTurn = false)
          this.advanceTurn()
      }
      io.to(this.roomName).emit('updatePlayers', this.players)
      //Emits to each non-Czar to clear their playTable
      connectedPlayers.forEach(player =>{
        if(!player.currentCzar){
          io.to(player.socketID).emit('clearTable')
        }
      })
    }

  }
  newRound(){
    this.players.forEach(player => player.hadTurn = false)
    //THISISFORSUREWRONG
    let winningPlayer =this.players.find(player => player.score >= this.winningScore)
    if(winningPlayer){
      io.to(this.roomName).emit('newRound', winningPlayer.name)
      this.players.forEach(player => player.score = 0)
    }
  }
}

let gameMap = new Map()

function setPlayerToCzar(player){
  console.log(player.name + ' is now Card Czar')
  player.currentCzar = true
  player.hadTurn = true
  let newRedCardArray = []
        while(newRedCardArray.length < 18) {
        newRedCardArray.push(redCardArray[randomUpTo(redCardArray.length-1)])
        }
  io.to(player.socketID).emit('newRedCards', newRedCardArray)
  /*
  let currentGame = gameMap.get(player.roomName)
  io.to(currentGame.roomName).emit('updatePlayers', currentGame.players)*/
}

//Socket behavior
io.on('connection', (socket) => {


  socket.on('gamePageLoad', function(data){
  
    let currentGame = gameMap.get(data.roomName)
    
    if(!currentGame){
      socket.emit('gameDoesNotExist')
    }
    else if(currentGame.players.length >= 8){
      //If there are too many players...
      console.log('Too many players in ' + currentGame.roomName)
    }
    else{
      let currentPlayer = currentGame.players.find(player => player.roundPlayerString === data.roundPlayerString)
      if(currentPlayer){
        console.log('Player reconnect')
        playerMap.delete(currentPlayer.socketID)
        playerMap.set(socket.id, currentPlayer)
        currentPlayer.socketID = socket.id
        currentPlayer.connected = true
        //If player is only player in room, set them to Card Czar
        if(currentGame.players.length === 1){
          setPlayerToCzar(currentPlayer)
                
          io.to(currentGame.roomName).emit('updatePlayers', currentGame.players)
            }
      }
      else{
        //Creates new player
        console.log('New player')
        currentGame.playersJoinedCount += 1
        let currentPlayer = new player('Player ' + currentGame.playersJoinedCount, currentGame.roomName, socket.id)
        playerMap.set(socket.id, currentPlayer)
        currentGame.players.push(currentPlayer)
        socket.emit('assignRoundPlayerString', currentPlayer.roundPlayerString)
        //If player is first player in room, set them to Card Czar
        if(currentGame.players.length === 1){
          setPlayerToCzar(currentPlayer)
                
          io.to(currentGame.roomName).emit('updatePlayers', currentGame.players)
            }
      }

      socket.join(currentGame.roomName)
      io.to(currentGame.roomName).emit('updatePlayers', currentGame.players)
    
    
    }    
  })

  socket.on('requestNewHand', function(data){
    let newHandArray = []
    let maxHandSize = 14
    while(newHandArray.length < maxHandSize) {
      newHandArray.push(whiteCardArray[randomUpTo(whiteCardArray.length-1)])
    }
    socket.emit('newPlayerHand', newHandArray) 
  })

  socket.on('requestRedCards', function(data){
    let newRedCardArray = []
    let fullTableOfRedCards = 18
    while(newRedCardArray.length < fullTableOfRedCards) {
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


  socket.on('cardSubmission', function(submittedCards){
    let currentPlayer = playerMap.get(socket.id)
    let currentGame = gameMap.get(currentPlayer.roomName)
    let currentCzar = currentGame.players.find(player => player.currentCzar)

    if(currentPlayer.currentCzar && !currentGame.redCardCurrentlySubmitted){
      currentPlayer.submittedCardsThisTurn = true
      currentGame.redCardCurrentlySubmitted = true
      let redCardContent = submittedCards[0]
      io.to(currentGame.roomName).emit('redCardSelection', redCardContent)
      io.to(currentPlayer.socketID).emit('lockCzarsHand')
    }
    else if(currentGame.redCardCurrentlySubmitted && !currentPlayer.submittedCardsThisTurn){
      currentPlayer.submittedCardsThisTurn = true
      currentPlayer.submittedCards = submittedCards
      let replacementWhiteCards = []
      while(replacementWhiteCards.length < submittedCards.length){
        replacementWhiteCards.push(whiteCardArray[randomUpTo(whiteCardArray.length-1)])
      }
      io.to(currentPlayer.socketID).emit('replacementWhiteCards', replacementWhiteCards)
      //
      io.to(currentGame.roomName).emit('playerSubmittedCards', submittedCards.length)
      let connectedPlayers = currentGame.players.filter(player => player.connected && !player.currentCzar)
      if(connectedPlayers.every(player => player.submittedCardsThisTurn)){
        let randomizedCardSubmissionArray = []
        while(randomizedCardSubmissionArray.length < (currentGame.players.length-1)){
          //Randomly selects a connected players cards and pushes it to radomizedCardSubmissionArray
          let randomPlayerIndex = randomUpTo(connectedPlayers.length - 1)
          let randomPlayer= connectedPlayers[randomPlayerIndex]
          let randomCards = randomPlayer.submittedCards
          randomizedCardSubmissionArray.push(randomCards)
          //removes player from array
          connectedPlayers.splice(randomPlayerIndex, 1)
        }
        io.to(currentGame.roomName).emit('allPlayersSubmitted', randomizedCardSubmissionArray)
        //I'm not in love with this solution
        io.to(currentCzar.socketID).emit('makeArrows')
      }

      
      //io.to(currentGame.roomName).emit('playerSubmittedCards', submittedCards.length)
    }
    console.log(currentGame.players)
  })

  socket.on('nextArrow', () =>{
    let currentPlayer = playerMap.get(socket.id)
    if(currentPlayer.currentCzar){
      io.to(currentPlayer.roomName).emit('nextArrow')
    }
    
  })

  socket.on('previousArrow', () =>{
    let currentPlayer = playerMap.get(socket.id)
    if(currentPlayer.currentCzar){
      io.to(currentPlayer.roomName).emit('previousArrow')
    }
  })

  socket.on('winnerSelected', function(winnerCards){
    let currentPlayer = playerMap.get(socket.id)
    if(currentPlayer.currentCzar){
      let currentGame = gameMap.get(currentPlayer.roomName)
      let winningPlayer = currentGame.players.find(player => 
        player.submittedCards[0] === winnerCards[0])
      winningPlayer.score += 1
      console.log(winningPlayer.name + ' is the winner')
      currentGame.players.forEach(player => {
        player.submittedCards = []
        player.submittedCardsThisTurn = false
      })
      currentGame.advanceTurn()
    }
  })
 

  socket.on('disconnect', () => {
    let currentPlayer = playerMap.get(socket.id)
    if(currentPlayer){
      let currentGame = gameMap.get(currentPlayer.roomName)
      currentPlayer.connected = false

       //If only one player remains in the room, set them to Card Czar
       let connectedPlayers = currentGame.players.filter(player => player.connected)
       if(connectedPlayers.length === 1){
        setPlayerToCzar(connectedPlayers[0])
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
