import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { supabase } from "../lib/supabase";
import type { Session } from "@supabase/supabase-js";

// Types
export interface Client { id: string; name: string; email: string; phone: string; address: string; status?: 'Active' | 'Inactive'; user_id?: string; }
export interface InvoiceTerm { id: string; name: string; amount: number; dueDate: string; status: 'Unpaid' | 'Paid'; }
export interface Quotation {
  id: string; clientId: string; date: string; validUntil: string;
  items: { id: string; name: string; type: string; sowId?: string; quantity: number; dailyRate: number; totalCost: number }[];
  sow: { id: string; task: string; startDate: string; endDate: string }[];
  totalEstimatedCost: number; marginPercentage: number; subtotal: number; taxAmount: number; grandTotal: number;
  isBundledView: boolean; bundleName: string; terms: string; notes: string;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected'; user_id?: string;
}
export interface Invoice { id: string; clientId: string; date: string; dueDate: string; items: { description: string; quantity: number; price: number }[]; amount: number; terms: InvoiceTerm[]; status: 'Draft' | 'Sent' | 'Partially Paid' | 'Paid' | 'Overdue'; user_id?: string; }
export interface Expense { id: string; name: string; category: string; date: string; amount: number; type: string; ref?: string; user_id?: string; }
export interface Payment { id: string; invoiceId: string; termId?: string; termName?: string; date: string; amount: number; method: string; user_id?: string; }
export interface Participant { id: string; name: string; type: string; bankAccount: string; status: string; user_id?: string; }
export interface Scheme { id: string; name: string; base: string; expenseDeduction: string; allocations: { participantId: string; percentage: number }[]; status: string; user_id?: string; }
export interface DistributionRecord { id: string; date: string; invoiceId: string; termId: string; schemeId: string; termRevenue: number; deductedExpense: number; netDistributable: number; breakdown: { participantName: string; bankAccount: string; amount: number }[]; user_id?: string; }

export interface User {
  id: string;
  email: string;
  role: 'superadmin' | 'company';
}

interface AppContextType {
  user: User | null;
  session: Session | null;
  isLoadingAuth: boolean;
  logout: () => Promise<void>;
  refreshData: () => Promise<void>;

