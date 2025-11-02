import React, { useState, useEffect } from "react";
import client from "../api/client";
import toast from "react-hot-toast";
import "./Settings.css";

export default function Settings() {
  const [autoRefill, setAutoRefill] = useState(false);
  const [notificationEmail, setNotificationEmail] = useState("");
  const [notificationPhone, setNotificationPhone] = useState("");
  const [lastAlertCopy, setLastAlertCopy] = useState("");
  const [lastAlertDate, setLastAlertDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingAlert, setSendingAlert] = useState(false);

  // 🔹 Load Settings + Last Alert
  async function loadSettingsAndAlerts() {
    try {
      const [settingsRes, alertsRes] = await Promise.all([
        client.get("/stores/settings"),
        client.get("/stores/alerts"),
      ]);

      const settings = settingsRes.data?.settings || {};
      setAutoRefill(Boolean(settings.autoRefill));
      setNotificationEmail(settings.notificationEmail || "");
      setNotificationPhone(settings.notificationPhone || "");
      setLastAlertCopy(alertsRes.data.lastAlertCopy || "");
      setLastAlertDate(alertsRes.data.lastAlertDate || "");
    } catch (err) {
      console.warn("Failed to load settings", err);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettingsAndAlerts();
  }, []);

  // 🔹 Manual Alert Trigger
  async function triggerAlertsManually() {
    setSendingAlert(true);
    try {
      const res = await client.get("/test-alerts");
      if (res.data?.success) {
        toast.success("📨 Alert email sent successfully!");
        // reload latest alert copy from DB
        await loadSettingsAndAlerts();
      } else {
        toast.error("Failed to send alert email");
      }
    } catch (err) {
      console.warn("Manual alert trigger failed", err);
      toast.error("Error sending alert email");
    } finally {
      setSendingAlert(false);
    }
  }

  // 🔹 Save Settings
  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await client.put("/stores/settings", {
        autoRefill,
        notificationEmail,
        notificationPhone,
      });
      toast.success("Settings saved successfully 🎉");
    } catch (err) {
      console.error("Save failed:", err);
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return (
      <div className="settings-page">
        <div className="card loading">Loading settings...</div>
      </div>
    );

  return (
    <div className="settings-page">
      <h1>Store Settings</h1>

      <div className="card">
        <form onSubmit={save}>
          <label className="form-row">
            <div className="label">Auto-refill</div>
            <input
              type="checkbox"
              checked={autoRefill}
              onChange={(e) => setAutoRefill(e.target.checked)}
            />
          </label>

          <label className="form-row">
            <div className="label">Notification Email</div>
            <input
              type="email"
              value={notificationEmail}
              onChange={(e) => setNotificationEmail(e.target.value)}
            />
          </label>

          <label className="form-row">
            <div className="label">Notification Phone</div>
            <input
              type="tel"
              value={notificationPhone}
              onChange={(e) => setNotificationPhone(e.target.value)}
            />
          </label>

          <div className="form-actions">
            <button className="btn" type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save settings"}
            </button>

            <button
              type="button"
              className="btn secondary"
              onClick={triggerAlertsManually}
              disabled={sendingAlert}
              style={{ marginLeft: "1rem" }}
            >
              {sendingAlert ? "Sending..." : "Send Alert Email Now"}
            </button>
          </div>
        </form>
      </div>

      {/* 🧠 ALERT COPY DISPLAY */}
      <div className="card" style={{ marginTop: "2rem" }}>
        <h2>📩 Latest Email Alert</h2>
        {lastAlertDate && (
          <p className="muted">
            Sent on {new Date(lastAlertDate).toLocaleString()}
          </p>
        )}
        {lastAlertCopy ? (
          <div
            className="alert-preview"
            dangerouslySetInnerHTML={{ __html: lastAlertCopy }}
          />
        ) : (
          <div className="muted">No alerts sent yet.</div>
        )}
      </div>
    </div>
  );
}
