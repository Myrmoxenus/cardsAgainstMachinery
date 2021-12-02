const socket = io();

let testButton = document.getElementById('testButton');

//grabs roomname from URL
let roomName =  window.location.toString().split('/')
roomName = roomName[roomName.length - 1]


testButton.addEventListener('click', testButtonClick);

function testButtonClick(){
    socket.emit('createGame', roomName);
}

socket.on('gameCreated', function(){
    window.location.replace(window.location.origin + '/game/' + roomName)
})