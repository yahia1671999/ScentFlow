/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Truck, 
  Plus, 
  Search, 
  Phone, 
  CreditCard, 
  Trash2, 
  Edit3,
  X
} from 'lucide-react';
import { useStore } from '../store.tsx';
import { motion, AnimatePresence } from 'motion/react';
import { Supplier } from '../types.ts';
import { PageWrapper, Card } from '../components/Common.tsx';
import { cn } from '../lib/utils.ts';

export default function Suppliers() {
  const { suppliers, purchases, returns, addSupplier, updateSupplier, deleteSupplier, t, language } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.phone.includes(searchTerm)
  );

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      balance: Number(formData.get('balance') || 0),
    };

    if (editingSupplier) {
      await updateSupplier(editingSupplier.id, data);
    } else {
      await addSupplier(data);
    }
    setShowAddModal(false);
    setEditingSupplier(null);
  };

  const supplierPurchases = selectedSupplier ? purchases.filter(p => p.supplierId === selectedSupplier.id) : [];
  const supplierReturns = selectedSupplier ? returns.filter(r => r.supplierId === selectedSupplier.id) : [];

  return (
    <PageWrapper>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 tracking-tight flex items-center gap-3">
            <Truck className="text-amber-600 w-8 h-8" />
            {t('suppliers')}
          </h2>
          <p className="text-zinc-500 text-sm tracking-wide">{t('suppliersSubtitle')}</p>
        </div>
        <button 
          onClick={() => {
            setEditingSupplier(null);
            setShowAddModal(true);
          }}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-xl font-bold uppercase tracking-widest hover:bg-amber-700 transition-all shadow-lg shadow-amber-900/20 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          {t('addCustomer')}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:h-[700px]">
        {/* Supplier List */}
        <div className={cn(
          "flex-none lg:w-96 flex flex-col gap-4 h-[400px] lg:h-auto",
          selectedSupplier && "hidden lg:flex"
        )}>
          <div className="relative shrink-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
            <input 
              type="text" 
              placeholder={t('search')} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl pl-12 pr-6 py-4 text-white focus:outline-none focus:border-amber-600 transition-all placeholder:text-zinc-600"
            />
          </div>
          
          <Card className="flex-1 overflow-y-auto p-0 custom-scrollbar">
            <div className="divide-y divide-zinc-900">
               {filteredSuppliers.map((s, idx) => (
                 <div 
                  key={`${s.id}-${idx}`} 
                  onClick={() => setSelectedSupplier(s)}
                  className={cn(
                    "p-4 cursor-pointer hover:bg-zinc-900/50 transition-all group flex items-center gap-4",
                    selectedSupplier?.id === s.id ? "bg-amber-600/5" : ""
                  )}
                >
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center font-bold text-white transition-colors shrink-0",
                      selectedSupplier?.id === s.id ? "bg-amber-600" : "bg-zinc-800"
                    )}>
                       {s.name.charAt(0)}
                    </div>
                    <div className="flex-1 truncate">
                       <h5 className="font-bold text-sm text-white truncate">{s.name}</h5>
                       <p className="text-[10px] text-zinc-500">{s.phone}</p>
                    </div>
                    <div className="text-right shrink-0">
                       <p className={cn("text-[10px] font-bold", (s.balance || 0) > 0 ? "text-rose-500" : "text-emerald-500")}>
                         {(s.balance || 0).toFixed(2)}
                       </p>
                    </div>
                 </div>
               ))}
            </div>
          </Card>
        </div>

        {/* Supplier Details */}
        <div className={cn(
          "flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-6",
          !selectedSupplier && "hidden lg:block",
          selectedSupplier && "block"
        )}>
           {selectedSupplier ? (
             <div className="animate-in fade-in slide-in-from-right-8 duration-500 space-y-6">
                <button 
                  onClick={() => setSelectedSupplier(null)}
                  className="lg:hidden flex items-center gap-2 text-zinc-500 hover:text-white text-xs font-bold uppercase tracking-widest mb-4"
                >
                  <X className="w-4 h-4" /> {t('backToList')}
                </button>

                <Card className="flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
                  <div className="w-20 h-20 bg-zinc-900 rounded-2xl border border-zinc-800 flex items-center justify-center shrink-0">
                    <Truck className="w-10 h-10 text-amber-600" />
                  </div>
                  <div className="flex-1 text-center md:text-start">
                    <h3 className="text-2xl font-black text-white mb-2">{selectedSupplier.name}</h3>
                    <div className="flex wrap justify-center md:justify-start gap-4 text-xs font-mono text-zinc-500 uppercase">
                      <span>{t('phone')}: {selectedSupplier.phone}</span>
                      <span>•</span>
                      <span className={(selectedSupplier.balance || 0) > 0 ? "text-rose-500 font-bold" : "text-emerald-500 font-bold"}>
                        {t('remaining')}: {(selectedSupplier.balance || 0).toFixed(2)} {t('currency')}
                      </span>
                    </div>
                    <div className="flex gap-3 mt-6 justify-center md:justify-start">
                      <button 
                        onClick={() => {
                          setEditingSupplier(selectedSupplier);
                          setShowAddModal(true);
                        }}
                        className="px-4 py-2 bg-zinc-800 text-white rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-zinc-700 transition-all flex items-center gap-2"
                      >
                         <Edit3 className="w-3 h-3" /> {t('editProfile')}
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm(t('confirmDelete'))) {
                            deleteSupplier(selectedSupplier.id);
                            setSelectedSupplier(null);
                          }
                        }}
                        className="px-4 py-2 bg-rose-950/30 text-rose-500 rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-rose-900/50 transition-all flex items-center gap-2 border border-rose-500/20"
                      >
                         <Trash2 className="w-3 h-3" /> {t('delete' as any)}
                      </button>
                    </div>
                  </div>
                </Card>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                   <Card title={t('purchases')} className="p-0">
                      <div className="divide-y divide-zinc-900 max-h-[400px] overflow-y-auto custom-scrollbar">
                         {supplierPurchases.length === 0 ? (
                           <div className="p-8 text-center text-zinc-700 opacity-50 uppercase text-[10px] font-bold tracking-widest">
                             {t('noHistory')}
                           </div>
                         ) : (
                           supplierPurchases.map((p, idx) => (
                             <div key={`${p.id}-${idx}`} className="p-4 flex items-center justify-between hover:bg-zinc-900/40 transition-colors">
                                <div>
                                   <p className="text-sm font-bold text-white">{p.invoiceNumber || `#${p.id.slice(-6)}`}</p>
                                   <p className="text-[10px] text-zinc-500 font-mono mt-1 uppercase">{new Date(p.date).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                   <p className="text-sm font-bold text-amber-500">{(p.total || 0).toFixed(2)} {t('currency')}</p>
                                   <p className="text-[9px] text-zinc-600 uppercase font-black">{(p.items || []).length} items</p>
                                </div>
                             </div>
                           ))
                         )}
                      </div>
                   </Card>

                   <Card title={t('returns')} className="p-0">
                      <div className="divide-y divide-zinc-900 max-h-[400px] overflow-y-auto custom-scrollbar">
                         {supplierReturns.length === 0 ? (
                           <div className="p-8 text-center text-zinc-700 opacity-50 uppercase text-[10px] font-bold tracking-widest">
                             {t('noHistory')}
                           </div>
                         ) : (
                           supplierReturns.map((r, idx) => (
                             <div key={`${r.id}-${idx}`} className="p-4 flex items-center justify-between hover:bg-zinc-900/40 transition-colors">
                                <div>
                                   <p className="text-sm font-bold text-rose-400">RET-#{r.id.slice(-6)}</p>
                                   <p className="text-[10px] text-zinc-500 font-mono mt-1 uppercase">{new Date(r.date).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                   <p className="text-sm font-bold text-white">{(r.total || 0).toFixed(2)} {t('currency')}</p>
                                   <p className="text-[9px] text-zinc-600 uppercase font-black">{(r.items || []).length} items</p>
                                </div>
                             </div>
                           ))
                         )}
                      </div>
                   </Card>
                </div>
             </div>
           ) : (
             <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-zinc-800 bg-zinc-950/20 border border-dashed border-zinc-800 rounded-3xl p-8 text-center">
                <div className="w-24 h-24 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6">
                   <Truck className="w-10 h-10 text-zinc-700" />
                </div>
                <h4 className="text-xl font-bold text-zinc-700">{t('selectRelationship')}</h4>
                <p className="text-zinc-500 mt-2 text-sm">{t('selectRelationshipDesc')}</p>
             </div>
           )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowAddModal(false);
                setEditingSupplier(null);
              }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-lg relative overflow-hidden"
            >
              <form onSubmit={handleSave} className="p-8">
                <h3 className="text-2xl font-bold text-white mb-8">
                  {editingSupplier ? t('editProfile') : t('addCustomer')}
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">{t('productName')}</label>
                    <input name="name" defaultValue={editingSupplier?.name} required className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-600" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">{t('phone')}</label>
                    <input name="phone" defaultValue={editingSupplier?.phone} required className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-600" />
                  </div>
                  {!editingSupplier && (
                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">{t('remaining')}</label>
                      <input name="balance" type="number" step="0.01" defaultValue={0} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-600" />
                    </div>
                  )}
                </div>

                <div className="flex gap-4 mt-10">
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingSupplier(null);
                    }}
                    className="flex-1 py-4 text-zinc-500 font-bold uppercase tracking-widest hover:text-white transition-colors"
                  >
                    {t('cancel')}
                  </button>
                  <button className="flex-1 py-4 bg-amber-600 text-white rounded-xl font-bold uppercase tracking-widest hover:bg-amber-700 transition-all shadow-lg shadow-amber-900/20">
                    {t('generate')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
