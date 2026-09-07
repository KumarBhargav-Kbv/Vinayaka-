import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import ReceiptPreview from '../components/ReceiptPreview';
import { Printer, Share2, PlusCircle, RotateCcw, CheckCircle } from 'lucide-react';

export default function ReceiptView({ transactionId, onNewTransaction }) {
  const { token } = useContext(AuthContext);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [waSending, setWaSending] = useState(false);
  const [waStatus, setWaStatus] = useState('pending');

  useEffect(() => {
    if (!transactionId) return;
    fetchReceiptData();
  }, [transactionId]);

  const fetchReceiptData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/transactions/${transactionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to fetch receipt');

      setData(result);
      if (result.delivery?.status) {
        setWaStatus(result.delivery.status);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendWhatsApp = async () => {
    if (!data?.transaction) return;
    setWaSending(true);

    try {
      const res = await fetch(`/api/whatsapp/retry/${data.delivery?._id || transactionId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (res.ok) {
        setWaStatus('sent');

        const tx = data.transaction;
        const donor = data.donor || tx.donor_id || {};
        const settings = data.settings || {};
        const mobile = donor.mobile || tx.mobile || '';

        const msg = encodeURIComponent(
          `🪔 *${settings.committee_name || 'Sri Vinayaka Chavithi Utsava Samithi'}*\n` +
          `*Official Receipt No:* ${tx.receipt_number}\n` +
          `*Devotee Name:* ${donor.name || tx.collected_by_name}\n` +
          `*Type:* ${tx.receipt_type === 'donation' ? 'Donation' : 'Sponsorship'}\n` +
          `*Amount:* ₹${tx.amount?.toLocaleString('en-IN')}\n` +
          `*Payment Mode:* ${tx.payment_mode?.toUpperCase()}\n\n` +
          `${settings.thank_you_message || 'May Lord Ganesha bless you & your family!'}`
        );

        if (mobile) {
          const cleanMob = mobile.replace(/\D/g, '');
          const waMob = cleanMob.length === 10 ? `91${cleanMob}` : cleanMob;
          window.open(`https://api.whatsapp.com/send?phone=${waMob}&text=${msg}`, '_blank');
        }
      } else {
        throw new Error('Failed to update WhatsApp delivery status');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setWaSending(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem', color: '#8b0000', fontWeight: '700' }}>Loading Receipt...</div>;
  }

  if (error || !data) {
    return (
      <div className="card" style={{ maxWidth: '500px', margin: '2rem auto', textAlign: 'center', padding: '24px' }}>
        <p style={{ color: '#c62828', fontWeight: '600' }}>⚠️ {error || 'Receipt not found'}</p>
        <button onClick={onNewTransaction} className="btn btn-primary" style={{ marginTop: '1rem', background: '#8b0000', color: '#fff', padding: '10px 16px', borderRadius: '6px', border: 'none' }}>
          Back to New Collection
        </button>
      </div>
    );
  }

  const { transaction, settings, template } = data;

  return (
    <div style={{ maxWidth: '650px', margin: '0 auto', padding: '16px' }}>
      {/* Top Bar Status */}
      <div style={{
        background: '#fff8e7',
        border: '1.5px solid #d4af37',
        borderRadius: '12px',
        padding: '12px 16px',
        marginBottom: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CheckCircle color="#2e7d32" size={20} />
          <span style={{ fontWeight: '700', color: '#8b0000', fontSize: '0.95rem' }}>
            Receipt Generated ({transaction.receipt_number})
          </span>
        </div>
        <span style={{
          background: waStatus === 'sent' || waStatus === 'delivered' ? '#e8f5e9' : '#fff3e0',
          color: waStatus === 'sent' || waStatus === 'delivered' ? '#2e7d32' : '#e65100',
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '0.8rem',
          fontWeight: 'bold',
          textTransform: 'uppercase'
        }}>
          WhatsApp: {waStatus}
        </span>
      </div>

      {/* Actual Customized Receipt Component */}
      <ReceiptPreview 
        transaction={transaction}
        settings={settings}
        template={template}
        amountWords={transaction.amount_in_words}
      />

      {/* Action Buttons */}
      <div style={{ marginTop: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={handleSendWhatsApp}
          disabled={waSending}
          style={{
            flex: 1,
            background: '#25D366',
            color: '#fff',
            border: 'none',
            padding: '12px',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            minWidth: '140px'
          }}
        >
          <Share2 size={18} /> {waSending ? 'Opening...' : 'Send WhatsApp'}
        </button>

        <button
          onClick={handlePrint}
          style={{
            flex: 1,
            background: '#8b0000',
            color: '#fff',
            border: 'none',
            padding: '12px',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            minWidth: '140px'
          }}
        >
          <Printer size={18} /> Print / Download
        </button>

        {waStatus === 'failed' && (
          <button
            onClick={handleSendWhatsApp}
            style={{
              background: '#f57c00',
              color: '#fff',
              border: 'none',
              padding: '12px',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <RotateCcw size={18} /> Retry WhatsApp
          </button>
        )}

        <button
          onClick={onNewTransaction}
          style={{
            background: '#555',
            color: '#fff',
            border: 'none',
            padding: '12px',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <PlusCircle size={18} /> New Collection
        </button>
      </div>
    </div>
  );
}
