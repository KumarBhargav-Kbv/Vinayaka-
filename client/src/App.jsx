import React, { useState, useContext } from 'react';
import { AuthContext, AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import MemberCollection from './pages/MemberCollection';
import MemberHistory from './pages/MemberHistory';
import ReceiptView from './pages/ReceiptView';
import AdminDashboard from './pages/AdminDashboard';
import AdminMembers from './pages/AdminMembers';
import AdminDonors from './pages/AdminDonors';
import AdminReceiptDesigner from './pages/AdminReceiptDesigner';
import AdminSettings from './pages/AdminSettings';
import AdminReports from './pages/AdminReports';
import AdminWhatsAppLogs from './pages/AdminWhatsAppLogs';
import './styles/index.css';

function MainApp() {
  const { user, loading, isAdmin } = useContext(AuthContext);

  const [currentPath, setCurrentPath] = useState('/collection');
  const [activeReceiptId, setActiveReceiptId] = useState(null);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#6b0000', color: '#ffe699', fontFamily: 'Cinzel, serif', fontSize: '1.5rem'
      }}>
        🪔 Initializing Vinayaka Chavithi Portal...
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={(u) => setCurrentPath(u.role === 'ADMIN' ? '/admin/dashboard' : '/collection')} />;
  }

  const handleTransactionCreated = (id) => {
    setActiveReceiptId(id);
    setCurrentPath('/receipt');
  };

  const handleViewReceipt = (id) => {
    setActiveReceiptId(id);
    setCurrentPath('/receipt');
  };

  const renderPage = () => {
    switch (currentPath) {
      case '/collection':
        return <MemberCollection onTransactionCreated={handleTransactionCreated} />;

      case '/receipt':
        return (
          <ReceiptView 
            transactionId={activeReceiptId}
            onNewTransaction={() => setCurrentPath('/collection')}
          />
        );

      case '/my-history':
        return <MemberHistory onViewReceipt={handleViewReceipt} />;

      case '/admin/dashboard':
        return isAdmin ? <AdminDashboard onViewReceipt={handleViewReceipt} /> : <MemberCollection onTransactionCreated={handleTransactionCreated} />;

      case '/admin/members':
        return isAdmin ? <AdminMembers /> : <MemberCollection onTransactionCreated={handleTransactionCreated} />;

      case '/admin/donors':
        return isAdmin ? <AdminDonors onViewReceipt={handleViewReceipt} /> : <MemberCollection onTransactionCreated={handleTransactionCreated} />;

      case '/admin/receipt-designer':
        return isAdmin ? <AdminReceiptDesigner /> : <MemberCollection onTransactionCreated={handleTransactionCreated} />;

      case '/admin/settings':
        return isAdmin ? <AdminSettings /> : <MemberCollection onTransactionCreated={handleTransactionCreated} />;

      case '/admin/reports':
        return isAdmin ? <AdminReports onViewReceipt={handleViewReceipt} /> : <MemberCollection onTransactionCreated={handleTransactionCreated} />;

      case '/admin/whatsapp':
        return isAdmin ? <AdminWhatsAppLogs /> : <MemberCollection onTransactionCreated={handleTransactionCreated} />;

      default:
        return <MemberCollection onTransactionCreated={handleTransactionCreated} />;
    }
  };

  return (
    <div className="app-container">
      <Navbar currentPath={currentPath} setCurrentPath={setCurrentPath} />
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
