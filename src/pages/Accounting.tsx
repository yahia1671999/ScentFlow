/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PageWrapper, Header, Card, StatCard } from '../components/Common.tsx';
import { useStore } from '../store.tsx';
import * as XLSX from 'xlsx';
import { 
  CreditCard, 
  Wallet, 
  Banknote, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  ArrowRight,
  Filter,
  DollarSign,
  Download,
  Calendar as CalendarIcon,
  Upload
} from 'lucide-react';
import { cn } from '../lib/utils.ts';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

export default function Accounting() {
  const { expenses, sales, purchases, returns, addExpense, updateSupplier, suppliers, t, language } = useStore();
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filterByDate = (date: string) => {
    if (!dateFrom && !dateTo) return true;
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    
    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      if (d < from) return false;
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      if (d > to) return false;
    }
    return true;
  };

  const filteredSales = sales.filter(s => filterByDate(s.createdAt));
  const filteredExpenses = expenses.filter(e => filterByDate(e.date));
  const filteredPurchases = purchases.filter(p => filterByDate(p.date));
  const filteredReturns = returns.filter(r => filterByDate(r.date));

  const handleExpenseSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await addExpense({
      description: formData.get('description') as string,
      amount: Number(formData.get('amount')),
      category: formData.get('category') as string,
    });
    setIsAddingExpense(false);
  };

  const handleSettle = async (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    if (!supplier) return;
    
    setIsSettling(true);
    try {
      const amount = supplier.balance;
      await updateSupplier(supplierId, { balance: 0 });
      await addExpense({
        description: `Settled balance for ${supplier.name}`,
        amount: amount,
        category: 'Suppliers',
      });
      alert(t('transactionComplete'));
    } finally {
      setIsSettling(false);
    }
  };

  const totalRevenue = filteredSales.reduce((acc, s) => acc + s.total, 0) - 
                       filteredReturns.filter(r => r.type === 'SALE').reduce((acc, r) => acc + r.totalAmount, 0);

  const totalExpenses = filteredExpenses.reduce((acc, e) => acc + e.amount, 0) + 
                        filteredPurchases.reduce((acc, p) => acc + p.paidAmount, 0) -
                        filteredReturns.filter(r => r.type === 'PURCHASE').reduce((acc, r) => acc + r.totalAmount, 0);
  
  const netProfit = totalRevenue - totalExpenses;

  // Combine all transactions
  const allTransactions = [
    ...filteredSales.map(s => ({ id: s.id, type: 'SALE', amount: s.total, date: s.createdAt, desc: t('saleInvoice') })),
    ...filteredExpenses.map(e => ({ id: e.id, type: 'EXPENSE', amount: e.amount, date: e.date, desc: e.description })),
    ...filteredPurchases.map(p => ({ 
      id: p.id, 
      type: 'PURCHASE', 
      amount: p.paidAmount, 
      date: p.date, 
      desc: `${t('purchaseInvoice')} (${suppliers.find(s => s.id === p.supplierId)?.name || 'Supplier'})` 
    })),
    ...filteredReturns.map(r => ({ 
      id: r.id, 
      type: 'RETURN', 
      amount: r.totalAmount, 
      date: r.date, 
      desc: `${r.type === 'SALE' ? t('saleReturn') : t('purchaseReturn')}: ${r.reason}`,
      returnType: r.type 
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleExportExcel = () => {
    const dataToExport = allTransactions.map(tx => ({
      ID: tx.id,
      Type: tx.type,
      Description: tx.desc,
      Amount: tx.amount,
      Date: new Date(tx.date).toLocaleDateString(),
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    XLSX.writeFile(wb, `accounting_report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      console.log("Imported data:", data);
      alert(t('experimentalImport'));
    };
    reader.readAsBinaryString(file);
  };

  const paymentMethods = [
    { name: t('cash'), key: 'CASH' },
    { name: t('wallet'), key: 'WALLET' },
    { name: t('bankTransfer'), key: 'BANK' },
    { name: t('mobile'), key: 'CARD' }
  ];

  const methodDistribution = paymentMethods.map(method => {
    const methodSales = filteredSales.filter(s => s.paymentMethod === method.key);
    const methodTotal = methodSales.reduce((acc, s) => acc + s.total, 0);
    const percentage = totalRevenue > 0 ? (methodTotal / totalRevenue) * 100 : 0;
    return { ...method, total: methodTotal, percentage };
  });

  return (
    <PageWrapper>
      <Header 
        title={t('cashAccounting')} 
        subtitle={t('accountingSubtitle')}
        actions={
          <div className="flex flex-wrap gap-2">
            <label className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg font-bold flex items-center gap-2 hover:bg-zinc-700 transition-colors cursor-pointer border border-zinc-700">
              <Upload className="w-4 h-4" />
              {t('import')}
              <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleImportExcel} />
            </label>
            <button 
              onClick={handleExportExcel}
              className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg font-bold flex items-center gap-2 hover:bg-zinc-700 transition-colors border border-zinc-700"
            >
              <Download className="w-4 h-4" />
              {t('export')}
            </button>
            <button 
              onClick={() => setIsAddingExpense(true)}
              className="px-4 py-2 bg-rose-600 text-white rounded-lg font-bold flex items-center gap-2 hover:bg-rose-700 transition-colors shadow-lg shadow-rose-900/20"
            >
              <Plus className="w-4 h-4" />
              {t('recordExpense')}
            </button>
          </div>
        }
      />

      <Card className="mb-8 p-4 bg-zinc-950/50">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-amber-600" />
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">{t('dateRange')}</span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-zinc-600" />
            <input 
              type="date" 
              value={dateFrom} 
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-600"
            />
            <span className="text-zinc-600">—</span>
            <input 
              type="date" 
              value={dateTo} 
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-600"
            />
            {(dateFrom || dateTo) && (
              <button 
                onClick={() => { setDateFrom(''); setDateTo(''); }}
                className="text-[10px] uppercase font-bold text-rose-500 hover:text-rose-400"
              >
                {t('clear')}
              </button>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <StatCard 
          label={t('revenue')} 
          value={`${totalRevenue.toLocaleString()}`} 
          unit={t('currency')}
          icon={TrendingUp} 
          color="bg-emerald-500" 
        />
        <StatCard 
          label={t('expenses')} 
          value={`${totalExpenses.toLocaleString()}`} 
          unit={t('currency')}
          icon={TrendingDown} 
          color="bg-rose-500" 
        />
        <StatCard 
          label={t('netProfit')} 
          value={`${netProfit.toLocaleString()}`} 
          unit={t('currency')}
          icon={Banknote} 
          color="bg-amber-500" 
        />
        <StatCard 
          label={t('cashRegister')} 
          value={`${sales.filter(s => s.paymentMethod === 'CASH').reduce((acc, s) => acc + s.total, 0).toLocaleString()}`} 
          unit={t('currency')}
          icon={Wallet} 
          color="bg-blue-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
           <Card className="p-0">
              <div className="px-6 py-4 border-b border-zinc-900 flex items-center justify-between">
                 <h3 className="font-bold text-white uppercase tracking-widest text-[10px] md:text-xs">{t('recentTransactions')}</h3>
                 <div className="flex gap-2">
                    <button className="p-2 text-zinc-500 hover:text-white transition-colors">
                       <Filter className="w-4 h-4" />
                    </button>
                 </div>
              </div>
              <div className="divide-y divide-zinc-900">
                 {allTransactions.slice(0, 20).map((tx, idx) => (
                   <div key={`${tx.id}-${idx}`} className="px-4 md:px-6 py-4 flex items-center justify-between hover:bg-zinc-900/30 transition-colors">
                      <div className="flex items-center gap-3 md:gap-4 shrink-0">
                        <div className={cn(
                          "w-8 h-8 md:w-10 md:h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center",
                          tx.type === 'SALE' || (tx.type === 'RETURN' && (tx as any).returnType === 'PURCHASE') ? "text-emerald-500" : "text-rose-500"
                        )}>
                          {(tx.type === 'SALE' || (tx.type === 'RETURN' && (tx as any).returnType === 'PURCHASE')) ? <Plus className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        </div>
                        <div className="truncate">
                          <p className="text-xs md:text-sm font-bold text-white truncate max-w-[150px] md:max-w-xs">{tx.desc}</p>
                          <p className="text-[10px] text-zinc-500 font-mono uppercase truncate">{tx.type} #{tx.id.slice(-6)}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                         <p className={cn(
                           "text-sm font-mono font-bold",
                           tx.type === 'SALE' || (tx.type === 'RETURN' && (tx as any).returnType === 'PURCHASE') ? "text-emerald-500" : "text-rose-500"
                         )}>
                           {(tx.type === 'SALE' || (tx.type === 'RETURN' && (tx as any).returnType === 'PURCHASE')) ? '+' : '-'}{(tx.amount || 0).toFixed(2)}
                         </p>
                         <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">{new Date(tx.date).toLocaleDateString()}</p>
                      </div>
                   </div>
                 ))}
              </div>
           </Card>
        </div>

        <div className="space-y-6">
           <Card title={t('paymentMethods')}>
              <div className="space-y-6">
                 {methodDistribution.map((method) => (
                    <div key={method.key}>
                       <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] md:text-xs font-bold text-zinc-400">{method.name}</span>
                          <span className="text-[10px] md:text-xs font-mono text-white font-bold">{(method.percentage || 0).toFixed(1)}%</span>
                       </div>
                       <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-600 rounded-full" style={{ width: `${method.percentage}%` }} />
                       </div>
                    </div>
                 ))}
              </div>
           </Card>

           <Card title={t('supplierBalances')}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                 {suppliers.map((s, idx) => (
                    <div key={`${s.id}-${idx}`} className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-start">
                       <p className="text-xs font-bold text-white mb-1 truncate">{s.name}</p>
                       <p className="text-sm font-mono text-rose-500 font-bold">{s.balance.toLocaleString()} {t('currency')}</p>
                       <button 
                        onClick={() => handleSettle(s.id)}
                        disabled={isSettling || s.balance === 0}
                        className="mt-3 w-full py-2 bg-zinc-800 text-zinc-400 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors disabled:opacity-50"
                       >
                          {t('settleBalance')}
                       </button>
                    </div>
                 ))}
                 <button className="w-full py-3 border border-dashed border-zinc-800 rounded-xl text-zinc-600 hover:text-amber-600 hover:border-amber-600/50 transition-all font-bold text-[10px] md:text-xs uppercase tracking-widest sm:col-span-2 lg:col-span-1">
                    {t('manageSuppliers')}
                 </button>
              </div>
           </Card>
        </div>
      </div>

      <AnimatePresence>
        {isAddingExpense && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingExpense(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-white">{t('recordExpense')}</h3>
                <button onClick={() => setIsAddingExpense(false)} className="p-2 hover:bg-zinc-900 rounded-full transition-colors">
                  <X className="w-5 h-5 text-zinc-500" />
                </button>
              </div>

              <form onSubmit={handleExpenseSubmit} className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">{t('productName')}</label>
                  <input name="description" required className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-600" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">{t('quantity')}</label>
                    <input name="amount" type="number" required className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-600" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">{t('productType')}</label>
                    <select name="category" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-600">
                      <option>Rent</option>
                      <option>Utilities</option>
                      <option>Oils</option>
                      <option>Bottles</option>
                      <option>Staff</option>
                      <option>Marketing</option>
                    </select>
                  </div>
                </div>

                <button className="w-full py-4 bg-rose-600 text-white rounded-xl font-bold uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-900/20">
                  {t('recordExpense')}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
