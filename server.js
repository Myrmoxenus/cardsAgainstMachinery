// Dependencies
const express = require('express');
const socket = require('socket.io');

//Sets port to a value
const PORT = process.env.PORT || 4422;

// Initializes the variable "app" with express()
const app = express();

//Configures express
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//Sets up static folder
app.use(express.static(path.join(__dirname, 'public'),{extensions:['html']}));

//Listens, reports to console that a server has successfully started on PORT
app.listen(PORT, function(req, res){
    console.log(`Server listening on port ${PORT}.`)
});