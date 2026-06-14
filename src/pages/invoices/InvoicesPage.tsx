import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { useApp } from "../../context/AppContext";

export default function InvoicesPage() {
  const { invoices, clients } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Paid': return 'badge-success';
      case 'Overdue': return 'badge-danger';
      case 'Partially Paid': return 'badge-warning';
      case 'Sent': return 'badge-warning';
      default: return 'badge-secondary';
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const client = clients.find(c => c.id === inv.clientId);
    const matchesSearch =
      inv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All Status" || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="page-title">Invoices</h1>
        <Link to="/invoices/create" className="btn btn-primary">
          <Plus size={18} />
          Create New Invoice
        </Link>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search invoices..."
              className="form-control"
              style={{ paddingLeft: '35px' }}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <select
              className="form-control"
              style={{ width: 'auto' }}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option>All Status</option>
              <option>Paid</option>
              <option>Partially Paid</option>
              <option>Sent</option>
              <option>Overdue</option>
              <option>Draft</option>
            </select>
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Invoice Number</th>
                <th>Client</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length > 0 ? filteredInvoices.map(invoice => {
                const client = clients.find(c => c.id === invoice.clientId);
                return (
                  <tr key={invoice.id}>
                    <td style={{ fontWeight: 600, color: 'var(--primary-color)' }}>#{invoice.id}</td>
                    <td style={{ fontWeight: 500 }}>{client?.name || 'Unknown'}</td>
                    <td>{invoice.date}</td>
                    <td style={{ fontWeight: 600 }}>Rp {invoice.amount.toLocaleString('id-ID')}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </td>
                  </tr>
                )
              }) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No invoices found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
