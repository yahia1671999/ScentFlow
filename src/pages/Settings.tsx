import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, 
  Users, 
  FileText, 
  Building2, 
  Plus, 
  Trash2, 
  Save, 
  Image as ImageIcon,
  Shield,
  Palette
} from 'lucide-react';
import { useStore } from '../store.tsx';

export default function SettingsPage() {
  const { 
    system_users, 
    settings, 
    addUser, 
    deleteUser, 
    updateSettings, 
    t, 
    language 
  } = useStore();
  
  const [activeTab, setActiveTab] = useState<'USERS' | 'INVOICE' | 'COMPANY'>('USERS');
  const isRtl = language === 'ar';

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-white tracking-widest uppercase">{t('settings')}</h2>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-2">Manage your system & customization</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Nav */}
        <div className="lg:col-span-1 space-y-2">
          <TabButton 
            active={activeTab === 'USERS'} 
            onClick={() => setActiveTab('USERS')} 
            icon={Users} 
            label={language === 'ar' ? 'المستخدمين' : 'User Accounts'} 
          />
          <TabButton 
            active={activeTab === 'INVOICE'} 
            onClick={() => setActiveTab('INVOICE')} 
            icon={FileText} 
            label={language === 'ar' ? 'تصميم الفاتورة' : 'Invoice Design'} 
          />
          <TabButton 
            active={activeTab === 'COMPANY'} 
            onClick={() => setActiveTab('COMPANY')} 
            icon={Building2} 
            label={language === 'ar' ? 'معلومات الشركة' : 'Company Info'} 
          />
          <TabButton 
            active={activeTab === 'LOYALTY'} 
            onClick={() => setActiveTab('LOYALTY')} 
            icon={Palette} 
            label={language === 'ar' ? 'نظام النقاط' : 'Loyalty Program'} 
          />
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {activeTab === 'USERS' && <UserManagement key="users" />}
            {activeTab === 'INVOICE' && <InvoiceDesigner key="invoice" />}
            {activeTab === 'COMPANY' && <CompanyInfo key="company" />}
            {activeTab === 'LOYALTY' && <LoyaltySettings key="loyalty" />}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl transition-all ${
        active 
          ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/20' 
          : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-bold text-sm uppercase tracking-widest">{label}</span>
    </button>
  );
}

const MODULES = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'pos', label: 'POS / Cashier' },
  { id: 'crm', label: 'CRM / Customers' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'accounting', label: 'Accounting' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'reports', label: 'Reports' },
  { id: 'settings', label: 'Settings' }
];

const ACTIONS = [
  { id: 'view', label: 'View' },
  { id: 'add', label: 'Add' },
  { id: 'edit', label: 'Edit' },
  { id: 'delete', label: 'Delete' },
  { id: 'print', label: 'Print' }
];

