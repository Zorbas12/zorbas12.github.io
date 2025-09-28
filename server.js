const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname)); // Serve files from current folder

io.on('connection', (socket) => {
  socket.on('device_opened', (data) => {
    const logMsg = `${data.deviceName} opened the website ${data.deviceId}`;
    console.log(logMsg);
    io.emit('log', logMsg); // Broadcast to all consoles
  });
});

http.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
