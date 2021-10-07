
const socket = io();

//Assigning elements from the DOM to variables
let playerHand = document.getElementById('playerHand');
let playTable = document.getElementById('playTable');
let informationPanel = document.getElementById('informationPanel');
let buttonContainer = document.getElementById('buttonContainer')
//



//
let mostRecentPlayerObject = {}

//Grabs roomname from user's address
let roomName =  window.location.toString().split('/')
roomName = roomName[roomName.length - 1]
let onLoadData = {
    roomName: roomName,
    //Grabs player's round specific key
    roundPlayerString: window.localStorage.getItem('roundPlayerString')
}
socket.emit('gamePageLoad', onLoadData)
socket.emit('requestNewHand')
lockCards(playerHand)
//THISSUCKSANDISUGLY
setTimeout(function() {
    lockCards(playerHand)
  }, 500);

let submittedWhiteCardCandidates = []
//Buttons and their event listeners


let drawHandButton = document.getElementById('drawHandButton');
let submitCardButton = document.getElementById('submitCardButton');
let selectWinnerButton = document.getElementById('selectWinnerButton')

function drawHandButtonClick(){
    socket.emit('requestNewHand');
}

function submitCardButtonClick(){
    if(submissionArray){
        socket.emit('cardSubmission', submissionArray);
    }
}

function selectWinnerButtonClick(){
    let winnerCards = submittedWhiteCardCandidates[0]
    socket.emit('winnerSelected', winnerCards)
}

drawHandButton.addEventListener('click', drawHandButtonClick);
submitCardButton.addEventListener('click', submitCardButtonClick)
selectWinnerButton.addEventListener('click', selectWinnerButtonClick)

//Where cards wait to be submitted
let submissionArray = []

//Function that causes a card to emit itself
function selectCard(){
    
   let cardType = this.classList[1]
   //Checks if the selected card is a red card, if so, it unselects previously selected redCards.
   if(cardType === 'redCard'){
       let previouslySelectedRedCard = document.getElementsByClassName('redCardSelected')[0]
       if(previouslySelectedRedCard){
        //'click's previously selected card to unselect it
        previouslySelectedRedCard.click()
       }
   }
   this.classList.add(cardType + 'Selected')
   this.removeEventListener('click', selectCard)
   this.addEventListener('click', unselectCard)
   let cardContent = this.firstChild.innerHTML
   submissionArray.push(cardContent) 

}

function unselectCard(){
    let cardType = this.classList[1]
    this.classList.remove(cardType + 'Selected')
    this.removeEventListener('click', unselectCard)
    this.addEventListener('click', selectCard)
    let cardContent = this.firstChild.innerHTML
    let submissionIndex = submissionArray.indexOf(cardContent);
    submissionArray.splice(submissionIndex, 1)
}

function unlockCards(section){
    let i = 0
    //Adds an extra increment if playerHand, because has a hidden child for formatting
    if (section.id === 'playerHand'){
        i += 1
    }

    while(i < section.children.length){
        section.children[i].addEventListener('click', selectCard)
        let cardType =section.children[i].classList[1]
        section.children[i].classList.remove(cardType + 'Locked')
        i++
    }
}

function lockCards(section){
   for(let i = 0; i < section.children.length; i++){
        section.children[i].removeEventListener('click', selectCard)
        let cardType = section.children[i].classList[1]
        section.children[i].classList.add(cardType + 'Locked')
    }
}




// Listen for events

socket.on('testoPresto', function(){
    console.log('It worked, bitch')

   
})


socket.on('gameDoesNotExist', function(){
    //Redirects user to the no game page if game doesn't already exist
    window.location.replace(window.location.origin + '/nogame/' + roomName)
})

socket.on('assignRoundPlayerString', function(roundPlayerString){
    //Sets player's round specific key
    window.localStorage.setItem('roundPlayerString', roundPlayerString)
})

socket.on('newPlayerHand', function(newHandArray){
    
    //clears existing playerHand
    clearSection(playerHand)

    newHandArray.forEach(card => createCard(playerHand, card))

});

