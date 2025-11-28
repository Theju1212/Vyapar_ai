// src/pages/Items.jsx
import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import API from '../utils/api';     // ← FIXED
import ItemCard from '../components/ItemCard';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import './Items.css';

const defaultItems = {
  Kirana: ["Rice","Sugar","Salt","Tea","Oil","Wheat","Biscuits","Soap","Milk","Chocolates"],
  General: [
    "Blue Pen","Notebook","Stapler","Glue Stick","Pencil","Eraser","Marker","Highlighter",
    "Scissors","Tape","Calculator","Folders","Paper Clips","Sharpener","Ruler","Desk Organizer",
    "Sticky Notes","Whiteboard Marker","Envelope","Notebook Pack"
  ]
};

export default function Items() {
  const [storeType, setStoreType] = useState('Kirana');
  const [search, setSearch] = useState('');
  const [itemsState, setItemsState] = useState([]);
  const qc = useQueryClient();

  const fetchItems = async () => {
    const res = await API.get('/items');   // ← FIXED
    return res.data;
  };

  const { data: allItems = [], isLoading, isError, error } = useQuery({
    queryKey: ['allItems'],
    queryFn: fetchItems
  });

  useEffect(() => {
    setItemsState(allItems);
  }, [allItems]);

  if (isLoading) return <div className="loading-container"><p>Loading items...</p></div>;
  if (isError) return <div className="card error">{error?.message || 'Failed to load items'}</div>;

  const userItems = itemsState
    .filter(i => i.userCreated)
    .filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()));

  const storeItemsMap = new Map();
  itemsState
    .filter(i => !i.userCreated && i.storeType === storeType)
    .forEach(i => storeItemsMap.set(i.name.toLowerCase(), i));

  defaultItems[storeType].forEach(name => {
    if (!storeItemsMap.has(name.toLowerCase())) {
      const today = new Date();
      const randomOffset = Math.floor(Math.random() * 5) - 1;
      const expiryDate = new Date(today);
      expiryDate.setDate(today.getDate() + randomOffset);

      storeItemsMap.set(name.toLowerCase(), {
        _id: `default-${storeType}-${name}`,
        name,
        sku: '-',
        rack: 'R1',
        totalStock: 0,
        rackStock: 0,
        threshold: 10,
        userCreated: false,
        storeType,
        expiryDate: expiryDate.toISOString().slice(0, 10)
      });
    }
  });

  const storeItems = Array.from(storeItemsMap.values())
    .filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()));

  const computeAlerts = (item) => {
    const alerts = [];

    if ((item.rackStock ?? 0) <= (item.threshold ?? 0)) {
      alerts.push(<span key="low" style={{ color: 'red' }}>Low Stock Warning</span>);
    }

    if (item.expiryDate) {
      const today = new Date(); today.setHours(0,0,0,0);
      const expiry = new Date(item.expiryDate); expiry.setHours(0,0,0,0);
      const diffDays = Math.floor((expiry - today)/(1000*60*60*24));

      if (diffDays < 0) {
        alerts.push(<span key="expired" style={{ color: 'black' }}>Expired Alert</span>);
      } else if (diffDays === 0) {
        alerts.push(<span key="today" style={{ color: 'red' }}>Expires Today Warning</span>);
      } else if (diffDays <= 3) {
        alerts.push(<span key="soon" style={{ color: 'orange' }}>Expiring Soon Clock</span>);
      }
    }

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

  const handleUpdateLocal = (updatedItem) => {
    setItemsState(prev => prev.map(i => i._id === updatedItem._id ? updatedItem : i));
    qc.invalidateQueries({ queryKey: ['allItems'] });
  };

  return (
    <div className="items-page">
      <div className="page-head">
        <h1>Items</h1>
        <Link to="/items/new" className="btn">+ New Item</Link>
      </div>

      <div className="card" style={{ marginBottom:'1.5rem', padding:'1rem' }}>
        <h3>Select Store Type</h3>
        <select value={storeType} onChange={e => setStoreType(e.target.value)} className="form-inline">
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

      <div style={{ display:'flex', gap:'2rem', flexWrap:'wrap' }}>
        <div style={{ flex:1 }}>
          <h2>User Created Items</h2>
          {userItems.length === 0 ? (
            <div className="card muted">No user-created items</div>
          ) : (
            userItems.map(it => (
              <ItemCard key={it._id} item={it} qc={qc} alerts={computeAlerts(it)} editable onSave={handleUpdateLocal}/>
            ))
          )}
        </div>

        <div style={{ flex:1 }}>
          <h2>{storeType} Items</h2>
          {storeItems.length === 0 ? (
            <div className="card muted">No items for this store type</div>
          ) : (
            storeItems.map(it => (
              <ItemCard key={it._id} item={it} qc={qc} alerts={computeAlerts(it)} editable onSave={handleUpdateLocal}/>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
