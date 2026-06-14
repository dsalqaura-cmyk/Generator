import { useState } from "react";
import { Calculator, CheckCircle, FileText } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";

export default function CalculateProfitSharingPage() {
  const { invoices, clients, schemes, participants, distributions, addDistribution } = useApp();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [selectedInvoice, setSelectedInvoice] = useState("");
  const [selectedTermId, setSelectedTermId] = useState("");
  const [selectedScheme, setSelectedScheme] = useState("");
  const [manualExpense, setManualExpense] = useState(0);
  const [isCalculated, setIsCalculated] = useState(false);

  // Computed Calculation State
  const [distributableAmount, setDistributableAmount] = useState(0);
  const [termAmount, setTermAmount] = useState(0);
  const [results, setResults] = useState<{name: string, role: string, bankAccount: string, allocation: number, amount: number}[]>([]);

  const activeInvoice = invoices.find(i => i.id === selectedInvoice);

  const handleCalculate = () => {
    if (!activeInvoice) return;
    const sch = schemes.find(s => s.id === selectedScheme);
    const term = activeInvoice.terms.find(t => t.id === selectedTermId);
    
    if (!sch || !term) return;

    // 1. Get Revenue Base from the specific Term!
    const revenueBase = term.amount;
    
    // 2. Calculate Deductions based on user input
    // The user requested to be able to input this manually for the specific term
    const deductions = manualExpense;
    
    // 3. Final Distributable Amount
    let finalDistributable = revenueBase;
    if (sch.base === "Net Profit") {
      finalDistributable = revenueBase - deductions;
      if (finalDistributable < 0) finalDistributable = 0;
    }

    setTermAmount(revenueBase);
    setDistributableAmount(finalDistributable);

    // 4. Calculate Distribution per Participant based on Scheme Allocations
    const calculatedResults = sch.allocations.map(alloc => {
      const participant = participants.find(p => p.id === alloc.participantId);
      const share = (alloc.percentage / 100) * finalDistributable;
      return {
        name: participant?.name || 'Unknown',
        role: participant?.type || 'Unknown',
        bankAccount: participant?.bankAccount || '-',
        allocation: alloc.percentage,
        amount: share
      };
    });

    setResults(calculatedResults);
    setIsCalculated(true);
    setStep(2);
  };

  const handleApprove = async () => {
    if (!activeInvoice) return;

    // Prevent double-distribution for same invoice + term
    const alreadyExists = distributions.some(
      d => d.invoiceId === selectedInvoice && d.termId === selectedTermId
    );
    if (alreadyExists) {
      alert("Profit sharing untuk term ini sudah dihitung dan dikunci. Tidak boleh duplikat.");
      return;
    }

    const ok = await addDistribution({
      id: `DIST-${crypto.randomUUID()}`,
      date: new Date().toISOString().split('T')[0],
      invoiceId: selectedInvoice,
      termId: selectedTermId,
      schemeId: selectedScheme,
      termRevenue: termAmount,
      deductedExpense: manualExpense,
      netDistributable: distributableAmount,
      breakdown: results.map(r => ({
        participantName: r.name,
        bankAccount: r.bankAccount,
        amount: r.amount
      }))
    });

    if (ok) {
      alert("Profit sharing calculation saved and locked for this term.");
      navigate("/profit-sharing?tab=history");
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="page-title">Calculate Profit Sharing</h1>
        <Link to="/profit-sharing" className="btn btn-secondary">
          Cancel
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
        
        {/* Step 1: Input Parameters */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: step >= 1 ? 'var(--primary-color)' : 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: step >= 1 ? 'white' : 'inherit' }}>1</div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Parameters</h2>
          </div>

          <div className="form-group">
            <label className="form-label">Select Invoice</label>
            <select className="form-control" value={selectedInvoice} onChange={e => {
              setSelectedInvoice(e.target.value); 
              setSelectedTermId("");
              setIsCalculated(false);
            }}>
              <option value="">Choose an invoice...</option>
              {invoices.filter(i => i.status === 'Paid' || i.status === 'Partially Paid').map(inv => {
                const client = clients.find(c => c.id === inv.clientId);
                return (
                  <option key={inv.id} value={inv.id}>
                    {inv.id} ({client?.name})
                  </option>
                )
              })}
            </select>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Only invoices with paid terms are shown.</div>
          </div>

          {activeInvoice && (
            <div className="form-group">
              <label className="form-label">Select Paid Term (Installment)</label>
              <select className="form-control" value={selectedTermId} onChange={e => {setSelectedTermId(e.target.value); setIsCalculated(false)}}>
                <option value="">Choose a paid term...</option>
                {activeInvoice.terms.filter(t => t.status === 'Paid').map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} - Rp {t.amount.toLocaleString('id-ID')}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Expense Deduction for this Term</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>Rp</span>
              <input 
                type="number" 
                className="form-control" 
                style={{ paddingLeft: '35px' }}
                value={manualExpense === 0 ? '' : manualExpense} 
                onChange={e => {setManualExpense(parseFloat(e.target.value) || 0); setIsCalculated(false)}}
                placeholder="Enter manual expenses to deduct..."
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Select Sharing Scheme</label>
            <select className="form-control" value={selectedScheme} onChange={e => {setSelectedScheme(e.target.value); setIsCalculated(false)}}>
              <option value="">Choose a scheme...</option>
              {schemes.map(sch => (
                <option key={sch.id} value={sch.id}>
                  {sch.name} ({sch.base})
                </option>
              ))}
            </select>
          </div>

          <button 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={!selectedInvoice || !selectedTermId || !selectedScheme}
            onClick={handleCalculate}
          >
            <Calculator size={18} /> Run Calculation
          </button>
        </div>

        {/* Step 2: Results & Approval */}
        <div className="card" style={{ opacity: isCalculated ? 1 : 0.5, pointerEvents: isCalculated ? 'auto' : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: step >= 2 ? 'var(--primary-color)' : 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: step >= 2 ? 'white' : 'inherit' }}>2</div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Review & Approve</h2>
          </div>

          {isCalculated ? (
            <div>
              <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ flex: 1, padding: '1rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Term Revenue</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>Rp {termAmount.toLocaleString('id-ID')}</div>
                </div>
                <div style={{ flex: 1, padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Deducted Expense</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>Rp {manualExpense.toLocaleString('id-ID')}</div>
                </div>
                <div style={{ flex: 1, padding: '1rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: 'var(--radius-md)', border: '1px solid var(--success-color)' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Distributable Amount</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success-color)' }}>Rp {distributableAmount.toLocaleString('id-ID')}</div>
                </div>
              </div>

              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Allocation Breakdown</h3>
              <div className="table-container" style={{ marginBottom: '2rem' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Participant</th>
                      <th>Role</th>
                      <th>Bank Acc</th>
                      <th>Allocation</th>
                      <th style={{ textAlign: 'right' }}>Calculated Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map(r => (
                      <tr key={r.name}>
                        <td style={{ fontWeight: 600 }}>{r.name}</td>
                        <td><span className="badge badge-secondary">{r.role}</span></td>
                        <td style={{ color: 'var(--text-muted)' }}>{r.bankAccount}</td>
                        <td>{r.allocation}%</td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--primary-color)' }}>
                          Rp {r.amount.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <th colSpan={4} style={{ textAlign: 'right', fontSize: '1rem' }}>Total Distributed</th>
                      <th style={{ textAlign: 'right', fontSize: '1.125rem', color: 'var(--success-color)' }}>
                        Rp {results.reduce((s, r) => s + r.amount, 0).toLocaleString('id-ID')}
                      </th>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary">
                  <FileText size={18} /> Save as Draft
                </button>
                <button className="btn btn-primary" style={{ backgroundColor: 'var(--success-color)' }} onClick={handleApprove}>
                  <CheckCircle size={18} /> Approve & Lock Calculation
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
              <Calculator size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p>Select parameters and run calculation to see the breakdown.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
