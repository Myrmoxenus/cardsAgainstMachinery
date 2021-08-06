

const serverURL = 'http://localhost:4433';
const socket = io.connect(serverURL);

let playerHand = document.getElementById('playerHand');
let playTable = document.getElementById('playTable');
let testButton = document.getElementById('testButton');
let informationPanel = document.getElementById('informationPanel');

function createNamePlates(nameArray){
    
    function createNamePlate(name){
        let namePlateDiv = document.createElement('div')
        namePlateDiv.className = 'namePlate'
        namePlateDiv.style.height = 90/nameArray.length + '%'
        let namePlateContentDiv = document.createElement('div')
        namePlateContentDiv.className = 'namePlateContent'
        let namePlateFontSize = 2
        
        if(name.length > 63){
            let extraTextLength = name.length - 63
            namePlateFontSize = 2 - extraTextLength*0.0022
            if (namePlateFontSize < 0.2){
                namePlateFontSize = 0.2
            }
        }
        if(name.length>15700){
            namePlateDiv.style.overflowY='scroll'
        }
        namePlateContentDiv.style.fontSize = namePlateFontSize + 'vw'
        namePlateContentDiv.innerHTML = name
        
        informationPanel.appendChild(namePlateDiv)
        namePlateDiv.appendChild(namePlateContentDiv)

    }

    nameArray.forEach(name => createNamePlate(name))

}

testButton.addEventListener('click', testButtonClick);

function testButtonClick(){
    socket.emit('testButton');
}

// Listen for events
socket.on('drawWhiteCard', function(data){
    createCard(playerHand, data)
});

createNamePlates(['Zack', 
'Fuck you', 
'Fuck you FUck you fuck you fuck you fuck you fuck youyou fuck you fuck youyou fuck you fuck yfuck you fuFuck you FUck you fuck you fuck you fuck you fuck youyou fuck you fuck youyou fuck you fuck yfuck you fuck you fuck you fuck youFuck you FUck you fuck you fuck you fuck you fuck youyou fuck you fuck youyou fuck you fuck yfuck you fuck you fuck you fuck youFuck you FUck you fuck you fuck you fuck you fuck youyou fuck you fuck youyou fuck you fuck yfuck you fuck you fuck you fuck youFuck you FUck you fuck you fuck you fuck you fuck youyou fuck you fuck youyou fuck you fuck yfuck you fuck you fuck you fuck youck you fuck you END',
 'Fuck you',
 'Horse. Horse Horse Horse Horse Horse Horse Horse horse WEWERERE RERERE fuck fuck fuck'])