function UserManagement() {
  const { system_users, addUser, deleteUser, language } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [permissions, setPermissions] = useState<any>({});

  const togglePermission = (modId: string, actionId: string) => {
    setPermissions((prev: any) => ({
      ...prev,
      [modId]: {
        ...(prev[modId] || {}),
        [actionId]: !(prev[modId]?.[actionId])
      }
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-white uppercase tracking-widest">System Users</h3>
        <button 
          onClick={() => {
            setPermissions({});
            setShowAdd(true);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {system_users.map((user: any) => (
          <div key={user.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center">
                <Shield className={`w-6 h-6 ${user.role === 'ADMIN' ? 'text-amber-500' : 'text-zinc-500'}`} />
              </div>
              <div>
                <div className="font-bold text-white uppercase tracking-wider">{user.username}</div>
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{user.role}</div>
              </div>
            </div>
            {user.id !== 'admin-1' && (
              <button 
                onClick={() => deleteUser(user.id)}
                className="p-2 text-zinc-600 hover:text-rose-500 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-zinc-950 border border-zinc-800 p-8 rounded-3xl w-full max-w-2xl shadow-2xl my-auto"
          >
            <h4 className="text-lg font-black text-white uppercase tracking-widest mb-6">Create New User</h4>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              await addUser({
                username: fd.get('username'),
                password: fd.get('password'),
                role: fd.get('role'),
                name: fd.get('name'),
                permissions
              });
              setShowAdd(false);
            }} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Full Name</label>
                  <input name="name" required className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-600" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Username</label>
                  <input name="username" required className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-600" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Password</label>
                  <input name="password" type="password" required className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-600" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Role</label>
                  <select name="role" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-600">
                    <option value="CASHIER">CASHIER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <h5 className="text-[10px] font-bold text-white uppercase tracking-widest border-b border-zinc-800 pb-2">Module Permissions</h5>
                <div className="max-h-[300px] overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                  {MODULES.map(mod => (
                    <div key={mod.id} className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800/50">
                      <div className="font-bold text-xs text-zinc-300 uppercase mb-3">{mod.label}</div>
                      <div className="flex flex-wrap gap-2">
                        {ACTIONS.map(action => (
                          <button
                            key={action.id}
                            type="button"
                            onClick={() => togglePermission(mod.id, action.id)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                              permissions[mod.id]?.[action.id] 
                                ? 'bg-amber-600 text-white' 
                                : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
                            }`}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-4 bg-zinc-800 text-white rounded-xl font-bold uppercase tracking-widest text-xs">Cancel</button>
                <button type="submit" className="flex-1 py-4 bg-amber-600 text-white rounded-xl font-bold uppercase tracking-widest text-xs">Create User</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

function InvoiceDesigner() {
  const { settings, updateSettings, language } = useStore();
  const [formData, setFormData] = useState({
    invoiceHeader: '',
    invoiceFooter: '',
    invoiceBackground: '',
    themeColor: '#d97706',
    ...settings
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-white uppercase tracking-widest">Invoice Customization</h3>
        <button 
          onClick={() => updateSettings(formData)}
          className="flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
        >
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Invoice Header</label>
            <textarea 
              value={formData.invoiceHeader}
              onChange={(e) => setFormData({...formData, invoiceHeader: e.target.value})}
              className="w-full h-24 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-white focus:outline-none focus:border-amber-600 resize-none text-sm"
              placeholder="e.g. Thank you for your business!"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Invoice Footer</label>
            <textarea 
              value={formData.invoiceFooter}
              onChange={(e) => setFormData({...formData, invoiceFooter: e.target.value})}
              className="w-full h-24 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-white focus:outline-none focus:border-amber-600 resize-none text-sm"
              placeholder="e.g. Terms and conditions..."
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Background Image URL</label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input 
                  value={formData.invoiceBackground}
                  onChange={(e) => setFormData({...formData, invoiceBackground: e.target.value})}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-amber-600 text-sm"
                  placeholder="https://example.com/bg.jpg"
                />
              </div>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Theme Color</label>
            <div className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
              <input 
                type="color"
                value={formData.themeColor || '#d97706'}
                onChange={(e) => setFormData({...formData, themeColor: e.target.value})}
                className="w-10 h-10 rounded-lg bg-transparent border-none cursor-pointer"
              />
              <span className="text-zinc-400 font-mono text-xs uppercase">{formData.themeColor || '#D97706'}</span>
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div className="space-y-4">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Live Preview</label>
          <div className="aspect-[3/4] bg-white rounded-3xl overflow-hidden shadow-2xl relative flex flex-col p-8 text-black font-sans">
             {formData.invoiceBackground && (
               <img src={formData.invoiceBackground} className="absolute inset-0 w-full h-full object-cover opacity-10 pointer-events-none" />
             )}
             <div className="flex justify-between items-start mb-8 relative z-10">
               <div className="w-12 h-12 bg-amber-600 rounded-xl flex items-center justify-center">
                 <Palette className="text-white w-6 h-6" />
               </div>
               <div className="text-right">
                 <div className="font-black uppercase tracking-tighter text-xl">INVOICE</div>
                 <div className="text-[10px] font-bold text-zinc-400">#INV-001234</div>
               </div>
             </div>
             
             <div className="text-center mb-6 border-y border-zinc-100 py-3 relative z-10">
               <p className="text-[10px] italic text-zinc-500 whitespace-pre-wrap">{formData.invoiceHeader || 'Header goes here'}</p>
             </div>

             <div className="flex-1 space-y-3 relative z-10">
               <div className="flex justify-between text-xs font-bold border-b border-zinc-100 pb-2">
                 <span>Item</span>
                 <span>Total</span>
               </div>
               <div className="flex justify-between text-xs text-zinc-600">
                 <span>Midnight Oud 50ml x1</span>
                 <span>120.00</span>
               </div>
               <div className="flex justify-between text-xs text-zinc-600">
                 <span>Rose Musk Oil 10ml x2</span>
                 <span>80.00</span>
               </div>
             </div>

             <div className="mt-6 pt-4 border-t-2 border-zinc-100 relative z-10">
                <div className="flex justify-between font-black text-lg">
                  <span>TOTAL</span>
                  <span>200.00 EGP</span>
                </div>
             </div>

             <div className="mt-auto text-center relative z-10">
               <p className="text-[9px] text-zinc-400 font-medium whitespace-pre-wrap">{formData.invoiceFooter || 'Footer goes here'}</p>
             </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function CompanyInfo() {
  const { settings, updateSettings, language } = useStore();
  const [formData, setFormData] = useState({
    companyName: '',
    companyPhone: '',
    taxId: '',
    companyAddress: '',
    ...settings
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-2xl space-y-8"
    >
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-white uppercase tracking-widest">Business Identity</h3>
        <button 
          onClick={() => updateSettings(formData)}
          className="flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
        >
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl space-y-6">
        <div>
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Company Name</label>
          <input 
            value={formData.companyName}
            onChange={(e) => setFormData({...formData, companyName: e.target.value})}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-600 font-bold"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Contact Number</label>
          <input 
            value={formData.companyPhone}
            onChange={(e) => setFormData({...formData, companyPhone: e.target.value})}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-600 font-mono"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Tax ID / Registration</label>
          <input 
            value={formData.taxId || ''}
            onChange={(e) => setFormData({...formData, taxId: e.target.value})}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-600 font-mono"
            placeholder="Optional"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Business Address</label>
          <textarea 
            value={formData.companyAddress || ''}
            onChange={(e) => setFormData({...formData, companyAddress: e.target.value})}
            className="w-full h-24 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-600 resize-none text-sm"
            placeholder="Enter physical address..."
          />
        </div>
      </div>
    </motion.div>
  );
}

function LoyaltySettings() {
  const { settings, updateSettings, language } = useStore();
  const [formData, setFormData] = useState({
    pointsEarningThreshold: 100,
    pointsEarnedPerThreshold: 5,
    pointValue: 0.1,
    ...settings
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-2xl space-y-8"
    >
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-white uppercase tracking-widest">
          {language === 'ar' ? 'إعدادات الولاء والمكافآت' : 'Loyalty & Rewards'}
        </h3>
        <button 
          onClick={() => updateSettings(formData)}
          className="flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
        >
          <Save className="w-4 h-4" />
          {language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
        </button>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">
              {language === 'ar' ? 'حد اكتساب النقاط (جنيه)' : 'Earning Threshold (EGP)'}
            </label>
            <input 
              type="number"
              value={formData.pointsEarningThreshold}
              onChange={(e) => setFormData({...formData, pointsEarningThreshold: parseFloat(e.target.value)})}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-600 font-mono"
            />
            <p className="text-[9px] text-zinc-600 mt-2 italic">
              {language === 'ar' ? 'المبلغ المطلوب لربح النقاط' : 'Amount spent to trigger points award'}
            </p>
          </div>
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">
              {language === 'ar' ? 'النقاط المكتسبة' : 'Points Awarded'}
            </label>
            <input 
              type="number"
              value={formData.pointsEarnedPerThreshold}
              onChange={(e) => setFormData({...formData, pointsEarnedPerThreshold: parseFloat(e.target.value)})}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-600 font-mono"
            />
            <p className="text-[9px] text-zinc-600 mt-2 italic">
              {language === 'ar' ? 'عدد النقاط الممنوحة لكل حد شراء' : 'Points added for every threshold spent'}
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-zinc-800">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">
            {language === 'ar' ? 'قيمة الاستبدال (للنقطة الواحدة)' : 'Redemption Value (Per Point)'}
          </label>
          <div className="flex items-center gap-4">
             <input 
              type="number"
              step="0.01"
              value={formData.pointValue}
              onChange={(e) => setFormData({...formData, pointValue: parseFloat(e.target.value)})}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-600 font-mono"
            />
            <div className="whitespace-nowrap text-xs font-bold text-amber-600 uppercase tracking-widest">
              {language === 'ar' ? 'جنيه / نقطة' : 'EGP / Point'}
            </div>
          </div>
          <p className="text-[9px] text-zinc-600 mt-2 italic">
            {language === 'ar' ? 'القيمة النقدية المخصومة لكل نقطة مستخدمة' : 'Cash value deducted for each point used during checkout'}
          </p>
        </div>

        <div className="p-4 bg-zinc-950/50 rounded-2xl border border-zinc-800 border-dashed">
          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">
            {language === 'ar' ? 'منطق القاعدة الحالية' : 'Current Rule logic'}
          </div>
          <div className="text-sm font-medium text-white italic">
            {language === 'ar' 
              ? `مقابل كل ${formData.pointsEarningThreshold} جنيه يتم إنفاقها، يحصل العميل على ${formData.pointsEarnedPerThreshold} نقطة. كل نقطة تساوي ${formData.pointValue} جنيه.`
              : `"For every ${formData.pointsEarningThreshold} EGP spent, the customer earns ${formData.pointsEarnedPerThreshold} Points. Each point is worth ${formData.pointValue} EGP."`}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
