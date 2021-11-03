
const socket = io();

//Assigning elements from the DOM to variables
let playerHand = document.getElementById('playerHand');
let playTable = document.getElementById('playTable');
let informationPanel = document.getElementById('informationPanel');
let buttonContainer = document.getElementById('buttonContainer')


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
//Locks cards on a delay while it waits for the server to emit a hand to each player. I'm not in love with this.
setTimeout(function() {
    lockCards(playerHand)
  }, 500);

//An array that holds the all of the submitted white card candidates. This array is used to cycle through cards while cardCzar is selecting a winner
let submittedWhiteCardCandidates = []

//Buttons from DOM assigned to variables

let drawHandButton = document.getElementById('drawHandButton');
let submitCardButton = document.getElementById('submitCardButton');
let selectWinnerButton = document.getElementById('selectWinnerButton')
let voteToSkipButton = document.getElementById('voteToSkipButton')
//Button functions 

function drawHandButtonClick(){
    socket.emit('requestNewHand');
}

function submitCardButtonClick(){
    if(submissionArray){
        //If white cards are selected, removes them from player's hand on submission
        let selectedCards = document.getElementsByClassName('whiteCardSelected')
        if(selectedCards.length !== 0){
            while(selectedCards[0]){
                selectedCards[0].remove()
            }
        }
        socket.emit('cardSubmission', submissionArray);
    }
//Clears submission array
submissionArray = []
}

//Function for submitting the content of a selected card
function selectWinnerButtonClick(){
    let winnerCards = submittedWhiteCardCandidates[0]
    socket.emit('winnerSelected', winnerCards)
}

//Function for voting to skip
function voteToSkipButtonClick(){
    socket.emit('votedToSkip')
}

//Adds event listeners to 
drawHandButton.addEventListener('click', drawHandButtonClick);
submitCardButton.addEventListener('click', submitCardButtonClick)
selectWinnerButton.addEventListener('click', selectWinnerButtonClick)
voteToSkipButton.addEventListener('click', voteToSkipButtonClick)

//Where selected cards are placed prior to being submitted
let submissionArray = []



//Function that runs when a card has been selected
function selectCard(){
    
   let cardType = this.classList[1]
   //Checks if the selected card is a red card, if so, it unselects previously selected redCards.
   if(cardType === 'redCard'){

        function redCardEditButtonFunction(){
            event.stopPropagation()
            let redCardEditButton = this
            let parentCard = this.parentElement
            parentCard.removeEventListener('click', unselectCard)
            redCardEditButton.remove()
            let cardContent = parentCard.firstChild
            cardContent.contentEditable = true
            cardContent.focus()
            cardContent.addEventListener('keyup', function(event){
                if (event.code === 'Enter') {
                    //Maybe rerender the card?
                    cardContent.contentEditable = false
                    parentCard.appendChild(redCardEditButton)
                    parentCard.addEventListener('click', unselectCard)
                  }
            })
        }

        if(!this.firstChild.isContentEditable){
            let redCardEditButton = document.createElement('img')
            redCardEditButton.src = 'pencil.png'
            redCardEditButton.className = 'redCardEditButton'
            redCardEditButton.addEventListener('click', redCardEditButtonFunction)
            this.appendChild(redCardEditButton)
        }



       let previouslySelectedRedCard = document.getElementsByClassName('redCardSelected')[0]
       if(previouslySelectedRedCard){
           if(previouslySelectedRedCard.firstChild.isContentEditable){
            previouslySelectedRedCard.firstChild.contentEditable = false
            previouslySelectedRedCard.addEventListener('click', unselectCard)
           }
            
            //'click's previously selected card to unselect it
            previouslySelectedRedCard.click()
            let redCardEditButton = previouslySelectedRedCard.children[1]
            if(redCardEditButton){
                previouslySelectedRedCard.removeChild(redCardEditButton)
            }
            
       }
   }
   else{
       numberWhiteCards()
       //
       let submissionOrderNumber= document.createElement('div')
       submissionOrderNumber.className = 'submissionOrderNumber'
       submissionOrderNumberValue = submissionArray.length + 1
       submissionOrderNumber.innerText = submissionOrderNumberValue
       this.appendChild(submissionOrderNumber)
   }
   this.classList.add(cardType + 'Selected')
   this.removeEventListener('click', selectCard)
   this.addEventListener('click', unselectCard)
   let cardContent = this.firstChild.innerHTML
   submissionArray.push(cardContent) 

}

