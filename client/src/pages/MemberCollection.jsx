import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import DonorLookupModal from '../components/DonorLookupModal';
import { PlusCircle, User, Phone, CreditCard, CheckCircle2 } from 'lucide-react';

export default function MemberCollection({ onTransactionCreated }) {
  const { user, token } = useContext(AuthContext);

  const [donorName, setDonorName] = useState('');
  const [mobile, setMobile] = useState('');
  const [receiptType, setReceiptType] = useState('donation'); // 'donation' or 'sponsorship'
  const [amount, setAmount] = useState('');
  const [sponsorshipCategory, setSponsorshipCategory] = useState('Annadanam Sponsorship');
  const [sponsorshipDetails, setSponsorshipDetails] = useState('');
  const [paymentMode, setPaymentMode] = useState('cash');
  const [transactionId, setTransactionId] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);

  // Duplicate Donor Lookup state
  const [searchingDonor, setSearchingDonor] = useState(false);
  const [foundDonorData, setFoundDonorData] = useState(null);
  const [showLookupModal, setShowLookupModal] = useState(false);

  const [amountWords, setAmountWords] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Handle Indian currency to words conversion live on client
  const convertNumberToWords = (num) => {
    num = Math.floor(Number(num));
    if (!num || isNaN(num) || num <= 0) return '';
    const single = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const double = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const convertTwo = (n) => {
      if (n < 10) return single[n];
      if (n >= 10 && n < 20) return double[n - 10];
      return (tens[Math.floor(n / 10)] + (n % 10 ? ' ' + single[n % 10] : '')).trim();
    };

    const convertThree = (n) => {
      const h = Math.floor(n / 100);
      const r = n % 100;
      let s = '';
      if (h > 0) s += single[h] + ' Hundred';
      if (r > 0) {
        if (s) s += ' ';
        s += convertTwo(r);
      }
      return s;
    };

    let res = '';
    const cr = Math.floor(num / 10000000);
    let rem = num % 10000000;
    const lk = Math.floor(rem / 100000);
    rem = rem % 100000;
    const th = Math.floor(rem / 1000);
    rem = rem % 1000;

    if (cr > 0) res += convertTwo(cr) + ' Crore ';
    if (lk > 0) res += convertTwo(lk) + ' Lakh ';
    if (th > 0) res += convertTwo(th) + ' Thousand ';
    if (rem > 0) res += convertThree(rem);

    return (res.trim() + ' Rupees Only').replace(/\s+/g, ' ');
  };

  useEffect(() => {
    if (amount) {
      setAmountWords(convertNumberToWords(amount));
    } else {
      setAmountWords('');
    }
  }, [amount]);

  // Automatic duplicate donor check when mobile reaches 10 digits
  const handleMobileChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
    setMobile(val);

    if (val.length === 10) {
      triggerDonorCheck(val);
    } else {
      setFoundDonorData(null);
      setShowLookupModal(false);
    }
  };

  const triggerDonorCheck = async (mob) => {
    setSearchingDonor(true);
    try {
      const res = await fetch(`/api/donors/search?mobile=${mob}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setFoundDonorData(data);
          if (!donorName) setDonorName(data.name);
        }
      }
    } catch (err) {
      console.error('Donor search failed', err);
    } finally {
      setSearchingDonor(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const payload = {
        donor_name: donorName,
        mobile,
        receipt_type: receiptType,
        amount: Number(amount),
        sponsorship_category: receiptType === 'sponsorship' ? sponsorshipCategory : '',
        sponsorship_details: receiptType === 'sponsorship' ? sponsorshipDetails : '',
        payment_mode: paymentMode,
        payment_transaction_id: transactionId,
        transaction_date: transactionDate
      };

      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to record transaction');
      }

      // Success - Trigger view receipt
      onTransactionCreated(data.transaction._id || data.transaction.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '650px', margin: '0 auto', padding: '16px' }}>
      {/* Duplicate Donor Modal */}
      {showLookupModal && foundDonorData && (
        <DonorLookupModal 
          donorData={foundDonorData}
          onConfirm={(d) => { setDonorName(d.name); setShowLookupModal(false); }}
          onClose={() => setShowLookupModal(false)}
        />
      )}

      <div className="card" style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
          <h2 style={{ color: '#8b0000', margin: 0, fontFamily: 'Cinzel, serif', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PlusCircle color="#8b0000" /> New Collection Entry
          </h2>
          <span style={{ fontSize: '0.85rem', color: '#665647', background: '#fff8e7', padding: '4px 10px', borderRadius: '12px', border: '1px solid #ebd7a3' }}>
            Collected By: <strong>{user?.name}</strong>
          </span>
        </div>

        {error && (
          <div style={{ background: '#ffebee', color: '#c62828', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontWeight: '600' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Existing Donor Banner Notification */}
        {foundDonorData && (
          <div style={{ background: '#e8f5e9', border: '1px solid #c8e6c9', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ color: '#2e7d32', fontSize: '0.95rem' }}>✓ EXISTING DONOR FOUND</strong>
                <p style={{ fontSize: '0.85rem', color: '#333', margin: '2px 0 0 0' }}>
                  {foundDonorData.name} ({foundDonorData.mobile})
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Mobile Number & Search */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label" style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>
              <Phone size={16} color="#8b0000" style={{ display: 'inline', marginRight: '4px' }} /> Mobile Number *
            </label>
            <div style={{ position: 'relative' }}>
              <input 
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                className="form-control"
                placeholder="10-digit mobile number"
                value={mobile}
                onChange={handleMobileChange}
                required
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1.1rem' }}
              />
              {searchingDonor && (
                <span style={{ position: 'absolute', right: '12px', top: '12px', fontSize: '0.8rem', color: '#8b0000' }}>
                  Searching...
                </span>
              )}
            </div>
          </div>

          {/* Donor Name */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label" style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>
              <User size={16} color="#8b0000" style={{ display: 'inline', marginRight: '4px' }} /> Donor / Devotee Name *
            </label>
            <input 
              type="text"
              className="form-control"
              placeholder="Enter devotee name"
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              required
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1rem' }}
            />
          </div>

          {/* Receipt Type Toggle Switch */}
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label" style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>Receipt Type *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: receiptType === 'donation' ? '2px solid #8b0000' : '1px solid #ccc',
                  background: receiptType === 'donation' ? '#8b0000' : '#f9f9f9',
                  color: receiptType === 'donation' ? '#fff' : '#333',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
                onClick={() => setReceiptType('donation')}
              >
                ₹ DONATION
              </button>
              <button
                type="button"
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: receiptType === 'sponsorship' ? '2px solid #8b0000' : '1px solid #ccc',
                  background: receiptType === 'sponsorship' ? '#8b0000' : '#f9f9f9',
                  color: receiptType === 'sponsorship' ? '#fff' : '#333',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
                onClick={() => setReceiptType('sponsorship')}
              >
                🚩 SPONSORSHIP
              </button>
            </div>
          </div>

          {/* DYNAMIC FIELD SWITCHING */}
          {receiptType === 'sponsorship' && (
            <>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>Sponsorship Category *</label>
                <select
                  value={sponsorshipCategory}
                  onChange={(e) => setSponsorshipCategory(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1rem' }}
                >
                  <option value="Annadanam Sponsorship">Annadanam Sponsorship</option>
                  <option value="Ganesh Idol Sponsorship">Ganesh Idol Sponsorship</option>
                  <option value="Decoration Sponsorship">Decoration Sponsorship</option>
                  <option value="Cultural Program Sponsorship">Cultural Program Sponsorship</option>
                  <option value="Pooja / Archana Sponsorship">Pooja / Archana Sponsorship</option>
                  <option value="Other Sponsorship">Other Sponsorship</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>Sponsorship Details</label>
                <input 
                  type="text"
                  placeholder="e.g. 500 Food Packets / Flower Garland Decoration"
                  value={sponsorshipDetails}
                  onChange={(e) => setSponsorshipDetails(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1rem' }}
                />
              </div>
            </>
          )}

          {/* Amount Field */}
          <div className="form-group" style={{ background: '#fffdf5', padding: '16px', borderRadius: '10px', border: '1.5px solid #ebd7a3', marginBottom: '16px' }}>
            <label className="form-label" style={{ display: 'block', fontWeight: '600', color: '#8b0000', marginBottom: '6px', fontSize: '1.05rem' }}>
              Collection Amount ₹ * (Numbers Only)
            </label>
            <input 
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              className="form-control"
              placeholder="e.g. 1500"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
              required
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d4af37', fontSize: '1.4rem', fontWeight: '700', color: '#8b0000' }}
            />

            {/* Quick amount shortcuts */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
              {[500, 1000, 2000, 5000, 10000].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(String((Number(amount) || 0) + val))}
                  style={{ background: '#fff', border: '1px solid #d4af37', color: '#8b0000', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                >
                  +₹{val}
                </button>
              ))}
            </div>

            {amountWords && (
              <div style={{ marginTop: '10px', padding: '8px', background: '#fff8e7', borderRadius: '6px', color: '#8b0000', fontSize: '0.9rem', fontWeight: 600 }}>
                Amount in Words: {amountWords}
              </div>
            )}
          </div>

          {/* Payment Mode */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label" style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>
              <CreditCard size={16} color="#8b0000" style={{ display: 'inline', marginRight: '4px' }} /> Payment Mode *
            </label>
            <select
              className="form-control"
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1rem' }}
            >
              <option value="cash">Cash</option>
              <option value="upi">UPI (PhonePe / Google Pay / Paytm)</option>
              <option value="bank_transfer">Bank Transfer / NEFT</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Transaction ID & Date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>Payment Transaction ID</label>
              <input 
                type="text"
                className="form-control"
                placeholder="UPI / Ref No."
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>Date</label>
              <input 
                type="date"
                className="form-control"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={submitting}
            style={{
              width: '100%',
              background: '#8b0000',
              color: '#fff',
              border: 'none',
              padding: '14px',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <CheckCircle2 size={20} /> {submitting ? 'Generating Receipt...' : 'Save Collection & Generate Receipt'}
          </button>
        </form>
      </div>
    </div>
  );
}
