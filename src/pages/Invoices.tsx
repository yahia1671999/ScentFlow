/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Eye, 
  Download, 
  Printer, 
  Calendar,
  User,
  CreditCard
} from 'lucide-react';
import { useStore } from '../store.tsx';
import { motion, AnimatePresence } from 'motion/react';
import { PageWrapper, Card } from '../components/Common.tsx';
import { cn } from '../lib/utils.ts';

export default function Invoices() {
  const { sales, purchases, customers, suppliers, t, language } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'SALES' | 'PURCHASES'>('SALES');

  const filteredData = (activeTab === 'SALES' ? sales : purchases).filter(item => {
    if (activeTab === 'SALES') {
      const customer = customers.find(c => c.id === item.customerId);
      return (
        item.id.includes(searchTerm) ||
        (customer && customer.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    } else {
      const supplier = suppliers.find(s => s.id === item.supplierId);
      return (
        item.id.includes(searchTerm) ||
        item.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (supplier && supplier.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
  }).sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());

  const handlePrint = (item: any) => {
    const isSale = activeTab === 'SALES';
    const party = isSale 
      ? customers.find(c => c.id === item.customerId)
      : suppliers.find(s => s.id === item.supplierId);
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const receiptHtml = `
        <html dir="${language === 'ar' ? 'rtl' : 'ltr'}">
          <head>
            <title>Invoice ${item.id}</title>
            <style>
              body { font-family: sans-serif; padding: 20px; width: 300px; line-height: 1.4; color: #333; }
              .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 15px; }
              .item { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
              .total-row { border-top: 2px solid #000; margin-top: 15px; padding-top: 15px; font-weight: bold; font-size: 18px; }
              .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
              h2 { margin: 0; color: #d97706; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>ScentFlow</h2>
              <p>${new Date(item.createdAt || item.date).toLocaleString()}</p>
              <p>${t('invoiceNumber')}: ${item.invoiceNumber || item.id}</p>
              ${party ? `<p>${isSale ? t('customer') : t('suppliers')}: ${party.name}</p>` : ''}
            </div>
            <div class="items">
              ${item.items.map((it: any) => `
                <div class="item">
                  <span>${it.name || it.productId} x${it.quantity}</span>
                  <span>${(it.totalPrice || 0).toFixed(2)}</span>
                </div>
              `).join('')}
            </div>
            <div class="total-row">
              <div class="item">
                <span>${t('total')}</span>
                <span>${(item.total || 0).toFixed(2)} ${t('currency')}</span>
              </div>
            </div>
            <div class="footer">
              <p>${language === 'ar' ? 'شكراً لتعاملكم معنا!' : 'Thank you for your business!'}</p>
            </div>
          </body>
        </html>
      `;
      printWindow.document.write(receiptHtml);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 300);
    }
  };

  return (
    <PageWrapper>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 tracking-tight flex items-center gap-3">
            <FileText className="text-amber-600 w-8 h-8" />
            {t('invoices')}
          </h2>
          <p className="text-zinc-500 text-sm tracking-wide">{t('invoicesSubtitle')}</p>
        </div>
      </div>

      <div className="flex gap-4 mb-8">
        <button 
          onClick={() => setActiveTab('SALES')}
          className={cn(
            "flex-1 py-3 rounded-2xl font-bold tracking-widest text-xs uppercase transition-all",
            activeTab === 'SALES' ? "bg-amber-600 text-white shadow-lg shadow-amber-900/20" : "bg-zinc-950 border border-zinc-800 text-zinc-500 hover:text-zinc-300"
          )}
        >
          {t('sales')}
        </button>
        <button 
          onClick={() => setActiveTab('PURCHASES')}
          className={cn(
            "flex-1 py-3 rounded-2xl font-bold tracking-widest text-xs uppercase transition-all",
            activeTab === 'PURCHASES' ? "bg-amber-600 text-white shadow-lg shadow-amber-900/20" : "bg-zinc-950 border border-zinc-800 text-zinc-500 hover:text-zinc-300"
          )}
        >
          {t('purchases')}
        </button>
      </div>

      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
        <input 
          type="text" 
          placeholder={t('search')} 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl pl-12 pr-6 py-4 text-white focus:outline-none focus:border-amber-600 transition-all placeholder:text-zinc-600"
        />
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden overflow-x-auto shadow-2xl">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-zinc-900/50 border-bottom border-zinc-800">
              <th className="px-6 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('id' as any)}</th>
              <th className="px-6 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('invoiceDate' as any)}</th>
              <th className="px-6 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{activeTab === 'SALES' ? t('customer' as any) : t('suppliers')}</th>
              <th className="px-6 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('totalPrice')}</th>
              <th className="px-6 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('paymentMethods')}</th>
              <th className="px-6 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/30">
            {filteredData.map((item, idx) => {
              const party = activeTab === 'SALES' 
                ? customers.find(c => c.id === item.customerId)
                : suppliers.find(s => s.id === item.supplierId);
              return (
                <tr key={`${item.id}-${idx}`} className="hover:bg-zinc-900/30 transition-colors">
                  <td className="px-6 py-5">
                    <span className="text-zinc-500 font-mono text-xs">#{item.invoiceNumber || item.id.slice(-6)}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-zinc-300 text-sm">
                      <Calendar className="w-4 h-4 text-zinc-600" />
                      {new Date(item.date || item.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-sm font-medium text-white">
                    <div className="flex items-center gap-2">
                       <User className="w-4 h-4 text-zinc-600" />
                       {party ? party.name : (activeTab === 'SALES' ? 'Walk-in' : 'Unknown')}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-amber-500 font-bold text-sm">
                    {(item.total || 0).toFixed(2)} {t('currency')}
                  </td>
                  <td className="px-6 py-5">
                    <span className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded-md text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      {item.paymentMethod ? t(item.paymentMethod.toLowerCase() as any) : t('healthyLabel')}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setSelectedInvoice(item)}
                        className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-500 hover:text-amber-500 hover:border-amber-600/30 transition-all"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handlePrint(item)}
                        className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-500 hover:text-white hover:border-emerald-600/30 transition-all"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Invoice Detail Modal */}
      <AnimatePresence>
        {selectedInvoice && (
          <div key="invoice-modal-overlay" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedInvoice(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-lg relative overflow-hidden"
            >
              <div className="p-8">
                <div className="flex justify-between items-start mb-8 text-right">
                   <div>
                     <h3 className="text-2xl font-bold text-white mb-2">ScentFlow Invoice</h3>
                     <p className="text-zinc-500 text-sm">{new Date(selectedInvoice.createdAt).toLocaleString()}</p>
                   </div>
                   <div className="bg-amber-600/10 border border-amber-600/20 px-4 py-2 rounded-xl">
                      <span className="text-amber-600 font-bold text-xs">#{selectedInvoice.id}</span>
                   </div>
                </div>

                <div className="space-y-4 mb-8">
                  {selectedInvoice.items.map((item: any, idx: number) => (
                    <div key={item.id || `${item.productId}-${idx}`} className="flex justify-between text-zinc-300 text-sm">
                      <span>{item.name} x{item.quantity}</span>
                      <span className="font-mono">{(item.totalPrice || 0).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-zinc-800 flex justify-between items-center mb-8">
                   <div className="text-zinc-500 font-bold text-sm uppercase tracking-widest">{t('total')}</div>
                   <div className="text-2xl font-bold text-amber-500">{(selectedInvoice.total || 0).toFixed(2)} {t('currency')}</div>
                </div>

                <button 
                  onClick={() => handlePrint(selectedInvoice)}
                  className="w-full py-4 bg-zinc-900 border border-zinc-800 text-white rounded-xl font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center justify-center gap-3"
                >
                  <Printer className="w-5 h-5" />
                  Print Invoice
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
