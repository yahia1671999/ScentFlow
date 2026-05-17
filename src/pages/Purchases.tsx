/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ListOrdered, 
  Plus, 
  Trash2, 
  Search, 
  Truck, 
  Package,
  Calendar,
  ChevronRight,
  ChevronLeft,
  X,
  Camera,
  CheckCircle2,
  AlertCircle,
  Eye,
  FlaskConical
} from 'lucide-react';
import { useStore } from '../store.tsx';
import { motion, AnimatePresence } from 'motion/react';
import { PageWrapper, Card } from '../components/Common.tsx';
import { ProductType, PurchaseItem } from '../types.ts';
import { cn } from '../lib/utils.ts';

export default function Purchases() {
  const { purchases, suppliers, products, addPurchase, t, language } = useStore();
  const [showAddModal, setShowAddModal] = useState(false);
  
  // New Purchase Form State
  const [cart, setCart] = useState<PurchaseItem[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [overallDiscount, setOverallDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [selectedPurchase, setSelectedPurchase] = useState<any>(null);

  const [selectedCategory, setSelectedCategory] = useState<ProductType | 'ALL'>('ALL');
  const [productSearch, setProductSearch] = useState('');

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'ALL' || p.type === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const total = Math.max(0, subtotal - overallDiscount);

  const handleAddItem = (product: any) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
    const newItem: PurchaseItem = {
      id,
      productId: product.id,
      name: product.name,
      quantity: 1,
      costPrice: product.costPrice,
      discount: 0,
      discountType: 'FIXED',
      totalPrice: product.costPrice
    };
    setCart([...cart, newItem]);
  };

  const updateItem = (id: string, updates: Partial<PurchaseItem>) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const updated = { ...item, ...updates };
        const itemSubtotal = updated.quantity * updated.costPrice;
        const itemDiscount = updated.discountType === 'FIXED' 
          ? updated.discount 
          : (itemSubtotal * updated.discount / 100);
        updated.totalPrice = Math.max(0, itemSubtotal - itemDiscount);
        return updated;
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setCart(cart.filter(i => i.id !== id));
  };

  const handleSavePurchase = async () => {
    if (!selectedSupplier || cart.length === 0) {
      alert(t('selectSupplierItems'));
      return;
    }
    
    await addPurchase({
      supplierId: selectedSupplier,
      items: cart,
      subtotal,
      discount: overallDiscount,
      total,
      paidAmount,
      received: true,
      invoiceNumber,
      date: new Date().toISOString()
    });

    setShowAddModal(false);
    resetForm();
  };

  const resetForm = () => {
    setCart([]);
    setSelectedSupplier('');
    setInvoiceNumber('');
    setOverallDiscount(0);
    setPaidAmount(0);
    setAttachment(null);
  };

  return (
    <PageWrapper>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 tracking-tight flex items-center gap-3">
            <ListOrdered className="text-amber-600 w-8 h-8" />
            {t('purchases')}
          </h2>
          <p className="text-zinc-500 text-sm tracking-wide">{t('purchasesSubtitle')}</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-xl font-bold uppercase tracking-widest hover:bg-amber-700 transition-all shadow-lg shadow-amber-900/20"
        >
          <Plus className="w-5 h-5" />
          {t('recordPurchase')}
        </button>
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-zinc-900/50 border-b border-zinc-800">
              <th className="px-6 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('invoiceNumber')}</th>
              <th className="px-6 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('invoiceDate' as any)}</th>
              <th className="px-6 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('suppliers')}</th>
              <th className="px-6 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('subtotal')}</th>
              <th className="px-6 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('discountAmount')}</th>
              <th className="px-6 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('totalPrice')}</th>
              <th className="px-6 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('status')}</th>
              <th className="px-6 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('actions' as any)}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/30">
            {purchases.map((purchase, idx) => {
              const supplier = suppliers.find(s => s.id === purchase.supplierId);
              return (
                <tr key={`${purchase.id}-${idx}`} className="hover:bg-zinc-900/30 transition-colors">
                  <td className="px-6 py-5 text-white font-mono text-sm">
                    {purchase.invoiceNumber || `#${purchase.id.slice(-6)}`}
                  </td>
                  <td className="px-6 py-5 text-sm text-zinc-300">
                     <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-zinc-600" />
                        {new Date(purchase.date).toLocaleDateString()}
                     </div>
                  </td>
                  <td className="px-6 py-5 text-sm font-medium text-white">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-zinc-600" />
                      {supplier ? supplier.name : 'Unknown'}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-zinc-400 font-mono text-xs">
                    {(purchase.subtotal || purchase.total || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-5 text-rose-500/70 font-mono text-xs">
                    -{(purchase.discount || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-5 text-amber-500 font-bold text-sm">
                    {(purchase.total || 0).toFixed(2)} {t('currency')}
                  </td>
                  <td className="px-6 py-5">
                    <span className="px-2 py-1 bg-emerald-900/20 border border-emerald-800/30 rounded-md text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                      {purchase.received ? t('healthyLabel') : t('pending')}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button 
                      onClick={() => setSelectedPurchase(purchase)}
                      className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-500 hover:text-amber-500 hover:border-amber-600/30 transition-all shadow-sm"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-6xl max-h-[92vh] relative overflow-hidden flex flex-col shadow-2xl"
            >
               <div className="p-6 md:p-8 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50 backdrop-blur-md">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-900/30">
                      <ListOrdered className="text-white w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{t('recordPurchase')}</h3>
                      <p className="text-xs text-zinc-500 uppercase tracking-widest">{t('newFormula')}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowAddModal(false)} className="p-2 text-zinc-500 hover:text-white transition-all hover:rotate-90">
                     <X className="w-6 h-6" />
                  </button>
               </div>

               <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col lg:flex-row gap-8 custom-scrollbar">
                  <div className="flex-1 flex flex-col gap-6">
                     <div className="space-y-4">
                        <div className="flex gap-2 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800 overflow-x-auto custom-scrollbar no-scrollbar">
                           {(['ALL', ...Object.values(ProductType)] as const).map(cat => (
                             <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={cn(
                                   "whitespace-nowrap px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all",
                                   selectedCategory === cat ? "bg-amber-600 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
                                )}
                             >
                                {cat}
                             </button>
                           ))}
                        </div>
                        <div className="relative">
                           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
                           <input 
                             type="text"
                             placeholder={t('selectProduct')}
                             value={productSearch}
                             onChange={(e) => setProductSearch(e.target.value)}
                             className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-amber-600/50 transition-all shadow-inner"
                           />
                        </div>
                        {/* Scrollable Product Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                           {filteredProducts.map((p, idx) => (
                             <button 
                                key={`${p.id}-${idx}`}
                                onClick={() => handleAddItem(p)}
                                className="flex items-center gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-left hover:border-amber-600/50 hover:bg-amber-600/5 transition-all group relative overflow-hidden"
                             >
                                <div className="absolute top-0 right-0 p-1">
                                   <div className="text-[8px] font-black text-zinc-800 bg-zinc-700/30 px-1.5 rounded">
                                      {p.type}
                                   </div>
                                </div>
                                <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center group-hover:bg-amber-600/20 transition-colors shrink-0">
                                   {p.type === 'OIL' ? <FlaskConical className="w-5 h-5 text-amber-500" /> : <Package className="w-5 h-5 text-zinc-600 group-hover:text-amber-500" />}
                                </div>
                                <div className="min-w-0">
                                   <div className="text-xs text-white font-bold truncate">{p.name}</div>
                                   <div className="text-[10px] text-zinc-600 font-mono italic">{(p.costPrice || 0).toFixed(2)}{t('currency')}</div>
                                </div>
                             </button>
                           ))}
                           {filteredProducts.length === 0 && (
                             <div className="col-span-full py-10 text-center text-zinc-700 text-[10px] font-bold uppercase tracking-widest border border-dashed border-zinc-800 rounded-2xl">
                                {t('noHistory')}
                             </div>
                           )}
                        </div>
                     </div>

                     <div className="flex-1 border border-zinc-800 rounded-3xl overflow-hidden bg-zinc-900/30 min-h-[400px]">
                        <table className="w-full text-left">
                           <thead>
                              <tr className="bg-zinc-800/50 border-b border-zinc-800">
                                 <th className="px-4 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{t('productName')}</th>
                                 <th className="px-4 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest w-24 text-center">{t('quantity')}</th>
                                 <th className="px-4 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest w-28">{t('unitPrice')}</th>
                                 <th className="px-4 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest w-32">{t('itemDiscount')}</th>
                                 <th className="px-4 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-end">{t('totalPrice')}</th>
                                 <th className="px-4 py-3 w-10"></th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-zinc-800/40">
                              {cart.map((item, idx) => (
                                <tr key={`${item.id}-${idx}`} className="group hover:bg-zinc-800/10 transition-colors">
                                   <td className="px-4 py-4">
                                      <div className="text-sm font-bold text-white leading-tight">{item.name}</div>
                                   </td>
                                   <td className="px-4 py-4">
                                      <input 
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => updateItem(item.id, { quantity: Number(e.target.value) })}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-center text-sm text-white focus:outline-none focus:border-amber-600 transition-all font-mono"
                                      />
                                   </td>
                                   <td className="px-4 py-4">
                                      <input 
                                        type="number"
                                        value={item.costPrice}
                                        onChange={(e) => updateItem(item.id, { costPrice: Number(e.target.value) })}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-amber-600 transition-all font-mono"
                                      />
                                   </td>
                                   <td className="px-4 py-4">
                                      <div className="flex items-center gap-1">
                                         <input 
                                          type="number"
                                          value={item.discount || ''}
                                          onChange={(e) => updateItem(item.id, { discount: Number(e.target.value) })}
                                          className="w-16 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-600 transition-all font-mono"
                                          placeholder="0"
                                         />
                                         <select 
                                          value={item.discountType}
                                          onChange={(e) => updateItem(item.id, { discountType: e.target.value as any })}
                                          className="bg-zinc-800 text-[10px] text-zinc-500 rounded p-1 border-none focus:outline-none"
                                         >
                                            <option value="FIXED">{t('currency')}</option>
                                            <option value="PERCENT">%</option>
                                         </select>
                                      </div>
                                   </td>
                                   <td className="px-4 py-4 text-end">
                                      <span className="text-sm font-bold text-white font-mono">{(item.totalPrice || 0).toFixed(2)}</span>
                                   </td>
                                   <td className="px-4 py-4">
                                      <button onClick={() => removeItem(item.id)} className="text-zinc-700 hover:text-rose-500 transition-colors">
                                         <Trash2 className="w-4 h-4" />
                                      </button>
                                   </td>
                                </tr>
                              ))}
                           </tbody>
                        </table>
                        {cart.length === 0 && (
                          <div className="flex flex-col items-center justify-center py-20 text-zinc-700 space-y-4">
                             <Package className="w-12 h-12 opacity-20" />
                             <p className="text-[10px] font-bold uppercase tracking-widest">{t('cartEmpty')}</p>
                          </div>
                        )}
                     </div>
                  </div>

                  {/* Right Column: Supplier & Invoice Details */}
                  <div className="w-full lg:w-96 flex flex-col gap-6">
                     <div className="space-y-6">
                        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl">
                           <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-6 border-b border-zinc-800 pb-2">{t('invoiceNumber')}</h4>
                           <div className="space-y-4">
                              <div>
                                 <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2 block">{t('suppliers')}</label>
                                 <div className="relative">
                                    <Truck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                                    <select 
                                      value={selectedSupplier}
                                      onChange={(e) => setSelectedSupplier(e.target.value)}
                                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-amber-600 appearance-none text-sm transition-all shadow-inner"
                                    >
                                       <option value="">{t('selectRelationship')}</option>
                                       {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                 </div>
                              </div>

                              <div>
                                 <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2 block">{t('invoiceNumber')}</label>
                                 <input 
                                    type="text" 
                                    value={invoiceNumber}
                                    onChange={(e) => setInvoiceNumber(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-amber-600 text-sm transition-all shadow-inner font-mono"
                                    placeholder="INV-00000"
                                 />
                              </div>

                              <div>
                                 <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2 block">{t('attachInvoice')}</label>
                                 <div className="relative">
                                    <input 
                                      type="file" 
                                      id="invoice-file"
                                      className="hidden"
                                      onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                                    />
                                    <label 
                                      htmlFor="invoice-file"
                                      className="w-full bg-zinc-950 border border-dashed border-zinc-800 rounded-2xl px-4 py-4 text-zinc-500 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-amber-600/50 hover:bg-zinc-900 transition-all group"
                                    >
                                       <Camera className={cn("w-6 h-6 group-hover:text-amber-500 transition-colors", attachment && "text-emerald-500")} />
                                       <span className="text-[10px] font-bold">
                                         {attachment ? attachment.name : t('attachInvoice')}
                                       </span>
                                    </label>
                                 </div>
                              </div>
                           </div>
                        </div>

                        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl">
                           <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-6 border-b border-zinc-800 pb-2">{t('financialSummary')}</h4>
                           <div className="space-y-4">
                              <div className="flex justify-between items-center text-zinc-400 text-sm">
                                 <span>{t('subtotal')}</span>
                                 <span className="font-mono">{(subtotal || 0).toFixed(2)}</span>
                              </div>
                              
                              <div className="flex justify-between items-center">
                                 <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest">{t('orderDiscount')}</span>
                                 <div className="flex items-center gap-2">
                                    <input 
                                      type="number" 
                                      value={overallDiscount || ''}
                                      onChange={(e) => setOverallDiscount(Number(e.target.value))}
                                      className="w-24 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-white text-end focus:outline-none focus:border-amber-600 font-mono"
                                      placeholder="0.00"
                                    />
                                 </div>
                              </div>

                              <div className="pt-4 border-t border-zinc-800 flex justify-between items-center">
                                 <span className="text-white font-bold uppercase tracking-wider">{t('total')}</span>
                                 <div className="text-end">
                                    <div className="text-2xl font-bold text-amber-500 font-mono">{(total || 0).toFixed(2)}</div>
                                    <div className="text-[10px] text-zinc-600 uppercase tracking-widest">{t('currency')}</div>
                                 </div>
                              </div>

                              <div>
                                 <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2 block">Paid Amount</label>
                                 <input 
                                    type="number" 
                                    value={paidAmount || ''}
                                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-amber-600 text-lg font-bold font-mono transition-all shadow-inner"
                                    placeholder="0.00"
                                 />
                                 {paidAmount < total && (
                                   <p className="text-[10px] text-rose-500 font-bold mt-2 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                                      <AlertCircle className="w-3 h-3" />
                                      {t('remaining')}: {(total - paidAmount || 0).toFixed(2)} (Debt)
                                   </p>
                                 )}
                              </div>

                              <button 
                                onClick={handleSavePurchase}
                                disabled={!selectedSupplier || cart.length === 0}
                                className="w-full py-5 bg-amber-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-amber-700 active:scale-[0.98] transition-all shadow-xl shadow-amber-900/20 mt-4 flex items-center justify-center gap-2"
                              >
                                 <CheckCircle2 className="w-5 h-5" />
                                 {t('recordPurchase')}
                              </button>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedPurchase && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPurchase(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-2xl relative overflow-hidden flex flex-col shadow-2xl"
            >
               <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">{t('purchaseDetails')}</h3>
                    <p className="text-xs text-zinc-500 font-mono tracking-widest uppercase mt-1">
                      {selectedPurchase.invoiceNumber || `#${selectedPurchase.id.slice(-6)}`}
                    </p>
                  </div>
                  <button onClick={() => setSelectedPurchase(null)} className="text-zinc-500 hover:text-white transition-colors">
                     <X className="w-6 h-6" />
                  </button>
               </div>

               <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh] custom-scrollbar">
                  <div className="grid grid-cols-2 gap-8 border-b border-zinc-900 pb-8">
                     <div>
                        <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2">{t('suppliers')}</div>
                        <div className="flex items-center gap-2 text-white">
                           <Truck className="w-4 h-4 text-amber-600" />
                           <span className="font-bold">{suppliers.find(s => s.id === selectedPurchase.supplierId)?.name || 'Unknown'}</span>
                        </div>
                     </div>
                     <div>
                        <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2">{t('invoiceDate' as any)}</div>
                        <div className="flex items-center gap-2 text-white">
                           <Calendar className="w-4 h-4 text-emerald-600" />
                           <span className="font-bold">{new Date(selectedPurchase.date).toLocaleDateString()}</span>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{t('items')}</div>
                     <div className="bg-zinc-900/30 rounded-2xl border border-zinc-800 overflow-hidden">
                        <table className="w-full text-left">
                           <thead>
                              <tr className="bg-zinc-800/40 border-b border-zinc-800">
                                 <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('productName')}</th>
                                 <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center">{t('quantity')}</th>
                                 <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-end">{t('totalPrice')}</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-zinc-800/30">
                              {selectedPurchase.items.map((item: any, idx: number) => (
                                <tr key={idx}>
                                   <td className="px-4 py-3 text-sm text-zinc-300 font-medium">{item.name}</td>
                                   <td className="px-4 py-3 text-sm text-zinc-400 text-center font-mono">{item.quantity}</td>
                                   <td className="px-4 py-3 text-sm text-white text-end font-mono font-bold">{(item.totalPrice || 0).toFixed(2)}</td>
                                </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  </div>

                  <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800 space-y-4">
                     <div className="flex justify-between text-sm text-zinc-500">
                        <span>{t('subtotal')}</span>
                        <span className="font-mono text-zinc-400">{(selectedPurchase.subtotal || 0).toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between text-sm text-rose-500/80">
                        <span>{t('discountAmount')}</span>
                        <span className="font-mono">-{(selectedPurchase.discount || 0).toFixed(2)}</span>
                     </div>
                     <div className="pt-2 border-t border-zinc-800 flex justify-between items-center text-white">
                        <span className="font-bold uppercase text-xs tracking-wider">{t('total')}</span>
                        <span className="text-2xl font-bold text-amber-500 font-mono tracking-tight">{(selectedPurchase.total || 0).toFixed(2)} {t('currency')}</span>
                     </div>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
