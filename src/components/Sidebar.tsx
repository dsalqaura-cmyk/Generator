import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  CreditCard, 
  Receipt, 
  PieChart, 
  Settings,
  LogOut,
  FileSignature,
  ShieldAlert
} from "lucide-react";
import { useApp } from "../context/AppContext";

export default function Sidebar() {
  const location = useLocation();
  const { user, systemLogo, companyName, logout } = useApp();
  const pathname = location.pathname;

  const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Clients", href: "/clients", icon: Users },
    { name: "Quotations", href: "/quotations", icon: FileSignature },
    { name: "Invoices", href: "/invoices", icon: FileText },
    { name: "Payments", href: "/payments", icon: CreditCard },
    { name: "Expenses", href: "/expenses", icon: Receipt },
    { name: "Profit Sharing", href: "/profit-sharing", icon: PieChart },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header" style={{ padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', height: 'auto' }}>
        {systemLogo ? (
          <img src={systemLogo} alt="Logo" style={{ maxWidth: '100%', maxHeight: '60px', objectFit: 'contain' }} />
        ) : (
          <>
            <div className="sidebar-logo" style={{ width: '48px', height: '48px', fontSize: '1.5rem' }}>
              {companyName?.charAt(0)}
            </div>
            <h2 className="sidebar-title" style={{ margin: '0.5rem 0 0 0', textAlign: 'center' }}>
              {companyName}
            </h2>
          </>
        )}
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link 
              key={item.name} 
              to={item.href} 
              className={`nav-item ${isActive ? "active" : ""}`}
            >
              <Icon size={20} />
              <span>{item.name}</span>
            </Link>
          );
        })}
        <Link to="/settings" className={`nav-item ${pathname === '/settings' ? 'active' : ''}`}>
          <Settings size={20} />
          <span>Settings</span>
        </Link>
        {user?.role === 'superadmin' && (
          <Link to="/accounts" className={`nav-item ${pathname === '/accounts' ? 'active' : ''}`} style={{ color: 'var(--primary-color)' }}>
            <ShieldAlert size={20} />
            <span>Accounts</span>
          </Link>
        )}
      </nav>

      <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)', marginTop: 'auto' }}>
        <button onClick={logout} className="nav-item" style={{ width: '100%', color: 'var(--danger-color)', justifyContent: 'flex-start', background: 'none', border: 'none', cursor: 'pointer', padding: '0.75rem 1rem' }}>
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
