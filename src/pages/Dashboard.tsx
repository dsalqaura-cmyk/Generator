import { DollarSign, FileText, TrendingUp, AlertCircle, CheckCircle, PieChart } from "lucide-react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const { invoices, expenses, clients, distributions } = useApp();

  const totalPaidRevenue = invoices.filter(i => i.status === 'Paid' || i.status === 'Partially Paid').reduce((sum, i) => sum + i.amount, 0);
  // Include Partially Paid invoices: for paid, full amount; for partially paid, amount minus what's been paid via payments
  const outstandingAmount = invoices
    .filter(i => i.status === 'Sent' || i.status === 'Overdue' || i.status === 'Partially Paid')
    .reduce((sum, i) => {
      const paidTerms = i.terms.filter(t => t.status === 'Paid').reduce((s, t) => s + t.amount, 0);
      return sum + (i.amount - paidTerms);
    }, 0);
  const pendingInvoices = invoices.filter(i => i.status === 'Sent' || i.status === 'Overdue').length;

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Calculate margin
  const marginPercentage = totalPaidRevenue > 0 ? Math.round(((totalPaidRevenue - totalExpenses) / totalPaidRevenue) * 100) : 0;

  // Build chart data from actual invoice/expense dates (last 6 months)
  const chartData = (() => {
    const months: { name: string; revenue: number; expenses: number }[] = [];
    const now = new Date();
    for (let m = 5; m >= 0; m--) {
      const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const monthLabel = d.toLocaleString('id-ID', { month: 'short' });
      const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      const monthRevenue = invoices
        .filter(i => (i.status === 'Paid' || i.status === 'Partially Paid') && i.date.startsWith(yearMonth))
        .reduce((sum, i) => sum + i.amount, 0);

      const monthExpense = expenses
        .filter(e => e.date.startsWith(yearMonth))
        .reduce((sum, e) => sum + e.amount, 0);

      months.push({ name: monthLabel, revenue: monthRevenue, expenses: monthExpense });
    }
    return months;
  })();

  // Invoices that are paid but don't have a distribution record yet
  const pendingSharingInvoices = invoices.filter(i =>
    (i.status === 'Paid' || i.status === 'Partially Paid') &&
    i.terms.some(t => t.status === 'Paid' && !distributions.some(d => d.invoiceId === i.id && d.termId === t.id))
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="page-title">Dashboard Overview</h1>
        <Link to="/invoices/create" className="btn btn-primary">
          <FileText size={18} />
          Create New Invoice
        </Link>
      </div>

      <div className="grid-cards">
        <div className="card" style={{ borderTop: '3px solid var(--primary-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="card-title">Total Paid Revenue</div>
              <div className="card-value">Rp {totalPaidRevenue.toLocaleString('id-ID')}</div>
            </div>
            <div style={{ padding: '0.75rem', backgroundColor: 'rgba(37, 99, 235, 0.1)', borderRadius: 'var(--radius-md)' }}>
              <DollarSign color="var(--primary-color)" />
            </div>
          </div>
        </div>

        <div className="card" style={{ borderTop: '3px solid var(--warning-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="card-title">Outstanding Invoices</div>
              <div className="card-value">Rp {outstandingAmount.toLocaleString('id-ID')}</div>
            </div>
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--warning-bg)', borderRadius: 'var(--radius-md)' }}>
              <AlertCircle color="var(--warning-color)" />
            </div>
          </div>
          <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            <span>{pendingInvoices} invoices pending payment</span>
          </div>
        </div>

        <div className="card" style={{ borderTop: '3px solid var(--danger-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="card-title">Total Expenses</div>
              <div className="card-value">Rp {totalExpenses.toLocaleString('id-ID')}</div>
            </div>
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--danger-bg)', borderRadius: 'var(--radius-md)' }}>
              <TrendingUp color="var(--danger-color)" style={{ transform: 'rotate(180deg)' }} />
            </div>
          </div>
        </div>

        <div className="card" style={{ borderTop: '3px solid var(--accent-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="card-title">Net Profit Margin</div>
              <div className="card-value">{marginPercentage}%</div>
            </div>
            <div style={{ padding: '0.75rem', backgroundColor: 'rgba(124, 58, 237, 0.1)', borderRadius: 'var(--radius-md)' }}>
              <PieChart color="var(--accent-color)" />
            </div>
          </div>
          <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: marginPercentage > 50 ? 'var(--success-color)' : 'var(--warning-color)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <CheckCircle size={14} />
            <span>{marginPercentage > 50 ? 'Healthy Margin' : 'Needs Attention'}</span>
          </div>
        </div>
      </div>

      {/* Growth Chart Section */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem' }}>Company Growth (6 Months)</h2>
        <div style={{ height: '300px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary-color)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--primary-color)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--danger-color)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--danger-color)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `Rp ${value / 1000}k`} />
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)' }}
                formatter={(value: any) => [`Rp ${value.toLocaleString('id-ID')}`, '']}
              />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="var(--primary-color)" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              <Area type="monotone" dataKey="expenses" name="Expenses" stroke="var(--danger-color)" strokeWidth={3} fillOpacity={1} fill="url(#colorExpenses)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Recent Invoices</h2>
            <Link to="/invoices" className="btn btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}>View All</Link>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Client</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length > 0 ? invoices.slice(0,5).map(inv => {
                  const client = clients.find(c => c.id === inv.clientId);
                  return (
                    <tr key={inv.id}>
                      <td style={{ fontWeight: 500, color: 'var(--primary-color)' }}>#{inv.id}</td>
                      <td>{client?.name || 'Unknown'}</td>
                      <td>{inv.date}</td>
                      <td style={{ fontWeight: 600 }}>Rp {inv.amount.toLocaleString('id-ID')}</td>
                      <td>
                        <span className={`badge ${
                          inv.status === 'Paid' ? 'badge-success' : 
                          inv.status === 'Overdue' ? 'badge-danger' : 
                          inv.status === 'Sent' ? 'badge-warning' : 'badge-secondary'
                        }`}>{inv.status}</span>
                      </td>
                    </tr>
                  )
                }) : (
                  <tr><td colSpan={5} style={{textAlign: 'center', padding: '2rem'}}>No recent invoices</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Pending Profit Sharing</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {pendingSharingInvoices.length > 0 ? pendingSharingInvoices.slice(0, 3).map(inv => {
              const client = clients.find(c => c.id === inv.clientId);
              return (
                <div key={inv.id} style={{ padding: '1rem', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 500 }}>{inv.id}</span>
                    <span className="badge badge-warning">Needs Approval</span>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{client?.name}</div>
                </div>
              );
            }) : (
              <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)' }}>No pending sharing</div>
            )}
            
            <Link to="/profit-sharing/calculate" className="btn btn-secondary" style={{ width: '100%', marginTop: '0.5rem' }}>
              Calculate Sharing
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
