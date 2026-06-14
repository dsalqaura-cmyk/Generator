import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { ShieldAlert, UserPlus, CheckCircle, Trash2 } from "lucide-react";
import { useApp } from "../../context/AppContext";

// Create a secondary client to prevent auth session replacement
const supabaseUrl = 'https://dmsktiqvbqpjsrqepeym.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtc2t0aXF2YnFwanNycWVwZXltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzMzgyNzcsImV4cCI6MjA5NjkxNDI3N30.advbcFLp1Ybg46UOIZ-1yg8ikOO8ypRKG5VvYX3ZaF4';
const authClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

interface Tenant {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

export default function AccountsPage() {
  const { user } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(true);

  const fetchTenants = async () => {
    setLoadingTenants(true);
    // Since we are superadmin, we should use the main client? 
    // Wait, authClient has NO session! So authClient RLS will block it!
    // We must use the global supabase client that has the superadmin session, but we can't import it easily without cyclic deps or just passing the token.
    // Let's just import supabase from lib!
    const { supabase } = await import("../../lib/supabase");
    
    const { data, error } = await supabase.from('user_roles').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      setTenants(data as Tenant[]);
    }
    setLoadingTenants(false);
  };

  useEffect(() => {
    if (user?.role === 'superadmin') {
      fetchTenants();
    }
  }, [user]);

  if (user?.role !== 'superadmin') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center' }}>
        <ShieldAlert size={64} style={{ color: 'var(--danger-color)', marginBottom: '1rem' }} />
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Access Denied</h1>
        <p style={{ color: 'var(--text-muted)' }}>Only the Superadmin can access this page.</p>
      </div>
    );
  }

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    // Use secondary client to create user without overriding current session
    const { data, error: signUpError } = await authClient.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // Need to use the main supabase client to insert because of RLS!
      const { supabase } = await import("../../lib/supabase");
      const { error: roleError } = await supabase.from('user_roles').insert([
        { id: data.user.id, email, role: 'company' }
      ]);

      if (roleError) {
        console.error("Failed to set role", roleError);
        setError("Account created but failed to set role permissions. Contact system administrator.");
      } else {
        setSuccess(`Account for ${email} created successfully! They can now log in.`);
        setEmail("");
        setPassword("");
        fetchTenants(); // Refresh list
      }
    }

    setLoading(false);
  };

  const handleDeleteTenant = async (id: string, tenantEmail: string) => {
    if (tenantEmail === 'superadmin@salqaura.com') {
      alert("You cannot delete the superadmin account!");
      return;
    }
    
    if (window.confirm(`Are you sure you want to remove ${tenantEmail} from the system? They will lose dashboard access.`)) {
      const { supabase } = await import("../../lib/supabase");
      const { error } = await supabase.from('user_roles').delete().eq('id', id);
      if (!error) {
        fetchTenants();
      } else {
        alert("Failed to delete account: " + error.message);
      }
    }
  };

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: '2rem' }}>Account Management (Superadmin)</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className="card">
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserPlus size={20} className="text-primary" /> Create New Company Account
          </h2>
          
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.875rem' }}>
            Use this form to generate a new tenant account. This account will have its own isolated database space.
          </p>

          {error && (
            <div style={{ padding: '1rem', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{ padding: '1rem', backgroundColor: '#dcfce7', color: '#166534', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={18} /> {success}
            </div>
          )}

          <form onSubmit={handleCreateAccount} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} autoComplete="off">
            <div className="form-group">
              <label className="form-label">Email Address (Username)</label>
              <input 
                type="email" 
                className="form-control" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                placeholder="company@domain.com"
                autoComplete="new-password"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input 
                type="password" 
                className="form-control" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                placeholder="Minimum 6 characters"
                autoComplete="new-password"
              />
            </div>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>
        </div>

        <div className="card">
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem' }}>Registered Tenants</h2>
          
          {loadingTenants ? (
            <p>Loading accounts...</p>
          ) : tenants.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No other accounts found.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {tenants.map(t => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{t.email}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Role: <span style={{ textTransform: 'uppercase', fontWeight: 700, color: t.role === 'superadmin' ? 'var(--primary-color)' : 'var(--text-secondary)' }}>{t.role}</span>
                    </div>
                  </div>
                  {t.email !== 'superadmin@salqaura.com' && (
                    <button 
                      onClick={() => handleDeleteTenant(t.id, t.email)}
                      style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', padding: '0.5rem' }}
                      title="Remove Account"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
