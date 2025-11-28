import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import API from '../utils/api';
import './Sales.css';

export default function Sales() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['sales'],
    queryFn: async () => {
      const res = await API.get('/sales');
      return res.data;
    }
  });

  const [selectedItem, setSelectedItem] = useState(null);

  if (isLoading) return (
    <div className="sales-page">
      <div className="card loading">
        Loading sales...
        <span className="spinner"></span>
      </div>
    </div>
  );

  if (isError) return (
    <div className="sales-page">
      <div className="card error">
        Failed to load sales: {error?.message || 'Unknown error'}
      </div>
    </div>
  );

  const sales = Array.isArray(data) ? data : (data.sales || []);
  const filteredSales = sales.filter(s => s.itemId);

  const salesByItem = {};
  filteredSales.forEach(s => {
    const itemId = s.itemId._id;
    if (!salesByItem[itemId]) salesByItem[itemId] = [];
    salesByItem[itemId].push(s);
  });

  const today = new Date().toDateString();

  return (
    <div className="sales-page">
      <h1>Sales</h1>

      <div className="grid-cards">
        {filteredSales.length === 0 ? (
          <div className="card muted">No sales yet</div>
        ) : (
          Object.values(salesByItem).map(itemSales => {
            const firstSale = itemSales[0];
            const isToday = itemSales.some(s => new Date(s.createdAt).toDateString() === today);

            return (
              <div
                key={firstSale.itemId._id}
                className="card small"
                onClick={() => setSelectedItem(firstSale.itemId._id)}
                style={{ cursor: 'pointer', borderColor: isToday ? '#FF7F50' : undefined }}
              >
                <strong>{firstSale.itemId.name}</strong>
                <div className="muted">{firstSale.itemId.sku}</div>
                {isToday && <div className="badge-today">Today</div>}
                <div className="muted" style={{ fontSize: '0.8rem', marginTop: '5px' }}>
                  Click to see history
                </div>
              </div>
            );
          })
        )}
      </div>

      {selectedItem && (
        <div className="modal-backdrop" onClick={() => setSelectedItem(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Sales History: {salesByItem[selectedItem][0]?.itemId?.name}</h2>
            <div className="history-list">
              {salesByItem[selectedItem]
                .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
                .map(s => (
                  <div key={s._id || s.id} className="card small">
                    <div className="muted">{new Date(s.createdAt).toLocaleString()}</div>
                    <div>Qty: {s.quantity}</div>
                    {s.itemId?.sku && <div className="muted">SKU: {s.itemId.sku}</div>}
                    {new Date(s.createdAt).toDateString() === today && (
                      <div className="badge-today-small">Today</div>
                    )}
                  </div>
              ))}
            </div>
            <button className="close-btn" onClick={() => setSelectedItem(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
