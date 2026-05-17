/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  FlaskConical, 
  Package, 
  Users, 
  CreditCard, 
  MessageSquare, 
  BarChart3, 
  Settings,
  Shield,
  LogOut,
  Menu,
  X,
  Truck,
  FileText,
  Undo2,
  ListOrdered
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { StoreProvider, useStore } from './store.tsx';
import Dashboard from './pages/Dashboard.tsx';
import POS from './pages/POS.tsx';
import Inventory from './pages/Inventory.tsx';
import Customers from './pages/Customers.tsx';
import Accounting from './pages/Accounting.tsx';
import Marketing from './pages/Marketing.tsx';
import Reports from './pages/Reports.tsx';
import Suppliers from './pages/Suppliers.tsx';
import Invoices from './pages/Invoices.tsx';
import Purchases from './pages/Purchases.tsx';
import Returns from './pages/Returns.tsx';
import SettingsPage from './pages/Settings.tsx';
import SuperAdmin from './pages/SuperAdmin.tsx';
import Login from './pages/Login.tsx';
import { cn } from './lib/utils.ts';

const SidebarItem = ({ to, icon: Icon, label, tKey }: { to: string; icon: any; label: string; tKey?: string }) => {
  const { t } = useStore();
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
          isActive 
            ? "bg-amber-600 text-white shadow-lg shadow-amber-900/20" 
            : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
        )
      }
    >
      <Icon className="w-5 h-5 md:w-6 md:h-6 lg:w-5 lg:h-5 flex-shrink-0" />
      <span className="font-medium text-sm md:text-base lg:text-sm">{tKey ? t(tKey as any) : label}</span>
    </NavLink>
  );
};

const Sidebar = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { t, language, logout, settings, currentUser } = useStore();
  const isRtl = language === 'ar';

  const hasPermission = (modId: string) => {
    if (!currentUser) return false;
    
    // Super admin has all permissions
    if (currentUser.roles?.includes('super_admin')) return true;

    // Check specific module permissions
    // Mapping frontend module IDs to backend permission names
    const permissionMap: Record<string, string> = {
      'dashboard': 'view_sales',
      'pos': 'create_sales',
      'inventory': 'manage_inventory',
      'accounting': 'view_sales', // Accounting needs sales view
      'crm': 'create_sales',
      'marketing': 'create_sales',
      'reports': 'view_sales',
      'settings': 'manage_settings'
    };

    const requiredPermission = permissionMap[modId];
    if (!requiredPermission) return true; // Default to true if not mapped

    return currentUser.permissions?.includes(requiredPermission);
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/60 z-[60] md:hidden transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      <div className={cn(
        "w-64 h-screen bg-zinc-950 border-zinc-800 flex flex-col p-4 fixed top-0 z-[70] transition-transform duration-300 ease-in-out md:translate-x-0",
        isRtl ? "right-0 border-l" : "left-0 border-r",
        !isOpen && (isRtl ? "translate-x-full" : "-translate-x-full")
      )}>
        <div className="flex items-center justify-between gap-3 px-2 mb-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-900/40">
              <FlaskConical className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-tight truncate max-w-[120px]">{settings.companyName || 'ScentFlow'}</h1>
              <p className="text-amber-600/80 text-[10px] uppercase tracking-widest font-bold">{t('erpSubtitle')}</p>
            </div>
          </div>
          <button onClick={onClose} className="md:hidden text-zinc-500 hover:text-white p-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar">
          {hasPermission('dashboard') && <SidebarItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" tKey="dashboard" />}
          {currentUser.roles?.includes('super_admin') && <SidebarItem to="/admin" icon={Shield} label="SaaS Admin" />}
          {hasPermission('pos') && <SidebarItem to="/pos" icon={ShoppingCart} label="POS" tKey="pos" />}
          {hasPermission('inventory') && <SidebarItem to="/inventory" icon={Package} label="Inventory" tKey="inventory" />}
          {hasPermission('inventory') && <SidebarItem to="/purchases" icon={ListOrdered} label="Purchases" tKey="purchases" />}
          {hasPermission('pos') && <SidebarItem to="/returns" icon={Undo2} label="Returns" tKey="returns" />}
          {hasPermission('accounting') && <SidebarItem to="/invoices" icon={FileText} label="Invoices" tKey="invoices" />}
          {hasPermission('crm') && <SidebarItem to="/customers" icon={Users} label="Customers" tKey="crm" />}
          {hasPermission('inventory') && <SidebarItem to="/suppliers" icon={Truck} label="Suppliers" tKey="suppliers" />}
          {hasPermission('accounting') && <SidebarItem to="/accounting" icon={CreditCard} label="Accounting" tKey="accounting" />}
          {hasPermission('marketing') && <SidebarItem to="/marketing" icon={MessageSquare} label="Marketing" tKey="marketing" />}
          {hasPermission('reports') && <SidebarItem to="/reports" icon={BarChart3} label="Reports" tKey="reports" />}
        </nav>

        <div className="mt-auto pt-4 border-t border-zinc-800 space-y-2">
          {hasPermission('settings') && <SidebarItem to="/settings" icon={Settings} label="Settings" tKey="settings" />}
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-zinc-400 hover:bg-red-950/30 hover:text-red-400 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">{t('logout')}</span>
          </button>
          <div className="px-4 py-2 bg-zinc-900/50 rounded-xl border border-zinc-800/50 hidden md:block">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">{t('systemOnline')}</span>
            </div>
            <p className="text-[11px] text-zinc-400 font-mono">v1.0.4-stable</p>
          </div>
        </div>
      </div>
    </>
  );
};

const AppContent = () => {
  const { language, setLanguage, t, currentUser, logout } = useStore();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const isRtl = language === 'ar';

  if (!currentUser) {
    return <Login />;
  }

  return (
    <Router>
      <div 
        className={cn(
          "min-h-screen bg-zinc-900 text-zinc-100 flex font-sans selection:bg-amber-600/30",
          isRtl && "flex-row-reverse text-right"
        )}
        dir={isRtl ? "rtl" : "ltr"}
      >
        <div className="relative">
          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
          
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className={cn(
              "fixed top-4 z-[40] md:hidden w-10 h-10 bg-zinc-800 border border-zinc-700 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white transition-all shadow-xl",
              isRtl ? "right-4" : "left-4"
            )}
          >
            <Menu className="w-6 h-6" />
          </button>

          <button 
            onClick={() => setLanguage(isRtl ? 'en' : 'ar')}
            className={cn(
              "fixed bottom-4 z-[45] w-12 h-12 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center text-[10px] font-bold text-zinc-400 hover:text-white transition-all shadow-2xl",
              isRtl ? "left-4" : "right-4"
            )}
          >
            {isRtl ? 'EN' : 'AR'}
          </button>
        </div>
        <main className={cn(
          "flex-1 p-6 md:p-10 relative overflow-x-hidden min-h-screen",
          isRtl ? "md:mr-64 mr-0" : "md:ml-64 ml-0"
        )}>
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/admin" element={<SuperAdmin />} />
              <Route path="/pos" element={<POS />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/purchases" element={<Purchases />} />
              <Route path="/returns" element={<Returns />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/suppliers" element={<Suppliers />} />
              <Route path="/accounting" element={<Accounting />} />
              <Route path="/marketing" element={<Marketing />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<div className="p-10 text-center text-zinc-500">{t('underDevelopment')}</div>} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>
    </Router>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
