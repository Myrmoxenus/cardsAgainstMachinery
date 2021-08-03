//import {io} from 'socket.io-client'
import PORT from 'server.js'
const serverURL = 'http://localhost:' + PORT
const socket = io.connect(serverURL)