//Function that allows a card to be unselected
function unselectCard(){
    let cardType = this.classList[1]
    this.classList.remove(cardType + 'Selected')
    let redCardEditButton = this.children[1]
    if(redCardEditButton){
        redCardEditButton.remove()
    }
    this.removeEventListener('click', unselectCard)
    this.addEventListener('click', selectCard)
    let cardContent = this.firstChild.innerHTML
    let submissionIndex = submissionArray.indexOf(cardContent);
    submissionArray.splice(submissionIndex, 1)
    if(cardType === 'whiteCard'){
        numberWhiteCards()
    }

}

function numberWhiteCards(){

    function denumberWhiteCards(){
        for(let i = 1; i<playerHand.children.length; i++){
        let submissionOrderNumberDiv = playerHand.children[i].children[1]
            if(submissionOrderNumberDiv){
                submissionOrderNumberDiv.remove()
            }
        }
    }

    denumberWhiteCards()

    submissionArray.forEach(submissionArrayCard => {
        for(let i = 1; i<playerHand.children.length; i++){
            let handCard = playerHand.children[i]
            let handCardContent = handCard.firstChild.innerHTML
            if(handCardContent === submissionArrayCard){
                let submissionOrderNumber= document.createElement('div')
                submissionOrderNumber.className = 'submissionOrderNumber'
                submissionOrderNumberValue = submissionArray.indexOf(submissionArrayCard) + 1
                submissionOrderNumber.innerText = submissionOrderNumberValue
                handCard.appendChild(submissionOrderNumber)
            }
        }
    })
}

//Functions for unlocking and locking cards, indicating a player can not currently submit cards

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



// Socket behavior

socket.on('gameDoesNotExist', function(){
    //Redirects user to the no game page if game doesn't already exist
    window.location.replace(window.location.origin + '/nogame/' + roomName)
})

socket.on('gameHasTooManyPlayers', function(){
    //Redirects user to the no game page if game has too many players
    window.location.replace(window.location.origin + '/nogame/' + roomName)
})

socket.on('alreadyConnectedToGame', function(){
    //Redirects user to the no game page if player is already connected
    window.location.replace(window.location.origin + '/nogame/' + roomName)
})


socket.on('assignRoundPlayerString', function(roundPlayerString){
    //Sets player's round specific key
    window.localStorage.setItem('roundPlayerString', roundPlayerString)
})

//Replaces player hand with cards from server
socket.on('newPlayerHand', function(newHandArray){
    
    //clears existing playerHand
    clearSection(playerHand)
    newHandArray.forEach(card => createCard(playerHand, card))
    //Adds the card select event listeners
    unlockCards(playerHand)

});

//Produces red card candidates from cards from server
socket.on('newRedCards', function(newRedCardsArray){
    
    clearSection(playTable)
    newRedCardsArray.forEach(card => createCard(playTable, card, 'red'))
    unlockCards(playTable)
    lockCards(playerHand)
});

//Handles the selection of a red card
socket.on('redCardSelection', function(redCardContent){

clearSection(playTable)
createCard(playTable,redCardContent,'red')
lockCards(playTable)
//If the player was not the Czar and therefore does not have a red card currently sitting in their submission array, it unlocks their hand to allow them to submit cards
if(redCardContent !== submissionArray[0]){
    unlockCards(playerHand)
}

})

//Locks player hand when signaled from the server 
socket.on('lockPlayerHand', function(){
    lockCards(playerHand)
})

//Displays cards 'face down' as they're submitted as a visual cue to players having submitted
socket.on('playerSubmittedCards', function(numberOfCards){
    while(numberOfCards>0){
        createCard(playTable)
        playTable.lastElementChild.classList.add('whiteCardLocked')
        numberOfCards -= 1
    }
})

//Replenishes submitted white cards into a players hand
socket.on('replacementWhiteCards', function(replacementCards){
    replacementCards.forEach(card => createCard(playerHand, card))
})

//Sets the submittedWhiteCardCandidates array to the array randomized and sent from the server
socket.on('allPlayersSubmitted', function(cardArray){
    submittedWhiteCardCandidates = cardArray
})

//Creates arrows that allows the cardCzar to cycle all players through white card submissions
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

//Functions that run when the cardCzar has pressed an arrow, cycling all players through the white card submissions
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

//Clears the playTable of redCards and whiteCard candidates. Removes the arrows if applicable
socket.on('clearTable', function(){
    lockCards(playerHand)
    clearSection(playTable)
    let nextButton  = document.getElementById('nextButton')
    let backButton  = document.getElementById('backButton')
    nextButton.remove()
    backButton.remove()
})

//Updates player nameplates on new player joins, score changes, and player name changes
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
                temporaryInputBox.className = 'namePlateInput'
                temporaryInputBox.value = currentNamePlateContent.innerHTML
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
            currentPlayerNamePlate.children[1].id = 'cardCzarScoreContainer'
            currentPlayerNamePlate.children[1].firstChild.id  = 'cardCzarScoreContent'
        }
        })
    
})
