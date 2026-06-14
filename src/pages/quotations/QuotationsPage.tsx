import { Plus, Search, FileSignature, CheckCircle, XCircle, Clock, FileText, Eye } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { useApp, type Quotation } from "../../context/AppContext";

export default function QuotationsPage() {
  const { quotations, clients, updateQuotation, companyName, companyAddress } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewingQuotation, setViewingQuotation] = useState<Quotation | null>(null);
  const navigate = useNavigate();

  const filteredQuotations = quotations.filter(q => {
    const client = clients.find(c => c.id === q.clientId);
    return (
      q.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client && client.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Accepted': return <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><CheckCircle size={14} /> Accepted</span>;
      case 'Rejected': return <span className="badge badge-danger" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><XCircle size={14} /> Rejected</span>;
      case 'Sent': return <span className="badge badge-warning" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Clock size={14} /> Sent</span>;
      default: return <span className="badge badge-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><FileSignature size={14} /> Draft</span>;
    }
  };

  const handleStatusChange = (id: string, newStatus: 'Draft' | 'Sent' | 'Accepted' | 'Rejected') => {
    const q = quotations.find(quo => quo.id === id);
    if (q) updateQuotation({ ...q, status: newStatus });
  };

  const convertToInvoice = (q: any) => {
    // Pass the quotation data to create invoice page via router state
    navigate("/invoices/create", { state: { quotationId: q.id } });
  };

  const viewingGanttData = useMemo(() => {
    if (!viewingQuotation || !viewingQuotation.sow || viewingQuotation.sow.length === 0) return null;
    
    const validSow = viewingQuotation.sow.filter(s => s.startDate && s.endDate && new Date(s.endDate) >= new Date(s.startDate));
    if (validSow.length === 0) return null;

    let minTime = Infinity;
    let maxTime = -Infinity;
    
    validSow.forEach(s => {
      const start = new Date(s.startDate).getTime();
      const end = new Date(s.endDate).getTime();
      if (start < minTime) minTime = start;
      if (end > maxTime) maxTime = end;
    });

    const totalDuration = maxTime - minTime;
    const safeTotalDuration = totalDuration === 0 ? 86400000 : totalDuration; 

    const tasks = validSow.map((s, index) => {
      const start = new Date(s.startDate).getTime();
      const end = new Date(s.endDate).getTime();
      
      const leftPercent = ((start - minTime) / safeTotalDuration) * 100;
      const widthPercent = ((end - start) / safeTotalDuration) * 100;
      const daysDuration = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
      const color = colors[index % colors.length];

      return { ...s, leftPercent, widthPercent: Math.max(widthPercent, 1), daysDuration, color };
    });

    const minDateStr = new Date(minTime).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    const maxDateStr = new Date(maxTime).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    const totalDays = Math.ceil(safeTotalDuration / (1000 * 60 * 60 * 24));

    return { tasks, minDateStr, maxDateStr, totalDays };
  }, [viewingQuotation]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title">Quotations</h1>
          <div style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Manage and convert quotations</div>
        </div>
        <Link to="/quotations/create" className="btn btn-primary">
          <Plus size={18} />
          Create Quotation
        </Link>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search quotations..." 
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
                <th>Quotation ID</th>
                <th>Client</th>
                <th>Date</th>
                <th>Valid Until</th>
                <th>Amount</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuotations.length > 0 ? filteredQuotations.map(q => {
                const client = clients.find(c => c.id === q.clientId);
                return (
                  <tr key={q.id}>
                    <td style={{ fontWeight: 600 }}>{q.id}</td>
                    <td>{client?.name || 'Unknown Client'}</td>
                    <td>{q.date}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{q.validUntil}</td>
                    <td style={{ fontWeight: 600 }}>Rp {q.grandTotal.toLocaleString('id-ID')}</td>
                    <td>{getStatusBadge(q.status)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        {/* Status Toggle Buttons */}
                        {q.status !== 'Accepted' && q.status !== 'Rejected' && (
                          <>
                            <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', color: 'var(--success-color)' }} title="Mark as Accepted" onClick={() => handleStatusChange(q.id, 'Accepted')}>
                              <CheckCircle size={16} />
                            </button>
                            <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', color: 'var(--danger-color)' }} title="Mark as Rejected" onClick={() => handleStatusChange(q.id, 'Rejected')}>
                              <XCircle size={16} />
                            </button>
                          </>
                        )}
                        
                        {q.status === 'Accepted' && (
                          <button className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} title="Convert to Invoice" onClick={() => convertToInvoice(q)}>
                            <FileText size={14} /> Convert
                          </button>
                        )}
                        <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }} title="View Quotation Document" onClick={() => setViewingQuotation(q)}>
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              }) : (
                <tr><td colSpan={7} style={{textAlign: 'center', padding: '2rem', color: 'var(--text-muted)'}}>No quotations found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Quotation Modal */}
      {viewingQuotation && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '2rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', backgroundColor: '#fff', padding: '0' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 10 }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Quotation Document</h2>
                {getStatusBadge(viewingQuotation.status)}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {viewingQuotation.status === 'Accepted' && (
                  <button className="btn btn-primary" onClick={() => convertToInvoice(viewingQuotation)}>
                    <FileText size={16} /> Convert to Invoice
                  </button>
                )}
                <button className="btn btn-secondary" onClick={() => setViewingQuotation(null)}>Close</button>
              </div>
            </div>

            {/* Document Body */}
            <div style={{ padding: '3rem' }}>
              
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3rem' }}>
                <div>
                  <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary-color)', marginBottom: '0.5rem', letterSpacing: '-1px' }}>QUOTATION</h1>
                  <div style={{ color: 'var(--text-muted)' }}>#{viewingQuotation.id}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>{companyName || 'Your Company Ltd'}</h2>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', whiteSpace: 'pre-line' }}>{companyAddress || '123 Business Avenue\nTech District\nCity, Country'}</div>
                </div>
              </div>

              {/* Meta */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3rem', padding: '1.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.25rem' }}>Quotation For</div>
                  <div style={{ fontWeight: 600, fontSize: '1.125rem' }}>{clients.find(c => c.id === viewingQuotation.clientId)?.name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{clients.find(c => c.id === viewingQuotation.clientId)?.email}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '0.5rem 1.5rem', textAlign: 'left' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Issue Date</div>
                    <div style={{ fontWeight: 500 }}>{viewingQuotation.date}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Valid Until</div>
                    <div style={{ fontWeight: 500 }}>{viewingQuotation.validUntil}</div>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div style={{ marginBottom: '3rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '1rem 0', textAlign: 'left', fontWeight: 600 }}>Description</th>
                      <th style={{ padding: '1rem 0', textAlign: 'center', fontWeight: 600 }}>Qty</th>
                      <th style={{ padding: '1rem 0', textAlign: 'right', fontWeight: 600 }}>Price</th>
                      <th style={{ padding: '1rem 0', textAlign: 'right', fontWeight: 600 }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingQuotation.isBundledView ? (
                      <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '1rem 0' }}>
                          <div style={{ fontWeight: 600, fontSize: '1.125rem' }}>{viewingQuotation.bundleName || 'Professional Services Package'}</div>
                          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>As per agreed Scope of Work and Timeline below.</div>
                        </td>
                        <td style={{ padding: '1rem 0', textAlign: 'center' }}>1</td>
                        <td style={{ padding: '1rem 0', textAlign: 'right' }}>Rp {viewingQuotation.subtotal.toLocaleString('id-ID')}</td>
                        <td style={{ padding: '1rem 0', textAlign: 'right', fontWeight: 600 }}>Rp {viewingQuotation.subtotal.toLocaleString('id-ID')}</td>
                      </tr>
                    ) : (
                      viewingQuotation.items.map((item, i) => {
                        const marginRate = item.dailyRate + (item.dailyRate * (viewingQuotation.marginPercentage / 100));
                        const marginTotal = item.totalCost + (item.totalCost * (viewingQuotation.marginPercentage / 100));
                        return (
                          <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '1rem 0' }}>
                              <div style={{ fontWeight: 500 }}>{item.name || 'Resource / Item'}</div>
                            </td>
                            <td style={{ padding: '1rem 0', textAlign: 'center' }}>{item.quantity}</td>
                            <td style={{ padding: '1rem 0', textAlign: 'right' }}>Rp {marginRate.toLocaleString('id-ID')}</td>
                            <td style={{ padding: '1rem 0', textAlign: 'right', fontWeight: 500 }}>Rp {marginTotal.toLocaleString('id-ID')}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '3rem' }}>
                <div style={{ width: '300px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', color: 'var(--text-muted)' }}>
                    <span>Subtotal</span>
                    <span>Rp {viewingQuotation.subtotal.toLocaleString('id-ID')}</span>
                  </div>
                  {viewingQuotation.taxAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>
                      <span>Tax</span>
                      <span>Rp {viewingQuotation.taxAmount.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0', fontWeight: 700, fontSize: '1.25rem', color: 'var(--primary-color)' }}>
                    <span>Grand Total</span>
                    <span>Rp {viewingQuotation.grandTotal.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>

              {/* Gantt Chart SOW */}
              {viewingGanttData && (
                <div style={{ marginBottom: '3rem', pageBreakInside: 'avoid' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Scope of Work & Timeline</h3>
                  <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
                    <div style={{ position: 'relative', paddingTop: '2rem', paddingBottom: '1rem' }}>
                      <div style={{ position: 'absolute', top: '1.5rem', bottom: 0, left: '150px', right: 0, display: 'flex', justifyContent: 'space-between' }}>
                        {[0, 25, 50, 75, 100].map(pct => (
                          <div key={pct} style={{ position: 'relative', width: '1px', backgroundColor: 'var(--border-color)' }}>
                            {pct === 0 && <span style={{ position: 'absolute', top: '-1.5rem', left: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{viewingGanttData.minDateStr}</span>}
                            {pct === 100 && <span style={{ position: 'absolute', top: '-1.5rem', right: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{viewingGanttData.maxDateStr}</span>}
                          </div>
                        ))}
                      </div>

                      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {viewingGanttData.tasks.map(t => (
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
                </div>
              )}

              {/* Terms and Notes */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', fontSize: '0.875rem' }}>
                {viewingQuotation.terms && (
                  <div>
                    <h4 style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Terms & Conditions</h4>
                    <div style={{ whiteSpace: 'pre-line', color: 'var(--text-secondary)' }}>{viewingQuotation.terms}</div>
                  </div>
                )}
                {viewingQuotation.notes && (
                  <div>
                    <h4 style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Additional Notes</h4>
                    <div style={{ whiteSpace: 'pre-line', color: 'var(--text-secondary)' }}>{viewingQuotation.notes}</div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
