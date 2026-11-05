import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws'; 

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

const server = app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

const wss = new WebSocketServer({server});

wss.on('connection', (socket) => {
  socket.send('WEBSOCKET SERVER IS WOKRING OMG');

  socket.on('message', (message) => {
    console.log('MESSAGE RECEIVED ', message.toString());
  });

  wss.clients.forEach((client) => {
    if (client !== socket && client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });

  socket.on('close', () => {
    console.log('WEBSOCKET CLOSED');
  });

  socket.on('error', (err) => {
    console.error('WE GOTS AN ERROR YO ', err.message);
  });
});

