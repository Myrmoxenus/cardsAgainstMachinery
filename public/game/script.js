
const socket = io();

//Assigning elements from the DOM to variables
let playerHand = document.getElementById('playerHand');
let playTable = document.getElementById('playTable');
let informationPanel = document.getElementById('informationPanel');
let buttonContainer = document.getElementById('buttonContainer')
let dropDownContainer = document.getElementById('dropDownContainer')

//Grabs roomname from user's address
let roomName =  window.location.toString().split('/')
roomName = roomName[roomName.length - 1]
let onLoadData = {
    roomName: roomName,
    //Grabs player's round specific key
    roundPlayerString: window.localStorage.getItem('roundPlayerString')
}
socket.emit('gamePageLoad', onLoadData)

//Locks cards on a delay while it waits for the server to emit a hand to each player. I'm not in love with this.
/*setTimeout(function() {
    lockCards(playerHand)
  }, 500);*/

//An array that holds the all of the submitted white card candidates. This array is used to cycle through cards while cardCzar is selecting a winner
let submittedWhiteCardCandidates = []

//
let playerButtonContainer = document.getElementById('playerButtonContainer')
let czarButtonContainer = document.getElementById('czarButtonContainer')


//Button functions
 //Function for selectWinnerButton
function selectWinnerButtonClick(){
    this.remove()

   playTable.hidden = true
   playerButtonContainer.hidden = true
   playerHand.style.opacity = 0
   czarButtonContainer.hidden = true


    let candidateDropDown = document.createElement('div')
    submittedWhiteCardCandidates.forEach(candidate =>{
        let candidateCardContainer = document.createElement('div')
        candidateCardContainer.className = 'candidateCardContainer'
        candidate.forEach(candidateCardContent => {
            createCard(candidateCardContainer, candidateCardContent)
        })
        createButton( 'selectCandidate', candidateCardContainer)
        candidateDropDown.appendChild(candidateCardContainer)
    })

    dropDownContainer.appendChild(candidateDropDown)

}

function selectCandidateButtonClick(){
    //currentCzar = false
    playTable.hidden = false
    playerButtonContainer.hidden = false
    playerHand.style.opacity = 1
    czarButtonContainer.hidden = false
    
    while(dropDownContainer.children[0]){
        dropDownContainer.children[0].remove()
    }

    removeButtons()
    
    let winnerCardContainer = this.parentElement
    let winnerCards = []
    for(let i = 0; i<winnerCardContainer.children.length-1; i++){
        winnerCards.push(winnerCardContainer.children[i].children[0].innerHTML)
    }
  
    socket.emit('winnerSelected', winnerCards)
}



//Function for voteToSkipButton
function voteToSkipButtonClick(){
    this.remove()
    
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

    socket.emit('votedToSkip')
}

//Function for drawHandButton
function drawHandButtonClick(){
    if(!currentCzar){
        this.remove()
    }
    socket.emit('requestNewHand');
}

//function for submitCardButton
function submitCardButtonClick(){
    console.log(submissionArray)
    if(submissionArray.length !== 0){
        //If white cards are selected, removes them from player's hand on submission
        let selectedCards = document.getElementsByClassName('whiteCardSelected')
        console.log(selectedCards.length)
        if(selectedCards.length !== 0){
            let storedCardArray = JSON.parse(window.localStorage.getItem('storedCards')) || []
            while(selectedCards[0]){
                let currentCardContent = selectedCards[0].firstChild.innerHTML
                if(storedCardArray.includes(currentCardContent)){
                    let storedCardIndex = storedCardArray.indexOf(currentCardContent)
                    storedCardArray.splice(storedCardIndex, 1)
                    let storedCardString = JSON.stringify(storedCardArray)
                    window.localStorage.setItem('storedCards', storedCardString)
                }
                selectedCards[0].remove()
            }
        }
        socket.emit('cardSubmission', submissionArray);
        this.remove()
    }
    else{
        
    }
    //Clears submission array
    submissionArray = []
}


function storeCurrentHand(){
    let arrayOfCards = []
    for(let i = 1; i < 15; i++){
        let currentCard = playerHand.children[i]
        let currentCardContent = currentCard.firstChild.innerHTML
        arrayOfCards.push(currentCardContent)
    }
    let arrayOfCardsString = JSON.stringify(arrayOfCards.reverse())
    window.localStorage.setItem('lastHand', arrayOfCardsString)
}

