import { useEffect, useState } from 'react';
import { api, getApiBaseUrl } from '../api.js';

export default function StatusCard() {
  const [gateway, setGateway] = useState(null);
  const [health, setHealth] = useState(null);
  const [ready, setReady] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setError('');
        const [g, h, r] = await Promise.all([
          api.getGatewayRoot(),
          api.getGatewayHealth(),
          api.getGatewayReady(),
        ]);
        if (cancelled) return;
        setGateway(g);
        setHealth(h);
        setReady(r);
      } catch (e) {
        if (cancelled) return;
        setError(e.message || String(e));
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const apiBaseUrl = getApiBaseUrl();

  return (
    <div className="card">
      <h2>API Gateway</h2>
      <div className="statusLine">
        Base: <span style={{ color: 'var(--text)' }}>{apiBaseUrl}</span>
      </div>

      {error ? <div className="error">{error}</div> : null}

      {gateway ? (
        <>
          <div className="statusLine">
            Service: <span style={{ color: 'var(--text)' }}>{gateway.service}</span>
          </div>
          <div className="statusLine">
            Version:{' '}
            <span style={{ color: 'var(--text)' }}>{gateway.version || '(n/a)'}</span>
          </div>
        </>
      ) : (
        <div className="statusLine">Loading gateway status...</div>
      )}

      <div className="statusLine">
        Health:{' '}
        <span style={{ color: 'var(--text)' }}>
          {health?.status || (error ? 'error' : 'loading')}
        </span>
      </div>

      <div className="statusLine">
        Ready:{' '}
        <span style={{ color: 'var(--text)' }}>{ready?.status || '...'}</span>
      </div>
    </div>
  );
}

