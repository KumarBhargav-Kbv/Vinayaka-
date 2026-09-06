import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import ReceiptPreview from '../components/ReceiptPreview';
import { Palette, Save, Eye, Check, Sliders, Type, Layout, RefreshCw } from 'lucide-react';

export default function AdminReceiptDesigner() {
  const { token } = useContext(AuthContext);

  const [templateType, setTemplateType] = useState('donation'); // 'donation' or 'sponsorship'
  const [templateData, setTemplateData] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');

  // Sample transaction for live preview
  const sampleTransaction = {
    id: 999,
    receipt_number: 'VC-0001',
    receipt_type: templateType,
    donor_name: 'Sri Krishna Varma',
    donor_mobile: '9876543210',
    amount: 5000,
    sponsorship_details: 'Ganesh Idol Grand Sponsorship',
    payment_mode: 'UPI',
    transaction_id: 'UPI1234567890',
    transaction_date: new Date().toISOString().split('T')[0],
    collected_by: 'Ramesh (Committee Member)'
  };
  const sampleAmountWords = 'Five Thousand Rupees Only';

  useEffect(() => {
    fetchSettingsAndTemplate();
  }, [templateType]);

  const fetchSettingsAndTemplate = async () => {
    setLoading(true);
    try {
      // 1. Committee settings
      const setRes = await fetch('/api/settings');
      const setData = await setRes.json();
      setSettings(setData);

      // 2. Template
      const tRes = await fetch(`/api/templates/${templateType}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const tData = await tRes.json();
      if (tRes.ok) {
        setTemplateData(tData.template_data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateData) return;
    setSaving(true);
    setSaveSuccess('');
    try {
      const res = await fetch(`/api/templates/${templateType}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ template_data: templateData })
      });
      if (res.ok) {
        setSaveSuccess(`${templateType.toUpperCase()} Receipt Template saved successfully!`);
        setTimeout(() => setSaveSuccess(''), 3000);
      }
    } catch (err) {
      alert('Save failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Helper mutators for deep state updates
  const updateLogo = (key, val) => {
    setTemplateData(prev => ({
      ...prev,
      logo: { ...prev.logo, [key]: val }
    }));
  };

  const updateGroupPhoto = (key, val) => {
    setTemplateData(prev => ({
      ...prev,
      groupPhoto: { ...prev.groupPhoto, [key]: val }
    }));
  };

  const updateHeader = (key, val) => {
    setTemplateData(prev => ({
      ...prev,
      header: { ...prev.header, [key]: val }
    }));
  };

  const updateBorders = (key, val) => {
    setTemplateData(prev => ({
      ...prev,
      borders: { ...prev.borders, [key]: val }
    }));
  };

  const updateField = (index, key, val) => {
    setTemplateData(prev => {
      const newFields = [...prev.fields];
      newFields[index] = { ...newFields[index], [key]: val };
      return { ...prev, fields: newFields };
    });
  };

  if (loading || !templateData) {
    return <div style={{ textAlign: 'center', padding: '3rem', color: '#6b0000', fontWeight: '700' }}>Loading Receipt Designer...</div>;
  }

  return (
    <div>
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div className="card-header">
          <h2 className="card-title">
            <Palette color="#e65100" /> Admin Receipt Designer Studio
          </h2>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {saveSuccess && (
              <span style={{ color: '#2e7d32', fontWeight: '700', fontSize: '0.85rem' }}>
                ✓ {saveSuccess}
              </span>
            )}
            <button onClick={handleSaveTemplate} className="btn btn-primary" disabled={saving}>
              <Save size={18} /> {saving ? 'Saving...' : 'Save Template Design'}
            </button>
          </div>
        </div>

        {/* Template Selector Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <button
            className={`btn ${templateType === 'donation' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTemplateType('donation')}
          >
            Donation Receipt Template
          </button>
          <button
            className={`btn ${templateType === 'sponsorship' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTemplateType('sponsorship')}
          >
            Sponsorship Receipt Template
          </button>
        </div>
      </div>

      {/* Side-by-Side Editor & Live Preview Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Editor Controls Column */}
        <div className="card" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
          <h3 style={{ color: '#6b0000', borderBottom: '2px solid #ebd7a3', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
            ⚙️ Customize Controls
          </h3>

          {/* Title */}
          <div className="form-group">
            <label className="form-label">Receipt Title</label>
            <input 
              type="text" 
              className="form-control"
              value={templateData.title || ''}
              onChange={(e) => setTemplateData({ ...templateData, title: e.target.value })}
            />
          </div>

          {/* Logo Options */}
          <div style={{ background: '#fff8e7', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #ebd7a3' }}>
            <h4 style={{ fontSize: '0.9rem', color: '#6b0000', marginBottom: '0.5rem' }}>Logo Formatting</h4>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                <input 
                  type="checkbox" 
                  checked={templateData.logo?.show || false} 
                  onChange={(e) => updateLogo('show', e.target.checked)} 
                /> Show Logo
              </label>
              <select 
                className="form-control" 
                style={{ width: 'auto', padding: '0.3rem' }}
                value={templateData.logo?.align || 'center'}
                onChange={(e) => updateLogo('align', e.target.value)}
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
            <label style={{ fontSize: '0.8rem', color: '#555' }}>Logo Height (px): {templateData.logo?.size || 80}px</label>
            <input 
              type="range" min="40" max="150" 
              value={templateData.logo?.size || 80} 
              onChange={(e) => updateLogo('size', Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          {/* Group Photo Options */}
          <div style={{ background: '#fff8e7', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #ebd7a3' }}>
            <h4 style={{ fontSize: '0.9rem', color: '#6b0000', marginBottom: '0.5rem' }}>Committee Group Photo Formatting</h4>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                <input 
                  type="checkbox" 
                  checked={templateData.groupPhoto?.show || false} 
                  onChange={(e) => updateGroupPhoto('show', e.target.checked)} 
                /> Show Group Photo
              </label>
              <select 
                className="form-control" 
                style={{ width: 'auto', padding: '0.3rem' }}
                value={templateData.groupPhoto?.align || 'center'}
                onChange={(e) => updateGroupPhoto('align', e.target.value)}
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
            <label style={{ fontSize: '0.8rem', color: '#555' }}>Photo Height (px): {templateData.groupPhoto?.size || 140}px</label>
            <input 
              type="range" min="60" max="250" 
              value={templateData.groupPhoto?.size || 140} 
              onChange={(e) => updateGroupPhoto('size', Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          {/* Borders & Colors */}
          <div style={{ background: '#fff8e7', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #ebd7a3' }}>
            <h4 style={{ fontSize: '0.9rem', color: '#6b0000', marginBottom: '0.5rem' }}>Borders & Accent Colors</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem' }}>Border Color</label>
                <input type="color" value={templateData.borders?.color || '#D4AF37'} onChange={(e) => updateBorders('color', e.target.value)} style={{ width: '100%', height: '35px' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem' }}>Header BG Color</label>
                <input type="color" value={templateData.header?.bgColor || '#FFF8DC'} onChange={(e) => updateHeader('bgColor', e.target.value)} style={{ width: '100%', height: '35px' }} />
              </div>
            </div>
          </div>

          {/* Field Renaming & Show/Hide */}
          <h4 style={{ color: '#6b0000', margin: '1rem 0 0.5rem 0' }}>Fields Customization</h4>
          {templateData.fields?.map((field, idx) => (
            <div key={field.key} style={{ background: '#fafafa', border: '1px solid #e0e0e0', padding: '0.5rem 0.75rem', borderRadius: '6px', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#444' }}>
                  <input 
                    type="checkbox" 
                    checked={field.show} 
                    onChange={(e) => updateField(idx, 'show', e.target.checked)} 
                  /> Show {field.key}
                </label>
                <span style={{ fontSize: '0.75rem', color: '#777' }}>Font: {field.fontSize}px</span>
              </div>

              {field.show && (
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.5rem', marginTop: '0.4rem' }}>
                  <input 
                    type="text"
                    className="form-control"
                    style={{ padding: '0.3rem', fontSize: '0.85rem' }}
                    value={field.label}
                    onChange={(e) => updateField(idx, 'label', e.target.value)}
                    placeholder="Custom Field Label"
                  />
                  <input 
                    type="number"
                    className="form-control"
                    style={{ padding: '0.3rem', fontSize: '0.85rem' }}
                    value={field.fontSize}
                    onChange={(e) => updateField(idx, 'fontSize', Number(e.target.value))}
                    min="10" max="24"
                  />
                </div>
              )}
            </div>
          ))}

          {/* Messages */}
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label">Thank You Message</label>
            <input 
              type="text" 
              className="form-control"
              value={templateData.thankYouMessage || ''}
              onChange={(e) => setTemplateData({ ...templateData, thankYouMessage: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Footer Note</label>
            <input 
              type="text" 
              className="form-control"
              value={templateData.footerMessage || ''}
              onChange={(e) => setTemplateData({ ...templateData, footerMessage: e.target.value })}
            />
          </div>
        </div>

        {/* Live Preview Column */}
        <div>
          <div style={{ background: '#fff8e7', border: '1.5px solid #d4af37', padding: '0.6rem 1rem', borderRadius: '10px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Eye color="#e65100" size={20} />
            <strong style={{ color: '#6b0000' }}>LIVE RECEIPT PREVIEW (Updates Realtime)</strong>
          </div>

          <ReceiptPreview 
            transaction={sampleTransaction}
            settings={settings}
            template={templateData}
            amountWords={sampleAmountWords}
          />
        </div>
      </div>
    </div>
  );
}
