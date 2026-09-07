import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Calendar, Plus, CheckCircle, Clock, Archive, Sparkles } from 'lucide-react';

export default function AdminFestivals() {
  const { token } = useContext(AuthContext);
  const [festivals, setFestivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: 'Vinayaka Chavithi 2026',
    year: 2026,
    start_date: '',
    end_date: '',
    status: 'draft'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchFestivals();
  }, [token]);

  const fetchFestivals = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/festivals', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFestivals(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/festivals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create festival');
      }

      setSuccess('Festival created successfully!');
      setShowModal(false);
      fetchFestivals();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleActivate = async (id) => {
    try {
      const res = await fetch(`/api/festivals/${id}/activate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchFestivals();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const statusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '4px 10px', borderRadius: '12px', fontWeight: 600, fontSize: '0.85rem' }}><CheckCircle size={14} style={{ display: 'inline', marginRight: 4 }} /> Active</span>;
      case 'draft':
        return <span style={{ background: '#fff8e1', color: '#f57f17', padding: '4px 10px', borderRadius: '12px', fontWeight: 600, fontSize: '0.85rem' }}><Clock size={14} style={{ display: 'inline', marginRight: 4 }} /> Draft</span>;
      case 'completed':
        return <span style={{ background: '#e3f2fd', color: '#1565c0', padding: '4px 10px', borderRadius: '12px', fontWeight: 600, fontSize: '0.85rem' }}>Completed</span>;
      case 'archived':
        return <span style={{ background: '#f5f5f5', color: '#616161', padding: '4px 10px', borderRadius: '12px', fontWeight: 600, fontSize: '0.85rem' }}><Archive size={14} style={{ display: 'inline', marginRight: 4 }} /> Archived</span>;
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="page-container" style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ color: '#8b0000', margin: 0, fontFamily: 'Cinzel, serif', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={24} /> Festival / Year Management
          </h2>
          <p style={{ color: '#666', margin: '4px 0 0 0' }}>Reuse this application every year. Select or activate festival years.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            background: 'linear-[#8b0000, #a00000]',
            backgroundColor: '#8b0000',
            color: '#fff',
            border: 'none',
            padding: '10px 18px',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Plus size={18} /> New Festival Year
        </button>
      </div>

      {success && <div style={{ background: '#e8f5e9', color: '#2e7d32', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>{success}</div>}
      {error && <div style={{ background: '#ffebee', color: '#c62828', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>{error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#8b0000' }}>Loading festivals...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {festivals.map(f => (
            <div
              key={f._id}
              style={{
                background: f.status === 'active' ? '#fffdf5' : '#fff',
                border: f.status === 'active' ? '2px solid #d4af37' : '1px solid #e0e0e0',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: f.status === 'active' ? '0 4px 12px rgba(212, 175, 55, 0.2)' : '0 2px 4px rgba(0,0,0,0.05)',
                position: 'relative'
              }}
            >
              {f.status === 'active' && (
                <div style={{ position: 'absolute', top: '12px', right: '12px', background: '#d4af37', color: '#8b0000', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                  ACTIVE FESTIVAL
                </div>
              )}
              <h3 style={{ margin: '0 0 8px 0', color: '#8b0000', fontSize: '1.2rem' }}>{f.name}</h3>
              <p style={{ margin: '0 0 12px 0', color: '#555', fontSize: '0.9rem' }}>
                Year: <strong>{f.year}</strong>
              </p>
              <div style={{ marginBottom: '16px' }}>
                {statusBadge(f.status)}
              </div>
              {f.status !== 'active' && (
                <button
                  onClick={() => handleActivate(f._id)}
                  style={{
                    width: '100%',
                    background: '#2e7d32',
                    color: '#fff',
                    border: 'none',
                    padding: '8px',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  Set as Active Festival
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '450px' }}>
            <h3 style={{ color: '#8b0000', marginTop: 0 }}>Create Festival Year</h3>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', fontSize: '0.9rem' }}>Festival Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                  required
                />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', fontSize: '0.9rem' }}>Year</label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                  required
                />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', fontSize: '0.9rem' }}>Initial Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ padding: '8px 16px', background: '#e0e0e0', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 16px', background: '#8b0000', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
