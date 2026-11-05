import { useEffect, useState, useRef } from 'react';

function App() {
  const [serverStatus, setServerStatus] = useState('checking...');
  const [wsStatus, setWsStatus] = useState('connecting websocket...');
  const [messages, setMessages] = useState([]);
  const socketRef = useRef(null); 

  useEffect(() => {
    fetch('http://localhost:3001/api/health')
      .then((res) => res.json())
      .then((data) => setServerStatus(`server says: ${data.status}`))
      .catch(() => setServerStatus('server unreachable'));
  }, []);

  useEffect(() => {
    // create the websocket connection
    const socket = new WebSocket('ws://localhost:3001/ws');
    socketRef.current = socket;

    socket.onopen = () => {
      setWsStatus('connected');
    }

    socket.onclose = () => {
      setWsStatus('disconnected');
    };

    return() => {
      socket.close()
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    }
  }, []);

  function sendMessage() {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send('HELLO FROM THE OTHER SIDE');
    }
  }

  return (
    <div>
      <h1>HEADLINE IDK</h1>
      <button onClick={sendMessage}>SEND MESSAGE</button>
      <p>{serverStatus}</p>
    </div>
  );
}

export default App;
