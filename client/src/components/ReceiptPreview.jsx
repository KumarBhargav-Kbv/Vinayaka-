import React from 'react';
import '../styles/receipt.css';

export default function ReceiptPreview({ transaction, settings, template, amountWords }) {
  if (!transaction || !template) return null;

  const isDonation = transaction.receipt_type === 'donation';
  
  // Extract images
  const logoUrl = settings?.logo?.url || settings?.logo || '';
  const photoUrl = settings?.group_photo?.url || settings?.group_photo || '';

  const donorName = transaction.donor?.name || transaction.donor_name || 'Valued Devotee';
  const donorMobile = transaction.donor?.mobile || transaction.donor_mobile || transaction.mobile || '';
  const collectedBy = transaction.collected_by_name || transaction.collected_by || 'Committee Member';
  const txDate = transaction.transaction_date ? new Date(transaction.transaction_date).toLocaleDateString() : new Date().toLocaleDateString();
  const words = amountWords || transaction.amount_in_words || '';

  // Template design properties
  const design = template.design || {};
  const fields = template.fields || [];

  const getFieldConfig = (key) => {
    const f = fields.find((item) => item.key === key);
    if (!f) return { visible: true, label: key, font_size: 14, bold: false };
    return {
      visible: f.visible !== false && f.show !== false,
      label: f.label || key,
      font_size: f.font_size || f.fontSize || 14,
      bold: !!f.bold
    };
  };

  const borderStyle = {
    borderStyle: design.border?.style || 'solid',
    borderColor: design.border?.color || '#D4AF37',
    borderWidth: `${design.border?.width || 2}px`,
    borderRadius: `${design.border?.radius || 8}px`,
    backgroundColor: design.background?.value || '#FFFDF5'
  };

  return (
    <div className="receipt-wrapper" style={borderStyle}>
      {/* Header */}
      <div className="receipt-header" style={{ textAlign: design.header?.alignment || 'center', padding: '1rem', background: '#FFF8DC', borderRadius: '6px' }}>
        {/* Logo */}
        {design.logo?.enabled !== false && logoUrl && (
          <div style={{ textAlign: design.logo?.position || 'center', marginBottom: '8px' }}>
            <img 
              src={logoUrl} 
              alt="Logo" 
              className="receipt-logo" 
              style={{ maxHeight: `${design.logo?.height || 80}px`, maxWidth: `${design.logo?.width || 120}px`, objectFit: 'contain' }} 
            />
          </div>
        )}

        <h2 className="receipt-committee-title" style={{ margin: '0 0 4px 0', color: '#8b0000', fontFamily: 'Cinzel, serif' }}>
          {settings?.committee_name || 'Sri Vinayaka Chavithi Utsava Samithi'}
        </h2>
        <div className="receipt-festival-subtitle" style={{ fontWeight: 600, color: '#555' }}>
          {settings?.festival_name || 'Ganesh Chaturthi Utsav'} ({settings?.festival_year || '2026'})
        </div>
        <div className="receipt-address" style={{ fontSize: '0.85rem', color: '#666', marginTop: '2px' }}>
          {settings?.address}, {settings?.village_city} | Contact: {settings?.contact_number}
        </div>

        {/* Group Photo */}
        {design.group_photo?.enabled !== false && photoUrl && (
          <div style={{ textAlign: design.group_photo?.position || 'center', margin: '8px 0' }}>
            <img 
              src={photoUrl} 
              alt="Group Photo" 
              className="receipt-group-photo" 
              style={{ maxHeight: `${design.group_photo?.height || 90}px`, maxWidth: `${design.group_photo?.width || 200}px`, objectFit: 'cover', borderRadius: '4px' }} 
            />
          </div>
        )}

        <div className="receipt-badge-title" style={{ marginTop: '10px', background: '#8b0000', color: '#fff', padding: '4px 12px', borderRadius: '20px', display: 'inline-block', fontWeight: 'bold', fontSize: '0.9rem' }}>
          {template.template_name || (isDonation ? 'DONATION RECEIPT' : 'SPONSORSHIP RECEIPT')}
        </div>
      </div>

      {/* Body / Fields */}
      <div className="receipt-body" style={{ padding: '1.2rem' }}>
        {getFieldConfig('receipt_number').visible && (
          <div className="receipt-field-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px dashed #eee', paddingBottom: '4px' }}>
            <span className="receipt-field-label" style={{ color: '#555' }}>{getFieldConfig('receipt_number').label}:</span>
            <span className="receipt-field-value" style={{ color: '#8b0000', fontWeight: 'bold', fontSize: `${getFieldConfig('receipt_number').font_size}px` }}>
              {transaction.receipt_number}
            </span>
          </div>
        )}

        {getFieldConfig('transaction_date').visible && (
          <div className="receipt-field-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px dashed #eee', paddingBottom: '4px' }}>
            <span className="receipt-field-label" style={{ color: '#555' }}>{getFieldConfig('transaction_date').label}:</span>
            <span className="receipt-field-value" style={{ fontSize: `${getFieldConfig('transaction_date').font_size}px` }}>
              {txDate}
            </span>
          </div>
        )}

        {getFieldConfig('donor_name').visible && (
          <div className="receipt-field-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px dashed #eee', paddingBottom: '4px' }}>
            <span className="receipt-field-label" style={{ color: '#555' }}>{getFieldConfig('donor_name').label}:</span>
            <span className="receipt-field-value" style={{ fontWeight: 'bold', fontSize: `${getFieldConfig('donor_name').font_size}px` }}>
              {donorName}
            </span>
          </div>
        )}

        {getFieldConfig('mobile').visible && donorMobile && (
          <div className="receipt-field-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px dashed #eee', paddingBottom: '4px' }}>
            <span className="receipt-field-label" style={{ color: '#555' }}>{getFieldConfig('mobile').label}:</span>
            <span className="receipt-field-value" style={{ fontSize: `${getFieldConfig('mobile').font_size}px` }}>
              {donorMobile}
            </span>
          </div>
        )}

        {/* Sponsorship category & details */}
        {!isDonation && (
          <>
            {getFieldConfig('sponsorship_category').visible && transaction.sponsorship_category && (
              <div className="receipt-field-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px dashed #eee', paddingBottom: '4px' }}>
                <span className="receipt-field-label" style={{ color: '#555' }}>{getFieldConfig('sponsorship_category').label}:</span>
                <span className="receipt-field-value" style={{ fontWeight: 'bold', color: '#2e7d32', fontSize: `${getFieldConfig('sponsorship_category').font_size}px` }}>
                  {transaction.sponsorship_category}
                </span>
              </div>
            )}

            {getFieldConfig('sponsorship_details').visible && transaction.sponsorship_details && (
              <div className="receipt-field-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px dashed #eee', paddingBottom: '4px' }}>
                <span className="receipt-field-label" style={{ color: '#555' }}>{getFieldConfig('sponsorship_details').label}:</span>
                <span className="receipt-field-value" style={{ fontSize: `${getFieldConfig('sponsorship_details').font_size}px` }}>
                  {transaction.sponsorship_details}
                </span>
              </div>
            )}
          </>
        )}

        {/* Amount */}
        {getFieldConfig('amount').visible && (
          <div className="receipt-field-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', background: '#fff8e7', padding: '8px', borderRadius: '6px' }}>
            <span className="receipt-field-label" style={{ fontWeight: 'bold', color: '#8b0000' }}>{getFieldConfig('amount').label}:</span>
            <span className="receipt-field-value" style={{ fontWeight: 'bold', color: '#8b0000', fontSize: '1.2rem' }}>
              ₹{Number(transaction.amount)?.toLocaleString('en-IN')}
            </span>
          </div>
        )}

        {getFieldConfig('amount_in_words').visible && words && (
          <div style={{ fontStyle: 'italic', color: '#666', fontSize: '0.85rem', marginBottom: '10px', padding: '4px 8px', background: '#f9f9f9', borderRadius: '4px' }}>
            <strong>In Words:</strong> {words}
          </div>
        )}

        {getFieldConfig('payment_mode').visible && (
          <div className="receipt-field-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span className="receipt-field-label" style={{ color: '#555' }}>{getFieldConfig('payment_mode').label}:</span>
            <span className="receipt-field-value" style={{ textTransform: 'uppercase', fontSize: `${getFieldConfig('payment_mode').font_size}px` }}>
              {transaction.payment_mode}
            </span>
          </div>
        )}

        {getFieldConfig('payment_transaction_id').visible && transaction.payment_transaction_id && (
          <div className="receipt-field-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span className="receipt-field-label" style={{ color: '#555' }}>{getFieldConfig('payment_transaction_id').label}:</span>
            <span className="receipt-field-value" style={{ fontSize: `${getFieldConfig('payment_transaction_id').font_size}px` }}>
              {transaction.payment_transaction_id}
            </span>
          </div>
        )}

        {getFieldConfig('collected_by_name').visible && (
          <div className="receipt-field-row" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', paddingTop: '6px', borderTop: '1px dashed #ccc' }}>
            <span className="receipt-field-label" style={{ color: '#666', fontSize: '0.85rem' }}>{getFieldConfig('collected_by_name').label}:</span>
            <span className="receipt-field-value" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
              {collectedBy}
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="receipt-footer" style={{ padding: '1rem', background: '#fff8dc', textAlign: 'center', borderTop: '1px solid #ebd7a3', borderRadius: '0 0 6px 6px' }}>
        <div style={{ fontWeight: 'bold', color: '#8b0000', fontSize: '0.95rem', marginBottom: '4px' }}>
          {settings?.thank_you_message || 'May Lord Ganesha Bless You & Your Family!'}
        </div>
        <div style={{ fontSize: '0.75rem', color: '#666' }}>
          {settings?.footer_message || 'This is an official computer-generated receipt.'}
        </div>
      </div>
    </div>
  );
}
