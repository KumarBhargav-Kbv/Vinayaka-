import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { LayoutDashboard, Users, IndianRupee, Flag, Calendar, Eye, FileText, CheckCircle2 } from 'lucide-react';

export default function AdminDashboard({ onViewReceipt }) {
  const { token } = useContext(AuthContext);

  const [metrics, setMetrics] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setMetrics(data.metrics);
        setRecentTransactions(data.recentTransactions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem', color: '#6b0000', fontWeight: '700' }}>Loading Dashboard Metrics...</div>;
  }

  return (
    <div>
      {/* Metric Cards Grid */}
      <div className="metrics-grid">
        <div className="metric-card gold">
          <div className="metric-val">₹{metrics?.totalCollection?.toLocaleString('en-IN') || 0}</div>
          <div className="metric-lbl">Total Collection</div>
        </div>

        <div className="metric-card">
          <div className="metric-val">{metrics?.uniqueDonors || 0}</div>
          <div className="metric-lbl">Unique Donors</div>
        </div>

        <div className="metric-card maroon">
          <div className="metric-val">{metrics?.totalDonationsCount || 0}</div>
          <div className="metric-lbl">Total Donations</div>
        </div>

        <div className="metric-card gold">
          <div className="metric-val">{metrics?.totalSponsorshipsCount || 0}</div>
          <div className="metric-lbl">Total Sponsorships</div>
        </div>

        <div className="metric-card">
          <div className="metric-val">₹{metrics?.todayCollection?.toLocaleString('en-IN') || 0}</div>
          <div className="metric-lbl">Today's Collection</div>
        </div>

        <div className="metric-card maroon">
          <div className="metric-val">₹{metrics?.weekCollection?.toLocaleString('en-IN') || 0}</div>
          <div className="metric-lbl">This Week</div>
        </div>

        <div className="metric-card gold">
          <div className="metric-val">₹{metrics?.monthCollection?.toLocaleString('en-IN') || 0}</div>
          <div className="metric-lbl">This Month</div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <LayoutDashboard color="#e65100" /> Recent Transactions
          </h3>
        </div>

        {recentTransactions.length === 0 ? (
          <p style={{ color: '#888', textAlign: 'center', padding: '1.5rem' }}>No recent collections recorded yet.</p>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Receipt No</th>
                  <th>Donor</th>
                  <th>Mobile</th>
                  <th>Type</th>
                  <th>Amount / Details</th>
                  <th>Payment</th>
                  <th>Collected By</th>
                  <th>Date</th>
                  <th>WhatsApp</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((t) => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: '700', color: '#e65100' }}>{t.receipt_number}</td>
                    <td style={{ fontWeight: '600' }}>{t.donor_name}</td>
                    <td>{t.donor_mobile}</td>
                    <td>
                      <span className={`badge ${t.receipt_type === 'donation' ? 'badge-success' : 'badge-warning'}`}>
                        {t.receipt_type}
                      </span>
                    </td>
                    <td style={{ fontWeight: '700' }}>
                      {t.receipt_type === 'donation' ? `₹${t.amount?.toLocaleString('en-IN')}` : t.sponsorship_details}
                    </td>
                    <td>{t.payment_mode}</td>
                    <td>{t.collected_by}</td>
                    <td style={{ color: '#666', fontSize: '0.85rem' }}>{t.transaction_date}</td>
                    <td>
                      <span className={`badge ${t.whatsapp_status === 'Sent' || t.whatsapp_status === 'Delivered' ? 'badge-success' : 'badge-warning'}`}>
                        {t.whatsapp_status || 'Pending'}
                      </span>
                    </td>
                    <td>
                      <button 
                        onClick={() => onViewReceipt(t.id)}
                        className="btn btn-secondary"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                      >
                        <Eye size={14} /> Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
