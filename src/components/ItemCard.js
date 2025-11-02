import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import toast from 'react-hot-toast';

export default function ItemCard({ item, qc, alerts = [], editable = false, searchTerm = '', onSave }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: item.name || '',
    sku: item.sku || '',
    rack: item.rack || '',
    totalStock: item.totalStock ?? 0,
    rackStock: item.rackStock ?? 0,
    threshold: item.threshold ?? 0,
    expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().slice(0, 10) : ''
  });

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${item.name}?`)) return;

    if (!item.userCreated) {
      toast.error('Cannot delete preloaded store items');
      return;
    }

    try {
      await client.delete(`/items/${item._id}`);
      qc.invalidateQueries({ queryKey: ['allItems'] });
      toast.success('Item deleted successfully');
    } catch (err) {
      toast.error('Failed to delete item: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleSave = async () => {
    try {
      if (item.userCreated) {
        const res = await client.put(`/items/${item._id}`, formData);
        if (onSave) onSave(res.data);
        toast.success('Item updated successfully');
      } else {
        if (onSave) onSave({ ...item, ...formData });
        toast.success('Preloaded item updated locally');
      }

      setIsEditing(false);
      qc.invalidateQueries({ queryKey: ['allItems'] });
    } catch (err) {
      toast.error('Failed to update item: ' + (err.response?.data?.error || err.message));
    }
  };

  const rawExpiry = formData.expiryDate || item.expiryDate || null;
  const expiryDate = rawExpiry ? new Date(rawExpiry) : null;
  const today = new Date();
  today.setHours(0,0,0,0);
  const diffDays = expiryDate ? Math.floor((expiryDate - today)/(1000*60*60*24)) : null;
  const isLowStock = formData.rackStock <= formData.threshold;

  const getHighlightedName = () => {
    if (!searchTerm) return formData.name;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = formData.name.split(regex);
    return parts.map((part,i) => regex.test(part) ? <mark key={i} className="bg-yellow-200">{part}</mark> : part);
  };

  return (
    <div className={`card w-80 transition-all duration-300 rounded-xl ${
      diffDays!==null && diffDays<0 ? 'bg-red-50 border-l-4 border-red-400' :
      diffDays!==null && diffDays<=3 ? 'bg-yellow-50 border-l-4 border-yellow-400' :
      isLowStock ? 'bg-red-50 border-l-4 border-red-400' :
      'bg-white hover:shadow-lg'}`}>

      {/* ALERTS BAR WITH DISCOUNT TAG */}
      {alerts.length > 0 && (
        <div className="item-alerts p-2 mb-2 flex flex-wrap gap-1 items-center">
          {alerts.map((a, i) => (
            <span key={i}>{a}</span>
          ))}
        </div>
      )}

      <div className="card-top flex justify-between items-start">
        {isEditing ? (
          <input type="text" value={formData.name} onChange={e => setFormData({...formData, name:e.target.value})} className="form-input"/>
        ) : (
          <h3 className="card-title font-semibold text-lg">{getHighlightedName()}</h3>
        )}
        <div className="muted text-sm">SKU: {isEditing ? 
          <input type="text" value={formData.sku} onChange={e => setFormData({...formData, sku:e.target.value})} className="form-input w-24"/> 
          : formData.sku || '-'}</div>
      </div>

      <div className="card-bottom mt-2 flex justify-between items-center">
        <div className="item-details text-sm space-y-1">
          {isEditing ? (
            <>
              <input type="text" value={formData.rack} onChange={e => setFormData({...formData,rack:e.target.value})} placeholder="Rack"/>
              <input type="number" value={formData.totalStock} onChange={e => setFormData({...formData,totalStock:+e.target.value})} placeholder="Total Stock"/>
              <input type="number" value={formData.rackStock} onChange={e => setFormData({...formData,rackStock:+e.target.value})} placeholder="Rack Stock"/>
              <input type="number" value={formData.threshold} onChange={e => setFormData({...formData,threshold:+e.target.value})} placeholder="Threshold"/>
              <input type="date" value={formData.expiryDate} onChange={e => setFormData({...formData,expiryDate:e.target.value})}/>
            </>
          ) : (
            <>
              <div className="muted">Rack: {formData.rack || '-'}</div>
              <div className="muted">Total Stock: {formData.totalStock}</div>
              <div className="muted">Rack Stock: {formData.rackStock}</div>
              <div className="muted">Threshold: {formData.threshold}</div>
              {expiryDate && <div className="muted">Expiry: {expiryDate.toLocaleDateString()}</div>}
            </>
          )}
        </div>

        <div className="card-actions flex flex-col items-end space-y-1">
          {isEditing ? (
            <>
              <button className="btn btn-ghost text-green-600 hover:underline" onClick={handleSave}>Save</button>
              <button className="btn btn-ghost text-gray-600 hover:underline" onClick={()=>setIsEditing(false)}>Cancel</button>
            </>
          ) : (
            <>
              {editable && <button className="btn btn-ghost text-blue-600 hover:underline" onClick={()=>setIsEditing(true)}>Edit</button>}
              <Link to={`/items/${item._id || item.id}`} className="btn btn-ghost text-blue-600 hover:underline">Manage</Link>
              {item.userCreated && <button className="btn btn-ghost text-red-600 hover:underline" onClick={handleDelete}>Delete</button>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}