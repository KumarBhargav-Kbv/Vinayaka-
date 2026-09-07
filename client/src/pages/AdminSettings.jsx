import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Settings, Upload, Trash2, Image, Save } from 'lucide-react';

export default function AdminSettings() {
  const { token } = useContext(AuthContext);

  const [settings, setSettings] = useState({
    committee_name: '',
    festival_name: '',
    festival_year: 2026,
    address: '',
    village_city: '',
    contact_number: '',
    whatsapp_number: '',
    email: '',
    website: '',
    committee_members: [],
    thank_you_message: '',
    footer_message: '',
    receipt_number_config: {
      common_prefix: 'VC-',
      donation_prefix: 'DON-',
      sponsorship_prefix: 'SPON-',
      padding_length: 4,
      starting_number: 1
    },
    logo: { url: '', enabled: true },
    group_photo: { url: '', enabled: true }
  });

  const [membersText, setMembersText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [logoFile, setLogoFile] = useState(null);
  const [logoUploading, setLogoUploading] = useState(false);

  const [photoFile, setPhotoFile] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSettings(data);
        if (data.committee_members && Array.isArray(data.committee_members)) {
          setMembersText(data.committee_members.map(m => `${m.name} (${m.role})`).join(', '));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTextSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess('');
    setError('');

    try {
      // Parse members string into [{ name, role }]
      const parsedMembers = membersText.split(',').map(item => {
        const match = item.match(/(.*?)\((.*?)\)/);
        if (match) {
          return { name: match[1].trim(), role: match[2].trim() };
        }
        return { name: item.trim(), role: 'Member' };
      }).filter(m => m.name);

      const payload = {
        ...settings,
        committee_members: parsedMembers
      };

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update settings');

      setSettings(data);
      setSuccess('Committee settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUploadLogo = async (e) => {
    e.preventDefault();
    if (!logoFile) return;
    setLogoUploading(true);

    const formData = new FormData();
    formData.append('logo', logoFile);

    try {
      const res = await fetch('/api/settings/logo', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Logo upload failed');

      setSettings(prev => ({ ...prev, logo: data.logo }));
      setLogoFile(null);
      alert('Logo uploaded successfully!');
    } catch (err) {
      alert(err.message);
    } finally {
      setLogoUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!window.confirm('Remove logo from future receipts?')) return;
    try {
      const res = await fetch('/api/settings/remove-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ type: 'logo' })
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUploadPhoto = async (e) => {
    e.preventDefault();
    if (!photoFile) return;
    setPhotoUploading(true);

    const formData = new FormData();
    formData.append('group_photo', photoFile);

    try {
      const res = await fetch('/api/settings/group-photo', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Photo upload failed');

      setSettings(prev => ({ ...prev, group_photo: data.group_photo }));
      setPhotoFile(null);
      alert('Committee group photo uploaded successfully!');
    } catch (err) {
      alert(err.message);
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!window.confirm('Remove group photo from future receipts?')) return;
    try {
      const res = await fetch('/api/settings/remove-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ type: 'group_photo' })
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem', color: '#8b0000', fontWeight: '700' }}>Loading Committee Settings...</div>;
  }

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto', padding: '16px' }}>
      <div className="card" style={{ background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
          <h2 style={{ color: '#8b0000', margin: 0, fontFamily: 'Cinzel, serif', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings color="#8b0000" /> Admin Branding & Committee Settings
          </h2>
          {success && <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>✓ {success}</span>}
        </div>

        {error && <div style={{ background: '#ffebee', color: '#c62828', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>⚠️ {error}</div>}

        {/* LOGO & GROUP PHOTO MEDIA MANAGEMENT SECTION */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {/* Logo Card */}
          <div style={{ background: '#fff8e7', padding: '16px', borderRadius: '10px', border: '1px solid #ebd7a3' }}>
            <h4 style={{ color: '#8b0000', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Image size={18} /> Committee Logo
            </h4>

            {settings.logo?.url ? (
              <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                <img src={settings.logo.url} alt="Logo" style={{ maxHeight: '90px', objectFit: 'contain' }} />
                <div style={{ marginTop: '8px' }}>
                  <button onClick={handleRemoveLogo} style={{ background: '#c62828', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>
                    <Trash2 size={14} style={{ display: 'inline', marginRight: 4 }} /> Remove Logo
                  </button>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '8px' }}>No logo currently uploaded.</p>
            )}

            <form onSubmit={handleUploadLogo}>
              <input 
                type="file" 
                accept="image/png, image/jpeg, image/jpg, image/webp" 
                onChange={(e) => setLogoFile(e.target.files[0])}
                style={{ fontSize: '0.8rem', width: '100%', marginBottom: '8px' }}
              />
              <button type="submit" disabled={!logoFile || logoUploading} style={{ width: '100%', background: '#8b0000', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                <Upload size={14} style={{ display: 'inline', marginRight: 4 }} /> {logoUploading ? 'Uploading...' : 'Upload Logo'}
              </button>
            </form>
          </div>

          {/* Group Photo Card */}
          <div style={{ background: '#fff8e7', padding: '16px', borderRadius: '10px', border: '1px solid #ebd7a3' }}>
            <h4 style={{ color: '#8b0000', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Image size={18} /> Committee Group Photo
            </h4>

            {settings.group_photo?.url ? (
              <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                <img src={settings.group_photo.url} alt="Group Photo" style={{ maxHeight: '90px', width: '100%', objectFit: 'cover', borderRadius: '6px' }} />
                <div style={{ marginTop: '8px' }}>
                  <button onClick={handleRemovePhoto} style={{ background: '#c62828', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>
                    <Trash2 size={14} style={{ display: 'inline', marginRight: 4 }} /> Remove Photo
                  </button>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '8px' }}>No group photo uploaded.</p>
            )}

            <form onSubmit={handleUploadPhoto}>
              <input 
                type="file" 
                accept="image/png, image/jpeg, image/jpg, image/webp" 
                onChange={(e) => setPhotoFile(e.target.files[0])}
                style={{ fontSize: '0.8rem', width: '100%', marginBottom: '8px' }}
              />
              <button type="submit" disabled={!photoFile || photoUploading} style={{ width: '100%', background: '#8b0000', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                <Upload size={14} style={{ display: 'inline', marginRight: 4 }} /> {photoUploading ? 'Uploading...' : 'Upload Group Photo'}
              </button>
            </form>
          </div>
        </div>

        {/* COMMITTEE TEXT INFORMATION FORM */}
        <form onSubmit={handleSaveTextSettings}>
          <h3 style={{ color: '#8b0000', borderBottom: '2px solid #ebd7a3', paddingBottom: '6px', marginTop: 0, marginBottom: '16px' }}>
            📜 Committee Details & Receipt Prefix Configuration
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', fontSize: '0.9rem' }}>Committee Name *</label>
              <input 
                type="text"
                value={settings.committee_name} 
                onChange={(e) => setSettings({ ...settings, committee_name: e.target.value })} 
                required 
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', fontSize: '0.9rem' }}>Festival Name *</label>
              <input 
                type="text" 
                value={settings.festival_name} 
                onChange={(e) => setSettings({ ...settings, festival_name: e.target.value })} 
                required 
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', fontSize: '0.9rem' }}>Festival Year *</label>
              <input 
                type="number" 
                value={settings.festival_year} 
                onChange={(e) => setSettings({ ...settings, festival_year: Number(e.target.value) })} 
                required 
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', fontSize: '0.9rem' }}>Address / Street</label>
              <input 
                type="text" 
                value={settings.address} 
                onChange={(e) => setSettings({ ...settings, address: e.target.value })} 
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', fontSize: '0.9rem' }}>Village / City</label>
              <input 
                type="text" 
                value={settings.village_city} 
                onChange={(e) => setSettings({ ...settings, village_city: e.target.value })} 
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', fontSize: '0.9rem' }}>Contact Number</label>
              <input 
                type="text" 
                value={settings.contact_number} 
                onChange={(e) => setSettings({ ...settings, contact_number: e.target.value })} 
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
              />
            </div>
          </div>

          {/* Receipt Number Config Box */}
          <div style={{ background: '#f5f5f5', padding: '16px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #e0e0e0' }}>
            <h4 style={{ color: '#8b0000', margin: '0 0 12px 0' }}>Receipt Numbering Format Config</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Common Prefix</label>
                <input 
                  type="text" 
                  value={settings.receipt_number_config?.common_prefix || 'VC-'}
                  onChange={(e) => setSettings({
                    ...settings,
                    receipt_number_config: { ...settings.receipt_number_config, common_prefix: e.target.value }
                  })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', fontWeight: 'bold' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Donation Prefix</label>
                <input 
                  type="text" 
                  value={settings.receipt_number_config?.donation_prefix || 'DON-'}
                  onChange={(e) => setSettings({
                    ...settings,
                    receipt_number_config: { ...settings.receipt_number_config, donation_prefix: e.target.value }
                  })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', fontWeight: 'bold' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Sponsorship Prefix</label>
                <input 
                  type="text" 
                  value={settings.receipt_number_config?.sponsorship_prefix || 'SPON-'}
                  onChange={(e) => setSettings({
                    ...settings,
                    receipt_number_config: { ...settings.receipt_number_config, sponsorship_prefix: e.target.value }
                  })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', fontWeight: 'bold' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Padding Digits</label>
                <input 
                  type="number" 
                  value={settings.receipt_number_config?.padding_length || 4}
                  onChange={(e) => setSettings({
                    ...settings,
                    receipt_number_config: { ...settings.receipt_number_config, padding_length: Number(e.target.value) }
                  })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', fontSize: '0.9rem' }}>Committee Key Members</label>
            <input 
              type="text" 
              value={membersText} 
              onChange={(e) => setMembersText(e.target.value)}
              placeholder="e.g. Sri R. Sharma (President), Sri K. Varma (Secretary)"
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', fontSize: '0.9rem' }}>Thank You Message (Receipt Footer Header)</label>
            <input 
              type="text" 
              value={settings.thank_you_message} 
              onChange={(e) => setSettings({ ...settings, thank_you_message: e.target.value })} 
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', fontSize: '0.9rem' }}>Footer Message (Computer Generated Notice)</label>
            <input 
              type="text" 
              value={settings.footer_message} 
              onChange={(e) => setSettings({ ...settings, footer_message: e.target.value })} 
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
            />
          </div>

          <button 
            type="submit" 
            disabled={saving}
            style={{
              width: '100%',
              background: '#8b0000',
              color: '#fff',
              border: 'none',
              padding: '14px',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '1.05rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Save size={20} /> {saving ? 'Saving Settings...' : 'Save All Committee Settings'}
          </button>
        </form>
      </div>
    </div>
  );
}
