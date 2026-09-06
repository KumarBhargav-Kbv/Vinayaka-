import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Settings, Upload, Trash2, Image, Save, Check } from 'lucide-react';

export default function AdminSettings() {
  const { token } = useContext(AuthContext);

  const [settings, setSettings] = useState({
    committee_name: '',
    festival_name: '',
    festival_year: '',
    address: '',
    village_city: '',
    contact_number: '',
    whatsapp_number: '',
    email: '',
    website: '',
    committee_members: '',
    thank_you_message: '',
    footer_message: '',
    receipt_prefix: 'VC-',
    logo: '',
    group_photo: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Logo file upload state
  const [logoFile, setLogoFile] = useState(null);
  const [logoUploading, setLogoUploading] = useState(false);

  // Group Photo upload state
  const [photoFile, setPhotoFile] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (res.ok) setSettings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveTextSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess('');
    setError('');

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update settings');

      setSuccess('Committee settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Upload Logo
  const handleUploadLogo = async (e) => {
    e.preventDefault();
    if (!logoFile) return;
    setLogoUploading(true);

    const formData = new FormData();
    formData.append('logo', logoFile);

    try {
      const res = await fetch('/api/settings/upload-logo', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Logo upload failed');

      setSettings(prev => ({ ...prev, logo: data.logoUrl }));
      setLogoFile(null);
      alert('Logo uploaded successfully!');
    } catch (err) {
      alert(err.message);
    } finally {
      setLogoUploading(false);
    }
  };

  // Remove Logo
  const handleRemoveLogo = async () => {
    if (!window.confirm('Are you sure you want to remove the committee logo?')) return;
    try {
      const res = await fetch('/api/settings/logo', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSettings(prev => ({ ...prev, logo: '' }));
        alert('Logo removed successfully!');
      } else {
        alert(data.error || 'Failed to remove logo');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Upload Group Photo
  const handleUploadPhoto = async (e) => {
    e.preventDefault();
    if (!photoFile) return;
    setPhotoUploading(true);

    const formData = new FormData();
    formData.append('group_photo', photoFile);

    try {
      const res = await fetch('/api/settings/upload-photo', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Photo upload failed');

      setSettings(prev => ({ ...prev, group_photo: data.photoUrl }));
      setPhotoFile(null);
      alert('Committee group photo uploaded successfully!');
    } catch (err) {
      alert(err.message);
    } finally {
      setPhotoUploading(false);
    }
  };

  // Remove Group Photo
  const handleRemovePhoto = async () => {
    if (!window.confirm('Are you sure you want to remove the committee photo?')) return;
    try {
      const res = await fetch('/api/settings/photo', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSettings(prev => ({ ...prev, group_photo: '' }));
        alert('Group photo removed successfully!');
      } else {
        alert(data.error || 'Failed to remove photo');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem', color: '#6b0000', fontWeight: '700' }}>Loading Committee Settings...</div>;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h2 className="card-title">
            <Settings color="#e65100" /> Admin Committee & Logo Settings
          </h2>
          {success && <span style={{ color: '#2e7d32', fontWeight: '700' }}>✓ {success}</span>}
        </div>

        {error && <div style={{ background: '#ffebee', color: '#c62828', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' }}>⚠️ {error}</div>}

        {/* LOGO & GROUP PHOTO MEDIA MANAGEMENT SECTION */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          {/* Logo Card */}
          <div style={{ background: '#fff8e7', padding: '1rem', borderRadius: '10px', border: '1px solid #ebd7a3' }}>
            <h4 style={{ color: '#6b0000', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Image size={18} /> Committee Logo
            </h4>

            {settings.logo ? (
              <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
                <img src={settings.logo} alt="Logo" style={{ maxHeight: '90px', objectFit: 'contain' }} />
                <div style={{ marginTop: '0.5rem' }}>
                  <button onClick={handleRemoveLogo} className="btn btn-danger" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
                    <Trash2 size={14} /> Remove Logo
                  </button>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '0.5rem' }}>No logo currently uploaded.</p>
            )}

            <form onSubmit={handleUploadLogo}>
              <input 
                type="file" 
                accept="image/png, image/jpeg, image/jpg, image/webp" 
                onChange={(e) => setLogoFile(e.target.files[0])}
                style={{ fontSize: '0.8rem', width: '100%', marginBottom: '0.5rem' }}
              />
              <button type="submit" className="btn btn-secondary btn-block" disabled={!logoFile || logoUploading} style={{ fontSize: '0.8rem' }}>
                <Upload size={14} /> {logoUploading ? 'Uploading...' : 'Upload Logo'}
              </button>
            </form>
          </div>

          {/* Group Photo Card */}
          <div style={{ background: '#fff8e7', padding: '1rem', borderRadius: '10px', border: '1px solid #ebd7a3' }}>
            <h4 style={{ color: '#6b0000', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Image size={18} /> Committee Group Photo
            </h4>

            {settings.group_photo ? (
              <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
                <img src={settings.group_photo} alt="Group Photo" style={{ maxHeight: '90px', width: '100%', objectFit: 'cover', borderRadius: '6px' }} />
                <div style={{ marginTop: '0.5rem' }}>
                  <button onClick={handleRemovePhoto} className="btn btn-danger" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
                    <Trash2 size={14} /> Remove Photo
                  </button>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '0.5rem' }}>No photo currently uploaded.</p>
            )}

            <form onSubmit={handleUploadPhoto}>
              <input 
                type="file" 
                accept="image/png, image/jpeg, image/jpg, image/webp" 
                onChange={(e) => setPhotoFile(e.target.files[0])}
                style={{ fontSize: '0.8rem', width: '100%', marginBottom: '0.5rem' }}
              />
              <button type="submit" className="btn btn-secondary btn-block" disabled={!photoFile || photoUploading} style={{ fontSize: '0.8rem' }}>
                <Upload size={14} /> {photoUploading ? 'Uploading...' : 'Upload Group Photo'}
              </button>
            </form>
          </div>
        </div>

        {/* COMMITTEE TEXT INFORMATION FORM */}
        <form onSubmit={handleSaveTextSettings}>
          <h3 style={{ color: '#6b0000', borderBottom: '2px solid #ebd7a3', paddingBottom: '0.4rem', marginBottom: '1rem' }}>
            📜 Committee Details & Receipt Prefix
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Committee Name *</label>
              <input 
                type="text" name="committee_name" className="form-control"
                value={settings.committee_name} onChange={handleChange} required 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Receipt Prefix * (e.g. VC- or DON-)</label>
              <input 
                type="text" name="receipt_prefix" className="form-control"
                value={settings.receipt_prefix} onChange={handleChange} required 
                style={{ fontWeight: '700', color: '#e65100' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Festival Name *</label>
              <input 
                type="text" name="festival_name" className="form-control"
                value={settings.festival_name} onChange={handleChange} required 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Festival Year *</label>
              <input 
                type="text" name="festival_year" className="form-control"
                value={settings.festival_year} onChange={handleChange} required 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Address / Street</label>
              <input 
                type="text" name="address" className="form-control"
                value={settings.address} onChange={handleChange} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Village / City</label>
              <input 
                type="text" name="village_city" className="form-control"
                value={settings.village_city} onChange={handleChange} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contact Number</label>
              <input 
                type="text" name="contact_number" className="form-control"
                value={settings.contact_number} onChange={handleChange} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">WhatsApp Official Number</label>
              <input 
                type="text" name="whatsapp_number" className="form-control"
                value={settings.whatsapp_number} onChange={handleChange} 
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Committee Office Bearers / Key Members</label>
            <input 
              type="text" name="committee_members" className="form-control"
              value={settings.committee_members} onChange={handleChange}
              placeholder="e.g. Sri R. Sharma (President), Sri K. Varma (Secretary)"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Thank You Message (Shown on Receipts)</label>
            <input 
              type="text" name="thank_you_message" className="form-control"
              value={settings.thank_you_message} onChange={handleChange} 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Footer Note (Shown on Receipts)</label>
            <input 
              type="text" name="footer_message" className="form-control"
              value={settings.footer_message} onChange={handleChange} 
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={saving} style={{ marginTop: '1rem' }}>
            <Save size={20} /> {saving ? 'Saving...' : 'Save All Committee Information'}
          </button>
        </form>
      </div>
    </div>
  );
}
