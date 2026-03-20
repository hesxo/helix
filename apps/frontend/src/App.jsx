import { useCallback, useState } from 'react';
import StatusCard from './components/StatusCard.jsx';
import CreateUserForm from './components/CreateUserForm.jsx';
import GetUserForm from './components/GetUserForm.jsx';
import CreateOrderForm from './components/CreateOrderForm.jsx';
import GetOrderForm from './components/GetOrderForm.jsx';
import GetOrdersByUserForm from './components/GetOrdersByUserForm.jsx';

function toPrettyJson(value) {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'string') return value;
  if (value instanceof Error) return value.message || String(value);
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export default function App() {
  const [responseText, setResponseText] = useState('Run an action to see the API response here.');

  const onResult = useCallback((result, err) => {
    if (err) {
      setResponseText(toPrettyJson({ error: err.message || String(err), status: err.status }));
      return;
    }
    setResponseText(toPrettyJson(result));
  }, []);

  return (
    <div className="container">
      <h1>Helix Platform Dashboard</h1>

      <div className="grid">
        <div>
          <StatusCard />

          <div style={{ height: 14 }} />

          <div className="row">
            <div className="col">
              <h2>User Service Flow</h2>
              <CreateUserForm onResult={onResult} />
            </div>
            <div className="col">
              <h2>User Service Flow</h2>
              <GetUserForm onResult={onResult} />
            </div>
          </div>

          <div style={{ height: 14 }} />

          <div className="row">
            <div className="col">
              <h2>Order Service Flow</h2>
              <CreateOrderForm onResult={onResult} />
            </div>
            <div className="col">
              <h2>Order Service Flow</h2>
              <GetOrderForm onResult={onResult} />
              <div style={{ height: 14 }} />
              <GetOrdersByUserForm onResult={onResult} />
            </div>
          </div>
        </div>

        <div className="card">
          <h2>JSON Response</h2>
          <pre>{responseText}</pre>
        </div>
      </div>
    </div>
  );
}

