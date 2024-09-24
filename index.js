// index.js


const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000', // Allow Next.js frontend
    methods: ['GET', 'POST'],
  },
});

// To track rooms, players, and their colors
let rooms = {};

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Function to assign a player to a room and color
  const assignRoomAndColor = () => {
    for (const roomId in rooms) {
      const playersInRoom = rooms[roomId].players;

      if (playersInRoom.length < 2) {
        const color = playersInRoom.length === 0 ? 'white' : 'black'; // First player gets white, second gets black
        socket.join(roomId); // Add the player to the room
        rooms[roomId].players.push({ id: socket.id, color });
        console.log(`Player ${socket.id} added to room ${roomId} as ${color}`);

        // Notify the player of their assigned color
        socket.emit('roomJoined', roomId, color);

        return;
      }
    }

    // If no room has space, create a new room
    const newRoomId = `room-${Object.keys(rooms).length + 1}`;
    rooms[newRoomId] = { players: [{ id: socket.id, color: 'white' }] }; // First player is white
    socket.join(newRoomId); // Add the player to the new room
    console.log(`New room created: ${newRoomId}, player ${socket.id} is white`);

    // Notify the player of their assigned color
    socket.emit('roomJoined', newRoomId, 'white');
  };

  // Assign the player to a room and color when they connect
  assignRoomAndColor();

  // Handle moves in a specific room
  socket.on('move', (roomId, moveData) => {
    // Broadcast the move to the other player in the room
    socket.to(roomId).emit('move', moveData);
  });

  // Handle player disconnect
  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
    // Remove the player from the room
    for (const roomId in rooms) {
      rooms[roomId].players = rooms[roomId].players.filter(
        (player) => player.id !== socket.id
      );
      if (rooms[roomId].players.length === 0) {
        delete rooms[roomId]; // Delete the room if empty
      }
    }
  });
});

app.get('/', (req, res) => {
  res.send('Hello to Chess Master API')
})


server.listen(3001, () => {
  console.log('Server running on port 3001');
});
