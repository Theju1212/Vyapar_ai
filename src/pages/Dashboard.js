import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import API from '../utils/api';   // ✅ FIXED IMPORT
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

export default function Dashboard() {
  const [showCharts, setShowCharts] = useState(false);
  const navigate = useNavigate();

  // 🔹 Trigger alert once when dashboard mounts
  async function triggerAlertsManually() {
    try {
      await API.get("/test-alerts");   // ✅ FIXED
      console.log("Manual alert sent ✅");
    } catch (err) {
      console.warn("Manual alert trigger failed", err);
    }
  }

  useEffect(() => {
    triggerAlertsManually();
  }, []);

  // Fetch items & sales
  const itemsQ = useQuery({
    queryKey: ['dashboardItems'],
    queryFn: async () => (await API.get('/items')).data   // ✅ FIXED
  });

  const salesQ = useQuery({
    queryKey: ['dashboardSales'],
    queryFn: async () => (await API.get('/sales')).data   // ✅ FIXED
  });

  const { data: salesTrend = [] } = useQuery({
    queryKey: ['salesTrend'],
    queryFn: async () => (await API.get('/analytics/sales-trend')).data,   // ✅ FIXED
    enabled: showCharts
  });

  const { data: topItems = [] } = useQuery({
    queryKey: ['topItems'],
    queryFn: async () => (await API.get('/analytics/top-items')).data,     // ✅ FIXED
    enabled: showCharts
  });

  const { data: lowestStock = {} } = useQuery({
    queryKey: ['lowestStock'],
    queryFn: async () => (await API.get('/analytics/lowest-stock')).data,  // ✅ FIXED
    enabled: showCharts
  });

  const items = itemsQ.data || [];
  const sales = salesQ.data || [];
  const todayStr = new Date().toDateString();

  // Filter today’s sales
  const todaySales = sales.filter(
    s => new Date(s.createdAt).toDateString() === todayStr
  );

  const bestSeller = topItems[0] || {};

  // 🔹 AI Alerts Computation
  const aiAlerts = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return items
      .map(item => {
        const alerts = [];

        if ((item.rackStock ?? 0) <= (item.threshold ?? 0)) {
          alerts.push(<span key="low" style={{ color: 'red' }}>Low Stock ⚠️</span>);
        }

        if (item.expiryDate) {
          const expiry = new Date(item.expiryDate);
          expiry.setHours(0, 0, 0, 0);
          const diffDays = Math.floor((expiry - today) / (1000 * 60 * 60 * 24));

          if (diffDays < 0) {
            alerts.push(<span key="expired" style={{ color: 'black' }}>Expired ⚫</span>);
          } else if (diffDays === 0) {
            alerts.push(<span key="today" style={{ color: 'red' }}>Expires Today 🔴</span>);
          } else if (diffDays <= 3) {
            alerts.push(<span key="soon" style={{ color: 'orange' }}>Expiring Soon 🟠</span>);
          }
        }

        if (alerts.length > 0) {
          return { name: item.name, alerts };
        }
        return null;
      })
      .filter(Boolean);
  }, [items]);

  const barData = topItems.map(t => ({
    name: t.name,
    sold: t.qty
  }));

  const pieData = Object.values(
    todaySales.reduce((acc, sale) => {
      const name = sale.itemId?.name || 'Unknown';
      acc[name] = acc[name] || { name, quantity: 0 };
      acc[name].quantity += sale.quantity;
      return acc;
    }, {})
  );

  const COLORS = ['#B568F8', '#F5BABB', '#FFD166', '#06D6A0', '#EF476F', '#118AB2', '#83C5BE', '#F28482', '#CDB4DB'];

  return (
    <div className="dashboard-page">
      <h1>Dashboard</h1>

      <div className="grid-3">
        <div className="card">
          <h3>Total item types</h3>
          <div className="big">{items.length}</div>
        </div>

        <div className="card">
          <h3>Top Action</h3>
          <button
            className="see-charts-btn"
            onClick={() => setShowCharts(!showCharts)}
          >
            {showCharts ? 'Hide Insights' : 'See Insights'}
          </button>
        </div>

        <div className="card">
          <h3>AI Alerts</h3>
          <div
            className="ai-alerts-list"
            style={{ maxHeight: '200px', overflowY: 'auto', padding: '0.5rem' }}
          >
            {aiAlerts.length === 0 ? (
              <p className="muted">No AI alerts currently 🎉</p>
            ) : (
              aiAlerts.map((a, i) => (
                <div key={i} className="ai-alert-item" style={{ marginBottom: '0.5rem' }}>
                  <strong>{a.name}</strong>
                  <div style={{ display: 'inline', marginLeft: '0.5rem' }}>
                    {a.alerts.map((alert, j) => (
                      <span key={j} style={{ marginLeft: '0.3rem' }}>
                        {alert}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          <button
            className="ai-suggestions-btn"
            onClick={() => navigate('/ai-future')}
          >
            AI Suggestions
          </button>
        </div>
      </div>

      {/* Latest Items */}
      <section style={{ marginTop: 20 }}>
        <h2>Latest items (preview)</h2>
        <div className="grid-cards">
          {items.slice(0, 6).map(it => (
            <div key={it._id || it.id} className="card small">
              <strong>{it.name}</strong>
              <div className="muted">Rack: {it.rackStock ?? 0}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Today's Sales */}
      <section style={{ marginTop: 20 }}>
        <h2>Today's Sales</h2>
        <div className="grid-cards">
          {todaySales.length === 0 ? (
            <div className="card muted">No sales today</div>
          ) : (
            todaySales.map(s => (
              <div key={s._id || s.id} className="card small">
                <strong>{s.itemId?.name || 'Unknown Item'}</strong>
                <div className="muted">{s.itemId?.sku}</div>
                <div>Qty: {s.quantity}</div>
                <div className="badge-today-small">Today</div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Charts Section */}
      <AnimatePresence>
        {showCharts && (
          <motion.section
            style={{ marginTop: 40 }}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2>📊 Store Insights</h2>

            <div className="widgets">
              <div className="card small">
                <h3>🏆 Best Seller</h3>
                {bestSeller.name ? (
                  <>
                    <p>{bestSeller.name}</p>
                    <small>Sold: {bestSeller.qty}</small>
                  </>
                ) : (
                  <p>No data</p>
                )}
              </div>

              <div className="card small">
                <h3>🧃 Lowest Stock</h3>
                {lowestStock.name ? (
                  <>
                    <p>{lowestStock.name}</p>
                    <small>Rack Stock: {lowestStock.rackStock}</small>
                  </>
                ) : (
                  <p>No data</p>
                )}
              </div>
            </div>

            <div className="charts">
              <div className="chart-card card">
                <h3>Sales Trend (Last 7 Days)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={salesTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="total" stroke="#B568F8" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-card card">
                <h3>Top Selling Items</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="sold" fill="#F5BABB" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-card card">
                <h3>Today's Sales Distribution</h3>
                {pieData.length === 0 ? (
                  <p className="muted">No sales recorded today 🍃</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Tooltip />
                      <Legend />
                      <Pie
                        data={pieData}
                        dataKey="quantity"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label
                      >
                        {pieData.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
