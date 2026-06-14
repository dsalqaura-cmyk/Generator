import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider, useApp } from "./context/AppContext";

import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Dashboard from "./pages/Dashboard";
import ClientsPage from "./pages/ClientsPage";
import InvoicesPage from "./pages/invoices/InvoicesPage";
import CreateInvoicePage from "./pages/invoices/CreateInvoicePage";
import PaymentsPage from "./pages/PaymentsPage";
import ExpensesPage from "./pages/ExpensesPage";
import ProfitSharingPage from "./pages/profit-sharing/ProfitSharingPage";
import CalculateProfitSharingPage from "./pages/profit-sharing/CalculateProfitSharingPage";
import SettingsPage from "./pages/SettingsPage";
import LoginPage from "./pages/auth/LoginPage";
import AccountsPage from "./pages/auth/AccountsPage";
import QuotationsPage from "./pages/quotations/QuotationsPage";
import CreateQuotationPage from "./pages/quotations/CreateQuotationPage";



function AppLayout() {
  const { user, isLoadingAuth } = useApp();

  if (isLoadingAuth) {
    return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>Authenticating...</div>;
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <Topbar />
        <main className="page-content">
          <Routes>
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="/" element={<Dashboard />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/quotations" element={<QuotationsPage />} />
            <Route path="/quotations/create" element={<CreateQuotationPage />} />
            <Route path="/invoices" element={<InvoicesPage />} />
            <Route path="/invoices/create" element={<CreateInvoicePage />} />
            <Route path="/payments" element={<PaymentsPage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/profit-sharing" element={<ProfitSharingPage />} />
            <Route path="/profit-sharing/calculate" element={<CalculateProfitSharingPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/accounts" element={<AccountsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <Router>
        <AppLayout />
      </Router>
    </AppProvider>
  );
}

export default App;
