const socket = io();

//Assigning elements from the DOM to variables
let playerHand = document.getElementById('playerHand');
let playTable = document.getElementById('playTable');
let informationPanel = document.getElementById('informationPanel');

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

//Buttons and their event listeners


let drawHandButton = document.getElementById('drawHandButton');

function drawHandButtonClick(){
    socket.emit('requestNewHand');
}

drawHandButton.addEventListener('click', drawHandButtonClick);




// Listen for events
socket.on('gameDoesNotExist', function(){
    //Redirects user to the no game page if game doesn't already exist
    window.location.replace(window.location.origin + '/nogame/' + roomName)
})

socket.on('assignRoundPlayerString', function(roundPlayerString){
    //Sets player's round specific key
    window.localStorage.setItem('roundPlayerString', roundPlayerString)
})

socket.on('newPlayerHand', function(newHandArray){
    
    while(playerHand.children[1]){
        playerHand.removeChild(playerHand.children[1])
    }
    
    newHandArray.forEach(card => createCard(playerHand, card))

});

socket.on('newRedCards', function(newRedCardsArray){
    
    newRedCardsArray.forEach(card => createCard(playTable, card, 'red'))

});

socket.on('updatePlayers', function(playerData){
    //Removes current name plates, skipping the invisible one used for formatting
    while(informationPanel.children[1]){
        informationPanel.removeChild(informationPanel.children[1])
    }

    let connectedPlayers = playerData.filter(player => player.connected)

    //clears playTable
    while(playTable.children[0]){
        playTable.removeChild(informationPanel.children[0])
    }

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
            if(player.currentCzar){
                socket.emit('requestRedCards')
            }
        }
        if(player.currentCzar){
            currentPlayerNamePlate.id = 'cardCzarNamePlate'
            currentPlayerNamePlate.firstChild.id = 'cardCzarNamePlateContent'
        }
        })
    
})
