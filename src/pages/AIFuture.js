import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../api/client';
import toast from 'react-hot-toast';
import './AIFuture.css';

export default function AIFuture() {
  const [userDiscountDefault] = useState(10);
  const qc = useQueryClient();
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);  // Store temporary PDF URL

  // === AI SUGGESTIONS ===
  const {
    data: suggestionsData,
    isLoading: aiLoading,
    isError: aiError,
    error: aiErrorObj
  } = useQuery({
    queryKey: ['aiSuggestions', userDiscountDefault],
    queryFn: async () =>
      (await client.post('/ai/suggestions', {
        userDiscountConfig: { defaultDiscount: userDiscountDefault, maxDiscount: 50 }
      })).data,
    keepPreviousData: true,
    retry: 1,
    staleTime: 5 * 60 * 1000,
    onError: (err) => {
      if (err?.response?.status === 429) {
        toast.error('AI rate limit reached. Try again later or upgrade plan.');
      } else if (err?.response?.status >= 500) {
        toast.error('AI server error. Using local forecasts only.');
      }
    }
  });

  // === ALL SALES ===
  const { data: allSales = [] } = useQuery({
    queryKey: ['allSales'],
    queryFn: async () => (await client.get('/sales')).data,
    keepPreviousData: true,
    staleTime: 2 * 60 * 1000
  });

  // === ALL ITEMS ===
  const { data: allItems = [] } = useQuery({
    queryKey: ['allItems'],
    queryFn: async () => (await client.get('/items')).data,
    keepPreviousData: true,
    staleTime: 2 * 60 * 1000
  });

  // === APPLY DISCOUNT ===
  const applyDiscountMutation = useMutation({
    mutationFn: async ({ itemId, discountPercent, applyQty }) =>
      (await client.post('/ai/apply-discount', { itemId, discountPercent, applyQty })).data,
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: ['aiSuggestions', userDiscountDefault] });
      qc.invalidateQueries({ queryKey: ['allItems'] });
      toast.success('Discount applied!');

      const item = allItems.find(i => i._id === variables.itemId);
      setAppliedDiscounts(prev => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          itemId: variables.itemId,
          itemName: item?.name || 'Unknown',
          discountPercent: variables.discountPercent,
          applyQty: variables.applyQty,
          appliedAt: new Date().toLocaleString()
        }
      ]);
    }
  });

  const [editableItems, setEditableItems] = useState({});
  const [appliedDiscounts, setAppliedDiscounts] = useState([]);

  const handleChange = (itemId, field, value) => {
    setEditableItems(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: Number(value) }
    }));
  };

  const handleApply = (itemId) => {
    const item = editableItems[itemId];
    if (!item || item.applyQty <= 0) return;
    applyDiscountMutation.mutate({
      itemId,
      discountPercent: item.suggestedPercent,
      applyQty: item.applyQty
    });
  };

  const handleDeleteDiscount = (id) => {
    setAppliedDiscounts(prev => prev.filter(d => d.id !== id));
    toast.success('Discount removed from list');
  };

  // === EXPIRY ITEMS ===
  const expiryItems = useMemo(() => {
    if (!suggestionsData?.alerts) return [];
    return suggestionsData.alerts
      .filter(a => a.message.toLowerCase().includes('expired') || a.message.toLowerCase().includes('expiring'))
      .map(alert => {
        const msg = alert.message;
        const stockMatch = msg.match(/Low stock \((\d+)\/(\d+)\)/);
        const rackStock = stockMatch ? parseInt(stockMatch[1], 10) : 0;
        let daysToExpiry = 'N/A';
        const expMatch = msg.match(/Expiring in (\d+) days?/i);
        if (expMatch) daysToExpiry = parseInt(expMatch[1], 10);
        else if (msg.toLowerCase().includes('expired')) daysToExpiry = 0;

        const itemId = alert.itemId;
        const current = editableItems[itemId] || { suggestedPercent: userDiscountDefault, applyQty: 0 };

        return {
          itemId,
          itemName: alert.itemName,
          rackStock,
          daysToExpiry,
          suggestedPercent: current.suggestedPercent,
          applyQty: current.applyQty
        };
      });
  }, [suggestionsData?.alerts, userDiscountDefault, editableItems]);

  // === STOCK DEPLETION FORECAST ===
  const stockForecast = useMemo(() => {
    if (!allItems.length || !allSales.length) return [];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const last7Sales = allSales.filter(s => new Date(s.createdAt) >= sevenDaysAgo);
    const salesMap = new Map();
    last7Sales.forEach(s => {
      const id = s.itemId?._id || s.itemId;
      if (id) salesMap.set(id, (salesMap.get(id) || 0) + s.quantity);
    });

    return allItems
      .filter(item => item.rackStock > 0)
      .map(item => {
        const sold = salesMap.get(item._id) || 0;
        const daily = sold / 7;
        const daysLeft = daily > 0 ? Math.ceil(item.rackStock / daily) : Infinity;
        let status = daysLeft <= 3 ? 'text-red' : daysLeft <= 7 ? 'text-orange' : 'text-green';
        return {
          itemId: item._id,
          itemName: item.name,
          currentStock: item.rackStock,
          soldLast7Days: sold,
          dailyRate: daily.toFixed(2),
          daysLeft: daysLeft === Infinity ? 'Never' : daysLeft,
          status
        };
      })
      .filter(f => f.daysLeft !== 'Never' && f.soldLast7Days > 0)
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [allItems, allSales]);

  // === FUTURE SALES + OUT OF STOCK ===
  const futurePredictions = useMemo(() => {
    if (!allItems.length || !allSales.length) return [];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const last7Sales = allSales.filter(s => new Date(s.createdAt) >= sevenDaysAgo);
    const salesMap = new Map();
    last7Sales.forEach(s => {
      const id = s.itemId?._id || s.itemId;
      if (id) salesMap.set(id, (salesMap.get(id) || 0) + s.quantity);
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return allItems
      .map(item => {
        const sold = salesMap.get(item._id) || 0;
        const daily = sold / 7;
        const predicted7 = Math.round(daily * 7);
        const daysToOut = daily > 0 ? Math.ceil(item.rackStock / daily) : Infinity;
        const outDate = daysToOut === Infinity ? null : new Date(today);
        if (outDate) outDate.setDate(today.getDate() + daysToOut);

        return {
          itemId: item._id,
          itemName: item.name,
          currentStock: item.rackStock,
          dailyRate: daily.toFixed(2),
          predictedSales: predicted7,
          daysToOut,
          outOfStockDate: outDate ? outDate.toLocaleDateString() : 'Never',
          willRunOut: item.rackStock < predicted7
        };
      })
      .filter(p => p.predictedSales > 0)
      .sort((a, b) => a.daysToOut - b.daysToOut);
  }, [allItems, allSales]);

  // === RESTOCK TODAY ===
  const restockSuggestions = useMemo(() => {
    return futurePredictions
      .filter(p => p.daysToOut <= 3 && p.currentStock > 0)
      .map(p => ({
        itemName: p.itemName,
        currentStock: p.currentStock,
        dailyRate: p.dailyRate,
        daysLeft: p.daysToOut,
        reason: p.daysToOut <= 1 ? 'Will run out tomorrow!' : `Only ${p.daysToOut} days left`
      }))
      .slice(0, 5);
  }, [futurePredictions]);

  // === GENERATE PDF REPORT ===
  const generatePDF = () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const today = new Date().toLocaleDateString();
    let y = 20;

    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Daily AI Store Report', 14, y);
    y += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, y);
    y += 15;

    // 1. Alerts
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('1. Alerts', 14, y);
    y += 8;
    if (suggestionsData?.alerts?.length) {
      const alertText = suggestionsData.alerts.map(a => `• ${a.message}`).join('\n');
      doc.setFontSize(10);
      const splitText = doc.splitTextToSize(alertText, 180);
      doc.text(splitText, 14, y);
      y += splitText.length * 5 + 10;
    } else {
      doc.setFontSize(10);
      doc.text('No alerts.', 14, y);
      y += 10;
    }

    // 2. Stock Running Low
    if (stockForecast.length) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('2. Stock Running Low', 14, y);
      y += 8;
      const tableData = stockForecast.slice(0, 5).map(f => [
        f.itemName,
        f.currentStock,
        f.soldLast7Days,
        f.dailyRate,
        `${f.daysLeft} days`
      ]);
      doc.autoTable({
        head: [['Item', 'Stock', 'Sold 7d', 'Daily', 'Days Left']],
        body: tableData,
        startY: y,
        theme: 'striped',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [22, 160, 133] }
      });
      y = doc.lastAutoTable.finalY + 15;
    }

    // 3. Discount Suggestions
    if (expiryItems.length) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('3. Discount Suggestions', 14, y);
      y += 8;
      const discData = expiryItems.map(e => [
        e.itemName,
        e.daysToExpiry === 0 ? 'EXPIRED' : `${e.daysToExpiry} days`,
        e.rackStock,
        `${e.suggestedPercent}%`
      ]);
      doc.autoTable({
        head: [['Item', 'Expiry', 'Stock', 'Discount']],
        body: discData,
        startY: y,
        theme: 'striped',
        styles: { fontSize: 9 }
      });
      y = doc.lastAutoTable.finalY + 15;
    }

    // 4. Restock Today
    if (restockSuggestions.length) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('4. Restock Today', 14, y);
      y += 8;
      const restockData = restockSuggestions.map(r => [r.itemName, r.reason]);
      doc.autoTable({
        head: [['Item', 'Reason']],
        body: restockData,
        startY: y,
        theme: 'striped',
        styles: { fontSize: 9 }
      });
    }

    // Generate Blob + URL
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    setPdfBlobUrl(pdfUrl);
    toast.success('PDF Ready! Download or Share.');
  };

  // === SHARE ON WHATSAPP (Clean URL Only) ===
  const shareOnWhatsApp = () => {
    if (!pdfBlobUrl) return toast.error('Generate PDF first!');
    window.open(`whatsapp://send?text=${encodeURIComponent(pdfBlobUrl)}`);
    toast.success('Opening WhatsApp...');
  };

  // === AUTO CLEANUP BLOB URL ===
  useEffect(() => {
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [pdfBlobUrl]);

  return (
    <div className="ai-future-page">
      <h1>AI Suggestions & Insights</h1>

      {aiLoading && <p>Loading AI suggestions...</p>}
      {aiError && (
        <p style={{ color: 'orange', fontWeight: 'bold' }}>
          {aiErrorObj?.response?.status === 429 
            ? 'AI rate limit reached. Local forecasts active.' 
            : 'AI temporarily down. Using sales data only.'}
        </p>
      )}

      <div className="ai-sections">

        {/* 1. ALERTS */}
        <section>
          <h2>Alerts</h2>
          <div className="alerts-grid">
            {suggestionsData?.alerts?.length ? (
              suggestionsData.alerts.map((a, i) => {
                const msg = a.message;
                const cls = msg.includes('EXPIRED') ? 'alert-expired' :
                           msg.includes('Expiring') ? 'alert-expiring' :
                           msg.includes('Low stock') ? 'alert-lowstock' :
                           msg.includes('Slow') ? 'alert-slow' : '';
                return <div key={i} className={`alert-card ${cls}`}>{msg}</div>;
              })
            ) : <p>No alerts right now</p>}
          </div>
        </section>

        {/* 2. STOCK RUNNING LOW */}
        <section>
          <h2>Stock Running Low</h2>
          {stockForecast.length > 0 ? (
            <table className="discount-table">
              <thead><tr><th>Item</th><th>Stock</th><th>Sold 7d</th><th>Daily</th><th>Days Left</th></tr></thead>
              <tbody>
                {stockForecast.map(f => (
                  <tr key={f.itemId}>
                    <td>{f.itemName}</td>
                    <td>{f.currentStock}</td>
                    <td>{f.soldLast7Days}</td>
                    <td>{f.dailyRate}</td>
                    <td><span className={f.status}>{f.daysLeft} days</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p>No items sold in last 7 days.</p>}
        </section>

        {/* 3. DISCOUNT SUGGESTIONS */}
        <section>
          <h2>Discount Suggestions (Expiry Items)</h2>
          {expiryItems.length > 0 ? (
            <table className="discount-table">
              <thead><tr><th>Item</th><th>Days to Expiry</th><th>Stock</th><th>Discount (%)</th><th>Apply Qty</th><th>Action</th></tr></thead>
              <tbody>
                {expiryItems.map(e => (
                  <tr key={e.itemId}>
                    <td>{e.itemName}</td>
                    <td><span className={e.daysToExpiry === 0 ? 'text-red' : 'text-orange'}>{e.daysToExpiry}</span></td>
                    <td>{e.rackStock}</td>
                    <td><input type="number" value={e.suggestedPercent} onChange={ev => handleChange(e.itemId, 'suggestedPercent', ev.target.value)} min={0} max={100} style={{width:60}} /></td>
                    <td><input type="number" value={e.applyQty} onChange={ev => handleChange(e.itemId, 'applyQty', ev.target.value)} min={0} max={e.rackStock} style={{width:60}} /></td>
                    <td><button onClick={() => handleApply(e.itemId)} disabled={applyDiscountMutation.isLoading || e.applyQty === 0} className="apply-btn">{applyDiscountMutation.isLoading ? '...' : 'Apply'}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p>No expiry items need discount.</p>}
        </section>

        {/* 4. APPLIED DISCOUNTS */}
        <section>
          <h2>Applied Discounts</h2>
          {appliedDiscounts.length > 0 ? (
            <table className="discount-table">
              <thead><tr><th>Item</th><th>Discount %</th><th>Qty Applied</th><th>Applied At</th><th>Action</th></tr></thead>
              <tbody>
                {appliedDiscounts.map(d => (
                  <tr key={d.id}>
                    <td>{d.itemName}</td>
                    <td>{d.discountPercent}%</td>
                    <td>{d.applyQty}</td>
                    <td className="muted">{d.appliedAt}</td>
                    <td><button onClick={() => handleDeleteDiscount(d.id)} className="delete-btn">Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className="muted">No discounts applied yet.</p>}
        </section>

        {/* 5. FUTURE SALES */}
        <section>
          <h2>Future Sales Predictions (Next 7 Days)</h2>
          {futurePredictions.length > 0 ? (
            <table className="discount-table">
              <thead><tr><th>Item</th><th>Stock</th><th>Daily Rate</th><th>Predicted (7d)</th><th>Out of Stock On</th></tr></thead>
              <tbody>
                {futurePredictions.map(p => (
                  <tr key={p.itemId}>
                    <td>{p.itemName}</td>
                    <td>{p.currentStock}</td>
                    <td>{p.dailyRate}</td>
                    <td>{p.predictedSales}</td>
                    <td><span className={p.willRunOut ? 'text-red' : 'text-green'}>{p.outOfStockDate}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p>No sales data to predict.</p>}
        </section>

        {/* 6. RESTOCK TODAY */}
        <section>
          <h2>What to Restock Today</h2>
          {restockSuggestions.length > 0 ? (
            <div className="restock-list">
              {restockSuggestions.map((r, i) => (
                <div key={i} className="restock-item">
                  <strong>{r.itemName}</strong> — {r.reason}
                  <div className="muted">Stock: {r.currentStock} | Daily: {r.dailyRate}</div>
                </div>
              ))}
            </div>
          ) : <p className="muted">No urgent restock needed today.</p>}
        </section>

        {/* PDF BUTTONS AT THE END */}
        <section style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button
            onClick={generatePDF}
            className="apply-btn"
            style={{ padding: '12px 24px', fontSize: '1.1rem', margin: '0 8px' }}
          >
            Generate PDF Report
          </button>

          {pdfBlobUrl && (
            <>
              <a
                href={pdfBlobUrl}
                download={`Daily_Report_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`}
                className="apply-btn"
                style={{
                  display: 'inline-block',
                  padding: '12px 24px',
                  fontSize: '1.1rem',
                  margin: '0 8px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '6px'
                }}
              >
                Download PDF
              </a>

              <button
                onClick={shareOnWhatsApp}
                className="apply-btn"
                style={{
                  padding: '12px 24px',
                  fontSize: '1.1rem',
                  margin: '0 8px',
                  backgroundColor: '#25D366',
                  color: 'white'
                }}
              >
                Share on WhatsApp
              </button>
            </>
          )}
        </section>

      </div>
    </div>
  );
}