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

const wss = new WebSocketServer({ server, maxPayload: 64 * 1024 });

wss.on('connection', (socket) => {
  socket.send(JSON.stringify({ type: 'system', text: 'Connected' }));

  socket.on('message', (data, isBinary) => {
    if (isBinary) return;

    let msg;
    try {
      msg = JSON.parse(data.toString());
    } catch {
      return;
    }

    if (msg?.type !== 'message' || typeof msg.text !== 'string' || !msg.text.trim()) {
      return;
    }

    console.log('MESSAGE RECEIVED', msg.text);

    const out = JSON.stringify({ type: 'message', text: msg.text });
    wss.clients.forEach((client) => {
      if (client !== socket && client.readyState === WebSocket.OPEN) {
        client.send(out);
      }
    });
  });

  socket.on('close', () => {
    console.log('WEBSOCKET CLOSED');
  });

  socket.on('error', (err) => {
    console.error('WE GOTS AN ERROR YO', err.message);
  });
});
