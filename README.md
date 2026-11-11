# great-aim

A multi-user, browser-based recreation of AOL Instant Messenger, built with React and Node. Pick a screen name, sign on, see who else is online, and chat in real time, complete with a Windows 98 look and a running man.

## Features

- **Sign on with a screen name.** Names are 3-16 characters (letters, numbers, `.`, `_`, `-`) and unique, case-insensitively.
- **Live buddy list.** Shows everyone currently online and updates as people sign on and off.
- **Real-time chat over WebSockets.** Messages are broadcast to every signed-on user, tagged with the sender's screen name.
- **Sign on / sign off notices** in the chat transcript.
- **Retro UI.** Beveled windows, title bars and the AOL-style logo box, all in plain CSS.

## Tech stack

| Layer  | Tools                                   |
| ------ | --------------------------------------- |
| Client | React 19, Vite, Oxlint                  |
| Server | Node (ES modules), Express 5, `ws`, CORS |

## Project structure

```
great-aim/
├── client/              # React + Vite frontend
│   └── src/
│       ├── App.jsx      # Sign-on screen, buddy list, chat window, WebSocket logic
│       └── index.css    # Retro window styling
└── server/
    └── index.js         # Express app + WebSocket server (presence, chat, name rules)
```

## Getting started

You need Node 18+ and two terminals.

```bash
# Terminal 1: server (http://localhost:3001)
cd server
npm install
npm run dev

# Terminal 2: client (http://localhost:5173)
cd client
npm install
npm run dev
```

Open <http://localhost:5173> in two or more browser windows, sign on with different screen names, and start chatting.

The server reads `PORT` from the environment (default `3001`). The client connects to `ws://localhost:3001/ws`, and the server only accepts CORS requests from `http://localhost:5173`. Change those values if you move either one.

### Scripts

| Where    | Command           | What it does                      |
| -------- | ----------------- | --------------------------------- |
| `server` | `npm run dev`     | Start with auto-reload            |
| `server` | `npm start`       | Start normally                    |
| `client` | `npm run dev`     | Vite dev server with HMR          |
| `client` | `npm run build`   | Production build to `client/dist` |
| `client` | `npm run lint`    | Lint with Oxlint                  |

## How it works

All real-time traffic goes over a single WebSocket at `/ws`. Messages are JSON.

**Client to server**

| Message                         | Purpose                                      |
| ------------------------------- | -------------------------------------------- |
| `{ type: "join", name }`        | Sign on with a screen name                   |
| `{ type: "message", text }`     | Send a chat message (must be signed on)      |

**Server to client**

| Message                               | Purpose                                          |
| ------------------------------------- | ------------------------------------------------ |
| `{ type: "joined", name }`            | Sign-on accepted                                 |
| `{ type: "error", text }`             | Name invalid or taken, or not signed on yet      |
| `{ type: "presence", users }`         | Current list of online screen names              |
| `{ type: "message", from, text }`     | A chat message from another user                 |
| `{ type: "system", text }`            | Notices such as "alice has signed on"            |

Things worth knowing:

- Messages are relayed to everyone *except* the sender, so the client appends its own messages locally.
- Sockets that haven't signed on receive no chat or presence traffic.
- There's also a `GET /api/health` endpoint for a quick liveness check.
- Payloads are capped at 64 KB.

## Limitations

This is a toy, and it behaves like one.

- **No authentication.** Anyone can claim any unused screen name.
- **No persistence.** Users and messages live in server memory. A restart signs everyone off, and there's no chat history.
- **One shared room.** Every message goes to every signed-on user. Private IMs, and the buddy-list buttons (Sign Off, Setup, Help, and the window controls), are decorative for now.
- **Hardcoded localhost URLs** in the client and server CORS config.

## Ideas for next steps

- Private one-to-one conversations
- Away messages and idle status
- Sounds (the door creak is non-negotiable)
- Message history and persistent accounts
- Environment-based config instead of hardcoded URLs

## License

See [LICENSE](LICENSE).
