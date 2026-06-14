import { useState, useMemo } from "react";
import { Plus, Trash2, Save, Send, Calendar, Calculator, Settings } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";

interface ResourceItem {
  id: string;
  name: string;
  type: string;
  sowId?: string;
  quantity: number;
  dailyRate: number;
  totalCost: number;
}

interface SOWItem {
  id: string;
  task: string;
  startDate: string;
  endDate: string;
}

export default function CreateQuotationPage() {
  const { clients, addQuotation, quotations } = useApp();
  const navigate = useNavigate();

  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);

  const [sow, setSow] = useState<SOWItem[]>([
    { id: "s1", task: "Phase 1: Research & Planning", startDate: today.toISOString().split('T')[0], endDate: nextWeek.toISOString().split('T')[0] }
  ]);

  const [items, setItems] = useState<ResourceItem[]>([
    { id: "1", name: "Senior Backend Engineer", type: "Engineer", sowId: "s1", quantity: 7, dailyRate: 500000, totalCost: 3500000 }
  ]);
  
  const [useTax, setUseTax] = useState(false);
  const [taxPercentage, setTaxPercentage] = useState(11);
  const [clientId, setClientId] = useState("");
  
  const nextMonth = new Date();
  nextMonth.setMonth(today.getMonth() + 1);
  
  const [date, setDate] = useState(today.toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState(nextMonth.toISOString().split('T')[0]);
  const [notes, setNotes] = useState("");
  const [termsText, setTermsText] = useState("1. Quotation is valid for 30 days.\n2. Prices are subject to change after the validity period.");

  // Cost Engine State
  const [marginPercentage, setMarginPercentage] = useState(30);
  const [isBundledView, setIsBundledView] = useState(true);
  const [bundleName, setBundleName] = useState("Software Development Services");

  const qYear = new Date().getFullYear();
  const qSeq = String(quotations.filter(q => q.id.startsWith(`QUO-${qYear}-`)).length + 1).padStart(3, '0');
  const newQuotationId = `QUO-${qYear}-${qSeq}`;

  // Helper to calculate days between dates
  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 1;
    const d1 = new Date(start).getTime();
    const d2 = new Date(end).getTime();
    if (d2 < d1) return 1;
    return Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24)) + 1; // Inclusive of start day
  };

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), name: "", type: "Engineer", quantity: 1, dailyRate: 0, totalCost: 0 }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof ResourceItem, value: any) => {
    setItems(items.map(item => {
      if (item.id !== id) return item;
      
      const updated = { ...item, [field]: value };
      
      // Auto-calc quantity if sowId changes
      if (field === 'sowId' && value !== "") {
        const relatedSow = sow.find(s => s.id === value);
        if (relatedSow) {
          updated.quantity = calculateDays(relatedSow.startDate, relatedSow.endDate);
        }
      }
      // Auto-calc total cost
      updated.totalCost = updated.quantity * updated.dailyRate;
      return updated;
    }));
  };

  // SOW Actions
  const addSowItem = () => {
    const lastDate = sow.length > 0 ? new Date(sow[sow.length - 1].endDate) : new Date();
    const newEnd = new Date(lastDate);
    newEnd.setDate(lastDate.getDate() + 7);
    
    setSow([...sow, { 
      id: `sow-${Date.now()}`, 
      task: "", 
      startDate: lastDate.toISOString().split('T')[0], 
      endDate: newEnd.toISOString().split('T')[0] 
    }]);
  };

  const removeSowItem = (id: string) => {
    setSow(sow.filter(item => item.id !== id));
    // Clear sowId from related items
    setItems(items.map(item => item.sowId === id ? { ...item, sowId: undefined } : item));
  };

  const updateSowItem = (id: string, field: keyof SOWItem, value: string) => {
    const newSow = sow.map(item => item.id === id ? { ...item, [field]: value } : item);
    setSow(newSow);

    // If dates changed, update the quantity of linked resources automatically!
    if (field === 'startDate' || field === 'endDate') {
      const updatedSow = newSow.find(item => item.id === id);
      if (updatedSow) {
        const newDays = calculateDays(updatedSow.startDate, updatedSow.endDate);
        setItems(items.map(item => {
          if (item.sowId === id) {
            return { ...item, quantity: newDays, totalCost: newDays * item.dailyRate };
          }
          return item;
        }));
      }
    }
  };

  // Cost Engine Math
  const totalEstimatedCost = items.reduce((sum, item) => sum + item.totalCost, 0);
  const subtotal = totalEstimatedCost + (totalEstimatedCost * (marginPercentage / 100)); // Selling Price before tax
  const taxAmount = useTax ? (subtotal * taxPercentage) / 100 : 0;
  const grandTotal = subtotal + taxAmount;

  const handleSave = async (status: "Draft" | "Sent") => {
    if (!clientId) {
      alert("Please select a client.");
      return;
    }

    const ok = await addQuotation({
      id: newQuotationId,
      clientId,
      date,
      validUntil,
      totalEstimatedCost,
      marginPercentage,
      subtotal,
      taxAmount,
      grandTotal,
      isBundledView,
      bundleName,
      terms: termsText,
      notes,
      status,
      items,
      sow
    });
    if (ok) navigate("/quotations");
  };

  // Gantt Chart Logic
  const ganttData = useMemo(() => {
    if (sow.length === 0) return null;
    
    // Find min and max dates
    let minTime = Infinity;
    let maxTime = -Infinity;
    
    const validSow = sow.filter(s => s.startDate && s.endDate && new Date(s.endDate) >= new Date(s.startDate));
    if (validSow.length === 0) return null;

    validSow.forEach(s => {
      const start = new Date(s.startDate).getTime();
      const end = new Date(s.endDate).getTime();
      if (start < minTime) minTime = start;
      if (end > maxTime) maxTime = end;
    });

    const totalDuration = maxTime - minTime;
    // Prevent division by zero
    const safeTotalDuration = totalDuration === 0 ? 86400000 : totalDuration; 

    const tasks = validSow.map((s, index) => {
      const start = new Date(s.startDate).getTime();
      const end = new Date(s.endDate).getTime();
      
      const leftPercent = ((start - minTime) / safeTotalDuration) * 100;
      const widthPercent = ((end - start) / safeTotalDuration) * 100;
      
      const daysDuration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1; // Inclusive

      // Color cycling
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
      const color = colors[index % colors.length];

      return {
        ...s,
        leftPercent,
        widthPercent: Math.max(widthPercent, 1),
        daysDuration,
        color
      };
    });

    const minDateStr = new Date(minTime).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    const maxDateStr = new Date(maxTime).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    const totalDays = Math.ceil(safeTotalDuration / (1000 * 60 * 60 * 24)) + 1;

    return { tasks, minDateStr, maxDateStr, totalDays };
  }, [sow]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title">Create Quotation (Cost Estimator)</h1>
          <div style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Auto-calculate selling price based on resources and timeline.</div>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/quotations" className="btn btn-secondary">Cancel</Link>
          <button className="btn btn-secondary" onClick={() => handleSave("Draft")}><Save size={18} /> Save as Draft</button>
          <button className="btn btn-primary" onClick={() => handleSave("Sent")}><Send size={18} /> Send to Client</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Client Selection */}
          <div className="card">
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem' }}>Quotation Details</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Client</label>
                <select className="form-control" value={clientId} onChange={e => setClientId(e.target.value)}>
                  <option value="">Select a client...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Quotation Number</label>
                <input type="text" className="form-control" value={newQuotationId} readOnly />
              </div>
              <div className="form-group">
                <label className="form-label">Issue Date</label>
                <input type="date" className="form-control" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Valid Until</label>
                <input type="date" className="form-control" value={validUntil} onChange={e => setValidUntil(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Scope of Work */}
          <div className="card">
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={20} className="text-primary" /> Scope of Work & Timeline
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>
                <div>Phase / Task Name</div>
                <div>Start Date</div>
                <div>End Date</div>
                <div style={{ width: '42px' }}></div>
              </div>
              
              {sow.map((item) => (
                <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '1rem', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g., UI/UX Design" 
                    value={item.task}
                    onChange={(e) => updateSowItem(item.id, 'task', e.target.value)}
                  />
                  <input 
                    type="date" 
                    className="form-control" 
                    value={item.startDate}
                    onChange={(e) => updateSowItem(item.id, 'startDate', e.target.value)}
                  />
                  <input 
                    type="date" 
                    className="form-control" 
                    value={item.endDate}
                    onChange={(e) => updateSowItem(item.id, 'endDate', e.target.value)}
                  />
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '0.5rem', height: '42px', color: 'var(--danger-color)' }}
                    onClick={() => removeSowItem(item.id)}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>

            <button className="btn btn-secondary" onClick={addSowItem} style={{ marginBottom: '2rem' }}>
              <Plus size={18} /> Add Task
            </button>

            {/* Live Gantt Chart Preview */}
            {ganttData && (
              <div style={{ backgroundColor: 'var(--bg-primary)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', textAlign: 'center' }}>Timeline Preview ({ganttData.totalDays} Days)</h3>
                <div style={{ position: 'relative', paddingTop: '2rem', paddingBottom: '1rem' }}>
                  {/* Grid background lines */}
                  <div style={{ position: 'absolute', top: '1.5rem', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between' }}>
                    {[0, 25, 50, 75, 100].map(pct => (
                      <div key={pct} style={{ position: 'relative', width: '1px', backgroundColor: 'var(--border-color)' }}>
                        {pct === 0 && <span style={{ position: 'absolute', top: '-1.5rem', left: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ganttData.minDateStr}</span>}
                        {pct === 100 && <span style={{ position: 'absolute', top: '-1.5rem', right: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ganttData.maxDateStr}</span>}
                      </div>
                    ))}
                  </div>

                  {/* Tasks */}
                  <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {ganttData.tasks.map(t => (
                      <div key={t.id} style={{ display: 'flex', alignItems: 'center', minHeight: '30px' }}>
                        <div style={{ width: '150px', fontSize: '0.875rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: '1rem' }}>
                          {t.task || 'Untitled Task'}
                        </div>
                        <div style={{ flex: 1, position: 'relative', height: '24px' }}>
                          <div 
                            style={{ 
                              position: 'absolute', left: `${t.leftPercent}%`, width: `${t.widthPercent}%`, 
                              height: '100%', backgroundColor: t.color, borderRadius: '4px', opacity: 0.85,
                              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                              fontSize: '0.75rem', fontWeight: 600, boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                          >
                            {t.widthPercent > 10 ? `${t.daysDuration}d` : ''}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Cost Estimator */}
          <div className="card">
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calculator size={20} className="text-primary" /> Resource Estimator (Internal Cost)
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr auto', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>
                <div>Link to SOW</div>
                <div>Resource / Item Name</div>
                <div>Qty (Days)</div>
                <div>Rate per Day</div>
                <div>Total Cost</div>
                <div style={{ width: '42px' }}></div>
              </div>
              
              {items.map((item) => (
                <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr auto', gap: '1rem', alignItems: 'center' }}>
                  <select 
                    className="form-control" 
                    value={item.sowId || ""} 
                    onChange={(e) => updateItem(item.id, 'sowId', e.target.value)}
                  >
                    <option value="">No Link (Manual)</option>
                    {sow.map(s => <option key={s.id} value={s.id}>{s.task || 'Untitled'}</option>)}
                  </select>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g., Senior Frontend Dev" 
                    value={item.name}
                    onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                  />
                  <input 
                    type="number" 
                    className="form-control" 
                    placeholder="Qty" 
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                    disabled={!!item.sowId} // Disabled if linked to SOW
                    title={item.sowId ? "Auto-calculated from SOW duration" : ""}
                  />
                  <input 
                    type="number" 
                    className="form-control" 
                    placeholder="Rp Rate" 
                    value={item.dailyRate}
                    onChange={(e) => updateItem(item.id, 'dailyRate', parseFloat(e.target.value) || 0)}
                  />
                  <div style={{ fontWeight: 600 }}>
                    Rp {item.totalCost.toLocaleString('id-ID')}
                  </div>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '0.5rem', height: '42px', color: 'var(--danger-color)' }}
                    onClick={() => removeItem(item.id)}
                    disabled={items.length === 1}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>

            <button className="btn btn-secondary" onClick={addItem}>
              <Plus size={18} /> Add Resource
            </button>
          </div>

          <div className="card">
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem' }}>Terms & Notes</h2>
            <div className="form-group">
              <label className="form-label">Terms and Conditions</label>
              <textarea className="form-control" rows={4} value={termsText} onChange={e => setTermsText(e.target.value)}></textarea>
            </div>
            <div className="form-group">
              <label className="form-label">Additional Notes</label>
              <textarea className="form-control" rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="E.g., Special instructions or remarks..."></textarea>
            </div>
          </div>

        </div>

        {/* Pricing Engine & Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="card" style={{ border: '2px solid var(--primary-color)' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Settings size={20} className="text-primary" /> Pricing Engine
            </h2>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              <span>Total Internal Cost</span>
              <span style={{ fontWeight: 600 }}>Rp {totalEstimatedCost.toLocaleString('id-ID')}</span>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Profit Margin Markup (%)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <input 
                  type="range" 
                  min="0" max="200" 
                  value={marginPercentage} 
                  onChange={e => setMarginPercentage(Number(e.target.value))}
                  style={{ flex: 1 }}
                />
                <div style={{ fontWeight: 700, fontSize: '1.25rem', width: '60px', textAlign: 'right' }}>
                  {marginPercentage}%
                </div>
              </div>
            </div>

            <div style={{ padding: '1.5rem', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-md)' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Client Document View</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="radio" checked={isBundledView} onChange={() => setIsBundledView(true)} style={{ marginTop: '0.25rem' }} />
                  <div>
                    <div style={{ fontWeight: 600 }}>Bundled / Package View (Recommended)</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Hides internal resources. Shows one single package price to the client.</div>
                  </div>
                </label>

                {isBundledView && (
                  <div style={{ paddingLeft: '1.5rem' }}>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={bundleName} 
                      onChange={e => setBundleName(e.target.value)} 
                      placeholder="e.g. Fullstack Web Development"
                    />
                  </div>
                )}

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer', marginTop: '0.5rem' }}>
                  <input type="radio" checked={!isBundledView} onChange={() => setIsBundledView(false)} style={{ marginTop: '0.25rem' }} />
                  <div>
                    <div style={{ fontWeight: 600 }}>Itemized View</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Shows all resources and days, but with margin applied to daily rates.</div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem' }}>Final Quotation Price</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Subtotal (Selling Price)</span>
                <span style={{ fontWeight: 600 }}>Rp {subtotal.toLocaleString('id-ID')}</span>
              </div>
              
              <div style={{ padding: '1rem 0', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={useTax} 
                      onChange={(e) => setUseTax(e.target.checked)}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <span>Apply Tax</span>
                  </label>
                  {useTax && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input 
                        type="number" 
                        className="form-control" 
                        value={taxPercentage} 
                        onChange={(e) => setTaxPercentage(parseFloat(e.target.value) || 0)}
                        style={{ width: '80px', padding: '0.25rem 0.5rem' }}
                      />
                      <span>%</span>
                    </div>
                  )}
                </div>
                
                {useTax && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                    <span>Tax Amount</span>
                    <span>Rp {taxAmount.toLocaleString('id-ID')}</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.5rem', fontWeight: 800, marginTop: '0.5rem' }}>
                <span>Grand Total</span>
                <span style={{ color: 'var(--primary-color)' }}>Rp {grandTotal.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
