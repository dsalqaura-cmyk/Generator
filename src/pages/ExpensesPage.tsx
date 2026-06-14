import { Plus, Search, Filter, Edit2, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useApp, type Expense } from "../context/AppContext";

export default function ExpensesPage() {
  const { expenses, addExpense, updateExpense, deleteExpense } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Form
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Operational");
  const [date, setDate] = useState("");
  const [amount, setAmount] = useState<number | "">("");

  const filteredExpenses = expenses.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openModal = () => setShowModal(true);
  const closeModal = () => {
    setShowModal(false);
    setEditingExpense(null);
    setName("");
    setCategory("Operational");
    setDate("");
    setAmount("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let ok: boolean;
    if (editingExpense) {
      ok = await updateExpense({ ...editingExpense, name, category, date, amount: Number(amount) || 0 });
    } else {
      ok = await addExpense({
        id: `EXP-${crypto.randomUUID()}`,
        name,
        category,
        date,
        amount: Number(amount) || 0,
        type: "General"
      });
    }
    if (ok) closeModal();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title">Expenses</h1>
          <div style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Track and manage company expenditures</div>
        </div>
        <button className="btn btn-primary" onClick={openModal}>
          <Plus size={18} />
          Record Expense
        </button>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search expenses..." 
              className="form-control"
              style={{ paddingLeft: '35px' }}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          
          <button className="btn btn-secondary">
            <Filter size={18} /> Filter
          </button>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Expense Detail</th>
                <th>Category</th>
                <th>Amount</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length > 0 ? filteredExpenses.map(expense => (
                <tr key={expense.id}>
                  <td>{expense.date}</td>
                  <td style={{ fontWeight: 500 }}>{expense.name}</td>
                  <td><span className="badge badge-secondary">{expense.category}</span></td>
                  <td style={{ fontWeight: 600, color: 'var(--danger-color)' }}>-Rp {expense.amount.toLocaleString('id-ID')}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }} title="Edit" onClick={() => {
                        setEditingExpense(expense);
                        setName(expense.name);
                        setCategory(expense.category);
                        setDate(expense.date);
                        setAmount(expense.amount);
                        setShowModal(true);
                      }}>
                        <Edit2 size={16} />
                      </button>
                      <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', color: 'var(--danger-color)' }} title="Delete" onClick={() => { if (window.confirm(`Hapus expense "${expense.name}"?`)) deleteExpense(expense.id); }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No expenses found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card" style={{ width: '400px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{editingExpense ? 'Edit Expense' : 'Record Expense'}</h2>
              <button onClick={closeModal} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Expense Name / Detail</label>
                <input type="text" className="form-control" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-control" value={category} onChange={e => setCategory(e.target.value)}>
                  <option value="Operational">Operational</option>
                  <option value="Hosting/Server">Hosting/Server</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Salary">Salary</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input type="date" className="form-control" value={date} onChange={e => setDate(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Amount (Rp)</label>
                <input type="number" className="form-control" value={amount} onChange={e => setAmount(Number(e.target.value))} required />
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editingExpense ? 'Update' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
