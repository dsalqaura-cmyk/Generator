import { useState, useEffect } from "react";
import { Plus, Trash2, Save, Send } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useApp, type InvoiceTerm } from "../../context/AppContext";

interface InvoiceItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  price: number;
}

export default function CreateInvoicePage() {
  const { clients, addInvoice, invoices, quotations } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const quotationId = location.state?.quotationId;
  const sourceQuote = quotationId ? quotations.find(q => q.id === quotationId) : null;

  // Convert Quotation data to Invoice data format
  let initialItems: InvoiceItem[] = [{ id: "1", name: "", description: "", quantity: 1, price: 0 }];
  
  if (sourceQuote) {
    if (sourceQuote.isBundledView) {
      initialItems = [{
        id: "1",
        name: sourceQuote.bundleName || "Professional Services",
        description: "As per agreed quotation and Scope of Work.",
        quantity: 1,
        price: sourceQuote.subtotal
      }];
    } else {
      initialItems = sourceQuote.items.map((item, index) => ({
        id: String(index + 1),
        name: item.name,
        description: `Resource Type: ${item.type}`,
        quantity: item.quantity,
        price: item.dailyRate + (item.dailyRate * (sourceQuote.marginPercentage / 100))
      }));
    }
  }

  const [items, setItems] = useState<InvoiceItem[]>(initialItems);
  const [useTax, setUseTax] = useState(sourceQuote?.taxAmount ? true : false);
  const [taxPercentage, setTaxPercentage] = useState(11); // Hardcoded standard tax, can be dynamic
  const [clientId, setClientId] = useState(sourceQuote?.clientId || "");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState(sourceQuote?.notes || "");

  const year = new Date().getFullYear();
  const seq = String(invoices.filter(i => i.id.startsWith(`INV-${year}-`)).length + 1).padStart(3, '0');
  const newInvoiceId = `INV-${year}-${seq}`;

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), name: "", description: "", quantity: 1, price: 0 }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const taxAmount = useTax ? (subtotal * taxPercentage) / 100 : 0;
  const grandTotal = subtotal + taxAmount;

  // Terms State
  const [terms, setTerms] = useState<InvoiceTerm[]>([
    { id: 't-1', name: 'Full Payment', amount: 0, dueDate: '', status: 'Unpaid' }
  ]);

  // Auto-sync terms when grand total changes, if there's only 1 term.
  useEffect(() => {
    if (terms.length === 1 && terms[0].name === 'Full Payment') {
      setTerms([{ ...terms[0], amount: grandTotal }]);
    }
  }, [grandTotal]);

  const addTerm = () => {
    const currentSum = terms.reduce((s, t) => s + t.amount, 0);
    const remainder = grandTotal > currentSum ? grandTotal - currentSum : 0;
    setTerms([...terms, { id: `t-${Date.now()}`, name: `Termin ${terms.length + 1}`, amount: remainder, dueDate: '', status: 'Unpaid' }]);
  };

  const updateTerm = (id: string, field: keyof InvoiceTerm, value: any) => {
    setTerms(terms.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const removeTerm = (id: string) => {
    if (terms.length > 1) {
      setTerms(terms.filter(t => t.id !== id));
    }
  };

  const totalTermsAmount = terms.reduce((s, t) => s + t.amount, 0);

  const handleSave = async (status: "Draft" | "Sent") => {
    if (!clientId) {
      alert("Please select a client.");
      return;
    }
    
    // Validate terms sum equals grand total
    if (Math.abs(totalTermsAmount - grandTotal) > 1) { // Allowing tiny floating point diff
      alert(`The sum of all payment terms (Rp ${totalTermsAmount.toLocaleString('id-ID')}) must exactly match the Grand Total (Rp ${grandTotal.toLocaleString('id-ID')}). Please adjust the terms.`);
      return;
    }

    const ok = await addInvoice({
      id: newInvoiceId,
      clientId,
      date,
      dueDate,
      amount: grandTotal,
      terms,
      status,
      items
    });
    if (ok) navigate("/invoices");
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title">Create New Invoice</h1>
          <div style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Draft mode</div>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/invoices" className="btn btn-secondary">Cancel</Link>
          <button className="btn btn-secondary" onClick={() => handleSave("Draft")}><Save size={18} /> Save as Draft</button>
          <button className="btn btn-primary" onClick={() => handleSave("Sent")}><Send size={18} /> Finalize & Send</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Client Selection & Invoice Details */}
          <div className="card">
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem' }}>Invoice Details</h2>
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
                <label className="form-label">Invoice Number</label>
                <input type="text" className="form-control" value={newInvoiceId} readOnly />
              </div>
              <div className="form-group">
                <label className="form-label">Invoice Date</label>
                <input type="date" className="form-control" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Overall Due Date</label>
                <input type="date" className="form-control" value={dueDate} onChange={e => setDueDate(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Invoice Items */}
          <div className="card">
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem' }}>Items</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              {items.map((item) => (
                <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 2fr 2fr auto', gap: '1rem', alignItems: 'start' }}>
                  <div>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Item name / Service" 
                      value={item.name}
                      onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                      style={{ marginBottom: '0.5rem' }}
                    />
                    <textarea 
                      className="form-control" 
                      placeholder="Description (optional)" 
                      rows={1}
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                    />
                  </div>
                  <div>
                    <input 
                      type="number" 
                      className="form-control" 
                      placeholder="Qty" 
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <input 
                      type="number" 
                      className="form-control" 
                      placeholder="Price" 
                      value={item.price}
                      onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', height: '42px', fontWeight: 600, paddingLeft: '0.5rem' }}>
                    Rp {(item.quantity * item.price).toLocaleString('id-ID')}
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
              <Plus size={18} /> Add Item
            </button>
          </div>
          
          {/* Payment Terms Section */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Payment Terms (Installments)</h2>
              <div style={{ fontSize: '0.875rem', color: totalTermsAmount === grandTotal ? 'var(--success-color)' : 'var(--danger-color)' }}>
                Allocated: Rp {totalTermsAmount.toLocaleString('id-ID')} / Rp {grandTotal.toLocaleString('id-ID')}
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              {terms.map((term) => (
                <div key={term.id} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 2fr auto', gap: '1rem', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Term Name (e.g. DP 30%)" 
                    value={term.name}
                    onChange={(e) => updateTerm(term.id, 'name', e.target.value)}
                  />
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>Rp</span>
                    <input 
                      type="number" 
                      className="form-control" 
                      style={{ paddingLeft: '35px' }}
                      value={term.amount || ''}
                      onChange={(e) => updateTerm(term.id, 'amount', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={term.dueDate}
                    onChange={(e) => updateTerm(term.id, 'dueDate', e.target.value)}
                  />
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '0.5rem', height: '42px', color: 'var(--danger-color)' }}
                    onClick={() => removeTerm(term.id)}
                    disabled={terms.length === 1}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>

            <button className="btn btn-secondary" onClick={addTerm}>
              <Plus size={18} /> Add Term / Installment
            </button>
          </div>

        </div>

        {/* Summary & Settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card">
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem' }}>Summary</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Subtotal</span>
                <span>Rp {subtotal.toLocaleString('id-ID')}</span>
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

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 700, marginTop: '0.5rem' }}>
                <span>Grand Total</span>
                <span style={{ color: 'var(--primary-color)' }}>Rp {grandTotal.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
          
          <div className="card">
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem' }}>Notes</h2>
            <div className="form-group">
              <label className="form-label">Client Notes (Visible on PDF)</label>
              <textarea className="form-control" rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Thank you for your business!"></textarea>
            </div>
            {sourceQuote && (
              <div style={{ padding: '1rem', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem' }}>
                <strong>Linked Quotation:</strong> #{sourceQuote.id}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
