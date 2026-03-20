import { useState } from 'react';
import { api } from '../api.js';

export default function CreateUserForm({ onResult }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  function isValidEmail(value) {
    const v = String(value || '').trim();
    // Simple RFC-ish email check for UI validation.
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  async function onSubmit(e) {
    e.preventDefault();

    const trimmedName = String(name || '').trim();
    const trimmedEmail = String(email || '').trim();

    if (!trimmedName) {
      setError('Name is required.');
      return;
    }

    if (!trimmedEmail) {
      setError('Email is required.');
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setError('Please enter a valid email (example: alice@example.com).');
      return;
    }

    try {
      setError('');
      const result = await api.createUser({ name: trimmedName, email: trimmedEmail });
      onResult(result, null);
    } catch (err) {
      onResult(null, err);
      setError(err.message || String(err));
    }
  }

  return (
    <div className="card">
      <h2>Create User</h2>
      <form onSubmit={onSubmit}>
        <label>
          Name
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            placeholder="Alice"
          />
        </label>

        <label>
          Email
          <input
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
            placeholder="alice@example.com"
          />
        </label>

        <button type="submit">Create user</button>
      </form>
      {error ? <div className="error">{error}</div> : null}
    </div>
  );
}

