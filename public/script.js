//const socket = io();


let joinGameButton = document.getElementById('joinGameButton');

joinGameButton.addEventListener('click', joinGameButtonClick);

function joinGameButtonClick(){

    let roomNameInput = document.getElementById('roomNameInputBox').value;

    //Redirects user to game with correct URL
    let newURL = 'game/' + roomNameInput
    window.location.replace(newURL)
}