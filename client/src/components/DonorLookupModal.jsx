import React from 'react';
import { UserCheck, Calendar, Receipt, IndianRupee, CheckCircle, X } from 'lucide-react';

export default function DonorLookupModal({ donorData, onConfirm, onClose }) {
  if (!donorData || !donorData.donor) return null;

  const { donor, history } = donorData;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        maxWidth: '520px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
        border: '2px solid #d4af37'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #6b0000, #800000)',
          color: '#ffe699',
          padding: '1.25rem',
          borderTopLeftRadius: '14px',
          borderTopRightRadius: '14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <UserCheck size={26} color="#ffe699" />
            <div>
              <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: '1.2rem', margin: 0 }}>Existing Donor Found</h3>
              <p style={{ fontSize: '0.8rem', color: '#ffd8a8', margin: 0 }}>Mobile: {donor.mobile}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#ffe699', cursor: 'pointer' }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.25rem' }}>
          <div style={{
            background: '#fff8e7',
            border: '1px solid #ebd7a3',
            borderRadius: '10px',
            padding: '1rem',
            marginBottom: '1rem'
          }}>
            <h4 style={{ color: '#6b0000', fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              👤 {donor.name}
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', textAlign: 'center', marginTop: '0.75rem' }}>
              <div style={{ background: '#ffffff', padding: '0.5rem', borderRadius: '8px', border: '1px solid #ebd7a3' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#e65100' }}>₹{donor.total_amount?.toLocaleString('en-IN') || 0}</div>
                <div style={{ fontSize: '0.7rem', color: '#666' }}>Total Amount</div>
              </div>
              <div style={{ background: '#ffffff', padding: '0.5rem', borderRadius: '8px', border: '1px solid #ebd7a3' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#6b0000' }}>{donor.total_donations_count || 0}</div>
                <div style={{ fontSize: '0.7rem', color: '#666' }}>Donations</div>
              </div>
              <div style={{ background: '#ffffff', padding: '0.5rem', borderRadius: '8px', border: '1px solid #ebd7a3' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#2e7d32' }}>{donor.total_sponsorships_count || 0}</div>
                <div style={{ fontSize: '0.7rem', color: '#666' }}>Sponsorships</div>
              </div>
            </div>
          </div>

          <h5 style={{ fontSize: '0.9rem', color: '#6b0000', marginBottom: '0.5rem', fontWeight: '700' }}>
            Previous Receipt History ({history.length}):
          </h5>

          <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ebd7a3', borderRadius: '8px' }}>
            {history.length === 0 ? (
              <p style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#777', textAlign: 'center' }}>No prior transaction records.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#fff8e7', color: '#6b0000', textAlign: 'left' }}>
                    <th style={{ padding: '6px 8px' }}>Receipt No</th>
                    <th style={{ padding: '6px 8px' }}>Type</th>
                    <th style={{ padding: '6px 8px' }}>Details / Amount</th>
                    <th style={{ padding: '6px 8px' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h.id} style={{ borderBottom: '1px solid #f0e6d2' }}>
                      <td style={{ padding: '6px 8px', fontWeight: '700', color: '#e65100' }}>{h.receipt_number}</td>
                      <td style={{ padding: '6px 8px', textTransform: 'capitalize' }}>{h.receipt_type}</td>
                      <td style={{ padding: '6px 8px', fontWeight: '600' }}>
                        {h.receipt_type === 'donation' ? `₹${h.amount?.toLocaleString('en-IN')}` : h.sponsorship_details}
                      </td>
                      <td style={{ padding: '6px 8px', color: '#666' }}>{h.transaction_date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '1rem 1.25rem',
          background: '#fcf8f0',
          borderBottomLeftRadius: '14px',
          borderBottomRightRadius: '14px',
          display: 'flex',
          gap: '0.75rem'
        }}>
          <button 
            onClick={onClose}
            className="btn btn-secondary"
            style={{ flex: 1 }}
          >
            Change Mobile
          </button>

          <button 
            onClick={() => onConfirm(donor)}
            className="btn btn-primary"
            style={{ flex: 2 }}
          >
            <CheckCircle size={18} /> Continue with Existing Donor
          </button>
        </div>
      </div>
    </div>
  );
}
