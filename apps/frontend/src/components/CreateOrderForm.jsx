import { useState } from 'react';
import { api } from '../api.js';

export default function CreateOrderForm({ onResult }) {
  const [userId, setUserId] = useState('');
  const [itemName, setItemName] = useState('Widget');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [error, setError] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    try {
      setError('');
      const p = Number(price);
      const q = Number(quantity);
      if (!userId) throw new Error('userId is required');
      if (!Number.isFinite(p)) throw new Error('price must be a number');
      if (!Number.isFinite(q) || q <= 0) throw new Error('quantity must be > 0');

      const result = await api.createOrder({
        userId,
        items: [
          {
            name: itemName,
            price: p,
            quantity: q,
          },
        ],
      });
      onResult(result, null);
    } catch (err) {
      onResult(null, err);
      setError(err.message || String(err));
    }
  }

  return (
    <div className="card">
      <h2>Create Order</h2>
      <form onSubmit={onSubmit}>
        <label>
          User ID
          <input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="1" />
        </label>

        <label>
          Item Name
          <input value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="Widget" />
        </label>

        <label>
          Price
          <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="9.99" />
        </label>

        <label>
          Quantity
          <input value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="2" />
        </label>

        <button type="submit">Create order</button>
      </form>
      {error ? <div className="error">{error}</div> : null}
    </div>
  );
}

