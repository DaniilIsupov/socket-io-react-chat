const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const messages = {
    connected: (user_name) => `a user connected: ${user_name}`,
    disconnected: (user_name) => `user disconnected: ${user_name}`,
    chat_message: (user_name, msg) => `${user_name}: ${msg}`
};

app.use(express.static('build'));
app.get('/*', (req, res) => {
    res.sendFile(__dirname + '/build/index.html');
});

// app.get('/', express.static('build'));

io.on('connection', (socket) => {
    const user_name = socket.handshake.query.user_name;

    io.emit('user_connected', { user: user_name });
    console.log(messages.connected(user_name));

    socket.on('chat_message', (msg) => {
        socket.broadcast.emit('chat_message', { user: user_name, msg });
    });

    socket.on('disconnect', () => {
        console.log(messages.disconnected(user_name));
        io.emit('user_disconnected', { user: user_name });
    });
});

http.listen(3000, () => {
    console.log('listening on *:3000');
});