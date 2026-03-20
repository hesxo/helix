import { useState } from 'react';
import { api } from '../api.js';

export default function GetOrdersByUserForm({ onResult }) {
  const [userId, setUserId] = useState('');
  const [error, setError] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    try {
      setError('');
      const result = await api.getOrdersByUserId(userId);
      onResult(result, null);
    } catch (err) {
      onResult(null, err);
      setError(err.message || String(err));
    }
  }

  return (
    <div className="card">
      <h2>Get Orders by User ID</h2>
      <form onSubmit={onSubmit}>
        <label>
          User ID
          <input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="1" />
        </label>

        <button type="submit">Fetch orders</button>
      </form>
      {error ? <div className="error">{error}</div> : null}
    </div>
  );
}

