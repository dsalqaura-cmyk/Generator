import { Plus, Users, LayoutTemplate, Calculator, Edit2, Trash2, X, Trash, History, Eye } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useApp, type Participant, type Scheme, type DistributionRecord } from "../../context/AppContext";

export default function ProfitSharingPage() {
  const { participants, schemes, distributions, invoices, addParticipant, updateParticipant, deleteParticipant, addScheme, updateScheme, deleteScheme } = useApp();
  const [searchParams] = useSearchParams();
  
  const [activeTab, setActiveTab] = useState('participants');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'history') setActiveTab('history');
  }, [searchParams]);

  // Modal states
  const [showParticipantModal, setShowParticipantModal] = useState(false);
  const [showSchemeModal, setShowSchemeModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [editingScheme, setEditingScheme] = useState<Scheme | null>(null);
  const [viewingRecord, setViewingRecord] = useState<DistributionRecord | null>(null);

  // Participant Form
  const [pName, setPName] = useState("");
  const [pType, setPType] = useState("CEO");
  const [pBankAccount, setPBankAccount] = useState("");

  // Scheme Form
  const [sName, setSName] = useState("");
  const [sBase, setSBase] = useState("Net Profit");
  const [sDeduct, setSDeduct] = useState("All Expenses");
  const [sAllocations, setSAllocations] = useState<{ participantId: string; percentage: number }[]>([]);

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    let ok: boolean;
    if (editingParticipant) {
      ok = await updateParticipant({ ...editingParticipant, name: pName, type: pType, bankAccount: pBankAccount });
    } else {
      ok = await addParticipant({
        id: `P-${crypto.randomUUID()}`,
        name: pName,
        type: pType,
        bankAccount: pBankAccount,
        status: "Active"
      });
    }
    if (!ok) return;
    setShowParticipantModal(false);
    setEditingParticipant(null);
    setPName("");
    setPType("CEO");
    setPBankAccount("");
  };

  const handleAddScheme = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate Total Allocation is exactly 100%
    const totalPerc = sAllocations.reduce((sum, a) => sum + a.percentage, 0);
    if (totalPerc !== 100) {
      alert(`Total allocation must be exactly 100%. Current total: ${totalPerc}%`);
      return;
    }

    let ok: boolean;
    if (editingScheme) {
      ok = await updateScheme({ ...editingScheme, name: sName, base: sBase, expenseDeduction: sDeduct, allocations: sAllocations });
    } else {
      ok = await addScheme({
        id: `S-${crypto.randomUUID()}`,
        name: sName,
        base: sBase,
        expenseDeduction: sDeduct,
        allocations: sAllocations,
        status: "Active"
      });
    }
    if (!ok) return;
    setShowSchemeModal(false);
    setEditingScheme(null);
    setSName("");
    setSAllocations([]);
  };

  const addAllocationRow = () => {
    setSAllocations([...sAllocations, { participantId: "", percentage: 0 }]);
  };

  const updateAllocationRow = (index: number, field: string, value: string | number) => {
    const newAlloc = [...sAllocations];
    newAlloc[index] = { ...newAlloc[index], [field]: value };
    setSAllocations(newAlloc);
  };

  const removeAllocationRow = (index: number) => {
    setSAllocations(sAllocations.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title">Profit Sharing Management</h1>
          <div style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Manage participants, schemes, calculations, and history</div>
        </div>
        <Link to="/profit-sharing/calculate" className="btn btn-primary">
          <Calculator size={18} />
          Calculate Profit Sharing
        </Link>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
        <button 
          className={`btn ${activeTab === 'participants' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('participants')}
          style={{ border: activeTab === 'participants' ? 'none' : '' }}
        >
          <Users size={18} /> Participants
        </button>
        <button 
          className={`btn ${activeTab === 'schemes' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('schemes')}
          style={{ border: activeTab === 'schemes' ? 'none' : '' }}
        >
          <LayoutTemplate size={18} /> Sharing Schemes
        </button>
        <button 
          className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('history')}
          style={{ border: activeTab === 'history' ? 'none' : '' }}
        >
          <History size={18} /> History & Records
        </button>
      </div>

      {activeTab === 'participants' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Participants List</h2>
            <button className="btn btn-secondary" onClick={() => setShowParticipantModal(true)}>
              <Plus size={18} /> Add Participant
            </button>
          </div>
          
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Bank Account</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {participants.length > 0 ? participants.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td><span className="badge badge-secondary">{p.type}</span></td>
                    <td>{p.bankAccount || "-"}</td>
                    <td><span className="badge badge-success">{p.status}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }} title="Edit" onClick={() => {
                          setEditingParticipant(p);
                          setPName(p.name);
                          setPType(p.type);
                          setPBankAccount(p.bankAccount);
                          setShowParticipantModal(true);
                        }}><Edit2 size={16} /></button>
                        <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', color: 'var(--danger-color)' }} title="Delete" onClick={() => { if (window.confirm(`Hapus participant "${p.name}"?`)) deleteParticipant(p.id); }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : <tr><td colSpan={5} style={{textAlign: 'center', padding: '2rem'}}>No participants</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'schemes' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Sharing Schemes</h2>
            <button className="btn btn-secondary" onClick={() => setShowSchemeModal(true)}>
              <Plus size={18} /> Create Scheme
            </button>
          </div>
          
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Scheme Name</th>
                  <th>Calculation Base</th>
                  <th>Expense Deduction</th>
                  <th>Allocations</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {schemes.length > 0 ? schemes.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600, color: 'var(--primary-color)' }}>{s.name}</td>
                    <td>{s.base}</td>
                    <td>{s.expenseDeduction}</td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {s.allocations.map((a, i) => {
                          const p = participants.find(x => x.id === a.participantId);
                          return (
                            <span key={i} className="badge" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                              {p?.name || 'Unknown'}: {a.percentage}%
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td><span className="badge badge-success">{s.status}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }} title="Edit" onClick={() => {
                          setEditingScheme(s);
                          setSName(s.name);
                          setSBase(s.base);
                          setSDeduct(s.expenseDeduction);
                          setSAllocations(s.allocations || []);
                          setShowSchemeModal(true);
                        }}><Edit2 size={16} /></button>
                        <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', color: 'var(--danger-color)' }} title="Delete" onClick={() => { if (window.confirm(`Hapus scheme "${s.name}"?`)) deleteScheme(s.id); }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : <tr><td colSpan={6} style={{textAlign: 'center', padding: '2rem'}}>No schemes</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Profit Sharing History</h2>
          </div>
          
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Record ID</th>
                  <th>Date Approved</th>
                  <th>Invoice Ref</th>
                  <th>Term Revenue</th>
                  <th>Deducted Expenses</th>
                  <th>Net Distributable</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {distributions.length > 0 ? distributions.map(d => {
                  const inv = invoices.find(i => i.id === d.invoiceId);
                  const term = inv?.terms.find(t => t.id === d.termId);
                  
                  return (
                    <tr key={d.id}>
                      <td style={{ fontWeight: 600 }}>{d.id}</td>
                      <td>{d.date}</td>
                      <td>
                        <div style={{ color: 'var(--primary-color)' }}>#{d.invoiceId}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{term?.name || 'Unknown Term'}</div>
                      </td>
                      <td>Rp {d.termRevenue.toLocaleString('id-ID')}</td>
                      <td style={{ color: 'var(--danger-color)' }}>- Rp {d.deductedExpense.toLocaleString('id-ID')}</td>
                      <td style={{ fontWeight: 700, color: 'var(--success-color)' }}>Rp {d.netDistributable.toLocaleString('id-ID')}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }} title="View Breakdown" onClick={() => {
                          setViewingRecord(d);
                          setShowHistoryModal(true);
                        }}>
                          <Eye size={16} /> View
                        </button>
                      </td>
                    </tr>
                  )
                }) : <tr><td colSpan={7} style={{textAlign: 'center', padding: '2rem', color: 'var(--text-muted)'}}>No profit sharing calculations have been recorded yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {showParticipantModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card" style={{ width: '400px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{editingParticipant ? "Edit Participant" : "Add Participant"}</h2>
              <button onClick={() => setShowParticipantModal(false)} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddParticipant}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input type="text" className="form-control" value={pName} onChange={e => setPName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Role / Type</label>
                <select className="form-control" value={pType} onChange={e => setPType(e.target.value)}>
                  <option>CEO</option>
                  <option>CTO</option>
                  <option>CMO</option>
                  <option>COO</option>
                  <option>Founder</option>
                  <option>Partner</option>
                  <option>Staff</option>
                  <option>Company Reserve</option>
                  <option>External Consultant</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Bank Account (Optional)</label>
                <input type="text" className="form-control" value={pBankAccount} onChange={e => setPBankAccount(e.target.value)} placeholder="e.g. BCA 1234567890" />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Save Participant</button>
            </form>
          </div>
        </div>
      )}

      {showSchemeModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card" style={{ width: '500px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{editingScheme ? "Edit Scheme" : "Create Scheme"}</h2>
              <button onClick={() => {setShowSchemeModal(false); setEditingScheme(null); setSName(""); setSAllocations([])}} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddScheme}>
              <div className="form-group">
                <label className="form-label">Scheme Name</label>
                <input type="text" className="form-control" value={sName} onChange={e => setSName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Base Calculation</label>
                <select className="form-control" value={sBase} onChange={e => setSBase(e.target.value)}>
                  <option>Net Profit</option>
                  <option>Gross Revenue</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label className="form-label">Expense Deduction</label>
                <select className="form-control" value={sDeduct} onChange={e => setSDeduct(e.target.value)}>
                  <option>All Expenses</option>
                  <option>Operational Only</option>
                  <option>None</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Allocations</h3>
                  <div style={{ fontSize: '0.875rem', color: sAllocations.reduce((sum, a) => sum + a.percentage, 0) === 100 ? 'var(--success-color)' : 'var(--danger-color)' }}>
                    Total: {sAllocations.reduce((sum, a) => sum + a.percentage, 0)}%
                  </div>
                </div>
                
                {sAllocations.map((alloc, index) => (
                  <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                    <select 
                      className="form-control" 
                      style={{ flex: 2 }}
                      value={alloc.participantId} 
                      onChange={e => updateAllocationRow(index, 'participantId', e.target.value)}
                      required
                    >
                      <option value="">Select Participant...</option>
                      {participants.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
                      ))}
                    </select>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <input 
                        type="number" 
                        className="form-control" 
                        style={{ paddingRight: '25px' }}
                        value={alloc.percentage === 0 ? '' : alloc.percentage} 
                        onChange={e => updateAllocationRow(index, 'percentage', Number(e.target.value))}
                        min="1" max="100" required
                        placeholder="%"
                      />
                      <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>%</span>
                    </div>
                    <button type="button" className="btn btn-secondary" style={{ padding: '0.5rem' }} onClick={() => removeAllocationRow(index)}>
                      <Trash size={16} color="var(--danger-color)" />
                    </button>
                  </div>
                ))}

                <button type="button" className="btn btn-secondary" style={{ width: '100%', marginTop: '0.5rem' }} onClick={addAllocationRow}>
                  <Plus size={18} /> Add Row
                </button>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '2rem' }}>Save Scheme</button>
            </form>
          </div>
        </div>
      )}

      {/* History Details Modal */}
      {showHistoryModal && viewingRecord && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card" style={{ width: '600px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Distribution Breakdown</h2>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{viewingRecord.id} • Approved on {viewingRecord.date}</div>
              </div>
              <button onClick={() => {setShowHistoryModal(false); setViewingRecord(null);}} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ flex: 1, padding: '1rem', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Term Revenue</div>
                <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>Rp {viewingRecord.termRevenue.toLocaleString('id-ID')}</div>
              </div>
              <div style={{ flex: 1, padding: '1rem', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Deductions</div>
                <div style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--danger-color)' }}>Rp {viewingRecord.deductedExpense.toLocaleString('id-ID')}</div>
              </div>
              <div style={{ flex: 1, padding: '1rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: 'var(--radius-md)', border: '1px solid var(--success-color)' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Distributed</div>
                <div style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--success-color)' }}>Rp {viewingRecord.netDistributable.toLocaleString('id-ID')}</div>
              </div>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Participant</th>
                    <th>Bank Account</th>
                    <th style={{ textAlign: 'right' }}>Received Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {viewingRecord.breakdown.map((b, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 500 }}>{b.participantName}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{b.bankAccount}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--primary-color)' }}>
                        Rp {b.amount.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
