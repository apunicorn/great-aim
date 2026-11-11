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

const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 64 * 1024 });

const NAME_RE = /^[A-Za-z0-9_.-]{3,16}$/;
const users = new Map(); // lowercased name -> { name, socket }

function send(socket, payload) {
  if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(payload));
}

function broadcast(payload, except) {
  const out = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client !== except && client.screenName && client.readyState === WebSocket.OPEN) client.send(out);
  });
}

function broadcastPresence() {
  const names = [...users.values()].map((u) => u.name).sort((a, b) => a.localeCompare(b));
  broadcast({ type: 'presence', users: names });
}

wss.on('connection', (socket) => {
  socket.screenName = null;
  send(socket, { type: 'system', text: 'Connected' });

  socket.on('message', (data, isBinary) => {
    if (isBinary) return;

    let msg;
    try {
      msg = JSON.parse(data.toString());
    } catch {
      return;
    }

    if (msg?.type === 'join') {
      if (socket.screenName) return;
      const name = typeof msg.name === 'string' ? msg.name.trim() : '';
      if (!NAME_RE.test(name)) {
        send(socket, { type: 'error', text: 'Screen name must be 3-16 letters, numbers, . _ or -' });
        return;
      }
      const key = name.toLowerCase();
      if (users.has(key)) {
        send(socket, { type: 'error', text: `"${name}" is already signed on` });
        return;
      }
      users.set(key, { name, socket });
      socket.screenName = name;
      send(socket, { type: 'joined', name });
      broadcast({ type: 'system', text: `${name} has signed on` }, socket);
      broadcastPresence();
      console.log('SIGN ON', name, `(${users.size} online)`);
      return;
    }

    if (msg?.type !== 'message' || typeof msg.text !== 'string' || !msg.text.trim()) {
      return;
    }
    if (!socket.screenName) {
      send(socket, { type: 'error', text: 'Sign on before sending messages' });
      return;
    }

    console.log('MESSAGE RECEIVED', socket.screenName, msg.text);
    broadcast({ type: 'message', from: socket.screenName, text: msg.text }, socket);
  });

  socket.on('close', () => {
    const name = socket.screenName;
    if (name) {
      users.delete(name.toLowerCase());
      broadcast({ type: 'system', text: `${name} has signed off` });
      broadcastPresence();
    }
    console.log('WEBSOCKET CLOSED', name ?? '(never signed on)');
  });

  socket.on('error', (err) => {
    console.error('WE GOTS AN ERROR YO', err.message);
  });
});