socket.on('newRedCards', function(newRedCardsArray){
    
    newRedCardsArray.forEach(card => createCard(playTable, card, 'red'))
    unlockCards(playTable)
    lockCards(playerHand)

});

socket.on('redCardSelection', function(redCardContent){

clearSection(playTable)
createCard(playTable,redCardContent,'red')
lockCards(playTable)
if(redCardContent !== submissionArray[0]){
    unlockCards(playerHand)
}
//THISPROBABLYISNTRIGHTT
submissionArray = []
})

socket.on('playerSubmittedCards', function(numberOfCards){
    while(numberOfCards>0){
        createCard(playTable)
        playTable.lastElementChild.classList.add('whiteCardLocked')
        numberOfCards -= 1
    }
})

socket.on('allPlayersSubmitted', function(cardArray){
    submittedWhiteCardCandidates = cardArray
})

socket.on('makeArrows', function(){

    function nextSubmission(){

        socket.emit('nextArrow')
    }

    function previousSubmission(){

        socket.emit('previousArrow')
    }
    
    let backButton = document.createElement('img')
    backButton.src = 'backButton.png'
    backButton.id = 'backButton'
    backButton.addEventListener('click', previousSubmission)
    buttonContainer.appendChild(backButton)

    let nextButton = document.createElement('img')
    nextButton.src = 'nextButton.png'
    nextButton.id = 'nextButton'
    nextButton.addEventListener('click', nextSubmission)
    buttonContainer.appendChild(nextButton)

})

socket.on('nextArrow', function(){
    while(playTable.children[1]){
        playTable.removeChild(playTable.children[1])
    }
    let currentlyDisplayed = submittedWhiteCardCandidates[0]
    submittedWhiteCardCandidates = submittedWhiteCardCandidates.splice(1)
    submittedWhiteCardCandidates.push(currentlyDisplayed)
    submittedWhiteCardCandidates[0].forEach(card => createCard(playTable, card))
})

socket.on('previousArrow', function(){
    while(playTable.children[1]){
        playTable.removeChild(playTable.children[1])
    }
    let toBeDisplayed = submittedWhiteCardCandidates.pop()
    submittedWhiteCardCandidates.unshift(toBeDisplayed)
    submittedWhiteCardCandidates[0].forEach(card => createCard(playTable, card))
})

socket.on('newTurn', function(){
    clearSection(playTable)
    let nextButton  = document.getElementById('nextButton')
    let backButton  = document.getElementById('backButton')
    nextButton.remove()
    backButton.remove()  
})

socket.on('updatePlayers', function(playerData){
    //Removes current name plates, skipping the invisible one used for formatting
    clearSection(informationPanel)

    let connectedPlayers = playerData.filter(player => player.connected)

    //Creates name plates from players in array
    connectedPlayers.forEach(player => {
        //Creates new name plate
        createNamePlate(player.name, player.score)
        //Assigns new name plate to a variable for conditional rendering
        let currentPlayerNamePlate = informationPanel.children[informationPanel.children.length-1]
        //When rendering the nameplate of the current player as determined by the socketID property on the incoming player object it adds an event listener for allowing the player to change their name
        if(player.socketID === socket.id){

            //Function for current player nameplate that allows you to change your name
            function namePlateDoubleClick(){
                
                let currentNamePlateContent = this.children[0]
                let temporaryInputBox = document.createElement('input')
                temporaryInputBox.addEventListener('keyup', function(event){
                    if (event.code === 'Enter') {
                        socket.emit('playerNameChange', this.value)
                      }
                })
                this.replaceChild( temporaryInputBox, currentNamePlateContent)
                temporaryInputBox.focus()
                temporaryInputBox.select()
            }

            currentPlayerNamePlate.addEventListener('dblclick', namePlateDoubleClick)
        }

        if(player.currentCzar){
            currentPlayerNamePlate.id = 'cardCzarNamePlate'
            currentPlayerNamePlate.firstChild.id = 'cardCzarNamePlateContent'
        }
        })
    
})
