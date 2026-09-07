import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { MessageSquare, RotateCcw } from 'lucide-react';

export default function AdminWhatsAppLogs() {
  const { token } = useContext(AuthContext);

  const [deliveries, setDeliveries] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, [statusFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const url = statusFilter ? `/api/whatsapp/logs?status=${statusFilter}` : '/api/whatsapp/logs';
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setDeliveries(data.deliveries || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (deliveryId) => {
    try {
      const res = await fetch(`/api/whatsapp/retry/${deliveryId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (res.ok) {
        alert('WhatsApp retry dispatched!');
        fetchLogs();
      } else {
        alert(result.error || 'Retry failed');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ padding: '16px', maxWidth: '1100px', margin: '0 auto' }}>
      <div className="card" style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <h2 style={{ color: '#8b0000', margin: 0, fontFamily: 'Cinzel, serif', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare color="#8b0000" /> WhatsApp Receipt Delivery Tracking
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Filter Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #ccc' }}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="sent">Sent</option>
              <option value="delivered">Delivered</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', padding: '24px', color: '#666' }}>Loading WhatsApp delivery logs...</p>
        ) : deliveries.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '24px', color: '#888' }}>No WhatsApp logs found.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: '#fff8e7', borderBottom: '2px solid #ebd7a3', textAlign: 'left' }}>
                  <th style={{ padding: '10px' }}>Receipt No</th>
                  <th style={{ padding: '10px' }}>Donor / Devotee</th>
                  <th style={{ padding: '10px' }}>WhatsApp Mobile</th>
                  <th style={{ padding: '10px' }}>Provider</th>
                  <th style={{ padding: '10px' }}>Status</th>
                  <th style={{ padding: '10px' }}>Retry Count</th>
                  <th style={{ padding: '10px' }}>Last Attempt</th>
                  <th style={{ padding: '10px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map((del) => {
                  const tx = del.transaction_id || {};
                  const donor = tx.donor_id || {};
                  return (
                    <tr key={del._id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px', fontWeight: 'bold', color: '#8b0000' }}>{tx.receipt_number || 'N/A'}</td>
                      <td style={{ padding: '10px', fontWeight: '600' }}>{donor.name || tx.collected_by_name || 'Devotee'}</td>
                      <td style={{ padding: '10px' }}>{del.whatsapp_number}</td>
                      <td style={{ padding: '10px', fontSize: '0.8rem', color: '#666' }}>{del.provider || 'WhatsApp API'}</td>
                      <td style={{ padding: '10px' }}>
                        <span style={{
                          background: del.status === 'sent' || del.status === 'delivered' ? '#e8f5e9' : del.status === 'failed' ? '#ffebee' : '#fff3e0',
                          color: del.status === 'sent' || del.status === 'delivered' ? '#2e7d32' : del.status === 'failed' ? '#c62828' : '#e65100',
                          padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold', fontSize: '0.75rem', textTransform: 'uppercase'
                        }}>
                          {del.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px' }}>{del.retry_count || 0}</td>
                      <td style={{ padding: '10px', fontSize: '0.8rem', color: '#666' }}>
                        {del.last_attempt_at ? new Date(del.last_attempt_at).toLocaleString() : del.created_at ? new Date(del.created_at).toLocaleString() : 'N/A'}
                      </td>
                      <td style={{ padding: '10px' }}>
                        <button 
                          onClick={() => handleRetry(del._id)}
                          style={{ background: '#25D366', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                        >
                          <RotateCcw size={12} style={{ display: 'inline', marginRight: 2 }} /> Retry WhatsApp
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
