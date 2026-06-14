import { useState, useRef, useEffect } from "react";
import { Upload, Save, User } from "lucide-react";
import { useApp } from "../context/AppContext";

export default function SettingsPage() {
  const { systemLogo, companyName, companyAddress, updateSettings } = useApp();
  
  const [logoBase64, setLogoBase64] = useState<string | null>(systemLogo);
  const [name, setName] = useState(companyName);
  const [address, setAddress] = useState(companyAddress);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state if context changes externally
  useEffect(() => {
    setLogoBase64(systemLogo);
    setName(companyName);
    setAddress(companyAddress);
  }, [systemLogo, companyName, companyAddress]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, etc).');
      return;
    }

    const MAX_SIZE_MB = 2;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      alert(`File terlalu besar (${(file.size / 1024 / 1024).toFixed(1)}MB). Maksimal ${MAX_SIZE_MB}MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setLogoBase64(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await updateSettings(logoBase64, name, address);
    if (ok) alert('Settings saved successfully!');
  };

  const handleRemoveLogo = () => {
    setLogoBase64(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="page-title">System Settings</h1>
        <div style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Configure company profile, logo, and system preferences</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
        
        {/* Left Column: Nav or Profile Summary */}
        <div className="card">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
              {logoBase64 ? (
                <img src={logoBase64} alt="Company Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '10px' }} />
              ) : (
                <User size={40} color="var(--text-muted)" />
              )}
            </div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{name || "Company Name"}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Administrator Account</p>
          </div>
        </div>

        {/* Right Column: Settings Form */}
        <div className="card">
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem' }}>Company Profile</h2>
          
          <form onSubmit={handleSave}>
            
            {/* Logo Upload Section */}
            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label className="form-label">Company Logo</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div 
                  style={{ 
                    width: '120px', 
                    height: '120px', 
                    border: '2px dashed var(--border-color)', 
                    borderRadius: 'var(--radius-md)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    overflow: 'hidden',
                    backgroundColor: 'var(--bg-secondary)'
                  }}
                >
                  {logoBase64 ? (
                    <img src={logoBase64} alt="Uploaded Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <Upload size={24} color="var(--text-muted)" />
                  )}
                </div>
                
                <div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    style={{ display: 'none' }} 
                  />
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
                      Choose File
                    </button>
                    {logoBase64 && (
                      <button type="button" className="btn btn-secondary" style={{ color: 'var(--danger-color)' }} onClick={handleRemoveLogo}>
                        Remove
                      </button>
                    )}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Recommended size: 500x500px (PNG or JPG). Max size 2MB.
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Info Section */}
            <div className="form-group">
              <label className="form-label">Company Name</label>
              <input 
                type="text" 
                className="form-control" 
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. PT Maju Bersama"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Company Address (For Invoices)</label>
              <textarea 
                className="form-control" 
                value={address}
                onChange={e => setAddress(e.target.value)}
                rows={3}
                placeholder="e.g. Jl. Jendral Sudirman Kav. 21, Jakarta Selatan"
              ></textarea>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary">
                <Save size={18} />
                Save Settings
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}
