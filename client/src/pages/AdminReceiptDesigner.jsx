import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import ReceiptPreview from '../components/ReceiptPreview';
import { Palette, Save, Eye } from 'lucide-react';

export default function AdminReceiptDesigner() {
  const { token } = useContext(AuthContext);

  const [templateType, setTemplateType] = useState('donation'); // 'donation' or 'sponsorship'
  const [template, setTemplate] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');

  // Sample transaction for live preview
  const sampleTransaction = {
    _id: 'sample_id',
    receipt_number: 'VC-0001',
    receipt_type: templateType,
    donor_name: 'Sri Krishna Varma',
    donor_mobile: '9876543210',
    amount: 5000,
    amount_in_words: 'Five Thousand Rupees Only',
    sponsorship_category: 'Annadanam Sponsorship',
    sponsorship_details: 'Annadanam Food Distribution for 500 Devotees',
    payment_mode: 'upi',
    payment_transaction_id: 'UPI1234567890',
    transaction_date: new Date().toISOString(),
    collected_by_name: 'Ramesh (Committee Member)'
  };

  useEffect(() => {
    fetchSettingsAndTemplate();
  }, [templateType]);

  const fetchSettingsAndTemplate = async () => {
    setLoading(true);
    try {
      // 1. Committee settings
      const setRes = await fetch('/api/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (setRes.ok) {
        const setData = await setRes.json();
        setSettings(setData);
      }

      // 2. Template
      const tRes = await fetch(`/api/templates/${templateType}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (tRes.ok) {
        const tData = await tRes.json();
        setTemplate(tData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!template) return;
    setSaving(true);
    setSaveSuccess('');
    try {
      const res = await fetch(`/api/templates/${templateType}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          template_name: template.template_name,
          design: template.design,
          fields: template.fields
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setTemplate(updated);
        setSaveSuccess(`${templateType.toUpperCase()} Receipt Template (v${updated.version}) saved successfully!`);
        setTimeout(() => setSaveSuccess(''), 4000);
      }
    } catch (err) {
      alert('Save failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (index, key, val) => {
    setTemplate(prev => {
      const newFields = [...prev.fields];
      newFields[index] = { ...newFields[index], [key]: val };
      return { ...prev, fields: newFields };
    });
  };

  const updateDesign = (section, key, val) => {
    setTemplate(prev => ({
      ...prev,
      design: {
        ...prev.design,
        [section]: {
          ...prev.design?.[section],
          [key]: val
        }
      }
    }));
  };

  if (loading || !template) {
    return <div style={{ textAlign: 'center', padding: '3rem', color: '#8b0000', fontWeight: '700' }}>Loading Receipt Designer...</div>;
  }

  return (
    <div style={{ padding: '16px', maxWidth: '1200px', margin: '0 auto' }}>
      <div className="card" style={{ background: '#fff', padding: '20px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <h2 style={{ color: '#8b0000', margin: 0, fontFamily: 'Cinzel, serif', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Palette color="#8b0000" /> Admin Receipt Designer Studio
            </h2>
            <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '0.9rem' }}>
              Customize receipt fields, labels, borders, logo placement & versioning without touching source code.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {saveSuccess && (
              <span style={{ color: '#2e7d32', fontWeight: '700', fontSize: '0.85rem' }}>
                ✓ {saveSuccess}
              </span>
            )}
            <button
              onClick={handleSaveTemplate}
              disabled={saving}
              style={{
                background: '#8b0000',
                color: '#fff',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Save size={18} /> {saving ? 'Saving Design...' : `Save Template (v${template.version || 1})`}
            </button>
          </div>
        </div>

        {/* Template Selector Tabs */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              border: templateType === 'donation' ? '2px solid #8b0000' : '1px solid #ccc',
              background: templateType === 'donation' ? '#8b0000' : '#f9f9f9',
              color: templateType === 'donation' ? '#fff' : '#333',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
            onClick={() => setTemplateType('donation')}
          >
            Donation Receipt Template
          </button>
          <button
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              border: templateType === 'sponsorship' ? '2px solid #8b0000' : '1px solid #ccc',
              background: templateType === 'sponsorship' ? '#8b0000' : '#f9f9f9',
              color: templateType === 'sponsorship' ? '#fff' : '#333',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
            onClick={() => setTemplateType('sponsorship')}
          >
            Sponsorship Receipt Template
          </button>
        </div>
      </div>

      {/* Side-by-Side Editor & Live Preview Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        {/* Editor Controls Column */}
        <div className="card" style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', maxHeight: '85vh', overflowY: 'auto' }}>
          <h3 style={{ color: '#8b0000', borderBottom: '2px solid #ebd7a3', paddingBottom: '8px', marginTop: 0 }}>
            ⚙️ Customize Controls
          </h3>

          {/* Template Title */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', fontSize: '0.9rem' }}>Template Title</label>
            <input 
              type="text" 
              value={template.template_name || ''}
              onChange={(e) => setTemplate({ ...template, template_name: e.target.value })}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
            />
          </div>

          {/* Logo Options */}
          <div style={{ background: '#fff8e7', padding: '12px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #ebd7a3' }}>
            <h4 style={{ fontSize: '0.95rem', color: '#8b0000', margin: '0 0 8px 0' }}>Committee Logo Settings</h4>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                <input 
                  type="checkbox" 
                  checked={template.design?.logo?.enabled !== false} 
                  onChange={(e) => updateDesign('logo', 'enabled', e.target.checked)} 
                /> Show Logo
              </label>
              <select 
                value={template.design?.logo?.position || 'center'}
                onChange={(e) => updateDesign('logo', 'position', e.target.value)}
                style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ccc' }}
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
            <label style={{ fontSize: '0.8rem', color: '#555' }}>Logo Height: {template.design?.logo?.height || 80}px</label>
            <input 
              type="range" min="40" max="150" 
              value={template.design?.logo?.height || 80} 
              onChange={(e) => updateDesign('logo', 'height', Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          {/* Group Photo Options */}
          <div style={{ background: '#fff8e7', padding: '12px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #ebd7a3' }}>
            <h4 style={{ fontSize: '0.95rem', color: '#8b0000', margin: '0 0 8px 0' }}>Group Photo Settings</h4>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                <input 
                  type="checkbox" 
                  checked={template.design?.group_photo?.enabled !== false} 
                  onChange={(e) => updateDesign('group_photo', 'enabled', e.target.checked)} 
                /> Show Group Photo
              </label>
              <select 
                value={template.design?.group_photo?.position || 'center'}
                onChange={(e) => updateDesign('group_photo', 'position', e.target.value)}
                style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ccc' }}
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
            <label style={{ fontSize: '0.8rem', color: '#555' }}>Photo Height: {template.design?.group_photo?.height || 90}px</label>
            <input 
              type="range" min="50" max="200" 
              value={template.design?.group_photo?.height || 90} 
              onChange={(e) => updateDesign('group_photo', 'height', Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          {/* Borders & Colors */}
          <div style={{ background: '#fff8e7', padding: '12px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #ebd7a3' }}>
            <h4 style={{ fontSize: '0.95rem', color: '#8b0000', margin: '0 0 8px 0' }}>Borders & Colors</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '0.8rem' }}>Background Color</label>
                <input 
                  type="color" 
                  value={template.design?.background?.value || '#FFFDF5'} 
                  onChange={(e) => updateDesign('background', 'value', e.target.value)} 
                  style={{ width: '100%', height: '35px', cursor: 'pointer' }} 
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem' }}>Border Radius (px)</label>
                <input 
                  type="number" 
                  value={template.design?.border?.radius || 8} 
                  onChange={(e) => updateDesign('border', 'radius', Number(e.target.value))} 
                  style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }} 
                />
              </div>
            </div>
          </div>

          {/* Fields Customization */}
          <h4 style={{ color: '#8b0000', margin: '16px 0 8px 0' }}>Receipt Fields (Labels & Visibility)</h4>
          {template.fields?.map((field, idx) => (
            <div key={field.key} style={{ background: '#fafafa', border: '1px solid #e0e0e0', padding: '8px 12px', borderRadius: '6px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#444' }}>
                  <input 
                    type="checkbox" 
                    checked={field.visible !== false} 
                    onChange={(e) => updateField(idx, 'visible', e.target.checked)} 
                  /> Show {field.key}
                </label>
                <span style={{ fontSize: '0.75rem', color: '#777' }}>Font: {field.font_size || 14}px</span>
              </div>

              {field.visible !== false && (
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px', marginTop: '6px' }}>
                  <input 
                    type="text"
                    style={{ padding: '6px', fontSize: '0.85rem', borderRadius: '4px', border: '1px solid #ccc' }}
                    value={field.label}
                    onChange={(e) => updateField(idx, 'label', e.target.value)}
                    placeholder="Field Label"
                  />
                  <input 
                    type="number"
                    style={{ padding: '6px', fontSize: '0.85rem', borderRadius: '4px', border: '1px solid #ccc' }}
                    value={field.font_size || 14}
                    onChange={(e) => updateField(idx, 'font_size', Number(e.target.value))}
                    min="10" max="24"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Live Preview Column */}
        <div>
          <div style={{ background: '#fff8e7', border: '1.5px solid #d4af37', padding: '10px 16px', borderRadius: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Eye color="#8b0000" size={20} />
            <strong style={{ color: '#8b0000' }}>LIVE RECEIPT PREVIEW (Updates Realtime)</strong>
          </div>

          <ReceiptPreview 
            transaction={sampleTransaction}
            settings={settings}
            template={template}
            amountWords={sampleTransaction.amount_in_words}
          />
        </div>
      </div>
    </div>
  );
}
