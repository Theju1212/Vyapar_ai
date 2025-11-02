import React, { useEffect, useState } from "react";
import client from "../api/client";

export default function StoreSelector({ onSwitch }) {
  const [stores, setStores] = useState([]);
  const [current, setCurrent] = useState(localStorage.getItem("CURRENT_STORE"));

  useEffect(() => {
    async function load() {
      try {
        const res = await client.get("/stores/me/list");
        setStores(res.data);
      } catch (err) {
        console.error("Failed to load stores", err);
      }
    }
    load();
  }, []);

  async function handleSwitch(storeId) {
    try {
      const res = await client.post("/stores/switch", { storeId });
      localStorage.setItem("AM_TOKEN", res.data.token);
      localStorage.setItem("CURRENT_STORE", storeId);
      setCurrent(storeId);
      if (onSwitch) onSwitch(storeId);
      window.location.reload(); // force re-mount
    } catch (err) {
      console.error("Switch failed", err);
    }
  }

  return (
    <select
      value={current || ""}
      onChange={(e) => handleSwitch(e.target.value)}
    >
      
      {stores.map((s) => (
        <option key={s._id} value={s._id}>
          {s.name}
        </option>
      ))}
    </select>
  );
}
