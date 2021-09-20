const socket = io();

let playerHand = document.getElementById('playerHand');
let playTable = document.getElementById('playTable');
let testButton = document.getElementById('testButton');
let informationPanel = document.getElementById('informationPanel');

function createNamePlates(nameArray){
    
    function createNamePlate(name){
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
        informationPanel.appendChild(namePlateDiv)
        namePlateDiv.appendChild(namePlateContentDiv)
        namePlateDiv.appendChild(scoreContainerDiv)
       

    }

    nameArray.forEach(name => createNamePlate(name))

}

testButton.addEventListener('click', testButtonClick);

function testButtonClick(){
    socket.emit('requestNewHand');
}

// Listen for events
socket.on('newPlayerHand', function(data){
    console.log(data)
    data.forEach(card => createCard(playerHand, card))
});

createNamePlates(['Zack', 'Beans', 'Taco', 'horse', 'horse', 
])