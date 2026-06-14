import { Bell, Search, User } from "lucide-react";
import { useApp } from "../context/AppContext";

export default function Topbar() {
  const { user } = useApp();
  
  return (
    <header className="topbar">
      <div className="page-title"></div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search..." 
            className="form-control"
            style={{ paddingLeft: '35px', width: '250px' }}
          />
        </div>
        
        <button style={{ color: 'var(--text-secondary)' }}>
          <Bell size={20} />
        </button>
        
        <div className="user-profile">
          <div className="avatar">
            <User size={20} color="white" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'capitalize' }}>
              {user?.role === 'superadmin' ? 'Super Administrator' : 'Company Admin'}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.email}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
