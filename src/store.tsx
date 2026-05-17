/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, Customer, Sale, Expense, PerfumeFormula, Supplier, Purchase, Return } from './types.ts';
import { translations, Language, TranslationKey } from './translations.ts';

interface AppState {
  products: Product[];
  perfumes: PerfumeFormula[];
  customers: Customer[];
  sales: Sale[];
  expenses: Expense[];
  suppliers: Supplier[];
  purchases: Purchase[];
  returns: Return[];
  system_users: any[];
  settings: any;
  currentUser: any;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshData: () => Promise<void>;
  addSale: (sale: Partial<Sale>) => Promise<Sale>;
  addCustomer: (customer: Partial<Customer>) => Promise<Customer>;
  addProduct: (product: Partial<Product>) => Promise<Product>;
  updateProduct: (id: string, data: Partial<Product>) => Promise<any>;
  deleteProduct: (id: string) => Promise<void>;
  addFormula: (formula: Partial<PerfumeFormula>) => Promise<any>;
  deleteFormula: (id: string) => Promise<void>;
  scheduledMessages: any[];
  addExpense: (expense: Partial<Expense>) => Promise<Expense>;
  updateCustomer: (id: string, data: Partial<Customer>) => Promise<any>;
  addSupplier: (supplier: Partial<Supplier>) => Promise<Supplier>;
  updateSupplier: (id: string, data: Partial<Supplier>) => Promise<any>;
  deleteSupplier: (id: string) => Promise<void>;
  addPurchase: (purchase: Partial<Purchase>) => Promise<Purchase>;
  addReturn: (ret: Partial<Return>) => Promise<Return>;
  addUser: (user: any) => Promise<any>;
  deleteUser: (id: string) => Promise<void>;
  updateSettings: (data: any) => Promise<any>;
  launchCampaign: (segment: string, message: string) => Promise<any>;
  addScheduledMessage: (msg: any) => Promise<any>;
  // SaaS / Admin
  tenantId: string | null;
  createTenant: (data: any) => Promise<any>;
  fetchTenants: () => Promise<any[]>;
  // I18n
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const StoreContext = createContext<AppState | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<any>(() => {
    const saved = localStorage.getItem('app_data');
    const initialData = {
      products: [],
      perfumes: [],
      customers: [],
      sales: [],
      expenses: [],
      suppliers: [],
      purchases: [],
      returns: [],
      system_users: [],
      settings: {
        companyName: 'ScentFlow',
        themeColor: '#d97706',
        pointsEarningThreshold: 100,
        pointsEarnedPerThreshold: 5,
        pointValue: 0.1,
        invoiceHeader: '',
        invoiceFooter: ''
      }
    };
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...initialData, ...parsed };
      } catch (e) {
        return initialData;
      }
    }
    return initialData;
  });
  const [currentUser, setCurrentUser] = useState<any>(() => {
    const saved = localStorage.getItem('current_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('app_token');
  });
  const [tenantId, setTenantId] = useState<string | null>(() => {
    return localStorage.getItem('app_tenant_id');
  });
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('app_lang') as Language) || 'en';
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    localStorage.setItem('app_lang', language);
  }, [language]);

  const login = async (username: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        const { user, token, permissions, tenantId } = await res.json();
        const userData = { ...user, permissions };
        setCurrentUser(userData);
        setToken(token);
        setTenantId(tenantId);
        localStorage.setItem('current_user', JSON.stringify(userData));
        localStorage.setItem('app_token', token);
        localStorage.setItem('app_tenant_id', tenantId);
        refreshData();
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setToken(null);
    setTenantId(null);
    localStorage.removeItem('current_user');
    localStorage.removeItem('app_token');
    localStorage.removeItem('app_tenant_id');
  };

  const t = (key: TranslationKey) => {
    return translations[language][key] || key;
  };

  const refreshData = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/data', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.status === 401) {
        logout();
        return;
      }
      const json = await res.json();
      if (!json.error) {
        setData(json);
        localStorage.setItem('app_data', JSON.stringify(json));
      }
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  };

  const processOfflineQueue = async () => {
    const queue = JSON.parse(localStorage.getItem('offline_queue') || '[]');
    if (queue.length === 0) return;

    console.log(`Processing ${queue.length} offline operations...`);
    const remaining = [];

    for (const op of queue) {
      try {
        await fetch(op.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(op.body)
        });
      } catch (err) {
        remaining.push(op);
      }
    }

    localStorage.setItem('offline_queue', JSON.stringify(remaining));
    if (remaining.length === 0) {
      refreshData();
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const addToQueue = (url: string, body: any) => {
    const queue = JSON.parse(localStorage.getItem('offline_queue') || '[]');
    queue.push({ url, body });
    localStorage.setItem('offline_queue', JSON.stringify(queue));
  };

  const performAction = async (url: string, body: any, tempUpdate: (draft: any) => void) => {
    // Optimistic update
    tempUpdate(data);

    try {
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Automatically inject tenantId into body if not present and available
      const requestBody = { ...body };
      if (tenantId && !requestBody.tenantId) {
        requestBody.tenantId = tenantId;
      }

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });
      
      if (res.status === 401) {
        logout();
        throw new Error("Session expired");
      }
      
      if (!res.ok) throw new Error("Server error");
      
      const result = await res.json();
      await refreshData();
      return result;
    } catch (err) {
      console.warn("Operation failed", err);
      if (err instanceof Error && err.message === "Session expired") throw err;
      addToQueue(url, body);
      return body; // Fallback
    }
  };

  const addSale = async (sale: Partial<Sale>) => {
    return performAction('/api/sales', sale, (draft) => {
       // Simple optimistic update could go here if needed
    });
  };

  const addCustomer = async (customer: Partial<Customer>) => {
    return performAction('/api/customers', customer, (draft) => {});
  };

  const addProduct = async (product: Partial<Product>) => {
    return performAction('/api/products', product, (draft) => {});
  };

  const updateProduct = async (id: string, updateData: Partial<Product>) => {
    return performAction('/api/products/update', { id, data: updateData }, (draft) => {});
  };

  const deleteProduct = async (id: string) => {
    return performAction('/api/products/delete', { id }, (draft) => {});
  };

  const addFormula = async (formula: Partial<PerfumeFormula>) => {
    return performAction('/api/formulas', formula, (draft) => {});
  };

  const deleteFormula = async (id: string) => {
    return performAction('/api/formulas/delete', { id }, (draft) => {});
  };

  const addExpense = async (expense: Partial<Expense>) => {
    return performAction('/api/expenses', expense, (draft) => {});
  };

  const updateCustomer = async (id: string, updateData: Partial<Customer>) => {
    return performAction('/api/customers/update', { id, data: updateData }, (draft) => {});
  };

  const updateSupplier = async (id: string, updateData: Partial<Supplier>) => {
    return performAction('/api/suppliers/update', { id, data: updateData }, (draft) => {});
  };

  const addSupplier = async (supplier: Partial<Supplier>) => {
    return performAction('/api/suppliers', supplier, (draft) => {});
  };

  const deleteSupplier = async (id: string) => {
    return performAction('/api/suppliers/delete', { id }, (draft) => {});
  };

  const addPurchase = async (purchase: Partial<Purchase>) => {
    return performAction('/api/purchases', purchase, (draft) => {});
  };

  const addReturn = async (ret: Partial<Return>) => {
    return performAction('/api/returns', ret, (draft) => {});
  };

  const addUser = async (user: any) => {
    return performAction('/api/users', user, (draft) => {});
  };

  const deleteUser = async (id: string) => {
    return performAction('/api/users/delete', { id }, (draft) => {});
  };

  const updateSettings = async (settingsData: any) => {
    return performAction('/api/settings/update', settingsData, (draft) => {});
  };

  const launchCampaign = async (segment: string, message: string) => {
    return performAction('/api/marketing/launch', { segment, message }, (draft) => {});
  };

  const addScheduledMessage = async (msg: any) => {
    return performAction('/api/marketing/schedule', msg, (draft) => {
      if (!draft.scheduledMessages) draft.scheduledMessages = [];
      draft.scheduledMessages.push({ ...msg, id: Date.now().toString(), status: 'PENDING' });
    });
  };

  // SaaS / Admin Methods
  const createTenant = async (tenantData: any) => {
    return performAction('/api/admin/tenants', tenantData, () => {});
  };

  const fetchTenants = async () => {
    if (!token) return [];
    try {
      const res = await fetch('/api/admin/tenants', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) return await res.json();
    } catch (err) {
       console.error(err);
    }
    return [];
  };

  return (
    <StoreContext.Provider value={{ 
      ...data, 
      settings: data.settings || {},
      currentUser,
      loading, 
      tenantId, // SaaS
      login,
      logout,
      refreshData, 
      addSale, 
      addCustomer, 
      addProduct, 
      updateProduct,
      deleteProduct,
      addFormula,
      deleteFormula,
      addExpense,
      updateCustomer,
      addSupplier,
      updateSupplier,
      deleteSupplier,
      addPurchase,
      addReturn,
      addUser,
      deleteUser,
      updateSettings,
      launchCampaign,
      addScheduledMessage,
      createTenant,
      fetchTenants,
      language, 
      setLanguage, 
      t 
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used within StoreProvider");
  return context;
};
