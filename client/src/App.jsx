import { useEffect, useRef, useState } from 'react';

const WS_URL = 'ws://localhost:3001/ws';

function RunningMan({ size = 40 }) {
  return (
    <svg
      className="running-man"
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      stroke="#f2c230"
      strokeWidth="7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="38" cy="10" r="6" fill="#f2c230" stroke="none" />
      <path d="M36 20 L28 36 L16 40" />
      <path d="M28 36 L36 48 L30 60" />
      <path d="M30 24 L16 22" />
      <path d="M36 22 L50 30" />
    </svg>
  );
}

function TitleBar({ title, icon }) {
  return (
    <div className="title-bar">
      <span className="title-text">
        {icon}
        {title}
      </span>
      <span className="title-buttons">
        <button type="button" aria-label="Minimize">_</button>
        <button type="button" aria-label="Maximize">▢</button>
        <button type="button" aria-label="Close">✕</button>
      </span>
    </div>
  );
}

function BuddyList({ online, me }) {
  return (
    <section className="window buddy-window">
      <TitleBar title="Buddy List" icon={<RunningMan size={16} />} />
      <div className="window-body">
        <div className="logo-box sunken">
          <RunningMan size={64} />
          <div className="logo-text">
            AOL Instant
            <br />
            Messenger
          </div>
        </div>

        <h2 className="section-label">BUDDIES</h2>
        <div className="buddy-tree sunken">
          <h3>Online ({online.length})</h3>
          <ul>
            {online.map((b) => (
              <li key={b}>{b === me ? `${b} (you)` : b}</li>
            ))}
          </ul>
        </div>

        <div className="icon-buttons">
          <div>
            <button type="button" className="btn icon-btn">⛹</button>
            <span>Sign Off</span>
          </div>
          <div>
            <button type="button" className="btn icon-btn">⚙</button>
            <span>Setup...</span>
          </div>
          <div>
            <button type="button" className="btn icon-btn">?</button>
            <span>Help</span>
          </div>
        </div>

        <button type="button" className="btn wide-btn">
          <RunningMan size={18} /> Send Instant Message
        </button>
      </div>
    </section>
  );
}

function ChatWindow({ me, messages, status, draft, setDraft, onSend }) {
  const transcriptRef = useRef(null);

  useEffect(() => {
    const el = transcriptRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }

  return (
    <section className="window chat-window">
      <TitleBar title={`${me} - Instant Message (${status})`} icon={<RunningMan size={16} />} />
      <div className="window-body chat-body">
        <div className="transcript sunken" ref={transcriptRef}>
          <RunningMan size={90} />
          {messages.map((m, i) =>
            m.from === 'system' ? (
              <p key={i} className="system">{m.text}</p>
            ) : (
              <p key={i}>
                <strong className={m.from === me ? 'me' : 'them'}>{m.from}:</strong> {m.text}
              </p>
            )
          )}
        </div>
        <textarea
          className="compose sunken"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Message"
        />
        <div className="chat-buttons">
          <button type="button" className="btn" onClick={onSend} disabled={status !== 'connected'}>Send</button>
          <button type="button" className="btn">Close</button>
        </div>
      </div>
    </section>
  );
}

function SignOn({ status, error, onJoin }) {
  const [name, setName] = useState('');

  function submit(e) {
    e.preventDefault();
    onJoin(name.trim());
  }

  return (
    <section className="window buddy-window">
      <TitleBar title="Sign On" icon={<RunningMan size={16} />} />
      <form className="window-body" onSubmit={submit}>
        <div className="logo-box sunken">
          <RunningMan size={64} />
          <div className="logo-text">
            AOL Instant
            <br />
            Messenger
          </div>
        </div>
        <label className="section-label" htmlFor="screen-name">SCREEN NAME</label>
        <input
          id="screen-name"
          className="sunken"
          value={name}
          maxLength={16}
          autoFocus
          onChange={(e) => setName(e.target.value)}
        />
        {error && <p className="system">{error}</p>}
        <button type="submit" className="btn wide-btn" disabled={status !== 'connected' || !name.trim()}>
          Sign On
        </button>
      </form>
    </section>
  );
}

function App() {
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('connecting');
  const [draft, setDraft] = useState('');
  const [me, setMe] = useState(null);
  const [online, setOnline] = useState([]);
  const [error, setError] = useState('');
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = new WebSocket(WS_URL);
    socketRef.current = socket;

    socket.onopen = () => setStatus('connected');
    socket.onclose = () => {
      setStatus('disconnected');
      setMe(null);
      setOnline([]);
    };

    socket.onmessage = (event) => {
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }
      if (msg?.type === 'presence' && Array.isArray(msg.users)) {
        setOnline(msg.users);
        return;
      }
      if (msg?.type === 'joined' && typeof msg.name === 'string') {
        setError('');
        setMe(msg.name);
        return;
      }
      if (msg?.type === 'error' && typeof msg.text === 'string') {
        setError(msg.text);
        return;
      }
      if (typeof msg?.text !== 'string') return;

      if (msg.type === 'message') {
        setMessages((prev) => [...prev, { from: String(msg.from ?? 'Unknown'), text: msg.text }]);
      } else if (msg.type === 'system') {
        setMessages((prev) => [...prev, { from: 'system', text: msg.text }]);
      }
    };

    return () => {
      socket.close();
      if (socketRef.current === socket) socketRef.current = null;
    };
  }, []);

  function join(name) {
    const socket = socketRef.current;
    if (socket?.readyState !== WebSocket.OPEN) return;
    setError('');
    socket.send(JSON.stringify({ type: 'join', name }));
  }

  function sendMessage() {
    const text = draft.trim();
    const socket = socketRef.current;
    if (!text || !me || socket?.readyState !== WebSocket.OPEN) return;

    socket.send(JSON.stringify({ type: 'message', text }));
    // server doesn't echo to the sender, so add our own message locally
    setMessages((prev) => [...prev, { from: me, text }]);
    setDraft('');
  }

  return (
    <main className="desktop">
      {!me ? (
        <SignOn status={status} error={error} onJoin={join} />
      ) : (
        <>
      <BuddyList online={online} me={me} />
      <ChatWindow
        me={me}
        messages={messages}
        status={status}
        draft={draft}
        setDraft={setDraft}
        onSend={sendMessage}
      />
        </>
      )}
    </main>
  );
}

export default App;
