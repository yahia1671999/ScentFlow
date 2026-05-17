import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { PageWrapper, Card } from '../components/Common';
import { Plus, Users, Globe, Shield, CreditCard } from 'lucide-react';

// Local UI components for SuperAdmin as standard ones might be missing
const Button = ({ children, onClick, className, variant = 'primary', ...props }: any) => (
  <button 
    onClick={onClick} 
    className={`px-4 py-2 rounded-lg font-medium transition-all ${
      variant === 'primary' ? 'bg-amber-600 text-white hover:bg-amber-700' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700'
    } ${className}`}
    {...props}
  >
    {children}
  </button>
);

const Input = (props: any) => (
  <input 
    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-600/50"
    {...props} 
  />
);

const Badge = ({ children, color }: any) => (
  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
    color === 'green' ? 'bg-green-950 text-green-400 border border-green-900' : 
    color === 'red' ? 'bg-red-950 text-red-400 border border-red-900' : 
    'bg-zinc-800 text-zinc-400 border border-zinc-700'
  }`}>
    {children}
  </span>
);

export default function SuperAdmin() {
  const { fetchTenants, createTenant } = useStore();
  const [tenants, setTenants] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTenant, setNewTenant] = useState({ name: '', adminUsername: '', adminPassword: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    setLoading(true);
    const data = await fetchTenants();
    setTenants(data);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createTenant(newTenant);
    setIsModalOpen(false);
    loadTenants();
    setNewTenant({ name: '', adminUsername: '', adminPassword: '' });
  };

  return (
    <PageWrapper>
      <div className="space-y-6" id="super-admin-page">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="w-8 h-8 text-amber-600" />
            Super Admin Panel
          </h1>
          <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add New Tenant
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-600/10 rounded-lg">
                <Globe className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-zinc-500 uppercase tracking-wider font-bold">Total Tenants</p>
                <p className="text-2xl font-bold text-white">{tenants.length}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-600/10 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-zinc-500 uppercase tracking-wider font-bold">Total Users</p>
                <p className="text-2xl font-bold text-white">--</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-600/10 rounded-lg">
                <CreditCard className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-zinc-500 uppercase tracking-wider font-bold">Active Subs</p>
                <p className="text-2xl font-bold text-white">{tenants.filter(t => t.status === 'ACTIVE').length}</p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="overflow-x-auto p-0">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Tenant Name</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">ID</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Created At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-10 text-center text-zinc-500 italic">Loading data...</td></tr>
              ) : tenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-amber-600/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-zinc-200">{tenant.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-zinc-500 font-mono">{tenant.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge color={tenant.status === 'ACTIVE' ? 'green' : 'red'}>
                      {tenant.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                    {new Date(tenant.createdAt || Date.now()).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-2xl border-amber-600/30">
              <h2 className="text-xl font-bold text-white mb-6">Create New Tenant</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Company Name</label>
                  <Input 
                    value={newTenant.name}
                    onChange={(e: any) => setNewTenant({...newTenant, name: e.target.value})}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Admin User</label>
                    <Input 
                      value={newTenant.adminUsername}
                      onChange={(e: any) => setNewTenant({...newTenant, adminUsername: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Admin Pass</label>
                    <Input 
                      type="password"
                      value={newTenant.adminPassword}
                      onChange={(e: any) => setNewTenant({...newTenant, adminPassword: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-8">
                  <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button type="submit">Create Tenant</Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
