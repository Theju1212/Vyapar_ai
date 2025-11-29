import React, { useState, useEffect } from "react";
import API from "../utils/api";
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

  async function loadSettingsAndAlerts() {
    try {
      const [settingsRes, alertsRes] = await Promise.all([
        API.get("/api/stores/settings"),   // ✅ FIXED
        API.get("/api/stores/alerts"),     // ✅ FIXED
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

  async function triggerAlertsManually() {
    setSendingAlert(true);
    try {
      const res = await API.get("/api/stores/test-alerts");  // ✅ FIXED

      if (res.data?.success) {
        toast.success("📨 Alert email sent successfully!");
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

  async function save(e) {
    e.preventDefault();
    setSaving(true);

    // BASIC EMAIL VALIDATION
    if (!notificationEmail.trim()) {
      toast.error("Please enter a notification email 📧");
      setSaving(false);
      return;
    }

    const cleanEmail = notificationEmail.trim();
    const cleanPhone = notificationPhone.trim();

    try {
      await API.put("/api/stores/settings", {   // ✅ FIXED
        autoRefill,
        notificationEmail: cleanEmail,
        notificationPhone: cleanPhone,
      });

      toast.success("Settings saved successfully 🎉");
      await loadSettingsAndAlerts();
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
              required
            />
          </label>

          <label className="form-row">
            <div className="label">Notification Phone</div>
            <input
              type="tel"
              value={notificationPhone}
              onChange={(e) => setNotificationPhone(e.target.value)}
              placeholder="Optional"
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
