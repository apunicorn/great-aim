import { useEffect, useState } from 'react';

function App() {
  const [status, setStatus] = useState('checking...');

  useEffect(() => {
    fetch('http://localhost:3001/api/health')
      .then((res) => res.json())
      .then((data) => setStatus(`server says: ${data.status}`))
      .catch(() => setStatus('server unreachable'));
  }, []);

  return (
    <div>
      <h1>Great AIM</h1>
      <p>{status}</p>
    </div>
  );
}

export default App;
