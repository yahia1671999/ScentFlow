/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PageWrapper, Header, Card } from '../components/Common.tsx';
import { useStore } from '../store.tsx';
import { 
  Users, 
  Search, 
  Plus, 
  MessageSquare, 
  History, 
  Award, 
  Gift,
  ChevronRight,
  Filter,
  ArrowUpRight,
  X,
  Printer,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { cn } from '../lib/utils.ts';

import { motion, AnimatePresence } from 'motion/react';

export default function Customers() {
  const { customers, sales, t, language, addCustomer, updateCustomer } = useStore();
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const customerData = {
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      notes: formData.get('notes') as string,
      favoriteScents: (formData.get('favoriteScents') as string)?.split(',').map(s => s.trim()).filter(Boolean),
    };

    if (editingCustomer) {
      await updateCustomer(editingCustomer.id, customerData);
    } else {
      await addCustomer(customerData);
    }
    setShowModal(false);
    setEditingCustomer(null);
  };

  const redeemPoints = async () => {
    if (!selectedCustomer) return;
    if (selectedCustomer.points < 500) {
      alert("Minimum 500 points required to redeem");
      return;
    }
    setIsUpdating(true);
    try {
      await updateCustomer(selectedCustomer.id, { points: selectedCustomer.points - 500 });
      alert(t('transactionComplete'));
    } finally {
      setIsUpdating(false);
    }
  };

  const openWhatsApp = () => {
    if (selectedCustomer) {
      window.open(`https://wa.me/${selectedCustomer.phone}`, '_blank');
    }
  };

  const qrRef = React.useRef<HTMLCanvasElement>(null);

  const printQR = () => {
    if (qrRef.current) {
      const url = qrRef.current.toDataURL();
      const win = window.open('');
      if (win) {
        win.document.write(`
          <html>
            <body style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; font-family:sans-serif;">
              <img src="${url}" style="width:300px; margin-bottom:20px;"/>
              <h1 style="margin:0; color:#d97706;">${selectedCustomer.name}</h1>
              <p style="color:#666;">Loyalty ID: ${selectedCustomer.qrCode}</p>
            </body>
            <script>
              window.onload = () => {
                window.print();
                window.close();
              };
            </script>
          </html>
        `);
        win.document.close();
      }
    }
  };

  const [isGeneratingMsg, setIsGeneratingMsg] = useState(false);
  const generatePersonalMsg = async () => {
    setIsGeneratingMsg(true);
    // Simulation of AI generation based on profile
    setTimeout(() => {
      const msg = `Hello ${selectedCustomer.name}! We noticed you love Oud scents. We have a special offer for you today!`;
      window.open(`https://wa.me/${selectedCustomer.phone}?text=${encodeURIComponent(msg)}`, '_blank');
      setIsGeneratingMsg(false);
    }, 1500);
  };

  return (
    <PageWrapper>
      <Header 
        title={t('loyaltyRelationship')} 
        subtitle={t('customerSubtitle')}
        actions={
          <button 
            onClick={() => {
              setEditingCustomer(null);
              setShowModal(true);
            }}
            className="w-full sm:w-auto px-4 py-2 bg-amber-600 text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-amber-700 transition-colors shadow-lg shadow-amber-900/20"
          >
            <Plus className="w-4 h-4" />
            {t('newCustomer')}
          </button>
        }
      />

      <div className="flex flex-col lg:flex-row gap-6 lg:h-[700px]">
        {/* Customer List */}
        <div className={cn(
          "flex-none lg:w-96 flex flex-col gap-4 h-[400px] lg:h-auto",
          selectedCustomer && "hidden lg:flex"
        )}>
           <div className="relative shrink-0">
              <Search className={cn("absolute top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4 md:w-5 md:h-5", language === 'ar' ? "right-4" : "left-4")} />
              <input 
                type="text" 
                placeholder={t('findCustomer')}
                className={cn(
                  "w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 focus:outline-none focus:border-amber-600 transition-colors text-sm",
                  language === 'ar' ? "pr-12 pl-4" : "pl-12 pr-4"
                )}
              />
           </div>
           
           <Card className="flex-1 overflow-y-auto p-0 custom-scrollbar">
              <div className="divide-y divide-zinc-900">
                 {customers.length === 0 ? (
                   <div className="p-8 text-center text-zinc-700 opacity-50">
                      <Users className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-4" />
                      <p className="font-bold text-[10px] md:text-xs uppercase tracking-widest">{t('noCustomers')}</p>
                   </div>
                 ) : (
                   customers.map((c, idx) => (
                     <div 
                      key={c.id} 
                      onClick={() => setSelectedCustomer(c)}
                      className={cn(
                        "p-4 cursor-pointer hover:bg-zinc-900/50 transition-all group flex items-center gap-4",
                        selectedCustomer?.id === c.id ? "bg-amber-600/5" : ""
                      )}
                    >
                        <div className={cn(
                          "w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold text-white transition-colors shrink-0",
                          selectedCustomer?.id === c.id ? "bg-amber-600" : "bg-zinc-800"
                        )}>
                           {c.name.charAt(0)}
                        </div>
                        <div className="flex-1 truncate">
                           <h5 className="font-bold text-sm text-white truncate">{c.name}</h5>
                           <p className="text-[10px] text-zinc-500 font-mono tracking-tighter uppercase">{c.qrCode}</p>
                        </div>
                        <div className="text-right shrink-0">
                           <p className="text-[10px] md:text-xs font-bold text-amber-500">{c.points} {t('pts')}</p>
                           <ChevronRight className="w-4 h-4 text-zinc-800 ml-auto mt-1" />
                        </div>
                     </div>
                   ))
                 )}
              </div>
           </Card>
        </div>

        {/* Customer Details Dashboard */}
        <div className={cn(
          "flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-6",
          !selectedCustomer && "hidden lg:block",
          selectedCustomer && "block"
        )}>
           {selectedCustomer ? (
             <div className="animate-in fade-in slide-in-from-right-8 duration-500 space-y-6">
                <button 
                  onClick={() => setSelectedCustomer(null)}
                  className="lg:hidden flex items-center gap-2 text-zinc-500 hover:text-white text-xs font-bold uppercase tracking-widest mb-4"
                >
                  <X className="w-4 h-4" /> {t('backToList')}
                </button>
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                   <Card className="xl:col-span-2 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
                      <div className="absolute right-0 top-0 w-32 h-32 bg-amber-600 rounded-full blur-[80px] opacity-10" />
                      <div className="w-24 h-24 bg-zinc-900 p-2 rounded-2xl border border-zinc-800 shadow-2xl shrink-0">
                         <QRCodeCanvas ref={qrRef} value={selectedCustomer.qrCode} width="100%" height="100%" fgColor="#d97706" bgColor="transparent" />
                      </div>
                      <div className="flex-1 text-center md:text-start">
                         <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                            <h3 className="text-xl md:text-2xl font-black text-white">{selectedCustomer.name}</h3>
                            <Award className="w-5 h-5 text-amber-500" />
                         </div>
                         <div className="flex flex-wrap justify-center md:justify-start gap-3 md:gap-4 text-[10px] md:text-xs font-mono text-zinc-500 uppercase tracking-tighter">
                            <span>{t('phone')}: {selectedCustomer.phone}</span>
                            <span className="hidden md:inline">•</span>
                            <span>{t('pointsLabel')}: <span className="text-amber-600 font-bold">{selectedCustomer.points}</span></span>
                            <span className="hidden md:inline">•</span>
                            <span>{t('joined')}: {new Date(selectedCustomer.createdAt).toLocaleDateString()}</span>
                         </div>
                         <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-6">
                            <button 
                              onClick={openWhatsApp}
                              className="px-4 py-2 bg-amber-600 text-white rounded-lg font-bold text-[10px] uppercase tracking-widest flex items-center gap-2"
                            >
                               <MessageSquare className="w-3 h-3" /> WhatsApp
                            </button>
                            <button 
                              onClick={generatePersonalMsg}
                              disabled={isGeneratingMsg}
                              className="px-4 py-2 bg-amber-600/10 text-amber-500 rounded-lg font-bold text-[10px] uppercase tracking-widest flex items-center gap-2"
                            >
                               {isGeneratingMsg ? <RefreshCw className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3" />} AI Promo
                            </button>
                            <button 
                              onClick={printQR}
                              className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg font-bold text-[10px] uppercase tracking-widest flex items-center gap-2"
                            >
                               <Printer className="w-3 h-3" /> Print QR
                            </button>
                            <button 
                              onClick={() => {
                                setEditingCustomer(selectedCustomer);
                                setShowModal(true);
                              }}
                              className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg font-bold text-[10px] uppercase tracking-widest"
                            >
                               {t('editProfile')}
                            </button>
                         </div>
                      </div>
                   </Card>

                   <Card className="bg-zinc-950 border-amber-600/30">
                      <p className="text-[10px] font-bold text-amber-600 uppercase tracking-[0.2em] mb-4">{t('loyaltyStatus')}</p>
                      <div className="space-y-4">
                         <div className="flex justify-between items-end">
                            <span className="text-2xl md:text-3xl font-black text-white">{selectedCustomer.points}</span>
                            <span className="text-zinc-600 font-mono text-xs md:text-sm">/ 1000 {t('toGold')}</span>
                         </div>
                         <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-600 rounded-full" style={{ width: `${(selectedCustomer.points / 1000) * 100}%` }} />
                         </div>
                         <button className="w-full py-3 bg-amber-600/10 text-amber-500 rounded-xl font-bold text-[10px] md:text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                            <Gift className="w-4 h-4" /> {t('redeemPoints')}
                         </button>
                      </div>
                   </Card>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                   <Card title={t('purchaseHistory')} className="p-0">
                      <div className="divide-y divide-zinc-900">
                         {sales.filter(s => s.customerId === selectedCustomer.id).length === 0 ? (
                           <div className="p-8 text-center text-zinc-700 opacity-50">
                              <History className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-4" />
                              <p className="font-bold text-[10px] md:text-xs uppercase tracking-widest">{t('noHistory')}</p>
                           </div>
                         ) : (
                           sales.filter(s => s.customerId === selectedCustomer.id).map((s, idx) => (
                             <div key={`${s.id}-${idx}`} className="p-4 flex items-center justify-between hover:bg-zinc-900/40 transition-colors">
                                <div>
                                   <p className="text-sm font-bold text-white">INV #{s.id.slice(-6)}</p>
                                   <p className="text-[10px] text-zinc-500 font-mono mt-1 uppercase tracking-tighter">{new Date(s.createdAt).toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                   <p className="text-sm font-mono font-bold text-amber-500">{(s.total || 0).toFixed(2)}</p>
                                   <p className="text-[10px] text-zinc-600 uppercase font-black tracking-tighter">{s.paymentMethod}</p>
                                </div>
                             </div>
                           ))
                         )}
                      </div>
                   </Card>

                   <div className="space-y-6">
                      <Card title={t('customerPreferences')}>
                         <div className="space-y-6">
                            <div>
                               <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest block mb-1.5 md:mb-3">{t('favoriteScents')}</label>
                               <div className="flex flex-wrap gap-2">
                                  {(selectedCustomer.favoriteScents || ['Oud', 'Floral', 'Vanilla', 'Spicy']).map((tag, idx) => (
                                    <span key={`${tag}-${idx}`} className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] md:text-xs text-zinc-400 font-bold hover:border-amber-600 transition-colors cursor-pointer whitespace-nowrap">
                                       {tag}
                                    </span>
                                  ))}
                                  <button className="px-3 py-1.5 rounded-lg border border-dashed border-zinc-800 text-[10px] md:text-xs text-zinc-600 hover:text-amber-500 hover:border-amber-500/50 transition-colors">
                                    + Add
                                  </button>
                               </div>
                            </div>
                            <div>
                               <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest block mb-1.5 md:mb-3">{t('notes')}</label>
                               <p className="text-xs text-zinc-500 italic bg-zinc-900/30 p-3 rounded-xl border border-zinc-900">
                                 {selectedCustomer.notes || t('noNotes')}
                               </p>
                            </div>
                         </div>
                      </Card>

                      <Card title={t('offers')}>
                         <div className="space-y-4">
                            <div className="p-4 rounded-2xl bg-amber-600/5 border border-amber-600/20">
                               <div className="flex items-center gap-2 text-amber-600 mb-2">
                                  <Sparkles className="w-4 h-4" />
                                  <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest">{t('activePromo')}</p>
                               </div>
                               <p className="text-[11px] text-white font-bold mb-1">20% Discount on Next Mix</p>
                               <p className="text-[10px] text-zinc-500 leading-relaxed mb-4">Valid until the end of this month for being a loyal customer.</p>
                               <button className="w-full py-2 bg-amber-600 text-white rounded-lg font-bold text-[10px] uppercase tracking-widest">
                                  {t('applytoPOS')}
                               </button>
                            </div>
                            {selectedCustomer.points >= 500 && (
                              <div className="p-4 rounded-2xl bg-emerald-600/5 border border-emerald-600/20 text-emerald-600">
                                 <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest mb-2">Available Reward</p>
                                 <p className="text-[11px] text-zinc-400 leading-relaxed mb-4">You have enough points to redeem for a free 30ml bottle!</p>
                                 <button onClick={redeemPoints} className="w-full py-2 bg-emerald-600 text-white rounded-lg font-bold text-[10px] uppercase tracking-widest">
                                    Redeem Now
                                 </button>
                              </div>
                            )}
                         </div>
                      </Card>
                   </div>
                </div>
             </div>
           ) : (
             <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-zinc-800 bg-zinc-950/20 border border-dashed border-zinc-800 rounded-3xl p-8 text-center">
                <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6">
                   <Users className="w-8 h-8 md:w-10 md:h-10 text-zinc-700" />
                </div>
                <h4 className="text-lg md:text-xl font-bold text-zinc-700">{t('selectRelationship')}</h4>
                <p className="text-zinc-500 mt-2 text-xs md:text-sm">{t('selectRelationshipDesc')}</p>
             </div>
           )}
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-white">
                  {editingCustomer ? t('editProfile') : t('newCustomer')}
                </h3>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-zinc-900 rounded-full transition-colors">
                  <X className="w-5 h-5 text-zinc-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">{t('productName')}</label>
                  <input name="name" defaultValue={editingCustomer?.name} required className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-600" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">{t('phone')}</label>
                  <input name="phone" defaultValue={editingCustomer?.phone} required className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-600" />
                </div>

                <button className="w-full py-4 bg-amber-600 text-white rounded-xl font-bold uppercase tracking-widest hover:bg-amber-700 transition-all shadow-lg shadow-amber-900/20">
                  {editingCustomer ? t('editProfile') : t('newCustomer')}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