  systemLogo: string | null; companyName: string; companyAddress: string; updateSettings: (logo: string | null, name: string, address: string) => Promise<boolean>;
  clients: Client[]; addClient: (c: Client) => Promise<boolean>; updateClient: (c: Client) => Promise<boolean>; deleteClient: (id: string) => Promise<boolean>;
  quotations: Quotation[]; addQuotation: (q: Quotation) => Promise<boolean>; updateQuotation: (q: Quotation) => Promise<boolean>; deleteQuotation: (id: string) => Promise<boolean>;
  invoices: Invoice[]; addInvoice: (i: Invoice) => Promise<boolean>; updateInvoiceStatus: (id: string, status: Invoice["status"]) => Promise<boolean>; updateInvoiceTermStatus: (invoiceId: string, termId: string, status: 'Unpaid' | 'Paid') => Promise<boolean>;
  expenses: Expense[]; addExpense: (e: Expense) => Promise<boolean>; updateExpense: (e: Expense) => Promise<boolean>; deleteExpense: (id: string) => Promise<boolean>;
  payments: Payment[]; addPayment: (p: Payment) => Promise<boolean>;
  participants: Participant[]; addParticipant: (p: Participant) => Promise<boolean>; updateParticipant: (p: Participant) => Promise<boolean>; deleteParticipant: (id: string) => Promise<boolean>;
  schemes: Scheme[]; addScheme: (s: Scheme) => Promise<boolean>; updateScheme: (s: Scheme) => Promise<boolean>; deleteScheme: (id: string) => Promise<boolean>;
  distributions: DistributionRecord[]; addDistribution: (d: DistributionRecord) => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // Auth
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // App Data States
  const [systemLogo, setSystemLogo] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("My Company");
  const [companyAddress, setCompanyAddress] = useState("Jakarta, Indonesia");
  const [clients, setClients] = useState<Client[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [distributions, setDistributions] = useState<DistributionRecord[]>([]);

  // Auth Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUserRole(session.user.id, session.user.email!);
      else setIsLoadingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchUserRole(session.user.id, session.user.email!);
      else {
        setUser(null);
        setIsLoadingAuth(false);
        setClients([]); setQuotations([]); setInvoices([]); setExpenses([]);
        setPayments([]); setParticipants([]); setSchemes([]); setDistributions([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string, email: string) => {
    try {
      if (email === 'superadmin@salqaura.com') {
        setUser({ id: userId, email, role: 'superadmin' });
        fetchData();
        return;
      }

      const { data } = await supabase.from('user_roles').select('role').eq('id', userId).single();
      const role = data?.role || 'company';
      setUser({ id: userId, email, role });
      fetchData();
    } catch (error) {
      console.error("Error fetching user role", error);
      setUser({ id: userId, email, role: 'company' });
      fetchData();
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  // ─── Data Fetching ───────────────────────────────────────────────
  const fetchData = async () => {
    try {
      const [
        { data: settings }, { data: clientsData }, { data: quotationsData },
        { data: invoicesData }, { data: expensesData }, { data: paymentsData },
        { data: participantsData }, { data: schemesData }, { data: distData }
      ] = await Promise.all([
        supabase.from('app_settings').select('*').limit(1).single(),
        supabase.from('clients').select('*').order('created_at', { ascending: false }),
        supabase.from('quotations').select('*').order('created_at', { ascending: false }),
        supabase.from('invoices').select('*').order('created_at', { ascending: false }),
        supabase.from('expenses').select('*').order('created_at', { ascending: false }),
        supabase.from('payments').select('*').order('created_at', { ascending: false }),
        supabase.from('participants').select('*').order('created_at', { ascending: false }),
        supabase.from('schemes').select('*').order('created_at', { ascending: false }),
        supabase.from('distributions').select('*').order('created_at', { ascending: false })
      ]);

      if (settings) {
        if (settings.systemLogo) setSystemLogo(settings.systemLogo);
        if (settings.companyName) setCompanyName(settings.companyName);
        if (settings.companyAddress) setCompanyAddress(settings.companyAddress);
      }
      if (clientsData) setClients(clientsData as Client[]);
      if (quotationsData) setQuotations(quotationsData as Quotation[]);
      if (invoicesData) setInvoices(invoicesData as Invoice[]);
      if (expensesData) setExpenses(expensesData as Expense[]);
      if (paymentsData) setPayments(paymentsData as Payment[]);
      if (participantsData) setParticipants(participantsData as Participant[]);
      if (schemesData) setSchemes(schemesData as Scheme[]);
      if (distData) setDistributions(distData as DistributionRecord[]);

    } catch (err) {
      console.error("Error fetching data from Supabase:", err);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  // ─── Helper: inject user_id into record ──────────────────────────
  const withUserId = <T extends { user_id?: string }>(record: T): T => ({
    ...record,
    user_id: user?.id,
  });

  // ─── Helper: handle Supabase error ───────────────────────────────
  const handleDbError = (action: string, error: { message: string } | null): boolean => {
    if (error) {
      console.error(`[Supabase ${action}]`, error);
      alert(`Gagal ${action}: ${error.message}`);
      return false;
    }
    return true;
  };

  // ─── Mutations ───────────────────────────────────────────────────

  const updateSettings = async (logo: string | null, name: string, address: string): Promise<boolean> => {
    const { data: existing } = await supabase.from('app_settings').select('id').limit(1).single();
    const settingsId = existing?.id || Date.now().toString();
    const record = { id: settingsId, systemLogo: logo, companyName: name, companyAddress: address, user_id: user?.id };
    const { error } = await supabase.from('app_settings').upsert(record);
    if (!handleDbError('simpan settings', error)) return false;
    setSystemLogo(logo); setCompanyName(name); setCompanyAddress(address);
    return true;
  };

  // ── Clients ──
  const addClient = async (c: Client): Promise<boolean> => {
    const record = withUserId(c);
    const { error } = await supabase.from('clients').insert([record]);
    if (!handleDbError('tambah client', error)) return false;
    setClients(prev => [record, ...prev]);
    return true;
  };

  const updateClient = async (c: Client): Promise<boolean> => {
    const record = withUserId(c);
    const { error } = await supabase.from('clients').update(record).eq('id', c.id);
    if (!handleDbError('update client', error)) return false;
    setClients(prev => prev.map(cl => cl.id === c.id ? record : cl));
    return true;
  };

  const deleteClient = async (id: string): Promise<boolean> => {
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (!handleDbError('hapus client', error)) return false;
    setClients(prev => prev.filter(cl => cl.id !== id));
    return true;
  };

  // ── Quotations ──
  const addQuotation = async (q: Quotation): Promise<boolean> => {
    const record = withUserId(q);
    const { error } = await supabase.from('quotations').insert([record]);
    if (!handleDbError('tambah quotation', error)) return false;
    setQuotations(prev => [record, ...prev]);
    return true;
  };

  const updateQuotation = async (q: Quotation): Promise<boolean> => {
    const record = withUserId(q);
    const { error } = await supabase.from('quotations').update(record).eq('id', q.id);
    if (!handleDbError('update quotation', error)) return false;
    setQuotations(prev => prev.map(qu => qu.id === q.id ? record : qu));
    return true;
  };

  const deleteQuotation = async (id: string): Promise<boolean> => {
    const { error } = await supabase.from('quotations').delete().eq('id', id);
    if (!handleDbError('hapus quotation', error)) return false;
    setQuotations(prev => prev.filter(qu => qu.id !== id));
    return true;
  };

  // ── Invoices ──
  const addInvoice = async (i: Invoice): Promise<boolean> => {
    const record = withUserId(i);
    const { error } = await supabase.from('invoices').insert([record]);
    if (!handleDbError('tambah invoice', error)) return false;
    setInvoices(prev => [record, ...prev]);
    return true;
  };

  const updateInvoiceStatus = async (id: string, status: Invoice["status"]): Promise<boolean> => {
    const { error } = await supabase.from('invoices').update({ status }).eq('id', id);
    if (!handleDbError('update status invoice', error)) return false;
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, status } : i));
    return true;
  };

  const updateInvoiceTermStatus = async (invoiceId: string, termId: string, termStatus: 'Unpaid' | 'Paid'): Promise<boolean> => {
    let targetInvoice: Invoice | undefined;
    setInvoices(prev => {
      targetInvoice = prev.find(i => i.id === invoiceId);
      return prev;
    });
    // Wait a tick for setState to flush, then read
    await new Promise(r => setTimeout(r, 0));
    if (!targetInvoice) return false;

    const updatedTerms = targetInvoice.terms.map(t => t.id === termId ? { ...t, status: termStatus } : t);
    const allPaid = updatedTerms.every(t => t.status === 'Paid');
    const anyPaid = updatedTerms.some(t => t.status === 'Paid');
    let newInvStatus: Invoice["status"] = targetInvoice.status;
    if (allPaid) newInvStatus = 'Paid'; else if (anyPaid) newInvStatus = 'Partially Paid'; else newInvStatus = 'Sent';

    const { error } = await supabase.from('invoices').update({ terms: updatedTerms, status: newInvStatus }).eq('id', invoiceId);
    if (!handleDbError('update termin invoice', error)) return false;

    setInvoices(prev => prev.map(inv => inv.id === invoiceId ? { ...inv, terms: updatedTerms, status: newInvStatus } : inv));
    return true;
  };

  // ── Expenses ──
  const addExpense = async (e: Expense): Promise<boolean> => {
    const record = withUserId(e);
    const { error } = await supabase.from('expenses').insert([record]);
    if (!handleDbError('tambah expense', error)) return false;
    setExpenses(prev => [record, ...prev]);
    return true;
  };

  const updateExpense = async (e: Expense): Promise<boolean> => {
    const record = withUserId(e);
    const { error } = await supabase.from('expenses').update(record).eq('id', e.id);
    if (!handleDbError('update expense', error)) return false;
    setExpenses(prev => prev.map(ex => ex.id === e.id ? record : ex));
    return true;
  };

  const deleteExpense = async (id: string): Promise<boolean> => {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (!handleDbError('hapus expense', error)) return false;
    setExpenses(prev => prev.filter(ex => ex.id !== id));
    return true;
  };

  // ── Payments ──
  const addPayment = async (p: Payment): Promise<boolean> => {
    const record = withUserId(p);
    const { error } = await supabase.from('payments').insert([record]);
    if (!handleDbError('catat payment', error)) return false;
    setPayments(prev => [record, ...prev]);
    return true;
  };

  // ── Participants ──
  const addParticipant = async (p: Participant): Promise<boolean> => {
    const record = withUserId(p);
    const { error } = await supabase.from('participants').insert([record]);
    if (!handleDbError('tambah participant', error)) return false;
    setParticipants(prev => [record, ...prev]);
    return true;
  };

  const updateParticipant = async (p: Participant): Promise<boolean> => {
    const record = withUserId(p);
    const { error } = await supabase.from('participants').update(record).eq('id', p.id);
    if (!handleDbError('update participant', error)) return false;
    setParticipants(prev => prev.map(pa => pa.id === p.id ? record : pa));
    return true;
  };

  const deleteParticipant = async (id: string): Promise<boolean> => {
    const { error } = await supabase.from('participants').delete().eq('id', id);
    if (!handleDbError('hapus participant', error)) return false;
    setParticipants(prev => prev.filter(pa => pa.id !== id));
    return true;
  };

  // ── Schemes ──
  const addScheme = async (s: Scheme): Promise<boolean> => {
    const record = withUserId(s);
    const { error } = await supabase.from('schemes').insert([record]);
    if (!handleDbError('tambah scheme', error)) return false;
    setSchemes(prev => [record, ...prev]);
    return true;
  };

  const updateScheme = async (s: Scheme): Promise<boolean> => {
    const record = withUserId(s);
    const { error } = await supabase.from('schemes').update(record).eq('id', s.id);
    if (!handleDbError('update scheme', error)) return false;
    setSchemes(prev => prev.map(sc => sc.id === s.id ? record : sc));
    return true;
  };

  const deleteScheme = async (id: string): Promise<boolean> => {
    const { error } = await supabase.from('schemes').delete().eq('id', id);
    if (!handleDbError('hapus scheme', error)) return false;
    setSchemes(prev => prev.filter(sc => sc.id !== id));
    return true;
  };

  // ── Distributions ──
  const addDistribution = async (d: DistributionRecord): Promise<boolean> => {
    const record = withUserId(d);
    const { error } = await supabase.from('distributions').insert([record]);
    if (!handleDbError('simpan distribusi', error)) return false;
    setDistributions(prev => [record, ...prev]);
    return true;
  };

  return (
    <AppContext.Provider value={{
      user, session, isLoadingAuth, logout, refreshData: fetchData,
      systemLogo, companyName, companyAddress, updateSettings,
      clients, addClient, updateClient, deleteClient,
      quotations, addQuotation, updateQuotation, deleteQuotation,
      invoices, addInvoice, updateInvoiceStatus, updateInvoiceTermStatus,
      expenses, addExpense, updateExpense, deleteExpense,
      payments, addPayment,
      participants, addParticipant, updateParticipant, deleteParticipant,
      schemes, addScheme, updateScheme, deleteScheme,
      distributions, addDistribution
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error("useApp must be used within an AppProvider");
  return context;
};
