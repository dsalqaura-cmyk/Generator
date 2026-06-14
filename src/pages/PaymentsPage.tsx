import { Plus, Search, Eye, X } from "lucide-react";
import { useState } from "react";
import { useApp } from "../context/AppContext";

export default function PaymentsPage() {
  const { payments, invoices, clients, addPayment, updateInvoiceTermStatus } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);

  // Form
  const [invoiceId, setInvoiceId] = useState("");
  const [termId, setTermId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [method, setMethod] = useState("Bank Transfer");

  const openModal = () => setShowModal(true);
  const closeModal = () => {
    setShowModal(false);
    setInvoiceId("");
    setTermId("");
    setDate(new Date().toISOString().split('T')[0]);
    setMethod("Bank Transfer");
  };

  const selectedInvoice = invoices.find(i => i.id === invoiceId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    const term = selectedInvoice.terms.find(t => t.id === termId);
    if (!term) return;

    const ok = await addPayment({
      id: `PAY-${crypto.randomUUID()}`,
      invoiceId,
      termId: term.id,
      termName: term.name,
      date,
      amount: term.amount,
      method
    });
    
    if (ok) {
      // Automatically set the term to paid, which also updates the invoice status
      await updateInvoiceTermStatus(invoiceId, term.id, "Paid");
      closeModal();
    }
  };

  const filteredPayments = payments.filter(p => 
    p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.invoiceId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="page-title">Payment Tracking</h1>
        <button className="btn btn-primary" onClick={openModal}>
          <Plus size={18} />
          Record Payment
        </button>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search payments..." 
              className="form-control"
              style={{ paddingLeft: '35px' }}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Receipt ID</th>
                <th>Invoice Ref</th>
                <th>Term / Installment</th>
                <th>Client</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Method</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length > 0 ? filteredPayments.map(payment => {
                const inv = invoices.find(i => i.id === payment.invoiceId);
                const client = clients.find(c => c.id === inv?.clientId);
                
                return (
                  <tr key={payment.id}>
                    <td style={{ fontWeight: 600 }}>{payment.id}</td>
                    <td style={{ color: 'var(--primary-color)' }}>#{payment.invoiceId}</td>
                    <td><span className="badge badge-warning">{payment.termName || 'Full Payment'}</span></td>
                    <td>{client?.name || 'Unknown'}</td>
                    <td>{payment.date}</td>
                    <td style={{ fontWeight: 600, color: 'var(--success-color)' }}>Rp {payment.amount.toLocaleString('id-ID')}</td>
                    <td><span className="badge badge-secondary">{payment.method}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }} title="View">
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No payments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card" style={{ width: '500px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Record Payment</h2>
              <button onClick={closeModal} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Invoice</label>
                <select className="form-control" value={invoiceId} onChange={e => {
                  setInvoiceId(e.target.value);
                  setTermId("");
                }} required>
                  <option value="">Select Invoice...</option>
                  {invoices.filter(i => i.status !== 'Paid').map(i => {
                    const client = clients.find(c => c.id === i.clientId);
                    return (
                      <option key={i.id} value={i.id}>
                        {i.id} - {client?.name} (Total: Rp {i.amount.toLocaleString('id-ID')})
                      </option>
                    );
                  })}
                </select>
              </div>

              {selectedInvoice && (
                <div className="form-group">
                  <label className="form-label">Term / Installment Being Paid</label>
                  <select className="form-control" value={termId} onChange={e => setTermId(e.target.value)} required>
                    <option value="">Select Term...</option>
                    {selectedInvoice.terms.map(t => (
                      <option key={t.id} value={t.id} disabled={t.status === 'Paid'}>
                        {t.name} - Rp {t.amount.toLocaleString('id-ID')} {t.status === 'Paid' ? '(Already Paid)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Payment Date</label>
                  <input type="date" className="form-control" value={date} onChange={e => setDate(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Method</label>
                  <select className="form-control" value={method} onChange={e => setMethod(e.target.value)} required>
                    <option>Bank Transfer</option>
                    <option>Cash</option>
                    <option>Credit Card</option>
                    <option>E-Wallet</option>
                  </select>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={!invoiceId || !termId}>Save Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
