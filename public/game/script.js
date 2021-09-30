const socket = io();

let playerHand = document.getElementById('playerHand');
let playTable = document.getElementById('playTable');
let testButton = document.getElementById('testButton');
let informationPanel = document.getElementById('informationPanel');

//Grabs roomname from user's address
let roomName =  window.location.toString().split('/')
roomName = roomName[roomName.length - 1]
let onLoadData = {
    roomName: roomName,
    roundPlayerString: window.localStorage.getItem('roundPlayerString')
}
socket.emit('gamePageLoad', onLoadData)

function createNamePlate(name, score){
    let namePlateDiv = document.createElement('div')
    namePlateDiv.className = 'namePlate'
    let namePlateContentDiv = document.createElement('div')
    namePlateContentDiv.className = 'namePlateContent'
    let namePlateFontSize = 2
    
    if(name.length > 40){
        let extraTextLength = name.length - 40
        let magicSlope = 1.62/name.length
        namePlateFontSize = 2 - extraTextLength*magicSlope
        if (namePlateFontSize < 0.2){
            namePlateFontSize = 0.2
        }
    }
    if(name.length>400){
        namePlateContentDiv.style.overflowY='scroll'
    }
    namePlateContentDiv.style.fontSize = namePlateFontSize + 'vw'
    namePlateContentDiv.innerHTML = name
    
    let scoreContainerDiv = document.createElement('div')
    scoreContainerDiv.className = 'scoreContainer'
    scoreContainerDiv.innerHTML = score
    informationPanel.appendChild(namePlateDiv)
    namePlateDiv.appendChild(namePlateContentDiv)
    namePlateDiv.appendChild(scoreContainerDiv)



}

testButton.addEventListener('click', testButtonClick);



function testButtonClick(){
    socket.emit('requestNewHand');
}

// Listen for events
socket.on('gameDoesNotExist', function(){
    window.location.replace(window.location.origin + '/nogame/' + roomName)
})

socket.on('assignRoundPlayerString', function(roundPlayerString){
    window.localStorage.setItem('roundPlayerString', roundPlayerString)
})

socket.on('newPlayerHand', function(data){
    console.log(data)
    data.forEach(card => createCard(playerHand, card))
});

socket.on('updatePlayers', function(data){
    //Removes current name plates, skipping the invisible one used for formatting
    while(informationPanel.children[1]){
        informationPanel.removeChild(informationPanel.children[1])
    }
    //Creates name plates from players in array
    data.forEach(player => {
        createNamePlate(player.name, player.score)
        //When rendering the nameplate of the current player as determined by the socketID property on the incoming player object it adds an event listener for allowing the player to change their name
        if(player.socketID === socket.id){

            let currentPlayerNamePlate = informationPanel.children[informationPanel.children.length-1]
            console.log(currentPlayerNamePlate)

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
        })
    
})
