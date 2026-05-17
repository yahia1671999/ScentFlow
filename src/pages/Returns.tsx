/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Undo2, 
  Plus, 
  Search, 
  Trash2, 
  Calendar,
  Layers,
  ArrowRight,
  Eye,
  X
} from 'lucide-react';
import { useStore } from '../store.tsx';
import { motion, AnimatePresence } from 'motion/react';
import { PageWrapper, Card } from '../components/Common.tsx';

export default function Returns() {
  const { returns, sales, purchases, addReturn, t, language } = useStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [returnType, setReturnType] = useState<'SALE' | 'PURCHASE'>('SALE');
  const [originalDoc, setOriginalDoc] = useState<any>(null);
  const [returnCart, setReturnCart] = useState<any[]>([]);
  const [reason, setReason] = useState('');
  const [selectedReturn, setSelectedReturn] = useState<any>(null);

  const handleDocSelect = (id: string) => {
    const doc = returnType === 'SALE' 
      ? sales.find(s => s.id === id)
      : purchases.find(p => p.id === id);
    setOriginalDoc(doc || null);
    setReturnCart([]);
  };

  const toggleItemInReturn = (item: any) => {
    const exists = returnCart.find(i => i.id === item.id);
    if (exists) {
      setReturnCart(returnCart.filter(i => i.id !== item.id));
    } else {
      setReturnCart([...returnCart, { ...item, returnQty: 1 }]);
    }
  };

  const updateReturnQty = (id: string, qty: number) => {
    setReturnCart(returnCart.map(item => 
      item.id === id ? { ...item, returnQty: Math.min(qty, item.quantity) } : item
    ));
  };

  const totalReturnAmount = returnCart.reduce((sum, item) => sum + (item.returnQty * (item.unitPrice || item.costPrice || 0)), 0);

  const handleSaveReturn = async () => {
    if (!originalDoc || !reason || returnCart.length === 0) return;

    await addReturn({
      originalId: originalDoc.id,
      type: returnType,
      customerId: returnType === 'SALE' ? originalDoc.customerId : undefined,
      supplierId: returnType === 'PURCHASE' ? originalDoc.supplierId : undefined,
      items: returnCart.map(i => ({ ...i, quantity: i.returnQty })),
      totalAmount: totalReturnAmount,
      reason
    });

    setShowAddModal(false);
    setOriginalDoc(null);
    setReturnCart([]);
    setReason('');
  };

  return (
    <PageWrapper>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 tracking-tight flex items-center gap-3">
            <Undo2 className="text-amber-600 w-8 h-8" />
            {t('returns')}
          </h2>
          <p className="text-zinc-500 text-sm tracking-wide">{t('returnsSubtitle')}</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-xl font-bold uppercase tracking-widest hover:bg-amber-700 transition-all shadow-lg shadow-amber-900/20"
        >
          <Plus className="w-5 h-5" />
          {t('newReturn')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {returns.map((ret, idx) => (
          <Card key={`${ret.id}-${idx}`} className="relative overflow-hidden group">
            <div className={`absolute top-0 right-0 px-3 py-1 text-[8px] font-bold uppercase tracking-widest rounded-bl-lg ${ret.type === 'SALE' ? 'bg-amber-600/20 text-amber-500' : 'bg-emerald-600/20 text-emerald-500'}`}>
              {ret.type}
            </div>
            <div className="flex items-center gap-2 text-zinc-500 text-[10px] mb-4 font-mono">
               <Calendar className="w-3 h-3" />
               {new Date(ret.date).toLocaleDateString()}
            </div>
            <h3 className="text-white font-bold mb-2 flex items-center gap-2">
               #{ret.id.slice(-6)}
               <ArrowRight className="w-3 h-3 text-zinc-700" />
               <span className="text-zinc-500 font-mono text-xs">#{ret.originalId.slice(-6)}</span>
            </h3>
            <p className="text-zinc-500 text-xs mb-6 line-clamp-2 italic">"{ret.reason}"</p>
            
            <div className="space-y-2 mb-6">
               {ret.items.map((item, idx) => (
                 <div key={item.id || `${item.productId}-${idx}`} className="flex justify-between text-[10px] text-zinc-400">
                    <span>{item.name} x{item.quantity}</span>
                    <span>{(item.totalPrice || 0).toFixed(2)}</span>
                 </div>
               ))}
            </div>

            <div className="pt-4 border-t border-zinc-800 flex justify-between items-center">
               <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{t('returnedAmount')}</span>
               <div className="flex items-center gap-3">
                 <span className="text-amber-500 font-bold">{(ret.totalAmount || 0).toFixed(2)}</span>
                 <button 
                  onClick={() => setSelectedReturn(ret)}
                  className="p-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-600 hover:text-amber-500 transition-colors"
                 >
                    <Eye className="w-3.5 h-3.5" />
                 </button>
               </div>
            </div>
          </Card>
        ))}
        {returns.length === 0 && (
          <div className="col-span-full py-20 text-center text-zinc-700 border-2 border-dashed border-zinc-800 rounded-3xl">
             {t('noReturns')}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div key="add-return-modal" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-4xl relative overflow-hidden h-[85vh] flex flex-col"
            >
               <div className="p-8 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur shadow-xl z-10 flex justify-between items-center">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1">{t('newReturn')}</h3>
                    <p className="text-xs text-zinc-500 uppercase tracking-widest">{t('returnItems')}</p>
                  </div>
                  <button onClick={() => setShowAddModal(false)} className="text-zinc-500 hover:text-white transition-colors">
                     <Plus className="w-6 h-6 rotate-45" />
                  </button>
               </div>
               
               <div className="flex-1 overflow-y-auto p-8 flex flex-col lg:flex-row gap-8 custom-scrollbar">
                  <div className="flex-1 space-y-8">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                           <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 block">{t('returnType')}</label>
                           <div className="grid grid-cols-2 gap-4">
                              <button 
                                onClick={() => { setReturnType('SALE'); setOriginalDoc(null); }}
                                className={`py-4 rounded-xl border font-bold text-xs uppercase tracking-widest transition-all ${returnType === 'SALE' ? 'bg-amber-600 border-amber-600 text-white shadow-lg shadow-amber-900/30' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                              >
                                 {t('saleReturn')}
                              </button>
                              <button 
                                onClick={() => { setReturnType('PURCHASE'); setOriginalDoc(null); }}
                                className={`py-4 rounded-xl border font-bold text-xs uppercase tracking-widest transition-all ${returnType === 'PURCHASE' ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-900/30' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                              >
                                 {t('purchaseReturn')}
                              </button>
                           </div>
                        </div>

                        <div>
                           <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">
                              {returnType === 'SALE' ? t('invoiceNumber') : t('purchases')}
                           </label>
                           <select 
                             value={originalDoc?.id || ''}
                             onChange={(e) => handleDocSelect(e.target.value)}
                             className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-amber-600 transition-all font-mono"
                           >
                              <option value="">{t('selectProduct')}...</option>
                              {returnType === 'SALE' 
                                ? sales.map((s, idx) => <option key={`${s.id}-${idx}`} value={s.id}>#{s.id.slice(-6)} - {new Date(s.createdAt).toLocaleDateString()} - {(s.total || 0).toFixed(1)}</option>)
                                : purchases.map((p, idx) => <option key={`${p.id}-${idx}`} value={p.id}>#{p.id.slice(-6)} - {new Date(p.date).toLocaleDateString()} - {(p.total || 0).toFixed(1)}</option>)
                              }
                           </select>
                        </div>
                     </div>

                     {originalDoc && (
                       <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                       >
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">{t('selectProduct')}</label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                             {originalDoc.items.map((item: any, idx: number) => {
                               const isSelected = returnCart.find(i => (i.id || i.productId) === (item.id || item.productId));
                               return (
                                 <div 
                                   key={item.id || `${item.productId}-${idx}`}
                                   onClick={() => toggleItemInReturn(item)}
                                   className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex justify-between items-center ${isSelected ? 'bg-amber-600/10 border-amber-600' : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'}`}
                                 >
                                    <div className="text-sm font-bold text-white">{item.name}</div>
                                    <div className="text-right">
                                       <div className="text-xs text-zinc-500">{t('paidPrice')}: {item.unitPrice || item.costPrice || 0}</div>
                                       <div className="text-[10px] text-amber-600 font-bold">{item.quantity} available</div>
                                    </div>
                                 </div>
                               );
                             })}
                          </div>
                       </motion.div>
                     )}
                  </div>

                  <div className="w-full lg:w-96 flex flex-col gap-6">
                     <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 flex-1 flex flex-col min-h-[300px]">
                        <h4 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-6">{t('returningItems')}</h4>
                        <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2 mb-6">
                           {returnCart.map((item, idx) => (
                             <div key={item.id || `${item.productId}-${idx}`} className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3">
                                <div className="flex justify-between items-start">
                                   <div className="text-sm font-bold text-white">{item.name}</div>
                                   <button onClick={() => toggleItemInReturn(item)} className="text-zinc-700 hover:text-rose-500">
                                      <Trash2 className="w-4 h-4" />
                                   </button>
                                </div>
                                <div className="flex items-center justify-between">
                                   <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">{t('returnQty')}</div>
                                   <div className="flex items-center gap-3">
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); updateReturnQty(item.id || item.productId, item.returnQty - 1); }}
                                        className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
                                      >-</button>
                                      <span className="font-mono text-white font-bold">{item.returnQty}</span>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); updateReturnQty(item.id || item.productId, item.returnQty + 1); }}
                                        className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
                                      >+</button>
                                   </div>
                                </div>
                             </div>
                           ))}
                           {returnCart.length === 0 && (
                             <div className="h-full flex flex-col items-center justify-center text-zinc-800 opacity-50 space-y-4">
                                <Layers className="w-12 h-12" />
                                <p className="text-[10px] font-bold uppercase tracking-widest">No items selected</p>
                             </div>
                           )}
                        </div>

                        <div className="space-y-4 pt-6 border-t border-zinc-800">
                           <div>
                              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">{t('returnReason')}</label>
                              <textarea 
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                rows={2}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-600 text-xs resize-none"
                                placeholder="..."
                              />
                           </div>
                           <div className="flex justify-between items-center py-2">
                              <span className="font-bold text-zinc-500 uppercase text-xs tracking-widest">{t('total')}</span>
                              <span className="text-xl font-bold text-amber-500 font-mono">{(totalReturnAmount || 0).toFixed(2)} {t('currency')}</span>
                           </div>
                           <button 
                             onClick={handleSaveReturn}
                             disabled={!originalDoc || !reason || returnCart.length === 0}
                             className="w-full py-4 bg-amber-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-xl font-bold uppercase tracking-widest hover:bg-amber-700 transition-all shadow-lg"
                           >
                             {t('generate')}
                           </button>
                        </div>
                     </div>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedReturn && (
          <div key="view-return-modal" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedReturn(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-lg relative overflow-hidden flex flex-col shadow-2xl"
            >
               <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">{t('returnDetails')}</h3>
                    <p className="text-xs text-zinc-500 uppercase tracking-widest mt-1">#{selectedReturn.id.slice(-6)}</p>
                  </div>
                  <button onClick={() => setSelectedReturn(null)} className="text-zinc-500 hover:text-white transition-colors">
                     <X className="w-6 h-6" />
                  </button>
               </div>

               <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
                  <div className="flex justify-between items-center">
                     <div>
                        <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1">{t('date')}</div>
                        <div className="text-white text-sm">{new Date(selectedReturn.date).toLocaleString()}</div>
                     </div>
                     <div className="text-right">
                        <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1">{t('reference')}</div>
                        <div className="text-amber-500 text-sm font-mono">#{selectedReturn.originalId.slice(-6)} ({selectedReturn.type})</div>
                     </div>
                  </div>

                  <div className="bg-zinc-900/30 rounded-2xl border border-zinc-800 p-4 border-l-4 border-l-amber-600">
                     <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2">{t('reason' as any)}</div>
                     <p className="text-zinc-300 text-sm italic">"{selectedReturn.reason}"</p>
                  </div>

                  <div className="space-y-3">
                     <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{t('items')}</div>
                     <div className="bg-zinc-900 border border-zinc-800 rounded-xl divide-y divide-zinc-800/40">
                        {selectedReturn.items.map((item: any, idx: number) => (
                          <div key={item.id || `${item.productId}-${idx}`} className="p-4 flex justify-between items-center">
                             <div>
                                <div className="text-sm font-bold text-white">{item.name}</div>
                                <div className="text-[10px] text-zinc-500">x{item.quantity}</div>
                             </div>
                             <div className="text-sm font-mono text-zinc-400">{(item.totalPrice || 0).toFixed(2)}</div>
                          </div>
                        ))}
                     </div>
                  </div>

                  <div className="pt-4 border-t border-zinc-800 flex justify-between items-center mb-4">
                     <span className="font-bold text-white uppercase text-xs tracking-widest">{t('total')}</span>
                     <span className="text-2xl font-bold text-amber-500 font-mono tracking-tight">{(selectedReturn.totalAmount || 0).toFixed(2)} {t('currency')}</span>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
