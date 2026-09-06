import React from 'react';
import '../styles/receipt.css';

export default function ReceiptPreview({ transaction, settings, template, amountWords }) {
  if (!transaction || !template) return null;

  const isDonation = transaction.receipt_type === 'donation';
  const logoUrl = settings?.logo || '';
  const photoUrl = settings?.group_photo || '';

  // Get field visibility and label mapping from template config
  const fields = template.fields || [];

  const getFieldConfig = (key) => {
    return fields.find((f) => f.key === key) || { show: true, label: key, fontSize: 14 };
  };

  const borderStyle = {
    borderStyle: template.borders?.style || 'solid',
    borderColor: template.borders?.color || '#D4AF37',
    borderWidth: `${template.borders?.width || 2}px`,
    borderRadius: `${template.borders?.radius || 8}px`
  };

  const headerStyle = {
    textAlign: template.header?.align || 'center',
    backgroundColor: template.header?.bgColor || '#FFF8DC',
    color: template.header?.color || '#8B0000',
    padding: '0.75rem',
    borderRadius: '6px'
  };

  return (
    <div className="receipt-wrapper" style={borderStyle}>
      {/* Header */}
      <div className="receipt-header" style={headerStyle}>
        {/* Logo */}
        {template.logo?.show && logoUrl && logoUrl.trim() !== '' && (
          <div style={{ textAlign: template.logo?.align || 'center' }}>
            <img 
              src={logoUrl} 
              alt="Committee Logo" 
              className="receipt-logo" 
              style={{ maxHeight: `${template.logo?.size || 80}px` }} 
            />
          </div>
        )}

        <h2 className="receipt-committee-title">
          {settings?.committee_name || 'Sri Vinayaka Chavithi Utsava Samithi'}
        </h2>
        <div className="receipt-festival-subtitle">
          {settings?.festival_name || 'Ganesh Chaturthi Utsav'} {settings?.festival_year || '2026'}
        </div>
        <div className="receipt-address">
          {settings?.address}, {settings?.village_city} | Phone: {settings?.contact_number}
        </div>

        {/* Group Photo */}
        {template.groupPhoto?.show && photoUrl && photoUrl.trim() !== '' && (
          <div style={{ textAlign: template.groupPhoto?.align || 'center' }}>
            <img 
              src={photoUrl} 
              alt="Committee Group Photo" 
              className="receipt-group-photo" 
              style={{ maxHeight: `${template.groupPhoto?.size || 140}px` }} 
            />
          </div>
        )}

        <div className="receipt-badge-title">
          {template.title || (isDonation ? 'DONATION RECEIPT' : 'SPONSORSHIP RECEIPT')}
        </div>
      </div>

      {/* Body / Dynamic Fields */}
      <div className="receipt-body">
        {getFieldConfig('receipt_number').show && (
          <div className="receipt-field-row">
            <span className="receipt-field-label">{getFieldConfig('receipt_number').label}:</span>
            <span className="receipt-field-value" style={{ color: '#e65100', fontSize: `${getFieldConfig('receipt_number').fontSize}px` }}>
              {transaction.receipt_number}
            </span>
          </div>
        )}

        {getFieldConfig('transaction_date').show && (
          <div className="receipt-field-row">
            <span className="receipt-field-label">{getFieldConfig('transaction_date').label}:</span>
            <span className="receipt-field-value" style={{ fontSize: `${getFieldConfig('transaction_date').fontSize}px` }}>
              {transaction.transaction_date}
            </span>
          </div>
        )}

        {getFieldConfig('donor_name').show && (
          <div className="receipt-field-row">
            <span className="receipt-field-label">{getFieldConfig('donor_name').label}:</span>
            <span className="receipt-field-value" style={{ fontSize: `${getFieldConfig('donor_name').fontSize}px` }}>
              {transaction.donor_name}
            </span>
          </div>
        )}

        {getFieldConfig('mobile').show && (
          <div className="receipt-field-row">
            <span className="receipt-field-label">{getFieldConfig('mobile').label}:</span>
            <span className="receipt-field-value" style={{ fontSize: `${getFieldConfig('mobile').fontSize}px` }}>
              {transaction.donor_mobile}
            </span>
          </div>
        )}

        {/* Dynamic Amount vs Sponsorship details */}
        {isDonation ? (
          <>
            {getFieldConfig('amount').show && (
              <div className="receipt-field-row" style={{ marginTop: '0.4rem', marginBottom: '0.4rem' }}>
                <span className="receipt-field-label" style={{ fontWeight: '700', fontSize: '1.1rem' }}>
                  {getFieldConfig('amount').label}:
                </span>
                <span className="receipt-field-value highlight-amount">
                  ₹{Number(transaction.amount)?.toLocaleString('en-IN')}
                </span>
              </div>
            )}

            {getFieldConfig('amount_words').show && amountWords && (
              <div className="receipt-words-box">
                {getFieldConfig('amount_words').label}: {amountWords}
              </div>
            )}
          </>
        ) : (
          <>
            {getFieldConfig('sponsorship_details').show && (
              <div className="receipt-field-row" style={{ marginTop: '0.4rem', marginBottom: '0.4rem' }}>
                <span className="receipt-field-label" style={{ fontWeight: '700', fontSize: '1.05rem' }}>
                  {getFieldConfig('sponsorship_details').label}:
                </span>
                <span className="receipt-field-value" style={{ color: '#2e7d32', fontSize: '1.15rem' }}>
                  {transaction.sponsorship_details}
                </span>
              </div>
            )}
          </>
        )}

        {getFieldConfig('payment_mode').show && (
          <div className="receipt-field-row">
            <span className="receipt-field-label">{getFieldConfig('payment_mode').label}:</span>
            <span className="receipt-field-value" style={{ fontSize: `${getFieldConfig('payment_mode').fontSize}px` }}>
              {transaction.payment_mode}
            </span>
          </div>
        )}

        {getFieldConfig('transaction_id').show && transaction.transaction_id && (
          <div className="receipt-field-row">
            <span className="receipt-field-label">{getFieldConfig('transaction_id').label}:</span>
            <span className="receipt-field-value" style={{ fontSize: `${getFieldConfig('transaction_id').fontSize}px` }}>
              {transaction.transaction_id}
            </span>
          </div>
        )}

        {getFieldConfig('collected_by').show && (
          <div className="receipt-field-row">
            <span className="receipt-field-label">{getFieldConfig('collected_by').label}:</span>
            <span className="receipt-field-value" style={{ fontSize: `${getFieldConfig('collected_by').fontSize}px` }}>
              {transaction.collected_by}
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="receipt-footer">
        <div className="receipt-thankyou">
          {template.thankYouMessage || settings?.thank_you_message}
        </div>
        <div className="receipt-footer-text">
          {template.footerMessage || settings?.footer_message}
        </div>
      </div>
    </div>
  );
}
