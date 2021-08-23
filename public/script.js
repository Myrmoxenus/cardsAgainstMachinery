var socket = io.connect('http://localhost:4433');


let joinGameButton = document.getElementById('joinGameButton');

joinGameButton.addEventListener('click', joinGameButtonClick);

function joinGameButtonClick(){
    
    let screenNameInput = document.getElementById('screenNameInputBox').value;
    let roomNameInput = document.getElementById('roomNameInputBox').value;

    let data = {
        screenName: screenNameInput,
        roomName: roomNameInput
    }
    socket.emit('joinGame', data);
}