function grabLastHandFromStorage(){
    let storedCardArray = JSON.parse(window.localStorage.getItem('storedCards')) || []
    let lastHandArray = JSON.parse(window.localStorage.getItem('lastHand')) || []
    
    //clears existing playerHand
    clearSection(playerHand)
    storedCardArray.forEach(card => createCard(playerHand, card))
    for(let i=1; i<playerHand.children.length; i++){
        let currentCard = playerHand.children[i]
        let currentCardContent = currentCard.firstChild.innerHTML
        let currentCardIndex = lastHandArray.indexOf(currentCardContent)
        lastHandArray.splice(currentCardIndex, 1)
        currentCard.className += ' storedCard'
    }
    while(playerHand.children.length<15){
        let retrievedCardContent = lastHandArray.pop()
        createCard(playerHand, retrievedCardContent)
    }

    createCardStorageButtons()
}

function createButton(button, target){
    let createdButton = document.createElement('button')
    let buttonID = button.toString() + 'Button'
    createdButton.id = buttonID
    let buttonTextArray = button.split(/(?=[A-Z])/)
    let buttonTextString = ''
    buttonTextArray.forEach(word => {
        buttonTextString += word.charAt(0).toUpperCase() + word.slice(1) + ' '
    })
    createdButton.innerHTML = buttonTextString
 
    let buttonFunctionString = buttonID + 'Click'
    let buttonFunction = window[buttonFunctionString]
    createdButton.addEventListener('click', buttonFunction)
    target.appendChild(createdButton)
}

function removeButtons(){

    while(playerButtonContainer.firstChild){
        playerButtonContainer.removeChild(playerButtonContainer.firstChild);
    }
    while(czarButtonContainer.firstChild){
        czarButtonContainer.removeChild(czarButtonContainer.firstChild);
    }
}


