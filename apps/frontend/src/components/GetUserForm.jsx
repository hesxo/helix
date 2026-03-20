import { useState } from 'react';
import { api } from '../api.js';

export default function GetUserForm({ onResult }) {
  const [id, setId] = useState('');
  const [error, setError] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    try {
      setError('');
      const result = await api.getUserById(id);
      onResult(result, null);
    } catch (err) {
      onResult(null, err);
      setError(err.message || String(err));
    }
  }

  return (
    <div className="card">
      <h2>Get User by ID</h2>
      <form onSubmit={onSubmit}>
        <label>
          User ID
          <input value={id} onChange={(e) => setId(e.target.value)} placeholder="1" />
        </label>

        <button type="submit">Fetch user</button>
      </form>
      {error ? <div className="error">{error}</div> : null}
    </div>
  );
}

