import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { 
  PlusCircle, 
  History, 
  LayoutDashboard, 
  Users, 
  Settings, 
  Palette, 
  FileText, 
  LogOut,
  UserCheck,
  MessageSquare
} from 'lucide-react';

export default function Navbar({ currentPath, setCurrentPath }) {
  const { user, logout, isAdmin } = useContext(AuthContext);

  if (!user) return null;

  const navigate = (path) => {
    setCurrentPath(path);
  };

  return (
    <>
      <header className="navbar">
        <div className="nav-container">
          <div className="nav-brand" onClick={() => navigate(isAdmin ? '/admin/dashboard' : '/collection')} style={{ cursor: 'pointer' }}>
            <div className="nav-logo-icon">
              <span style={{ fontSize: '1.4rem' }}>🪔</span>
            </div>
            <div className="nav-title-group">
              <h1>Vinayaka Chavithi</h1>
              <p>Collection & Receipt Portal</p>
            </div>
          </div>

          <nav className="nav-links">
            {isAdmin ? (
              <>
                <button 
                  className={`nav-link ${currentPath === '/admin/dashboard' ? 'active' : ''}`}
                  onClick={() => navigate('/admin/dashboard')}
                >
                  <LayoutDashboard size={18} /> Dashboard
                </button>

                <button 
                  className={`nav-link ${currentPath === '/collection' ? 'active' : ''}`}
                  onClick={() => navigate('/collection')}
                >
                  <PlusCircle size={18} /> New Collection
                </button>

                <button 
                  className={`nav-link ${currentPath === '/admin/members' ? 'active' : ''}`}
                  onClick={() => navigate('/admin/members')}
                >
                  <Users size={18} /> Members
                </button>

                <button 
                  className={`nav-link ${currentPath === '/admin/donors' ? 'active' : ''}`}
                  onClick={() => navigate('/admin/donors')}
                >
                  <UserCheck size={18} /> Donors
                </button>

                <button 
                  className={`nav-link ${currentPath === '/admin/receipt-designer' ? 'active' : ''}`}
                  onClick={() => navigate('/admin/receipt-designer')}
                >
                  <Palette size={18} /> Receipt Designer
                </button>

                <button 
                  className={`nav-link ${currentPath === '/admin/reports' ? 'active' : ''}`}
                  onClick={() => navigate('/admin/reports')}
                >
                  <FileText size={18} /> Reports
                </button>

                <button 
                  className={`nav-link ${currentPath === '/admin/settings' ? 'active' : ''}`}
                  onClick={() => navigate('/admin/settings')}
                >
                  <Settings size={18} /> Settings
                </button>

                <button 
                  className={`nav-link ${currentPath === '/admin/whatsapp' ? 'active' : ''}`}
                  onClick={() => navigate('/admin/whatsapp')}
                >
                  <MessageSquare size={18} /> WhatsApp
                </button>
              </>
            ) : (
              <>
                <button 
                  className={`nav-link ${currentPath === '/collection' ? 'active' : ''}`}
                  onClick={() => navigate('/collection')}
                >
                  <PlusCircle size={18} /> New Collection
                </button>

                <button 
                  className={`nav-link ${currentPath === '/my-history' ? 'active' : ''}`}
                  onClick={() => navigate('/my-history')}
                >
                  <History size={18} /> My Collection History
                </button>
              </>
            )}

            <div className="user-badge">
              <span>{user.name}</span>
              <span className="role-tag">{user.role}</span>
              <button 
                onClick={logout} 
                style={{ background: 'none', border: 'none', color: '#ffb3b3', cursor: 'pointer', marginLeft: '6px', display: 'flex', alignItems: 'center' }}
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile Bottom Bar for Collection Members & Mobile Users */}
      <div className="mobile-bottom-nav">
        <button 
          className={`mobile-nav-item ${currentPath === '/collection' ? 'active' : ''}`}
          onClick={() => navigate('/collection')}
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <PlusCircle size={22} />
          <span>New Entry</span>
        </button>

        {isAdmin ? (
          <>
            <button 
              className={`mobile-nav-item ${currentPath === '/admin/dashboard' ? 'active' : ''}`}
              onClick={() => navigate('/admin/dashboard')}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <LayoutDashboard size={22} />
              <span>Dashboard</span>
            </button>
            <button 
              className={`mobile-nav-item ${currentPath === '/admin/reports' ? 'active' : ''}`}
              onClick={() => navigate('/admin/reports')}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <FileText size={22} />
              <span>Reports</span>
            </button>
            <button 
              className={`mobile-nav-item ${currentPath === '/admin/settings' ? 'active' : ''}`}
              onClick={() => navigate('/admin/settings')}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <Settings size={22} />
              <span>Settings</span>
            </button>
          </>
        ) : (
          <button 
            className={`mobile-nav-item ${currentPath === '/my-history' ? 'active' : ''}`}
            onClick={() => navigate('/my-history')}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <History size={22} />
            <span>My History</span>
          </button>
        )}

        <button 
          className="mobile-nav-item"
          onClick={logout}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c62828' }}
        >
          <LogOut size={22} />
          <span>Logout</span>
        </button>
      </div>
    </>
  );
}
