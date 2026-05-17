/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PageWrapper, Header, Card } from '../components/Common.tsx';
import { useStore } from '../store.tsx';
import { 
  Package, 
  FlaskConical, 
  Plus, 
  Search, 
  MoreVertical, 
  AlertTriangle,
  History,
  ArrowUpRight,
  Filter,
  X,
  Trash2,
  Edit2,
  RefreshCw
} from 'lucide-react';
import { cn } from '../lib/utils.ts';
import { motion, AnimatePresence } from 'motion/react';
import { ProductType, ProductCategory } from '../types.ts';

export default function Inventory() {
  const { products, perfumes, addProduct, updateProduct, deleteProduct, addFormula, deleteFormula, t } = useStore();
  const [activeTab, setActiveTab] = useState(t('allProducts'));
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [selectedProductForAdj, setSelectedProductForAdj] = useState<any>(null);

  const productTabs = [t('allProducts'), t('rawMaterials'), t('readyProducts'), t('packaging')];
  const statLabels = [t('readyPerfumes'), t('oilsML'), t('alcoholL')];

  const handleAdjustmentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amount = Number(formData.get('amount'));
    const type = formData.get('type') as string;
    
    if (selectedProductForAdj) {
      const newStock = type === 'ADD' 
        ? selectedProductForAdj.stock + amount 
        : selectedProductForAdj.stock - Math.abs(amount);
      
      await updateProduct(selectedProductForAdj.id, { stock: newStock });
      setShowAdjustmentModal(false);
      setSelectedProductForAdj(null);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (activeTab === t('allProducts')) return matchesSearch;
    
    // Fallback for objects without category (older data)
    const isRaw = p.category === ProductCategory.RAW_MATERIAL || 
                 (!p.category && (p.type === ProductType.OIL || p.type === ProductType.ALCOHOL || p.type === ProductType.BOTTLE));
    const isReady = p.category === ProductCategory.READY_PRODUCT || 
                   (!p.category && p.type === ProductType.READY_PERFUME);

    if (activeTab === t('rawMaterials')) return matchesSearch && isRaw;
    if (activeTab === t('readyProducts')) return matchesSearch && isReady;
    if (activeTab === t('packaging')) return matchesSearch && p.type === ProductType.CARTON;
    return matchesSearch;
  });

  const handleProductSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const productData = {
      name: formData.get('name') as string,
      category: formData.get('category') as any,
      type: formData.get('type') as any,
      stock: Number(formData.get('stock')),
      unit: formData.get('unit') as string,
      costPrice: Number(formData.get('costPrice')),
      salePrice: Number(formData.get('salePrice')),
      reorderLevel: Number(formData.get('reorderLevel')),
      barcode: formData.get('barcode') as string,
    };

    if (editingProduct) {
      await updateProduct(editingProduct.id, productData);
    } else {
      await addProduct(productData);
    }
    setShowProductModal(false);
    setEditingProduct(null);
  };

  const handleFormulaSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const formulaData = {
      name: formData.get('name') as string,
      defaultOilPercentage: Number(formData.get('oilPercentage')),
      allowedBottleSizes: (formData.get('sizes') as string).split(',').map(s => Number(s.trim())),
    };
    await addFormula(formulaData);
    setShowFormulaModal(false);
  };

  return (
    <PageWrapper>
      <Header 
        title={t('inventoryControl')} 
        subtitle={t('inventorySubtitle')}
        actions={
          <>
            <button className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg font-bold hover:bg-zinc-700 transition-colors">
              {t('importCSV')}
            </button>
            <button 
              onClick={() => {
                setEditingProduct(null);
                setShowProductModal(true);
              }}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg font-bold flex items-center gap-2 hover:bg-amber-700 transition-colors shadow-lg shadow-amber-900/20"
            >
              <Plus className="w-4 h-4" />
              {t('addProduct')}
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 md:p-6 shrink-0">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-2 md:p-3 bg-amber-600/10 rounded-xl text-amber-600">
              <FlaskConical className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="text-start">
              <p className="text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-widest">{t('activeFormulas')}</p>
              <h4 className="text-xl md:text-2xl font-bold text-white">{perfumes.length}</h4>
            </div>
          </div>
          <button className="w-full py-2 text-[10px] font-bold text-zinc-500 hover:text-white uppercase tracking-widest flex items-center justify-center gap-2 transition-colors border-t border-zinc-900 mt-2 pt-4">
             {t('manageLayouts')} <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        {/* Quick Stock Stats */}
        {statLabels.map((label, idx) => (
           <div key={idx} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 md:p-6 shrink-0">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-2 md:p-3 bg-zinc-900 rounded-xl text-zinc-400">
                <Package className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div className="text-start">
                <p className="text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-widest">{label}</p>
                <h4 className="text-xl md:text-2xl font-bold text-white tracking-tighter">
                  {idx === 0 ? perfumes.length : idx === 1 ? products.filter(p => p.type === ProductType.OIL).reduce((a, b) => a + b.stock, 0) : products.filter(p => p.type === ProductType.ALCOHOL).reduce((a, b) => a + (b.stock || 0), 0)}
                </h4>
              </div>
            </div>
            <div className="w-full bg-zinc-900 h-1 rounded-full mt-2">
              <div className="w-2/3 h-full bg-blue-500 rounded-full" />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 lg:flex-[3]">
          <Card className="p-0 overflow-x-auto">
             <div className="px-6 py-4 border-b border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex overflow-x-auto w-full md:w-auto gap-2 no-scrollbar">
                  {productTabs.map(tab => (
                    <button 
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        "px-4 py-2 rounded-lg text-[10px] md:text-sm font-bold transition-all whitespace-nowrap",
                        activeTab === tab ? "bg-amber-600 text-white" : "text-zinc-500 hover:text-zinc-300"
                      )}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="relative w-full md:w-auto">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 w-4 h-4" />
                   <input 
                    type="text" 
                    placeholder={t('search')} 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-amber-600 w-full md:w-64"
                   />
                </div>
             </div>
             
             <div className="overflow-x-auto">
               <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="text-left border-b border-zinc-900">
                      <th className="px-6 py-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{t('productName')}</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{t('productType')}</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest text-center">{t('productStock')}</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest text-right">{t('costUnit')}</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest text-right">{t('status')}</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest text-center">{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900">
                     {filteredProducts.map((p, idx) => (
                       <tr key={`${p.id}-${idx}`} className="hover:bg-zinc-900/30 transition-colors group">
                          <td className="px-6 py-4 whitespace-nowrap">
                             <div>
                                <p className="text-sm font-bold text-white">{p.name}</p>
                                <p className="text-[10px] text-zinc-600 font-mono">ID: {p.id}</p>
                             </div>
                          </td>
                          <td className="px-6 py-4">
                             <span className="text-[10px] px-2 py-1 rounded-md bg-zinc-900 text-zinc-400 font-bold border border-zinc-800 whitespace-nowrap">
                                {p.type}
                             </span>
                          </td>
                          <td className="px-6 py-4 text-center whitespace-nowrap">
                             <span className={cn(
                               "text-sm font-mono font-bold",
                               p.stock <= p.reorderLevel ? "text-rose-500" : "text-white"
                             )}>
                                {p.stock} <span className="text-[10px] opacity-40 uppercase">{p.unit}</span>
                             </span>
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                             <span className="text-sm font-mono text-zinc-400">
                                {(p.costPrice || 0).toFixed(2)}
                             </span>
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                             {p.stock <= p.reorderLevel ? (
                               <div className="flex items-center gap-2 justify-end text-rose-500 bg-rose-500/5 px-2 md:px-3 py-1 rounded-full w-fit ml-auto border border-rose-500/10">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span className="text-[9px] md:text-[10px] font-black uppercase tracking-tighter">{t('lowStockLabel')}</span>
                               </div>
                             ) : (
                                <div className="flex items-center gap-2 justify-end text-emerald-500 bg-emerald-500/5 px-2 md:px-3 py-1 rounded-full w-fit ml-auto border border-emerald-500/10">
                                  <span className="text-[9px] md:text-[10px] font-black uppercase tracking-tighter">{t('healthyLabel')}</span>
                               </div>
                             )}
                          </td>
                          <td className="px-6 py-4">
                             <div className="flex items-center justify-center gap-2">
                                <button 
                                  onClick={() => {
                                    setEditingProduct(p);
                                    setShowProductModal(true);
                                  }}
                                  className="p-2 text-zinc-700 hover:text-white transition-colors"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => {
                                    if(confirm(t('confirmDelete'))) deleteProduct(p.id);
                                  }}
                                  className="p-2 text-zinc-700 hover:text-rose-500 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                             </div>
                          </td>
                       </tr>
                     ))}
                  </tbody>
               </table>
             </div>
          </Card>
        </div>

        <div className="flex-none lg:w-80 space-y-6">
           <Card title={t('mixingFormulas')}>
              <div className="space-y-4">
                 {perfumes.map((f, idx) => (
                   <div key={`${f.id}-${idx}`} className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 group hover:border-amber-600/30 transition-all cursor-pointer relative overflow-hidden">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-bold text-white group-hover:text-amber-500 transition-colors">{f.name}</h5>
                        <div className="flex gap-1">
                          <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               if(confirm(t('deleteFormulaConfirm'))) deleteFormula(f.id);
                             }}
                             className="p-1 opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-rose-500 transition-all"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] font-mono text-zinc-500 uppercase">
                         <span>{t('oil')}: {f.defaultOilPercentage}%</span>
                         <span className="w-1 h-1 rounded-full bg-zinc-800" />
                         <span>{f.allowedBottleSizes.length} {t('sizes')}</span>
                      </div>
                   </div>
                 ))}
                 <button 
                  onClick={() => setShowFormulaModal(true)}
                  className="w-full py-3 border border-dashed border-zinc-800 rounded-xl text-zinc-500 hover:text-amber-600 hover:border-amber-600/50 transition-all font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                 >
                    <Plus className="w-4 h-4" />
                    {t('newFormula')}
                 </button>
              </div>
           </Card>

           <Card title={t('stockAdjustments')}>
              <div className="space-y-4">
                 <button 
                  onClick={() => {
                    if (products.length > 0) {
                      setSelectedProductForAdj(products[0]);
                      setShowAdjustmentModal(true);
                    }
                  }}
                  className="w-full py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-all font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                 >
                    <RefreshCw className="w-4 h-4" />
                    {t('manualAdjustment')}
                 </button>
                 <div className="space-y-4 max-h-[300px] overflow-y-auto no-scrollbar">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex gap-4 text-start">
                         <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 shrink-0">
                           <History className="w-4 h-4" />
                         </div>
                         <div className="text-start">
                           <p className="text-xs font-bold text-white leading-none mb-1">{t('stockCorrection')}</p>
                           <p className="text-[10px] text-zinc-500 leading-tight">Ahmed M. adjusted "Pure Alcohol" (-200ml)</p>
                           <p className="text-[9px] text-zinc-700 font-mono uppercase mt-1">Today 14:02</p>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
           </Card>
        </div>
      </div>

      {/* Product Modal */}
      <AnimatePresence>
        {showProductModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProductModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-white">
                  {editingProduct ? t('editProduct') : t('addProduct')}
                </h3>
                <button onClick={() => setShowProductModal(false)} className="p-2 hover:bg-zinc-900 rounded-full transition-colors">
                  <X className="w-5 h-5 text-zinc-500" />
                </button>
              </div>

              <form onSubmit={handleProductSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">{t('productName')}</label>
                    <input name="name" defaultValue={editingProduct?.name} required className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-600" />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">{t('category')}</label>
                    <select name="category" defaultValue={editingProduct?.category || 'RAW_MATERIAL'} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-600">
                      <option value="RAW_MATERIAL">{t('rawMaterial')}</option>
                      <option value="READY_PRODUCT">{t('readyProduct')}</option>
                    </select>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">{t('productType')}</label>
                    <select name="type" defaultValue={editingProduct?.type || 'OIL'} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-600">
                      <option value="OIL">{t('oil')}</option>
                      <option value="ALCOHOL">{t('alc')}</option>
                      <option value="BOTTLE">{t('stepBottle')}</option>
                      <option value="READY_PERFUME">{t('readyPerfumes')}</option>
                      <option value="CARTON">{t('packaging')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">{t('productStock')}</label>
                    <input name="stock" type="number" defaultValue={editingProduct?.stock || 0} required className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-600" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">{t('unit')}</label>
                    <input name="unit" defaultValue={editingProduct?.unit || 'ml'} required className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-600" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">{t('reorderLevel')}</label>
                    <input name="reorderLevel" type="number" defaultValue={editingProduct?.reorderLevel || 100} required className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-600" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">{t('costUnit')}</label>
                    <input name="costPrice" type="number" step="0.01" defaultValue={editingProduct?.costPrice || 0} required className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-600" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">{t('salePrice')}</label>
                    <input name="salePrice" type="number" step="0.01" defaultValue={editingProduct?.salePrice || 0} required className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-600" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">{t('barcode')}</label>
                    <input name="barcode" defaultValue={editingProduct?.barcode} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-600" placeholder="Optional barcode..." />
                  </div>
                </div>

                <button className="w-full py-4 bg-amber-600 text-white rounded-xl font-bold uppercase tracking-widest hover:bg-amber-700 transition-all shadow-lg shadow-amber-900/20">
                  {editingProduct ? t('editProduct') : t('addProduct')}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {showAdjustmentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAdjustmentModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-white">{t('manualAdjustment')}</h3>
                <button onClick={() => setShowAdjustmentModal(false)} className="p-2 hover:bg-zinc-900 rounded-full transition-colors">
                  <X className="w-5 h-5 text-zinc-500" />
                </button>
              </div>

              <form onSubmit={handleAdjustmentSubmit} className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">{t('productName')}</label>
                  <select 
                    value={selectedProductForAdj?.id}
                    onChange={(e) => setSelectedProductForAdj(products.find(p => p.id === e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-600"
                  >
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">{t('productType')}</label>
                      <select name="type" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-600">
                        <option value="ADD">{t('add')} (+) </option>
                        <option value="REDUCE">{t('reduce')} (-)</option>
                      </select>
                   </div>
                   <div>
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">{t('quantity')}</label>
                      <input name="amount" type="number" required defaultValue={0} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-600" />
                   </div>
                </div>

                <div className="p-4 rounded-xl bg-amber-600/5 border border-amber-600/20 text-center">
                   <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">{t('currentStock')}</p>
                   <p className="text-xl font-mono text-white font-bold">{selectedProductForAdj?.stock} {selectedProductForAdj?.unit}</p>
                </div>

                <button className="w-full py-4 bg-amber-600 text-white rounded-xl font-bold uppercase tracking-widest hover:bg-amber-700 transition-all shadow-lg shadow-amber-900/20">
                  {t('confirmMix')}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {showFormulaModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFormulaModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-white">{t('createFormula')}</h3>
                <button onClick={() => setShowFormulaModal(false)} className="p-2 hover:bg-zinc-900 rounded-full transition-colors">
                  <X className="w-5 h-5 text-zinc-500" />
                </button>
              </div>

              <form onSubmit={handleFormulaSubmit} className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">{t('formulaName')}</label>
                  <input name="name" required className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-600" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">{t('defaultOil')}</label>
                  <input name="oilPercentage" type="number" defaultValue={25} required className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-600" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">{t('allowedSizes')}</label>
                  <input name="sizes" defaultValue="30, 50, 100" required className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-600" placeholder="e.g. 30, 50, 100" />
                </div>

                <div className="p-4 rounded-xl bg-amber-600/5 border border-amber-600/20">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-2">{t('autoCalc')}</p>
                  <p className="text-xs text-zinc-400">{t('autoCalcDesc')}</p>
                </div>

                <button className="w-full py-4 bg-amber-600 text-white rounded-xl font-bold uppercase tracking-widest hover:bg-amber-700 transition-all shadow-lg shadow-amber-900/20">
                  {t('generate')}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
