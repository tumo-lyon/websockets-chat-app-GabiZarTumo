import { createServer } from 'node:http';
import express from 'express';
import { Server as SocketServer } from 'socket.io';
import { time } from 'node:console';

const app = express(); // <-- Création de l'application express
const server = createServer(app); // <-- Création du serveur HTTP    
const io = new SocketServer(server); // <-- Création du serveur de socket

// On définie un middleware pour gérer les fichiers statics
app.use(express.static('public')); 

// On définie des routes
app.get('/', (_, res) => { 
	res.redirect('/index.html'); // <-- Redirection vers la page index.html
});

// On démarre le serveur sur le port 3000
server.listen(3000, () => {
	console.log('Server started on port 3000');
});

let typingUsers = [];

////////////// WebSocket //////////////

io.on('connection', (socket) => { // <-- Quand un client se CONNECTE   
	console.log('New connection', socket.id);
    let name = socket.id;

    io.emit('system_message', {
        content: `${name} connected`,
    });

	socket.on('disconnect', () => { // <-- Quand un client se DECONNECTE
		console.log('Disconnected', name);
        socket.emit('system_message', {
            content: `${name} disconnected`,
        });
        let nonTypingUsers = typingUsers.indexOf(name);
        typingUsers.splice(nonTypingUsers, 1);
	});

    socket.on('user_message_send', (message) => { // <-- Quand un client envoie un message
        console.log('User message', message);
        io.emit('user_message', {
            author: name,
            content: message.content,
            time: new Date().toLocaleTimeString(),
            isMe: false,
        })
    });

    socket.on('typing_start', () => {
        console.log('Typing start');
        if(!typingUsers.includes(name)) {
            typingUsers.push(name);
        }
        io.emit('typing', typingUsers);
    });

    socket.on('typing_stop', () => {
        console.log('Typing stop');
        io.emit('typing', []);
        let nonTypingUsers = typingUsers.indexOf(name);
        typingUsers.splice(nonTypingUsers, 1);
    });

    socket.on('commandShare', (command) => {
        console.log('Command share', command);
        if(command.commandContent.includes("/rename") === true) {
            name = command.commandContent.substring(8, command.commandContent.length);
            socket.emit('system_message', {
                content: 'Your name has been changed',
            });
            socket.emit('NewName', {
                newName: name,
            });
        }
    });
});