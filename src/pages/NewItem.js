// src/pages/NewItem.js
import React, { useState } from "react";
import client from "../api/client";
import { useNavigate } from "react-router-dom";
import './NewItem.css';

export default function NewItem() {
  const [form, setForm] = useState({
    name: "",
    sku: "",
    rack: "Rack A1",
    totalStock: 0,
    rackStock: 0,
    threshold: 10,
     expiryDate: "",
  });
  const nav = useNavigate();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await client.post("/items", form);
      alert("Item created successfully!");
      nav("/items");
    } catch (err) {
      alert(err.response?.data?.error || err.message || "Failed to create item");
    }
  }

  return (
    <div className="newitem-page">
      <h1>New Item</h1>
      <form className="card form" onSubmit={handleSubmit}>
        <label>
          Name
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="e.g., Blue Pen"
            required
          />
          <small>Human-readable name of the item.</small>
        </label>

        <label>
          SKU
          <input
            name="sku"
            value={form.sku}
            onChange={handleChange}
            placeholder="e.g., BP-001"
            required
          />
          <small>Unique Stock Keeping Unit identifier.</small>
        </label>

        <label>
          Rack
          <input
            name="rack"
            value={form.rack}
            onChange={handleChange}
            placeholder="e.g., Rack A1"
          />
          <small>Physical location in the warehouse/store.</small>
        </label>

        <label>
          Total Stock
          <input
            type="number"
            name="totalStock"
            value={form.totalStock}
            onChange={handleChange}
          />
          <small>Total number of items available in inventory.</small>
        </label>

        <label>
          Rack Stock
          <input
            type="number"
            name="rackStock"
            value={form.rackStock}
            onChange={handleChange}
          />
          <small>Number of items in this specific rack.</small>
        </label>

        <label>
          Threshold
          <input
            type="number"
            name="threshold"
            value={form.threshold}
            onChange={handleChange}
          />
          <small>Minimum stock before restock alert triggers.</small>
        </label>

        <label>
  Expiry Date
  <input
    type="date"
    name="expiryDate"
    value={form.expiryDate}
    onChange={handleChange}
  />
  <small>Enter expiry date of the item (optional).</small>
</label>

        <button className="btn" type="submit">
          Save Item
        </button>
      </form>
    </div>
  );
}
