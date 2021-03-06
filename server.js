// Dependencies
const express = require('express')
const path = require('path')
const http = require('http')
const { Server } = require('socket.io')

//Card Decks
let whiteCardArray = require('./cards/GeneratedWhiteCards.js')
let redCardArray = require('./cards/GeneratedRedCards.js')
//let universallyExplicitWords = []

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

//Function for generating a string for the player that can be stored in local storage to allow for reconnecting to a session
function generatePlayerSessionString(lengthOfString){
  let characters = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z','1','2','3','4','5','6','7','8','9','0']
  let outputString = ''

  while(outputString.length < lengthOfString){
    outputString += characters[randomUpTo(characters.length - 1)]
  }
  return outputString
}

//Class for player objects
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
    this.drewCardsThisTurn = false
    this.votedToSkip = false
  }
  //Sets the player to current Czar
  setPlayerToCzar(){
    console.log(this.name + ' is now Card Czar')
    this.currentCzar = true
    this.hadTurn = true
    let newRedCardArray = []
          while(newRedCardArray.length < 14) {
          newRedCardArray.push(redCardArray[randomUpTo(redCardArray.length-1)])
          }
    io.to(this.socketID).emit('newRedCards', newRedCardArray)
  }

  emitHandToPlayer(explicitWordArray){
    explicitWordArray = explicitWordArray || []
    //Sends new player their first hand
    let newHandArray = []
    let maxHandSize = 14
    while(newHandArray.length < maxHandSize) {
      let randomlySelectedCard = whiteCardArray[randomUpTo(whiteCardArray.length-1)]
      let randomlySelectedCardWordsArray = randomlySelectedCard.split(' ')
      let containsExplicitWord = explicitWordArray.some(explicitWord => randomlySelectedCardWordsArray.includes(explicitWord))
      if(!containsExplicitWord){
        newHandArray.push(randomlySelectedCard)
      }
    }
      io.to(this.socketID).emit('newPlayerHand', newHandArray)
    if(this.submittedCardsThisTurn || this.currentCzar){
      io.to(this.socketID).emit('lockPlayerHand')
      }
    }
}


//Map for storing player objects
let playerMap = new Map()

