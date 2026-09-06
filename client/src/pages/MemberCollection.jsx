import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import DonorLookupModal from '../components/DonorLookupModal';
import { PlusCircle, Search, User, Phone, CreditCard, Calendar, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

export default function MemberCollection({ onTransactionCreated }) {
  const { user, token } = useContext(AuthContext);

  const [donorName, setDonorName] = useState('');
  const [mobile, setMobile] = useState('');
  const [receiptType, setReceiptType] = useState('donation'); // 'donation' or 'sponsorship'
  const [amount, setAmount] = useState('');
  const [sponsorshipDetails, setSponsorshipDetails] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [transactionId, setTransactionId] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);

  // Duplicate Donor Lookup state
  const [searchingDonor, setSearchingDonor] = useState(false);
  const [foundDonorData, setFoundDonorData] = useState(null);
  const [showLookupModal, setShowLookupModal] = useState(false);
  const [selectedDonorId, setSelectedDonorId] = useState(null);

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
    if (receiptType === 'donation' && amount) {
      setAmountWords(convertNumberToWords(amount));
    } else {
      setAmountWords('');
    }
  }, [amount, receiptType]);

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
      const data = await res.json();
      if (data.found) {
        setFoundDonorData(data);
        setShowLookupModal(true);
      }
    } catch (err) {
      console.error('Donor search failed', err);
    } finally {
      setSearchingDonor(false);
    }
  };

  const confirmExistingDonor = (donor) => {
    setDonorName(donor.name);
    setSelectedDonorId(donor.id);
    setShowLookupModal(false);
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
        amount: receiptType === 'donation' ? Number(amount) : 0,
        sponsorship_details: receiptType === 'sponsorship' ? sponsorshipDetails : '',
        payment_mode: paymentMode,
        transaction_id: transactionId,
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
      onTransactionCreated(data.transaction.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '650px', margin: '0 auto' }}>
      {/* Duplicate Donor Modal */}
      {showLookupModal && foundDonorData && (
        <DonorLookupModal 
          donorData={foundDonorData}
          onConfirm={confirmExistingDonor}
          onClose={() => setShowLookupModal(false)}
        />
      )}

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <PlusCircle color="#e65100" /> New Collection Entry
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
        {foundDonorData && !showLookupModal && (
          <div className="donor-found-banner">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ color: '#6b0000', fontSize: '0.95rem' }}>✓ Existing Donor Verified</strong>
                <p style={{ fontSize: '0.8rem', color: '#555', margin: '2px 0 0 0' }}>
                  {foundDonorData.donor.name} (Total Past: ₹{foundDonorData.donor.total_amount?.toLocaleString('en-IN')})
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setShowLookupModal(true)}
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
              >
                View History
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Mobile Number & Duplicate Donor Search */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Phone size={18} color="#e65100" /> Mobile Number *
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
              />
              {searchingDonor && (
                <span style={{ position: 'absolute', right: '12px', top: '12px', fontSize: '0.8rem', color: '#e65100' }}>
                  Checking...
                </span>
              )}
            </div>
          </div>

          {/* Donor Name */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={18} color="#e65100" /> Donor / Devotee Name *
            </label>
            <input 
              type="text"
              className="form-control"
              placeholder="Enter full name"
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              required
            />
          </div>

          {/* Receipt Type Toggle Switch */}
          <div className="form-group">
            <label className="form-label">Receipt Type *</label>
            <div className="receipt-type-toggle">
              <button
                type="button"
                className={`toggle-btn ${receiptType === 'donation' ? 'active' : ''}`}
                onClick={() => setReceiptType('donation')}
              >
                ₹ DONATION
              </button>
              <button
                type="button"
                className={`toggle-btn ${receiptType === 'sponsorship' ? 'active' : ''}`}
                onClick={() => setReceiptType('sponsorship')}
              >
                🚩 SPONSORSHIP
              </button>
            </div>
          </div>

          {/* DYNAMIC FIELD SWITCHING */}
          {receiptType === 'donation' ? (
            <div className="form-group" style={{ background: '#fffdf5', padding: '1rem', borderRadius: '10px', border: '1.5px solid #ebd7a3' }}>
              <label className="form-label" style={{ fontSize: '1.05rem', color: '#6b0000' }}>
                Amount ₹ * (Numeric Only)
              </label>
              <input 
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                className="form-control"
                placeholder="e.g. 1500"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
                required={receiptType === 'donation'}
                style={{ fontSize: '1.4rem', fontWeight: '700', color: '#6b0000' }}
              />

              {/* Mobile Quick Amount Selector Buttons */}
              <div className="quick-amounts-grid">
                <button type="button" className="quick-amt-btn" onClick={() => setAmount(prev => String((Number(prev) || 0) + 100))}>+₹100</button>
                <button type="button" className="quick-amt-btn" onClick={() => setAmount(prev => String((Number(prev) || 0) + 500))}>+₹500</button>
                <button type="button" className="quick-amt-btn" onClick={() => setAmount(prev => String((Number(prev) || 0) + 1000))}>+₹1k</button>
                <button type="button" className="quick-amt-btn" onClick={() => setAmount(prev => String((Number(prev) || 0) + 2000))}>+₹2k</button>
                <button type="button" className="quick-amt-btn" onClick={() => setAmount(prev => String((Number(prev) || 0) + 5000))}>+₹5k</button>
              </div>
              {amountWords && (
                <div className="amount-words-box">
                  <strong>Amount in Words:</strong> {amountWords}
                </div>
              )}
            </div>
          ) : (
            <div className="form-group" style={{ background: '#fffdf5', padding: '1rem', borderRadius: '10px', border: '1.5px solid #ebd7a3' }}>
              <label className="form-label" style={{ fontSize: '1.05rem', color: '#2e7d32' }}>
                Sponsorship Details * (Text Input)
              </label>
              <input 
                type="text"
                className="form-control"
                placeholder="e.g. Ganesh Idol / Annadanam / Decoration Sponsorship"
                value={sponsorshipDetails}
                onChange={(e) => setSponsorshipDetails(e.target.value)}
                required={receiptType === 'sponsorship'}
                style={{ fontSize: '1.1rem', fontWeight: '600' }}
              />
              <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>
                Examples: Ganesh Idol Sponsorship, Annadanam Sponsorship, Cultural Program Sponsorship
              </div>
            </div>
          )}

          {/* Payment Mode */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CreditCard size={18} color="#e65100" /> Payment Mode *
            </label>
            <select
              className="form-control"
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
            >
              <option value="Cash">Cash</option>
              <option value="UPI">UPI (PhonePe / Google Pay / Paytm)</option>
              <option value="Bank Transfer">Bank Transfer / NEFT</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Optional Transaction ID & Date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Transaction / Reference ID</label>
              <input 
                type="text"
                className="form-control"
                placeholder="UPI / Ref No. (Optional)"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input 
                type="date"
                className="form-control"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-block btn-lg"
            disabled={submitting}
            style={{ marginTop: '1rem' }}
          >
            <CheckCircle2 size={22} /> {submitting ? 'Generating Receipt...' : 'Save Collection & Print Receipt'}
          </button>
        </form>
      </div>
    </div>
  );
}