//Where selected cards are placed prior to being submitted
let submissionArray = []
//Variable that stores if player is currently czar
let currentCzar = false


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
                    submissionArray = []
                    submissionArray.push(cardContent.innerHTML)
                  }
            })
        }

        if(!this.firstChild.isContentEditable){
            let redCardEditButton = document.createElement('img')
            redCardEditButton.src = 'images/pencil.png'
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

function storeCard(){
    event.stopPropagation()

    let storeCardButton = this
    let parentCard = this.parentElement
    let cardContent = parentCard.firstChild.innerHTML
    let storedCardArray = JSON.parse(window.localStorage.getItem('storedCards')) || []
    if(!storedCardArray.includes(cardContent)){
        storedCardArray.push(cardContent)
        storedCardString = JSON.stringify(storedCardArray)
        window.localStorage.setItem('storedCards', storedCardString)
        parentCard.className += ' storedCard'
    
        storeCardButton.remove()

        let unstoreCardButton = document.createElement('img')
        unstoreCardButton.src = 'images/store.png'
        unstoreCardButton.className = 'storeCardButton'
        unstoreCardButton.addEventListener('click', unstoreCard)
        parentCard.appendChild(unstoreCardButton)
    }
}

function unstoreCard(){
    event.stopPropagation()
    let unstoreCardButton = this
    let parentCard = this.parentElement
    let cardContent = parentCard.firstChild.innerHTML
    let storedCardArray = JSON.parse(window.localStorage.getItem('storedCards'))
    let storedCardIndex = storedCardArray.indexOf(cardContent)
    if(storedCardArray.includes(cardContent)){
        storedCardArray.splice(storedCardIndex, 1)
        let storedCardString = JSON.stringify(storedCardArray)
        window.localStorage.setItem('storedCards', storedCardString)
    }
    parentCard.classList.remove('storedCard')
    unstoreCardButton.remove('storedCard')
    let storeCardButton = document.createElement('img')
    storeCardButton.src = 'images/unstore.png'
    storeCardButton.className = 'storeCardButton'
    storeCardButton.addEventListener('click', storeCard)
    parentCard.appendChild(storeCardButton)
    storeCurrentHand()
}

function createCardStorageButtons(){
    for(let i = 1; i<playerHand.children.length; i++){
        let currentCard = playerHand.children[i]
        let currentCardClassesString = currentCard.className
        let currentCardClassesArray = currentCardClassesString.split(' ')
        if(currentCard.children.length < 2){
            if(currentCardClassesArray.includes('storedCard')){
                let unstoreCardButton = document.createElement('img')
                unstoreCardButton.src = 'images/store.png'
                unstoreCardButton.className = 'storeCardButton'
                unstoreCardButton.addEventListener('click', unstoreCard)
                currentCard.appendChild(unstoreCardButton)
            }
            else{
                let storeCardButton = document.createElement('img')
                storeCardButton.src = 'images/unstore.png'
                storeCardButton.className = 'storeCardButton'
                storeCardButton.addEventListener('click', storeCard)
                currentCard.appendChild(storeCardButton)
            }

        }
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
    submissionArray = []
    
    let storedCardArray = JSON.parse(window.localStorage.getItem('storedCards')) || []
    //clears existing playerHand
    clearSection(playerHand)
    storedCardArray.forEach(card => createCard(playerHand, card))
    for(let i=1; i<playerHand.children.length; i++){
        let currentCard = playerHand.children[i]
        currentCard.className += ' storedCard'
    }
    while(playerHand.children.length<15){
        let newCardContent = newHandArray.pop()
        createCard(playerHand, newCardContent)
    }
    //Adds the card select event listeners
    unlockCards(playerHand)
    storeCurrentHand()
    createCardStorageButtons()
    
});

//Produces red card candidates from cards from server
socket.on('newRedCards', function(newRedCardsArray){
    submissionArray = []
    //currentCzar = true
    clearSection(playTable)
    removeButtons()
    newRedCardsArray.forEach(card => createCard(playTable, card, 'red'))
    unlockCards(playTable)
    lockCards(playerHand)
    createButton('drawHand', czarButtonContainer)
    createButton('submitCard', czarButtonContainer)
});

//Handles the selection of a red card
socket.on('redCardSelection', function(redCardContent){

removeButtons()
clearSection(playTable)
createCard(playTable,redCardContent,'red')
lockCards(playTable)
console.log(submissionArray)
//If the player was not the Czar, it unlocks their hand to allow them to submit cards
    if(!currentCzar){
        unlockCards(playerHand)
        createButton('drawHand', playerButtonContainer)
        createButton('submitCard', playerButtonContainer)
        createButton('voteToSkip', playerButtonContainer)
    }
    else{
        createButton('voteToSkip', czarButtonContainer)
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
    createCardStorageButtons()
})

//Sets the submittedWhiteCardCandidates array to the array randomized and sent from the server
socket.on('allPlayersSubmitted', function(cardArray){
    removeButtons()
    
    submittedWhiteCardCandidates = cardArray
    createButton('voteToSkip', playerButtonContainer)
})

//Creates arrows that allows the cardCzar to cycle all players through white card submissions
socket.on('makeArrows', function(){
    createButton('selectWinner', czarButtonContainer)
    //createButton('voteToSkip', czarButtonContainer)
    function nextSubmission(){
        socket.emit('nextArrow')
    }

    function previousSubmission(){
        socket.emit('previousArrow')
    }
    
    let backButton = document.createElement('img')
    backButton.src = 'images/backButton.png'
    backButton.id = 'backButton'
    backButton.addEventListener('click', previousSubmission)
    //This is whack, fix this
    playerButtonContainer.appendChild(backButton)

    let nextButton = document.createElement('img')
    nextButton.src = 'images/nextButton.png'
    nextButton.id = 'nextButton'
    nextButton.addEventListener('click', nextSubmission)
    //This is whack, fix this
    playerButtonContainer.appendChild(nextButton)

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
})

socket.on('loadLastHand', function(){
    grabLastHandFromStorage()
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
            
            //Creates a dot that indicates which player the client is
            let playerIndicator= document.createElement('img')
            playerIndicator.src = 'images/playerIndicator.png'
            playerIndicator.className = 'playerIndicator'
            currentPlayerNamePlate.appendChild(playerIndicator)
            
            //Jank ass.
            if(player.currentCzar){
                currentCzar=true
            }
            else{
                currentCzar=false
                removeButtons()
            }

            //Also jank ass.
            if(!currentCzar && playerButtonContainer.children.length === 0 && connectedPlayers.length > 2){
                if(!player.submittedCardsThisTurn){
                createButton('submitCard', playerButtonContainer)
                }
                createButton('voteToSkip', playerButtonContainer)
            }
        }

        if(player.currentCzar){
            console.log(player.submittedCards)
            /*
            if(player.submittedCards && playTable.children.length < 1){
                createCard(playTable, submittedCards[0], 'red')
            } */
            currentPlayerNamePlate.id = 'cardCzarNamePlate'
            currentPlayerNamePlate.firstChild.id = 'cardCzarNamePlateContent'
            currentPlayerNamePlate.children[1].id = 'cardCzarScoreContainer'
            currentPlayerNamePlate.children[1].firstChild.id  = 'cardCzarScoreContent'
        }

        })
    
})
