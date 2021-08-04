const serverURL = 'http://localhost:4433';
const socket = io.connect(serverURL);

let playerHand = document.getElementById('playerHand');
let testButton = document.getElementById('testButton');

testButton.addEventListener('click', testButtonClick)

function testButtonClick(){
    socket.emit('testButton', 'testDataWOO');
}

function createCard(color, content, destination){
    //Creates card div
    let cardDiv= document.createElement('div')
    //Assigns div the card class and the appropriate card color class
    let cardDivClass = 'card ' + color + 'Card'
    cardDiv.className = cardDivClass
    //Creates div for card's conten
    let contentDiv = document.createElement('div')
    //Sets appropriate class and innerHTML content for the card content div
    contentDiv.className = 'cardContent'
    contentDiv.innerHTML = content
    //Appends cardContent into card div
    cardDiv.appendChild(contentDiv)
    //Appends card to destination
    destination.appendChild(cardDiv)
}

