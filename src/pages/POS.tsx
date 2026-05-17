/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { PageWrapper, Card } from '../components/Common.tsx';
import { useStore } from '../store.tsx';
import { 
  Search, 
  Plus, 
  Trash2, 
  User, 
  QrCode, 
  FlaskConical, 
  Minus,
  CheckCircle2,
  AlertCircle,
  Package,
  ShoppingCart,
  X,
  ChevronDown,
  CreditCard,
  Banknote,
  Coins,
  QrCode as ScanIcon,
  Camera,
  Eye
} from 'lucide-react';
import { calculatePerfumeMix, calculateCustomPerfumePrice } from '../lib/engine.ts';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils.ts';
import { SaleItem, ProductType } from '../types.ts';
import { Html5Qrcode } from 'html5-qrcode';

const SearchableItemSelect = ({ 
  label, 
  items, 
  onSelect, 
  selectedItem, 
  searchTerm, 
  setSearchTerm, 
  show, 
  setShow, 
  placeholder 
}: any) => {
  const { t, language } = useStore();
  return (
    <div className="relative">
      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 text-start">{label}</label>
      <button 
        onClick={() => setShow(!show)}
        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white flex items-center justify-between hover:border-amber-600/50 transition-colors"
      >
        <span className="truncate">{selectedItem ? selectedItem.name : placeholder}</span>
        <ChevronDown className={cn("w-4 h-4 text-zinc-500 transition-transform", show && "rotate-180")} />
      </button>
      
      <AnimatePresence>
        {show && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShow(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute z-50 left-0 right-0 mt-2 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[300px]"
            >
              <div className="p-2 border-b border-zinc-900 flex-none">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-600" />
                  <input 
                    autoFocus
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t('search')}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {items.length > 0 ? (
                  items.map((item: any, idx: number) => (
                    <button
                      key={`${item.id}-${idx}`}
                      onClick={() => {
                        onSelect(item);
                        setShow(false);
                      }}
                      className={cn(
                        "w-full px-4 py-3 text-start text-sm hover:bg-amber-600/10 transition-colors border-b border-zinc-900 flex justify-between items-center group",
                        selectedItem?.id === item.id && "bg-amber-600/5 text-amber-500"
                      )}
                    >
                      <div className="flex flex-col">
                        <span className="font-bold">{item.name}</span>
                        <span className="text-[10px] text-zinc-500">{item.stock} {item.unit}</span>
                      </div>
                      {item.salePrice && <span className="text-[10px] font-mono text-zinc-500 group-hover:text-amber-500">{item.salePrice}</span>}
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-zinc-600 uppercase tracking-widest">{language === 'ar' ? 'لم يتم العثور على عناصر' : 'No items found'}</div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function POS() {
  const { products, perfumes, customers, addSale, addCustomer, updateCustomer, currentUser, t, language, settings } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isMixing, setIsMixing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);

  const [paymentData, setPaymentData] = useState({
    cash: 0,
    transfer: 0,
    transferType: 'BANK' as 'BANK' | 'VODAFONE',
    pointsUsed: 0
  });

  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerSelect, setShowCustomerSelect] = useState(false);

  // Mix states
  const [selectedFormula, setSelectedFormula] = useState<any>(null);
  const [selectedBottle, setSelectedBottle] = useState<any>(null);
  const [concentration, setConcentration] = useState(30);
  const [bottleSize, setBottleSize] = useState(50);

  const [selectedOilProduct, setSelectedOilProduct] = useState<any>(null);
  const [selectedAlcoholProduct, setSelectedAlcoholProduct] = useState<any>(null);

  const [oilSearch, setOilSearch] = useState('');
  const [alcoholSearch, setAlcoholSearch] = useState('');
  const [bottleSearch, setBottleSearch] = useState('');
  const [showOilSelect, setShowOilSelect] = useState(false);
  const [showAlcoholSelect, setShowAlcoholSelect] = useState(false);
  const [showBottleSelect, setShowBottleSelect] = useState(false);

  React.useEffect(() => {
    if (!isMixing) {
      setOilSearch('');
      setAlcoholSearch('');
      setBottleSearch('');
      setShowOilSelect(false);
      setShowAlcoholSelect(false);
      setShowBottleSelect(false);
    }
  }, [isMixing]);

  const [discount, setDiscount] = useState({ value: 0, type: 'FIXED' as 'FIXED' | 'PERCENT' });

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.barcode && p.barcode.includes(searchTerm))) && 
      p.type !== ProductType.OIL && p.type !== ProductType.ALCOHOL
    );
  }, [products, searchTerm]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      (c.name || '').toLowerCase().includes(customerSearch.toLowerCase()) || 
      (c.phone || '').includes(customerSearch)
    );
  }, [customers, customerSearch]);

  const oils = useMemo(() => 
    products.filter(p => p.type === ProductType.OIL && p.name.toLowerCase().includes(oilSearch.toLowerCase())), 
  [products, oilSearch]);
  
  const alcohols = useMemo(() => 
    products.filter(p => p.type === ProductType.ALCOHOL && p.name.toLowerCase().includes(alcoholSearch.toLowerCase())), 
  [products, alcoholSearch]);

  const bottles = useMemo(() => 
    products.filter(p => p.type === ProductType.BOTTLE && p.name.toLowerCase().includes(bottleSearch.toLowerCase())), 
  [products, bottleSearch]);

  const addToCart = (item: any) => {
    setCart(prev => [...prev, item]);
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const subtotalValue = cart.reduce((acc, item) => acc + item.totalPrice, 0);

  const discountAmount = discount.type === 'FIXED' 
    ? discount.value 
    : (subtotalValue * discount.value / 100);

  const totalValue = Math.max(0, subtotalValue - discountAmount);

  // Helper to calculate total cost to prevent selling below cost
  const totalCost = useMemo(() => {
    return cart.reduce((acc, item) => {
      if (item.type === 'READY') {
        const prod = products.find(p => p.id === item.productId);
        return acc + (prod?.costPrice || 0) * (item.quantity || 1);
      } else if (item.type === 'CUSTOM') {
        // Calculate cost from components
        const oil = products.find(p => p.id === item.oilProductId);
        const alc = products.find(p => p.id === item.alcoholProductId);
        const bot = products.find(p => p.id === item.bottleProductId);
        const oilCost = ((oil?.costPrice || 0) * (item.oilQuantity || 0));
        const alcCost = (((alc?.costPrice || 0) / 1000) * (item.alcoholQuantity || 0));
        const botCost = (bot?.costPrice || 0);
        return acc + oilCost + alcCost + botCost;
      }
      return acc;
    }, 0);
  }, [cart, products]);

  const isSellingAtLoss = totalValue < totalCost - 0.01;

  const handleApplyRounding = () => {
    const decimals = subtotalValue % 1;
    if (decimals > 0) {
      setDiscount({ value: decimals, type: 'FIXED' });
    }
  };

  const handleMixSubmit = () => {
    if (!selectedFormula || !selectedBottle || !selectedOilProduct || !selectedAlcoholProduct) return;

    const { oilQuantity, alcoholQuantity } = calculatePerfumeMix(bottleSize, concentration);
    const price = calculateCustomPerfumePrice(
      selectedOilProduct.salePrice, 
      selectedAlcoholProduct.salePrice, 
      selectedBottle.salePrice, 
      oilQuantity, 
      alcoholQuantity
    );

    const mixItem = {
      id: `custom-${Date.now()}-${Math.random()}`,
      type: 'CUSTOM',
      perfumeFormulaId: selectedFormula.id,
      name: `${selectedFormula.name} (${bottleSize}ml)`,
      bottleProductId: selectedBottle.id,
      oilProductId: selectedOilProduct.id,
      alcoholProductId: selectedAlcoholProduct.id,
      bottleSize,
      concentration,
      oilQuantity,
      alcoholQuantity,
      unitPrice: price,
      totalPrice: price,
      quantity: 1
    };

    addToCart(mixItem);
    setIsMixing(false);
    setSelectedFormula(null);
    setSelectedBottle(null);
    setSelectedOilProduct(null);
    setSelectedAlcoholProduct(null);
  };

  const oilQty = (bottleSize * concentration) / 100;
  const alcQty = bottleSize - oilQty;
  const oilUnitPrice = selectedOilProduct?.salePrice || 0;
  const alcoholUnitPrice = selectedAlcoholProduct?.salePrice || 0;
  const bottleUnitPrice = selectedBottle?.salePrice || 0;

  const handleCheckout = async () => {
    if (cart.length === 0 || isSellingAtLoss) return;
    setPaymentData({
      cash: totalValue,
      transfer: 0,
      transferType: 'BANK',
      pointsUsed: 0
    });
    setShowPaymentModal(true);
  };

  const calculateRemaining = (cash: number, transfer: number, points: number) => {
    const pointsValue = points * (settings.pointValue || 0.1);
    return totalValue - (cash + transfer + pointsValue);
  };

  const handlePaymentChange = (field: 'cash' | 'transfer' | 'pointsUsed', value: number) => {
    const newData = { ...paymentData, [field]: value };
    const pointsValue = (field === 'pointsUsed' ? value : newData.pointsUsed) * (settings.pointValue || 0.1);
    
    if (field === 'cash') {
      const remaining = totalValue - value - pointsValue;
      newData.transfer = Math.max(0, remaining);
    } else if (field === 'transfer') {
      const remaining = totalValue - value - pointsValue;
      newData.cash = Math.max(0, remaining);
    }
    
    setPaymentData(newData);
  };

  const confirmCheckout = async () => {
    try {
      const pointsValue = paymentData.pointsUsed * (settings.pointValue || 0.1);
      const totalPay = paymentData.cash + paymentData.transfer + pointsValue;
      if (totalPay < totalValue - 0.01) {
        alert(language === 'ar' ? 'المبلغ المدفوع لا يغطي إجمالي السلة.' : 'Payment total does not cover shopping cart total.');
        return;
      }

      await addSale({
        customerId: selectedCustomer?.id || 'WALK-IN',
        items: cart,
        subtotal: subtotalValue,
        discount: discountAmount,
        loyaltyUsed: paymentData.pointsUsed,
        total: totalValue,
        paymentMethod: paymentData.transfer > 0 ? (paymentData.transferType === 'BANK' ? 'BANK' : 'WALLET') : 'CASH',
        cashierId: currentUser?.id || 'default-cashier'
      });

      // Award loyalty points
      if (selectedCustomer && settings.pointsEarningThreshold > 0) {
        const earnedPoints = Math.floor(totalValue / settings.pointsEarningThreshold) * settings.pointsEarnedPerThreshold;
        const totalPointsChange = earnedPoints - paymentData.pointsUsed;
        if (totalPointsChange !== 0) {
          await updateCustomer(selectedCustomer.id, { 
            points: Math.max(0, (selectedCustomer.points || 0) + totalPointsChange) 
          });
        }
      }
      
      // Auto print receipt
      try {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          const receiptHtml = `
            <html dir="${language === 'ar' ? 'rtl' : 'ltr'}">
              <head>
                <title>Receipt</title>
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
                  <h2 style="color: ${settings.themeColor || '#d97706'}">${settings.companyName || 'ScentFlow'}</h2>
                  <div style="font-size: 12px; font-weight: bold; margin-top: 4px;">${settings.companyPhone || ''}</div>
                  <p style="font-size: 10px; color: #666; margin-top: 4px;">${new Date().toLocaleString()}</p>
                </div>
                <div style="text-align: center; font-size: 11px; margin-bottom: 10px; color: #666; font-style: italic;">
                  ${settings.invoiceHeader || ''}
                </div>
                <div class="items">
                  ${cart.map(item => `
                    <div class="item">
                      <span style="font-weight: bold;">${item.name} x${item.quantity}</span>
                      <span style="font-family: monospace;">${(item.totalPrice||0).toFixed(2)}</span>
                    </div>
                  `).join('')}
                </div>
                <div class="total-row">
                  <div class="item">
                    <span>${t('subtotal')}</span>
                    <span>${(subtotalValue || 0).toFixed(2)}</span>
                  </div>
                  <div class="item" style="color: #e11d48">
                    <span>${t('discountAmount')}</span>
                    <span>-${(discountAmount || 0).toFixed(2)}</span>
                  </div>
                  <div class="item" style="font-size: 18px; border-top: 1px solid #eee; padding-top: 10px; margin-top: 5px;">
                    <span>${t('total')}</span>
                    <span style="color: ${settings.themeColor || '#d97706'}">${(totalValue || 0).toFixed(2)} ${t('currency')}</span>
                  </div>
                </div>
                <div class="footer">
                  <p style="white-space: pre-wrap;">${settings.invoiceFooter || (language === 'ar' ? 'شكراً لتعاملكم معنا!' : 'Thank you for shopping with us!')}</p>
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
      } catch (pErr) {
        console.error("Print feature blocked or failed", pErr);
      }

      setCart([]);
      setSelectedCustomer(null);
      setShowPaymentModal(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Checkout failed');
    }
  };

  const handleScanQR = () => {
    setShowQRScanner(true);
    setScannerActive(true);
  };

  React.useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null;
    
    if (showQRScanner && scannerActive) {
      html5QrCode = new Html5Qrcode("qr-reader");
      
      const config = { fps: 10, qrbox: { width: 250, height: 250 } };
      
      html5QrCode.start(
        { facingMode: "environment" }, 
        config, 
        (decodedText) => {
          // Success
          const customerMatch = customers.find(c => c.qrCode === decodedText || c.phone === decodedText);
          if (customerMatch) {
            setSelectedCustomer(customerMatch);
            setShowQRScanner(false);
            setScannerActive(false);
            return;
          }

          const productMatch = products.find(p => p.barcode === decodedText);
          if (productMatch) {
            addToCart({
              id: productMatch.id,
              productId: productMatch.id,
              type: 'READY',
              name: productMatch.name,
              unitPrice: productMatch.salePrice,
              totalPrice: productMatch.salePrice,
              quantity: 1
            });
            setShowQRScanner(false);
            setScannerActive(false);
            return;
          }

          console.log("No customer or product found for code:", decodedText);
        },
        (errorMessage) => {
          // parse error, ignore
        }
      ).catch(err => {
        console.error("Scanner failed to start", err);
      });
    }

    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => {
          html5QrCode?.clear();
        }).catch(err => console.error("Failed to stop scanner", err));
      }
    };
  }, [showQRScanner, scannerActive, customers]);

  return (
    <PageWrapper>
      <div className="flex flex-col lg:flex-row gap-6 lg:h-[calc(100vh-160px)]">
        {/* Left Side: Product Selection */}
        <div className="flex-1 lg:flex-[3] flex flex-col gap-6 overflow-hidden">
          <Card className="flex-none bg-zinc-950/50 backdrop-blur-md">
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => setIsMixing(true)}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition-all shadow-lg shadow-amber-900/30 whitespace-nowrap text-sm md:text-base"
              >
                <FlaskConical className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                {t('mixNewPerfume')}
              </button>
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4 md:w-5 md:h-5" />
                <input 
                  type="text" 
                  placeholder={t('search')}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 md:pl-12 pr-4 py-3 focus:outline-none focus:border-amber-600 transition-colors text-sm md:text-base"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </Card>

          <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4 pr-1 custom-scrollbar">
            {filteredProducts.map((p, idx) => (
              <motion.div 
                whileHover={{ y: -4 }}
                key={`${p.id}-${idx}`}
                onClick={() => addToCart({
                  id: p.id,
                  productId: p.id,
                  type: 'READY',
                  name: p.name,
                  unitPrice: p.salePrice,
                  totalPrice: p.salePrice,
                  quantity: 1
                })}
                className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 cursor-pointer hover:border-amber-600/50 transition-all group"
              >
                <div className="aspect-square bg-zinc-900 rounded-xl mb-4 flex items-center justify-center text-zinc-700 group-hover:text-amber-600 transition-colors">
                  <Package className="w-10 h-10" />
                </div>
                <h4 className="font-bold text-white mb-1 truncate">{p.name}</h4>
                <p className="text-xs text-zinc-500 mb-3">{p.type}</p>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-amber-500 font-bold">{p.salePrice} {t('currency')}</span>
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center group-hover:bg-amber-600 transition-colors">
                    <Plus className="w-4 h-4 text-white" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right Side: Cart & Checkout */}
        <div className="flex-none lg:w-96 flex flex-col gap-6">
           <Card className="flex-none bg-zinc-950 border-amber-600/20">
              <div className="flex flex-col gap-4">
                 <div className="flex items-center gap-4">
                   <div className="flex-1 relative">
                      <SearchableItemSelect 
                        label={t('selectCustomer')}
                        items={filteredCustomers}
                        selectedItem={selectedCustomer}
                        searchTerm={customerSearch}
                        setSearchTerm={setCustomerSearch}
                        show={showCustomerSelect}
                        setShow={setShowCustomerSelect}
                        onSelect={setSelectedCustomer}
                        placeholder={t('selectCustomer')}
                      />
                   </div>
                   <div className="flex gap-2 self-end">
                      <button 
                        onClick={handleScanQR}
                        disabled={isScanning}
                        className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-amber-500 hover:border-amber-500/30 transition-all shadow-sm"
                        title="Scan QR"
                      >
                         <ScanIcon className={cn("w-5 h-5", isScanning && "animate-pulse")} />
                      </button>
                      <button 
                        onClick={() => setShowAddCustomerModal(true)}
                        className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-all shadow-sm"
                        title="Add Customer"
                      >
                         <Plus className="w-5 h-5" />
                      </button>
                   </div>
                 </div>
                    {selectedCustomer ? (
                      <div>
                        <p className="text-sm font-bold text-white">{selectedCustomer.name}</p>
                        <p className="text-xs text-amber-600 font-bold">{selectedCustomer.points || 0} {t('points')}</p>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setSelectedCustomer(customers[0] || null)}
                        className="text-sm text-zinc-400 hover:text-white transition-colors"
                      >
                        {t('selectCustomer')}
                      </button>
                    )}
                 <button className="p-2 text-zinc-500 hover:text-amber-600 transition-colors">
                    <QrCode className="w-5 h-5" />
                 </button>
              </div>
           </Card>

           <Card className="flex-1 flex flex-col overflow-hidden p-0">
              <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
                 <h3 className="font-bold text-white">{t('currentCart')}</h3>
                 <span className="text-xs font-mono text-zinc-500 uppercase">{cart.length} {t('items')}</span>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                 {cart.length === 0 ? (
                   <div className="h-full flex flex-col items-center justify-center text-zinc-700 opacity-50 space-y-4">
                      <ShoppingCart className="w-16 h-16" />
                      <p className="font-bold uppercase tracking-widest text-xs">{t('cartEmpty')}</p>
                   </div>
                 ) : (
                   cart.map((item, i) => (
                     <div key={i} className="flex justify-between items-start gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex-1 text-start">
                           <p className="text-sm font-bold text-white leading-tight">{item.name}</p>
                           {item.type === 'CUSTOM' && (
                             <p className="text-[10px] text-amber-600 font-mono mt-1">
                               {item.bottleSize}{t('ml').toUpperCase()} • {item.concentration}%
                             </p>
                           )}
                           <p className="text-xs text-zinc-500 mt-1">1 x {item.unitPrice} {t('currency')}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                           <span className="font-mono text-sm font-bold text-white">{item.totalPrice}</span>
                           <button 
                            onClick={() => removeFromCart(i)}
                            className="p-1 text-zinc-700 hover:text-red-500 transition-colors"
                           >
                              <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                     </div>
                   ))
                 )}
              </div>
              <div className="p-6 bg-zinc-900/50 border-t border-zinc-800 space-y-4">
                 <div className="flex justify-between text-zinc-400">
                    <span className="text-sm">{t('subtotal')}</span>
                    <span className="font-mono">{(subtotalValue || 0).toFixed(2)}</span>
                 </div>
                 
                 <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                       <button 
                        onClick={handleApplyRounding}
                        className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-[10px] font-bold rounded uppercase tracking-wider transition-colors"
                       >
                          {t('rounding')}
                       </button>
                       <div className="flex items-center gap-2">
                          <input 
                            type="number"
                            value={discount.value || ''}
                            onChange={(e) => setDiscount(prev => ({ ...prev, value: Number(e.target.value) }))}
                            className="w-16 bg-zinc-800 border-none rounded px-2 py-1 text-xs text-white text-end focus:outline-none focus:ring-1 focus:ring-amber-500"
                            placeholder="0"
                          />
                          <select 
                            value={discount.type}
                            onChange={(e) => setDiscount(prev => ({ ...prev, type: e.target.value as any }))}
                            className="bg-zinc-800 text-[10px] text-zinc-500 border-none rounded px-1 py-1 focus:outline-none"
                          >
                             <option value="FIXED">{t('currency')}</option>
                             <option value="PERCENT">%</option>
                          </select>
                       </div>
                    </div>
                    {isSellingAtLoss && (
                      <div className="flex items-center gap-2 text-rose-500 bg-rose-500/10 p-2 rounded-lg animate-pulse">
                         <AlertCircle className="w-3 h-3" />
                         <span className="text-[10px] font-bold uppercase tracking-tight">{t('noLossWarning')}</span>
                      </div>
                    )}
                 </div>

                 <div className="flex justify-between pt-4 border-t border-zinc-800">
                    <span className="font-bold text-white uppercase tracking-wider">{t('total')}</span>
                    <span className="text-2xl font-bold text-amber-500 font-mono">{(totalValue || 0).toFixed(2)} {t('currency')}</span>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-3 mt-4">
                   <button 
                     onClick={() => setShowReceiptPreview(true)}
                     disabled={cart.length === 0}
                     className="py-4 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-xl font-bold hover:text-white transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                   >
                       <Eye className="w-5 h-5 flex-shrink-0" />
                       <span className="text-sm">{language === 'ar' ? 'معاينة الفاتورة' : 'Preview Invoice'}</span>
                   </button>
                   <button 
                     onClick={handleCheckout}
                     disabled={cart.length === 0 || isSellingAtLoss}
                     className="py-4 bg-amber-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-xl font-bold text-lg shadow-xl shadow-amber-900/20 active:scale-95 transition-all"
                   >
                       {t('checkout')}
                   </button>
                 </div>
              </div>
           </Card>
        </div>
      </div>

      {/* Mixing Modal */}
      <AnimatePresence>
        {isMixing && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsMixing(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-2xl relative overflow-hidden flex flex-col h-full max-h-[90vh] md:h-[600px]"
            >
              <div className="p-4 md:p-8 border-b border-zinc-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 md:p-3 bg-amber-600/20 rounded-2xl text-amber-600">
                    <FlaskConical className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div className="text-start">
                    <h3 className="text-lg md:text-xl font-bold text-white leading-tight">{t('mixingEngine')}</h3>
                    <p className="hidden md:block text-zinc-500 text-sm">{t('mixingSubtitle')}</p>
                  </div>
                </div>
                <button onClick={() => setIsMixing(false)} className="p-2 text-zinc-500 hover:text-white transition-colors">
                  <X className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scrollbar-hide">
                {/* Formulas Selection */}
                <div>
                  <label className="text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-4">{t('stepFormula')}</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    {perfumes.map((f, idx) => (
                      <div 
                        key={`${f.id}-${idx}`}
                        onClick={() => {
                          setSelectedFormula(f);
                          setConcentration(f.defaultOilPercentage);
                          const oil = products.find(p => p.id === f.oilProductId);
                          if (oil) setSelectedOilProduct(oil);
                          if (alcohols.length > 0) setSelectedAlcoholProduct(alcohols[0]);
                        }}
                        className={cn(
                          "p-3 md:p-4 rounded-2xl border-2 cursor-pointer transition-all h-20 md:h-24 flex items-center gap-4",
                          selectedFormula?.id === f.id ? "bg-amber-600/10 border-amber-600" : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                        )}
                      >
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-zinc-800 flex items-center justify-center text-amber-600 shrink-0">
                          <FlaskConical className="w-4 h-4 md:w-5 md:h-5" />
                        </div>
                        <span className={cn("font-bold text-sm md:text-base text-start", selectedFormula?.id === f.id ? "text-amber-500" : "text-white")}>{f.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottle Selection */}
                <SearchableItemSelect 
                  label={t('stepBottle')}
                  items={bottles}
                  selectedItem={selectedBottle}
                  searchTerm={bottleSearch}
                  setSearchTerm={setBottleSearch}
                  show={showBottleSelect}
                  setShow={setShowBottleSelect}
                  onSelect={(b: any) => {
                    setSelectedBottle(b);
                    if (b.fixedSize) setBottleSize(b.fixedSize);
                  }}
                  placeholder={t('selectBottle') || 'Select Bottle'}
                />

                {/* Configuration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <SearchableItemSelect 
                    label={t('oil')}
                    items={oils}
                    selectedItem={selectedOilProduct}
                    searchTerm={oilSearch}
                    setSearchTerm={setOilSearch}
                    show={showOilSelect}
                    setShow={setShowOilSelect}
                    onSelect={setSelectedOilProduct}
                    placeholder={t('selectOil') || 'Select Scent Oil'}
                   />
                   <SearchableItemSelect 
                    label={t('alc')}
                    items={alcohols}
                    selectedItem={selectedAlcoholProduct}
                    searchTerm={alcoholSearch}
                    setSearchTerm={setAlcoholSearch}
                    show={showAlcoholSelect}
                    setShow={setShowAlcoholSelect}
                    onSelect={setSelectedAlcoholProduct}
                    placeholder={t('selectAlcohol') || 'Select Alcohol'}
                   />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  <div>
                    <label className="text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-4 text-start">{t('bottleSize')}: {bottleSize}ml</label>
                    <div className="flex items-center gap-4">
                      <input 
                        type="range" 
                        min="1" 
                        max="1000" 
                        step="1"
                        value={bottleSize}
                        disabled={selectedBottle?.fixedSize}
                        onChange={(e) => setBottleSize(Number(e.target.value))}
                        className="flex-1 accent-amber-600 h-1.5 bg-zinc-900 rounded-full appearance-none cursor-pointer"
                      />
                      <input 
                        type="number"
                        min="1"
                        max="1000"
                        value={bottleSize}
                        disabled={selectedBottle?.fixedSize}
                        onChange={(e) => setBottleSize(Number(e.target.value))}
                        className="w-16 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-white text-center focus:outline-none focus:border-amber-600"
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-[10px] font-mono text-zinc-600">
                      <span>1ml</span>
                      <span>1000ml</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-4 text-start">{t('concentration')}: {concentration}%</label>
                    <div className="flex items-center gap-4">
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        step="0.1"
                        value={concentration}
                        onChange={(e) => setConcentration(Number(e.target.value))}
                        className="flex-1 accent-amber-600 h-1.5 bg-zinc-900 rounded-full appearance-none cursor-pointer"
                      />
                      <input 
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={concentration}
                        onChange={(e) => setConcentration(Number(e.target.value))}
                        className="w-16 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-white text-center focus:outline-none focus:border-amber-600"
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-[10px] font-mono text-zinc-600">
                      <span>0%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>

                {/* Formula Engine Table */}
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-x-auto">
                   <div className="px-4 py-2 bg-zinc-800/50 flex justify-between items-center min-w-[400px]">
                     <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{t('formulaEngine')}</span>
                     <span className="text-[10px] font-mono text-amber-500">{selectedFormula?.name || '---'} — {bottleSize}ml</span>
                   </div>
                   <table className="w-full text-xs text-start min-w-[400px]">
                     <thead>
                       <tr className="border-b border-zinc-800 text-zinc-500">
                         <th className="px-4 py-3 font-medium text-start">{t('component')}</th>
                         <th className="px-4 py-3 font-medium text-start">{t('quantity')}</th>
                         <th className="px-4 py-3 font-medium text-start hidden sm:table-cell">{t('unitPrice')}</th>
                         <th className="px-4 py-3 font-medium text-start">{t('totalPrice')}</th>
                       </tr>
                     </thead>
                     <tbody className="text-zinc-300">
                       <tr className="border-b border-zinc-800/50">
                         <td className="px-4 py-3 font-bold">{t('oil')}: {selectedOilProduct?.name || '---'}</td>
                         <td className="px-4 py-3 font-mono">{(oilQty || 0).toFixed(1)} ml</td>
                         <td className="px-4 py-3 font-mono hidden sm:table-cell">{oilUnitPrice}</td>
                         <td className="px-4 py-3 font-mono text-white">{(oilQty * oilUnitPrice || 0).toFixed(2)}</td>
                       </tr>
                       <tr className="border-b border-zinc-800/50">
                         <td className="px-4 py-3 font-bold">{t('alc')}: {selectedAlcoholProduct?.name || '---'}</td>
                         <td className="px-4 py-3 font-mono">{(alcQty || 0).toFixed(1)} ml</td>
                         <td className="px-4 py-3 font-mono hidden sm:table-cell">{alcoholUnitPrice}</td>
                         <td className="px-4 py-3 font-mono text-white">{(alcQty * alcoholUnitPrice / 1000 || 0).toFixed(2)}</td>
                       </tr>
                       <tr>
                         <td className="px-4 py-3 font-bold">{selectedBottle?.name || t('stepBottle')}</td>
                         <td className="px-4 py-3 font-mono">1 {t('items')}</td>
                         <td className="px-4 py-3 font-mono hidden sm:table-cell">{bottleUnitPrice}</td>
                         <td className="px-4 py-3 font-mono text-white">{(bottleUnitPrice || 0).toFixed(2)}</td>
                       </tr>
                     </tbody>
                     <tfoot className="bg-amber-600/5">
                        <tr className="font-bold text-amber-500 border-t border-zinc-800">
                          <td colSpan={language === 'ar' ? 3 : 2} className="px-4 py-3 text-start uppercase tracking-widest">{t('total')}</td>
                          <td className="hidden sm:table-cell"></td>
                          <td className="px-4 py-3 font-mono text-lg">{((oilQty * oilUnitPrice) + (alcQty * alcoholUnitPrice / 1000) + bottleUnitPrice).toLocaleString()}</td>
                        </tr>
                     </tfoot>
                   </table>
                </div>

              </div>

              <div className="p-4 md:p-8 bg-zinc-900/50 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
                <div className="flex items-center gap-6 self-start sm:self-center">
                  <div className="text-start">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1">{t('mixingPlan')}</p>
                    <p className="text-xs md:text-sm font-mono text-white">
                      {t('oil')}: <span className="text-amber-500 font-bold">{(((bottleSize * concentration)/100) || 0).toFixed(1)}{t('ml')}</span> • 
                      {t('alc')}: <span className="text-zinc-500">{((bottleSize - (bottleSize * concentration)/100) || 0).toFixed(1)}{t('ml')}</span>
                    </p>
                  </div>
                </div>
                <button 
                  onClick={handleMixSubmit}
                  disabled={!selectedFormula || !selectedBottle}
                  className="w-full sm:w-auto px-8 py-3 md:py-4 bg-amber-600 disabled:bg-zinc-800 text-white rounded-xl font-bold shadow-lg shadow-amber-900/20 active:scale-95 transition-all text-sm md:text-base"
                >
                  {t('confirmMix')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowPaymentModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-md relative overflow-hidden flex flex-col p-8"
            >
              <h3 className="text-xl font-black text-white mb-6 uppercase tracking-widest">{t('checkout')}</h3>
              
              <div className="space-y-6">
                 <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-3">{t('subtotal')}</label>
                    <div className="text-3xl font-mono font-bold text-amber-500">{(subtotalValue || 0).toFixed(2)}</div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
                       <div className="flex items-center gap-2 text-emerald-500 mb-2">
                          <Banknote className="w-4 h-4" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">{t('cash') || 'Cash'}</span>
                       </div>
                       <input 
                         type="number"
                         value={paymentData.cash}
                         onChange={(e) => handlePaymentChange('cash', Number(e.target.value))}
                         className="w-full bg-transparent border-none text-xl font-mono text-white focus:outline-none"
                       />
                    </div>
                    <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl relative">
                       <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 text-blue-500">
                             <CreditCard className="w-4 h-4" />
                             <span className="text-[10px] font-bold uppercase tracking-widest">{t('transfer') || 'Transfer'}</span>
                          </div>
                          <select 
                            value={paymentData.transferType}
                            onChange={(e) => setPaymentData({ ...paymentData, transferType: e.target.value as any })}
                            className="bg-zinc-800 border-none text-[10px] text-zinc-400 rounded px-1 py-0.5 focus:outline-none"
                          >
                             <option value="BANK">{t('bankTransfer')}</option>
                             <option value="VODAFONE">{t('wallet')}</option>
                          </select>
                       </div>
                       <input 
                         type="number"
                         value={paymentData.transfer}
                         onChange={(e) => handlePaymentChange('transfer', Number(e.target.value))}
                         className="w-full bg-transparent border-none text-xl font-mono text-white focus:outline-none"
                       />
                    </div>
                 </div>

                 {selectedCustomer && (
                   <div className="p-4 bg-amber-600/5 border border-amber-600/10 rounded-2xl">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-amber-500">
                           <Coins className="w-4 h-4" />
                           <span className="text-[10px] font-bold uppercase tracking-widest">{t('points')}</span>
                        </div>
                        <span className="text-[10px] text-zinc-500 font-mono">Max: {selectedCustomer.points} pts</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <input 
                          type="number"
                          max={selectedCustomer.points}
                          value={paymentData.pointsUsed}
                          onChange={(e) => handlePaymentChange('pointsUsed', Math.min(Number(e.target.value), selectedCustomer.points))}
                          className="flex-1 bg-transparent border-none text-xl font-mono text-amber-500 focus:outline-none"
                        />
                        <span className="text-xs text-zinc-600 font-mono">≈ {(paymentData.pointsUsed * (settings.pointValue || 0.1)).toFixed(2)}</span>
                      </div>
                   </div>
                 )}

                 <div className="pt-4 border-t border-zinc-900 flex justify-between items-center">
                    <div className="text-start">
                       <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">{t('remaining') || 'Remaining'}</p>
                       <p className={cn(
                         "text-lg font-mono font-bold",
                         (paymentData.cash + paymentData.transfer + (paymentData.pointsUsed * (settings.pointValue || 0.1))) >= subtotalValue - 0.01 ? "text-emerald-500" : "text-rose-500"
                       )}>
                         {(Math.max(0, subtotalValue - (paymentData.cash + paymentData.transfer + (paymentData.pointsUsed * (settings.pointValue || 0.1)))) || 0).toFixed(2)}
                       </p>
                    </div>
                    <button 
                      onClick={confirmCheckout}
                      className="px-8 py-4 bg-amber-600 text-white rounded-xl font-bold uppercase tracking-widest text-sm shadow-xl shadow-amber-900/20 active:scale-95 transition-all"
                    >
                       Confirm Payment
                    </button>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showQRScanner && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowQRScanner(false);
                setScannerActive(false);
              }}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-sm relative overflow-hidden flex flex-col p-8 items-center"
            >
              <div className="relative w-full aspect-square mb-8 rounded-2xl overflow-hidden border-2 border-amber-600/30">
                <div id="qr-reader" className="w-full h-full" />
                {/* Scanning line animation overlayed if scanning but not showing camera yet? html5-qrcode shows its own generally */}
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{t('scanningCard')}</h3>
              <p className="text-sm text-zinc-500 text-center">{t('scanningInstruction')}</p>
              
              <button 
                onClick={() => {
                  setShowQRScanner(false);
                  setScannerActive(false);
                }}
                className="mt-8 px-6 py-2 text-zinc-500 hover:text-white transition-colors"
              >
                {t('cancel') || 'Cancel'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddCustomerModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowAddCustomerModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-sm relative overflow-hidden flex flex-col p-8"
            >
              <h3 className="text-xl font-black text-white mb-6 uppercase tracking-widest">{t('addCustomer')}</h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                try {
                  const newCust = await addCustomer({
                    name: fd.get('name') as string,
                    phone: fd.get('phone') as string,
                  });
                  setSelectedCustomer(newCust);
                  setShowAddCustomerModal(false);
                } catch (error) {
                  console.error("Failed to add customer", error);
                  alert("Failed to add customer");
                }
              }} className="space-y-4">
                 <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">{t('fullName')}</label>
                    <input name="name" required className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-600" />
                 </div>
                 <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">{t('phone')}</label>
                    <input name="phone" required className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-600" />
                 </div>
                 <button className="w-full py-4 bg-amber-600 text-white rounded-xl font-bold uppercase tracking-widest shadow-lg shadow-amber-900/20 active:scale-95 transition-all">
                    {language === 'ar' ? 'إنشاء واختيار' : 'Create & Select'}
                 </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReceiptPreview && (
          <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
             <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReceiptPreview(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
             />
             <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-xl w-full max-w-[320px] shadow-2xl relative overflow-hidden flex flex-col items-center p-6 text-zinc-900"
             >
                {settings.invoiceBackground && (
                  <img src={settings.invoiceBackground} className="absolute inset-0 w-full h-full object-cover opacity-5 pointer-events-none" />
                )}
                <div className="w-full text-center border-b-2 border-zinc-900 pb-4 mb-4 relative z-10">
                   <h2 className="text-2xl font-black tracking-tighter italic uppercase" style={{ color: settings.themeColor || '#d97706' }}>
                     {settings.companyName || 'ScentFlow'}
                   </h2>
                   <p className="text-[10px] text-zinc-500 font-bold">{settings.companyPhone}</p>
                   <p className="text-[9px] text-zinc-400 font-mono mt-1">{new Date().toLocaleString()}</p>
                </div>
                
                <div className="w-full text-center mb-4 relative z-10">
                   <p className="text-[9px] text-zinc-400 italic whitespace-pre-wrap">{settings.invoiceHeader}</p>
                </div>

                <div className="w-full space-y-4 mb-6 relative z-10">
                   {cart.map((item, idx) => (
                     <div key={idx} className="flex justify-between text-xs items-start gap-2">
                        <span className="font-bold flex-1">{item.name} <span className="text-zinc-400">x{item.quantity}</span></span>
                        <span className="font-mono">{(item.totalPrice || 0).toFixed(2)}</span>
                     </div>
                   ))}
                </div>
                <div className="w-full border-t-2 border-zinc-900 border-dashed pt-4 space-y-2 relative z-10">
                   <div className="flex justify-between text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                      <span>{t('subtotal')}</span>
                      <span>{(subtotalValue || 0).toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between text-[10px] text-rose-500 font-bold uppercase tracking-widest">
                      <span>{t('discountAmount')}</span>
                      <span>-{(discountAmount || 0).toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between text-lg font-black border-t-2 border-zinc-900 pt-3 text-zinc-900 tracking-tight">
                      <span>{t('total')}</span>
                      <span className="font-mono" style={{ color: settings.themeColor || '#d97706' }}>
                        {(totalValue || 0).toFixed(2)} {t('currency')}
                      </span>
                   </div>
                </div>
                <div className="mt-8 text-center text-[10px] text-zinc-400 italic relative z-10 whitespace-pre-wrap line-clamp-3">
                   {settings.invoiceFooter || (language === 'ar' ? 'شكراً لتعاملكم معنا!' : 'Thank you for shopping with us!')}
                </div>
                <button 
                  onClick={() => setShowReceiptPreview(false)}
                  className="mt-6 w-full py-4 bg-zinc-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-zinc-800 transition-all active:scale-[0.98] relative z-20"
                >
                   {language === 'ar' ? 'إغلاق' : 'Close'}
                </button>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200]"
          >
             <div className="bg-emerald-500 text-white px-8 py-4 rounded-2xl shadow-2xl shadow-emerald-950/40 flex items-center gap-4">
                <CheckCircle2 className="w-6 h-6" />
                <div className={cn("pr-4 border-white/20", language === 'ar' ? "border-l pl-4" : "border-r pr-4")}>
                  <p className="font-bold">{t('transactionComplete')}</p>
                  <p className="text-xs opacity-90">Invoice #SF-{(Date.now()).toString().slice(-6)} {t('invoiceSuccess')}</p>
                </div>
                <button className="text-xs font-bold uppercase tracking-widest hover:underline">{t('viewInvoice')}</button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}

