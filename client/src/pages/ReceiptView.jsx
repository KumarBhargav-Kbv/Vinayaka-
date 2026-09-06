import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import ReceiptPreview from '../components/ReceiptPreview';
import { Printer, Share2, PlusCircle, RotateCcw, CheckCircle, AlertTriangle } from 'lucide-react';

export default function ReceiptView({ transactionId, onNewTransaction }) {
  const { token } = useContext(AuthContext);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [waSending, setWaSending] = useState(false);
  const [waStatus, setWaStatus] = useState('Pending');

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
      if (result.transaction?.whatsapp_status) {
        setWaStatus(result.transaction.whatsapp_status);
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
      const res = await fetch(`/api/whatsapp/retry/${transactionId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (res.ok && result.waUrl) {
        setWaStatus('Sent');
        // Open WhatsApp web/app
        window.open(result.waUrl, '_blank');
      } else {
        throw new Error('Failed to generate WhatsApp link');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setWaSending(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem', color: '#6b0000', fontWeight: '700' }}>Loading Receipt...</div>;
  }

  if (error || !data) {
    return (
      <div className="card" style={{ maxWidth: '500px', margin: '2rem auto', textAlign: 'center' }}>
        <p style={{ color: '#c62828', fontWeight: '600' }}>⚠️ {error || 'Receipt not found'}</p>
        <button onClick={onNewTransaction} className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Back to New Collection
        </button>
      </div>
    );
  }

  const { transaction, settings, template, amount_words } = data;

  return (
    <div style={{ maxWidth: '650px', margin: '0 auto' }}>
      {/* Top Bar Status */}
      <div style={{
        background: '#fff8e7',
        border: '1.5px solid #d4af37',
        borderRadius: '12px',
        padding: '0.75rem 1rem',
        marginBottom: '1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle color="#2e7d32" size={20} />
          <span style={{ fontWeight: '700', color: '#6b0000', fontSize: '0.95rem' }}>
            Receipt Generated ({transaction.receipt_number})
          </span>
        </div>
        <span className={`badge ${waStatus === 'Sent' || waStatus === 'Delivered' ? 'badge-success' : 'badge-warning'}`}>
          WhatsApp: {waStatus}
        </span>
      </div>

      {/* Actual Customized Receipt Component */}
      <ReceiptPreview 
        transaction={transaction}
        settings={settings}
        template={template}
        amountWords={amount_words}
      />

      {/* Action Buttons */}
      <div className="receipt-actions card" style={{ marginTop: '1.25rem' }}>
        <button onClick={handleSendWhatsApp} className="btn btn-success" disabled={waSending}>
          <Share2 size={18} /> {waSending ? 'Opening WhatsApp...' : 'Send WhatsApp'}
        </button>

        <button onClick={handlePrint} className="btn btn-primary">
          <Printer size={18} /> Print / Download
        </button>

        {waStatus === 'Failed' && (
          <button onClick={handleSendWhatsApp} className="btn btn-secondary">
            <RotateCcw size={18} /> Retry WhatsApp
          </button>
        )}

        <button onClick={onNewTransaction} className="btn btn-secondary">
          <PlusCircle size={18} /> New Collection
        </button>
      </div>
    </div>
  );
}
