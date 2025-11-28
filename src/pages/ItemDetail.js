// src/pages/ItemDetail.jsx
import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import API from '../utils/api';   // ← FIXED
import toast from 'react-hot-toast';
import './ItemDetail.css';

export default function ItemDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [sellQty, setSellQty] = useState(1);
  const [refillQty, setRefillQty] = useState(0);
  const [storeType, setStoreType] = useState('Kirana');

  // Fetch item data
  const { data, isLoading } = useQuery({
    queryKey: ['item', id],
    queryFn: async () => {
      const res = await API.get(`/items/${id}`);   // ← FIXED
      return res.data;
    },
    enabled: !!id && id !== "new",
  });

// Handle new item creation
if (id === "new") {
  const handleCreate = async (e) => {
    e.preventDefault();
    const payload = {
      name: e.target.itemName.value,
      storeType
    };

    try {
      await API.post('/items', payload); // ← correct route
      toast.success('Item created successfully');
      nav('/items');
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Creation failed');
    }
  };

  return (
    <div className="item-detail-page">
      <h1>Create New Item</h1>
      <div className="card">
        <form onSubmit={handleCreate} className="form-inline">
          <input type="text" name="itemName" placeholder="Item Name" required />
          <select value={storeType} onChange={e => setStoreType(e.target.value)}>
            <option value="Kirana">Kirana</option>
            <option value="General">General Store</option>
          </select>
          <button className="btn" type="submit">Create</button>
        </form>
      </div>
    </div>
  );
}

  // Loading state
  if (isLoading) return (
    <div className="item-detail-page">
      <div className="card loading">Loading item...<span className="spinner"></span></div>
    </div>
  );

  const item = data || {};
  const maxSellQty = item.rackStock || 0;
  const isSellQtyValid = sellQty > 0 && sellQty <= maxSellQty;
  const isLowStock = item.rackStock <= item.threshold;
  const isRefillQtyValid = refillQty > 0;

  // Expiry logic
  let expiryStatus = '';
  let expiryTooltip = '';
  if (item.expiryDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(item.expiryDate);
    expiry.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((expiry - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      expiryStatus = 'Expired';
      expiryTooltip = `Expired ${Math.abs(diffDays)} day(s) ago`;
    } else if (diffDays === 0) {
      expiryStatus = 'Expiring Today';
      expiryTooltip = 'Expires today';
    } else if (diffDays <= 3) {
      expiryStatus = 'Expiring Soon';
      expiryTooltip = `Expires in ${diffDays} day(s)`;
    }
  }

  // Sale handler
  async function doSell(e) {
    e.preventDefault();
    if (!isSellQtyValid) {
      toast.error(`Please enter a quantity between 1 and ${maxSellQty}`);
      return;
    }
    try {
      await API.post('/sales', {   // ← FIXED
        itemId: item._id,
        quantity: Number(sellQty)
      });
      toast.success('Sale recorded');
      qc.invalidateQueries({ queryKey: ['items'] });
      nav('/items');
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Sell failed');
    }
  }

  // Refill handler
  async function doRefill(e) {
    e.preventDefault();
    if (!isRefillQtyValid) {
      toast.error('Please enter a positive quantity to refill');
      return;
    }
    try {
      await API.put(`/items/${id}`, {   // ← FIXED
        rackStock: item.rackStock + Number(refillQty),
        totalStock: item.totalStock + Number(refillQty)
      });
      toast.success('Restock recorded');
      qc.invalidateQueries({ queryKey: ['item', id] });
      qc.invalidateQueries({ queryKey: ['items'] });
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Restock failed');
    }
  }

  return (
    <div className="item-detail-page">
      <h1>Manage Item</h1>

      <div className="card">
        <h2>{item.name || 'Unnamed Item'}</h2>
        <div className="muted">SKU: {item.sku || 'N/A'}</div>
        <div className="muted">Rack stock: {item.rackStock ?? 0}</div>
        <div className="muted">Total stock: {item.totalStock ?? 0}</div>

        {/* Store type selector */}
        <div className="muted">
          Store Type:
          <select
            value={item.storeType || storeType}
            onChange={async (e) => {
              try {
                await API.put(`/items/${id}`, { storeType: e.target.value });   // ← FIXED
                qc.invalidateQueries({ queryKey: ['item', id] });
                toast.success('Store type updated');
              } catch (err) {
                toast.error(err.response?.data?.error || 'Failed to update');
              }
            }}
          >
            <option value="Kirana">Kirana</option>
            <option value="General">General Store</option>
          </select>
        </div>

        {/* Expiry info */}
        <div className="muted">
          Expiry Date: {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'Not set'}
          {expiryStatus && <span style={{ marginLeft: '10px', cursor: 'default' }} title={expiryTooltip}>⚠️ {expiryStatus}</span>}
        </div>

        {/* Low stock alert */}
        {isLowStock && (
          <div className="alert">
            ⚠️ Low stock alert! Rack stock ({item.rackStock}) is below threshold ({item.threshold}). Consider restocking.
          </div>
        )}
      </div>

      {/* Sale form */}
      <div className="card">
        <h3>Record Sale</h3>
        <form onSubmit={doSell} className="form-inline">
          <input
            type="number"
            min="1"
            max={maxSellQty}
            value={sellQty}
            onChange={e => setSellQty(Math.min(Math.max(1, Number(e.target.value)), maxSellQty))}
            placeholder={`Max: ${maxSellQty}`}
          />
          <button className="btn" type="submit" disabled={!isSellQtyValid}>Sell</button>
        </form>
      </div>

      {/* Refill form */}
      <div className="card">
        <h3>Record Restock</h3>
        <form onSubmit={doRefill} className="form-inline">
          <input
            type="number"
            min="1"
            value={refillQty}
            onChange={e => setRefillQty(Math.max(1, Number(e.target.value)))}
            placeholder="Enter refill quantity"
          />
          <button className="btn" type="submit" disabled={!isRefillQtyValid}>Refill</button>
        </form>
      </div>

      {/* Expiry update */}
      <div className="card">
        <h3>Update Expiry Date</h3>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const newDate = e.target.expiryDate.value;
            try {
              await API.put(`/items/${id}`, { expiryDate: newDate });   // ← FIXED
              toast.success('Expiry date updated');
              qc.invalidateQueries({ queryKey: ['item', id] });
            } catch (err) {
              toast.error(err.response?.data?.error || err.message || 'Failed to update expiry date');
            }
          }}
          className="form-inline"
        >
          <input
            type="date"
            name="expiryDate"
            defaultValue={item.expiryDate ? item.expiryDate.split('T')[0] : ''}
          />
          <button className="btn" type="submit">Update</button>
        </form>
      </div>

      <Link to="/items" className="btn btn-ghost">Manage</Link>
    </div>
  );
}
