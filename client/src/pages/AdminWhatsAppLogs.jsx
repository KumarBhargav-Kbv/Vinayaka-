import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { MessageSquare, RotateCcw, CheckCircle, AlertCircle, Clock } from 'lucide-react';

export default function AdminWhatsAppLogs() {
  const { token } = useContext(AuthContext);

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/whatsapp/logs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (transactionId) => {
    try {
      const res = await fetch(`/api/whatsapp/retry/${transactionId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (res.ok && result.waUrl) {
        window.open(result.waUrl, '_blank');
        fetchLogs();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">
          <MessageSquare color="#e65100" /> WhatsApp Receipt Delivery Tracking
        </h2>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', padding: '1.5rem', color: '#666' }}>Loading WhatsApp delivery logs...</p>
      ) : logs.length === 0 ? (
        <p style={{ textAlign: 'center', padding: '1.5rem', color: '#888' }}>No WhatsApp logs found.</p>
      ) : (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Receipt No</th>
                <th>Donor Name</th>
                <th>WhatsApp Mobile</th>
                <th>Type</th>
                <th>Amount / Details</th>
                <th>Delivery Status</th>
                <th>Sent Time</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontWeight: '700', color: '#e65100' }}>{log.receipt_number}</td>
                  <td style={{ fontWeight: '600' }}>{log.donor_name}</td>
                  <td>{log.whatsapp_number}</td>
                  <td style={{ textTransform: 'capitalize' }}>{log.receipt_type}</td>
                  <td style={{ fontWeight: '700' }}>
                    {log.receipt_type === 'donation' ? `₹${log.amount?.toLocaleString('en-IN')}` : log.sponsorship_details}
                  </td>
                  <td>
                    <span className={`badge ${
                      log.status === 'Sent' || log.status === 'Delivered' 
                        ? 'badge-success' 
                        : log.status === 'Failed' ? 'badge-danger' : 'badge-warning'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: '#666' }}>
                    {log.sent_at ? new Date(log.sent_at).toLocaleString() : 'Not sent yet'}
                  </td>
                  <td>
                    <button 
                      onClick={() => handleRetry(log.transaction_id)}
                      className="btn btn-secondary"
                      style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                    >
                      <RotateCcw size={14} /> Retry WhatsApp
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