//Class for game objects
class game {
  constructor(roomName){
    this.roomName = roomName
    this.playersJoinedCount = 0
    this.players = []
    this.winningScore = 10
    this.redCardCurrentlySubmitted = false
    this.currentlySubmittedRedCard = ''
    this.timeOfLastTurn = new Date()
  }
  //Advances the game turn
  advanceTurn(){
    this.players.forEach(player => {
      player.submittedCards = []
      player.submittedCardsThisTurn = false
      player.drewCardsThisTurn = false
      player.votedToSkip = false
    })
    let connectedPlayers = this.players.filter(player => player.connected)
    this.timeOfLastTurn = new Date()
    if(connectedPlayers.length > 1){
      let previousCzar = connectedPlayers.find(player => player.currentCzar)
      let newCzar = connectedPlayers.find(player => !player.hadTurn)
      if(previousCzar){
        previousCzar.currentCzar = false
      }
      if(newCzar){
        this.redCardCurrentlySubmitted = false
        newCzar.setPlayerToCzar()
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
  //Starts a new round after a winner has been declared
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

//Map for storing player objects
let gameMap = new Map()

//Socket behavior
io.on('connection', (socket) => {

//Client emits 'gamePageLoad' on load
  socket.on('gamePageLoad', function(data){
  
    let currentGame = gameMap.get(data.roomName)
    let maximumPlayersPerGame = 8
    //let connectedPlayers = currentGame.players.filter(player => player.connected)_
    //If the game the player is attempting to join does not exist, emits 'gameDoesNotExist' to client
    if(!currentGame){
      socket.emit('gameDoesNotExist')
    }
    //If the game the player is attempting to join already has maximum connected players, emits 'tooManyPlayers' to client
    else if(currentGame.players.filter(player => player.connected).length >= maximumPlayersPerGame){
      //If there are too many players...
      socket.emit('gameHasTooManyPlayers')
    }
    ///Otherwise checks to see if the player already exists in the game by comparing their emitted player string to the one the server has stored for them
    else{
      let currentPlayer = currentGame.players.find(player => player.roundPlayerString === data.roundPlayerString)
      //If so, it reconnects player to the previously existing assosciated player object
      if(currentPlayer && !currentPlayer.connected){
        console.log('Player reconnect')
        //Updates playerMap with new socketID assosciated with player
        playerMap.delete(currentPlayer.socketID)
        playerMap.set(socket.id, currentPlayer)
        currentPlayer.socketID = socket.id
        currentPlayer.connected = true
        let connectedPlayers = currentGame.players.filter(player => player.connected)
        socket.emit('loadLastHand')
        if(currentGame.redCardCurrentlySubmitted){
          currentPlayer.submittedCardsThisTurn = true
        }
        if(connectedPlayers.length === 3){
          connectedPlayers[0].setPlayerToCzar()
                
          io.to(currentGame.roomName).emit('updatePlayers', currentGame.players)
            }
      }
      //If player is currently connected it redirects them 
      else if(currentPlayer && currentPlayer.connected){
        socket.emit('alreadyConnectedToGame')
      }
      //If it can't find an existing player, it creates one
      else{
        //Creates new player
        console.log('New player')
        currentGame.playersJoinedCount += 1
        let currentPlayer = new player('Player ' + currentGame.playersJoinedCount, currentGame.roomName, socket.id)
        playerMap.set(socket.id, currentPlayer)
        currentGame.players.push(currentPlayer)
        socket.emit('assignRoundPlayerString', currentPlayer.roundPlayerString)
        let connectedPlayers = currentGame.players.filter(player => player.connected)
        
        //Sends new player their first hand
        currentPlayer.emitHandToPlayer()
        
        //Once the game has at least 3 players, assign the first player to Card Czar
        if(connectedPlayers.length === 3){
          connectedPlayers[0].setPlayerToCzar()

                
          io.to(currentGame.roomName).emit('updatePlayers', currentGame.players)
            }
      }
      if(currentGame.currentlySubmittedRedCard){
        socket.emit('redCardSelection', currentGame.currentlySubmittedRedCard)
      }
      //Places player in the the socket room associated with the game's name
      socket.join(currentGame.roomName)
      //Emits an update to all current players about new player join
      io.to(currentGame.roomName).emit('updatePlayers', currentGame.players)
    
    
    }    
  })

  //Responds to a player requesting a new hand of white cards
  socket.on('requestNewHand', function(data){
    console.log('New hand!')
    let currentPlayer = playerMap.get(socket.id)
    if(currentPlayer && currentPlayer.currentCzar){
      let currentGame = gameMap.get(currentPlayer.roomName)
      if(currentGame && !currentGame.redCardCurrentlySubmitted){
        let newRedCardArray = []
        let fullTableOfRedCards = 14
        while(newRedCardArray.length < fullTableOfRedCards) {
          newRedCardArray.push(redCardArray[randomUpTo(redCardArray.length-1)])
        }
        socket.emit('newRedCards', newRedCardArray) 
      }
    }
    else if(currentPlayer && !currentPlayer.drewCardsThisTurn){
      currentPlayer.drewCardsThisTurn = true
      currentPlayer.emitHandToPlayer()
    }

  })

  //Responds to client request for red cards during player's cardCzar turn
  socket.on('requestRedCards', function(data){
    let newRedCardArray = []
    let fullTableOfRedCards = 14
    while(newRedCardArray.length < fullTableOfRedCards) {
      newRedCardArray.push(redCardArray[randomUpTo(redCardArray.length-1)])
    }
    socket.emit('newRedCards', newRedCardArray) 
  })

  //Responds to a player changing their name in the client and emits that change to all players in current game
  socket.on('playerNameChange', function(newName){
    let currentPlayer = playerMap.get(socket.id)

    let currentGame = gameMap.get(currentPlayer.roomName)
    currentPlayer.name = newName
    io.to(currentGame.roomName).emit('updatePlayers', currentGame.players)
    
  })

  //Responds to a player submitting a card
  socket.on('cardSubmission', function(submittedCards){
    console.log('Card submitted!')
    let currentPlayer = playerMap.get(socket.id)
    let currentGame = gameMap.get(currentPlayer.roomName)
    let currentCzar = currentGame.players.find(player => player.currentCzar)

    //If the player submitting a card is the currentCzar and has not previously submitted, it emits the red card selection to the room
    if(currentPlayer.currentCzar && !currentGame.redCardCurrentlySubmitted){
      currentPlayer.submittedCardsThisTurn = true
      currentGame.redCardCurrentlySubmitted = true
      let redCardContent = submittedCards[0]
      currentGame.currentlySubmittedRedCard = redCardContent
      console.log(currentGame.currentlySubmittedRedCard)
      io.to(currentGame.roomName).emit('redCardSelection', redCardContent)
    }
    //If the card is submitted by a player that is not the current czar, and a red card is already selected, then the card submission is handled as a white card submission
    else if(currentGame.redCardCurrentlySubmitted && !currentPlayer.submittedCardsThisTurn){
      currentPlayer.submittedCardsThisTurn = true
      currentPlayer.submittedCards = submittedCards
      let replacementWhiteCards = []
      //Generates an array of cards to replace the ones submitted by the player and emits them back to the player
      while(replacementWhiteCards.length < submittedCards.length){
        replacementWhiteCards.push(whiteCardArray[randomUpTo(whiteCardArray.length-1)])
      }
      io.to(currentPlayer.socketID).emit('replacementWhiteCards', replacementWhiteCards)
      io.to(currentGame.roomName).emit('playerSubmittedCards', submittedCards.length)
      //Takes all submitted cards by connected players and randomizes their order before emitting the list of candidates to the clients
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
        //Signals to the cardCzar client to create the next and previous arrows for cycling through submitted white card candidates
        io.to(currentCzar.socketID).emit('makeArrows')
      }
    }
   //Signals the client to lock a player's hand after they have submitted cards
    io.to(currentPlayer.socketID).emit('lockPlayerHand')

  })

  //Responds to cardCzar cylcing forwards and backwards through card submissions respectively, emits to all clients to adjust and render from their arrays accordingly
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
//Responds to the cardCzar selecting a winner
  socket.on('winnerSelected', function(winnerCards){
    let currentPlayer = playerMap.get(socket.id)
    let currentGame = gameMap.get(currentPlayer.roomName)
    currentGame.currentlySubmittedRedCard = ''
    //Authenticates that the winner selection emission is from the cardCzar
    if(currentPlayer.currentCzar && currentGame.redCardCurrentlySubmitted && winnerCards){
      let winningPlayer = currentGame.players.find(player => 
        player.submittedCards[0] === winnerCards[0])
      winningPlayer.score += 1
      console.log(winningPlayer.name + ' is the winner')
 
      currentGame.advanceTurn()
    }
  })

  socket.on('votedToSkip', () =>{
    let currentPlayer = playerMap.get(socket.id)
    let currentGame = gameMap.get(currentPlayer.roomName)
    currentPlayer.votedToSkip = true
    let connectedPlayers = currentGame.players.filter(player => player.connected)
    let playersThatVotedToSkip = connectedPlayers.filter(player => player.votedToSkip)
    console.log(currentPlayer.name + ' voted to skip.' + playersThatVotedToSkip.length + '/' + connectedPlayers.length + ' players have voted to skip.')
    //If at least half of players vote to skip, turn advances
    if(playersThatVotedToSkip.length >= connectedPlayers.length/2){
      if(!currentGame.redCardCurrentlySubmitted){
        currentGame.advanceTurn()
      }
      else{
        let currentCzar = currentGame.players.find(player => player.currentCzar)
        let submittedPlayers = connectedPlayers.filter(player => player.submittedCardsThisTurn)
        let randomizedCardSubmissionArray = []
          while(randomizedCardSubmissionArray.length < submittedPlayers.length){
            //Randomly selects a connected players cards and pushes it to radomizedCardSubmissionArray
            let randomPlayerIndex = randomUpTo(submittedPlayers.length - 1)
            console.log('randomPlayerIndex: ' + randomPlayerIndex)
            let randomPlayer = submittedPlayers[randomPlayerIndex]
            console.log(randomPlayer)
            let randomCards = randomPlayer.submittedCards
            if(randomCards[0]){
              randomizedCardSubmissionArray.push(randomCards)
            }
            //removes player from array
            submittedPlayers.splice(randomPlayerIndex, 1)
          }
          if(randomizedCardSubmissionArray.length >= 1){
            io.to(currentGame.roomName).emit('allPlayersSubmitted', randomizedCardSubmissionArray)
            //Signals to the cardCzar client to create the next and previous arrows for cycling through submitted white card candidates
            io.to(currentCzar.socketID).emit('makeArrows')
          }
          else{
            currentGame.advanceTurn()
          }
      }
    }
    
  })

  //Handles player disconnections
  socket.on('disconnect', () => {
    let currentPlayer = playerMap.get(socket.id)
    if(currentPlayer){
      let currentGame = gameMap.get(currentPlayer.roomName)
      currentPlayer.connected = false

       //If fewer than 3 players remain. Reset players to waiting for game status
       let connectedPlayers = currentGame.players.filter(player => player.connected)
       if(connectedPlayers.length < 3){
        currentGame.players.forEach(player => {
          player.hadTurn = false
          player.currentCzar = false
          player.submittedCardsThisTurn = false
          player.submittedCards = []
          player.drewCardsThisTurn = false
          player.votedToSkip = false
        })
        currentGame.currentlySubmittedRedCard = ''
        currentGame.redCardCurrentlySubmitted = false
        io.to(currentGame.roomName).emit('clearTable', currentGame.players)
      }

      io.to(currentGame.roomName).emit('updatePlayers', currentGame.players)
      

      if(currentPlayer.currentCzar){  
        currentPlayer.currentCzar = false
        currentPlayer.hadTurn = true
        currentGame.advanceTurn()
      }

      else if(currentGame.redCardCurrentlySubmitted){
        console.log('Player disconnected during card submission phase')
        let currentGame = gameMap.get(currentPlayer.roomName)
        let currentCzar = currentGame.players.find(player => player.currentCzar)
        let connectedPlayers = currentGame.players.filter(player => player.connected && !player.currentCzar)
        if(connectedPlayers.every(player => player.submittedCardsThisTurn)){
          console.log(connectedPlayers)
          let randomizedCardSubmissionArray = []
          while(randomizedCardSubmissionArray.length < connectedPlayers.length){
            //Randomly selects a connected players cards and pushes it to radomizedCardSubmissionArray
            let randomPlayerIndex = randomUpTo(connectedPlayers.length - 1)
            console.log('randomPlayerIndex: ' + randomPlayerIndex)
            let randomPlayer = connectedPlayers[randomPlayerIndex]
            console.log(randomPlayer)
            let randomCards = randomPlayer.submittedCards
            randomizedCardSubmissionArray.push(randomCards)
            //removes player from array
            connectedPlayers.splice(randomPlayerIndex, 1)
          }
          io.to(currentGame.roomName).emit('allPlayersSubmitted', randomizedCardSubmissionArray)
          //Signals to the cardCzar client to create the next and previous arrows for cycling through submitted white card candidates
          io.to(currentCzar.socketID).emit('makeArrows')
        }
      }
    }
    
  })

  //Creates game from client's URL
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


//Function checks every hour if a game has been inactive for more than an hour, it removes it from the map.
function gameKiller(){
  let killGameInterval = 1000*60*60
  setTimeout(function(){
    
    let currentTime = new Date()
    //Lifespan set to an hour
    let inactiveLifespan = 1000*60*60
    gameMap.forEach(game => {
      if((currentTime - game.timeOfLastTurn) > inactiveLifespan){
        console.log('Killing ' + game.roomName)
        gameMap.delete(game.roomName)
      }
    })

    gameKiller()
  }, killGameInterval)
  
}

gameKiller()