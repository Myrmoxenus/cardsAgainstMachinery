

const serverURL = 'http://localhost:4433';
const socket = io.connect(serverURL);

let playerHand = document.getElementById('playerHand');
let testButton = document.getElementById('testButton');
let testCardContent = document.getElementById('testCardContent');

testButton.addEventListener('click', testButtonClick);

function testButtonClick(){
    socket.emit('testButton');
}

function numberOfLines(cardContent){
    //Determines the height of a single line based on current view window by filling in an invisible card and checking
    testCardContent.innerHTML = 'testLine'
    let singleLineHeight = document.getElementById('testCardContent').clientHeight
    //Determines the number of lines of card content by checking total height and dividing it by the height of a single line and rounding it to the nearest integer
    testCardContent.innerHTML = cardContent
    let numberOfLines =  Math.round(document.getElementById('testCardContent').clientHeight/singleLineHeight)
    //Resets inner HTML of hidden card content
    testCardContent.innerHTML = ''
    return numberOfLines
}

function createCard(destination, cardContent, color){
    color = color || 'white'
    //Creates card div
    let cardDiv= document.createElement('div')
    //Assigns div the card class and the appropriate card color class
    let cardDivClass = 'card ' + color + 'Card'
    cardDiv.className = cardDivClass
    //Determines the number of lines of the card content
    let contentHeight = numberOfLines(cardContent)
    let contentDivClass = 'cardContent'
     if(contentHeight === 1){
        contentDivClass += ' shortContent'
     }
    //Creates div for card's content
    let contentDiv = document.createElement('div')
    //Sets appropriate class and innerHTML content for the card content div
    contentDiv.className = contentDivClass
    contentDiv.innerHTML = cardContent
    //Attempts to center content based on length of card content, 4.9 and 0.7 are magic numbers.
    let dynamicPadding = 0
    if(contentHeight < 7){
        dynamicPadding = 4.9 - contentHeight*0.7
    }
    contentDiv.style.paddingTop = dynamicPadding + 'vw'
    //Appends cardContent into card div
    cardDiv.appendChild(contentDiv)
    //Appends card to destination
    destination.appendChild(cardDiv)
}

// Listen for events
socket.on('drawWhiteCard', function(data){
    createCard(playerHand, data)
});

