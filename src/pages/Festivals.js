import React, { useState, useEffect } from "react";
import client from "../api/client";
import "./Festivals.css";

export default function FestivalList() {
  const [allFestivals, setAllFestivals] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [month, setMonth] = useState("");
  const [selectedFestival, setSelectedFestival] = useState(null);
  const [groceries, setGroceries] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await client.get("/calendar/festivals");
        const data = res.data.festivals || [];
        setAllFestivals(data);
        setFiltered(data);
      } catch (err) {
        console.error("Fetch festivals failed:", err);
      }
    };
    fetchAll();
  }, []);

  const handleSearch = () => {
    if (!month.trim()) {
      setFiltered(allFestivals);
      return;
    }

    const lower = month.toLowerCase();
    const monthNum = new Date(`${month} 1, 2000`).getMonth() + 1;

    const filteredList = allFestivals.filter(f => {
      const nameMatch = f.name.toLowerCase().includes(lower);
      const monthMatch = f.date.datetime.month === monthNum;
      return nameMatch || monthMatch;
    });

    setFiltered(filteredList);
  };

  const handleFestivalClick = async (festival) => {
    setSelectedFestival(festival);
    setLoading(true);
    setGroceries([]);

    try {
      const daysUntil = Math.ceil(
        (new Date(festival.date.iso) - new Date()) / (1000 * 60 * 60 * 24)
      );

      const res = await client.post("/ai/festival-suggestions", {
        festivalName: festival.name,
        daysUntil: daysUntil > 0 ? daysUntil : 0,
      });

      const list = res.data.suggestions || [];
      setGroceries(Array.isArray(list) ? list : ["No suggestions."]);
    } catch (err) {
      console.error("AI failed:", err.response?.data || err);
      setGroceries(["Failed to load AI suggestions."]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="festival-page">
      <h2 className="festival-title">Indian Festivals (2025 – 2026)</h2>

      {/* SEARCH */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by month or festival..."
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSearch()}
        />
        <button onClick={handleSearch}>Search</button>
      </div>

      {/* FESTIVAL GRID */}
      <div className="festival-list">
        {filtered.length === 0 ? (
          <p className="no-results">No festivals found for "{month}"</p>
        ) : (
          filtered.map((fest) => {
            const daysUntil = Math.ceil(
              (new Date(fest.date.iso) - new Date()) / (1000 * 60 * 60 * 24)
            );
            return (
              <div
                key={`${fest.name}-${fest.date.iso}`}
                className="festival-card"
                onClick={() => handleFestivalClick(fest)}
              >
                <h3>{fest.name}</h3>
                <p className="festival-date">
                  {new Date(fest.date.iso).toDateString()}
                </p>
                {daysUntil > 0 && (
                  <p className="days-until">
                    In: {daysUntil} day{daysUntil !== 1 ? "s" : ""}
                  </p>
                )}
                <p className="festival-type">{fest.type?.join(", ")}</p>
              </div>
            );
          })
        )}
      </div>

      {/* GROCERY SUGGESTIONS */}
      {selectedFestival && (
        <div className="grocery-section">
          <h3>Grocery Suggestions for {selectedFestival.name}</h3>
          {loading ? (
            <p className="loading">Loading AI suggestions...</p>
          ) : groceries.length === 0 ? (
            <p className="no-suggestions">No suggestions available.</p>
          ) : (
            <ul className="grocery-list">
              {groceries.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}