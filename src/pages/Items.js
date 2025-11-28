// src/pages/Items.jsx
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import API from '../utils/api';
import ItemCard from '../components/ItemCard';
import { Link } from 'react-router-dom';
import './Items.css';
import toast from 'react-hot-toast';

export default function Items() {
  const [storeType, setStoreType] = useState('Kirana');
  const [search, setSearch] = useState('');
  const qc = useQueryClient();

  // 🔥 Fetch ONLY from backend preload API
  const {
    data: items = [],
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['items', storeType],
    queryFn: async () => {
      const res = await API.get(`/items/preload?storeType=${storeType}`);
      return res.data.items; // MUST return items array
    }
  });

  if (isLoading)
    return (
      <div className="loading-container">
        <p>Loading items...</p>
      </div>
    );

  if (isError)
    return (
      <div className="card error">
        {error?.message || 'Failed to load items'}
      </div>
    );

  // ---- USER CREATED ITEMS ----
  const userItems = items
    .filter(i => i.userCreated)
    .filter(i =>
      !search || i.name.toLowerCase().includes(search.toLowerCase())
    );

  // ---- STORE ITEMS (REAL back-end items, NOT fake) ----
  const storeItems = items
    .filter(i => !i.userCreated && i.storeType === storeType)
    .filter(i =>
      !search || i.name.toLowerCase().includes(search.toLowerCase())
    );

  // ---- ALERT LOGIC (NO CHANGE) ----
  const computeAlerts = item => {
    const alerts = [];

    // Low Stock
    if ((item.rackStock ?? 0) <= (item.threshold ?? 0)) {
      alerts.push(
        <span key="low" style={{ color: 'red' }}>
          Low Stock Warning
        </span>
      );
    }

    // Expiry date alerts
    if (item.expiryDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiry = new Date(item.expiryDate);
      expiry.setHours(0, 0, 0, 0);
      const diffDays = Math.floor(
        (expiry - today) / (1000 * 60 * 60 * 24)
      );

      if (diffDays < 0) {
        alerts.push(
          <span key="expired" style={{ color: 'black' }}>
            Expired Alert
          </span>
        );
      } else if (diffDays === 0) {
        alerts.push(
          <span key="today" style={{ color: 'red' }}>
            Expires Today Warning
          </span>
        );
      } else if (diffDays <= 3) {
        alerts.push(
          <span key="soon" style={{ color: 'orange' }}>
            Expiring Soon Clock
          </span>
        );
      }
    }

    // Discount tag
    if (item.discountQty > 0) {
      let tagText = '';
      if (item.discountQty === 1) {
        tagText = `Discounted ${item.discountPercent}%`;
      } else {
        const free = item.discountQty - 1;
        tagText = `Buy 1 Get ${free} Free`;
      }

      alerts.push(
        <span
          key="discount"
          style={{
            background: '#4CAF50',
            color: 'white',
            padding: '4px 10px',
            borderRadius: '16px',
            fontSize: '12px',
            fontWeight: 'bold',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            marginLeft: '8px'
          }}
        >
          {tagText}
        </span>
      );
    }

    return alerts;
  };

  // Update item locally + refresh query
  const handleUpdateLocal = updatedItem => {
    qc.invalidateQueries({ queryKey: ['items', storeType] });
  };

  return (
    <div className="items-page">
      <div className="page-head">
        <h1>Items</h1>
        <Link to="/items/new" className="btn">
          + New Item
        </Link>
      </div>

      {/* Store Type + Search */}
      <div
        className="card"
        style={{ marginBottom: '1.5rem', padding: '1rem' }}
      >
        <h3>Select Store Type</h3>

        <select
          value={storeType}
          onChange={e => setStoreType(e.target.value)}
          className="form-inline"
        >
          <option value="Kirana">Kirana</option>
          <option value="General">General Store</option>
        </select>

        <input
          type="text"
          placeholder="Search items by name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="form-inline"
          style={{ marginLeft: '1rem' }}
        />
      </div>

      {/* Items Columns */}
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        {/* USER CREATED ITEMS */}
        <div style={{ flex: 1 }}>
          <h2>User Created Items</h2>
          {userItems.length === 0 ? (
            <div className="card muted">No user-created items</div>
          ) : (
            userItems.map(it => (
              <ItemCard
                key={it._id}
                item={it}
                qc={qc}
                alerts={computeAlerts(it)}
                editable
                onSave={handleUpdateLocal}
              />
            ))
          )}
        </div>

        {/* STORE DEFAULT ITEMS */}
        <div style={{ flex: 1 }}>
          <h2>{storeType} Items</h2>
          {storeItems.length === 0 ? (
            <div className="card muted">No items for this store type</div>
          ) : (
            storeItems.map(it => (
              <ItemCard
                key={it._id}
                item={it}
                qc={qc}
                alerts={computeAlerts(it)}
                editable
                onSave={handleUpdateLocal}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
