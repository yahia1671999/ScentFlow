/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PageWrapper, Header, StatCard, Card } from '../components/Common.tsx';
import { 
  TrendingUp, 
  Users, 
  Package, 
  FlaskConical, 
  ArrowRight,
  Clock,
  ChevronRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { useStore } from '../store.tsx';

const data = [
  { name: 'Mon', sales: 4000, mixing: 2400 },
  { name: 'Tue', sales: 3000, mixing: 1398 },
  { name: 'Wed', sales: 2000, mixing: 9800 },
  { name: 'Thu', sales: 2780, mixing: 3908 },
  { name: 'Fri', sales: 1890, mixing: 4800 },
  { name: 'Sat', sales: 2390, mixing: 3800 },
  { name: 'Sun', sales: 3490, mixing: 4300 },
];

export default function Dashboard() {
  const { sales, products, perfumes, customers, t } = useStore();

  const totalSalesValue = sales.reduce((acc, s) => acc + s.total, 0);
  const totalCustomers = customers.length;
  const lowStockCount = products.filter(p => p.stock <= p.reorderLevel).length;

  // Real chart data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const daySales = sales.filter(s => s.createdAt.startsWith(dateStr));
    return {
      name: d.toLocaleDateString('en-US', { weekday: 'short' }),
      sales: daySales.reduce((acc, s) => acc + s.total, 0),
      count: daySales.length
    };
  });

  const recentSales = [...sales].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  return (
    <PageWrapper>
      <Header 
        title={t('dashboard')} 
        subtitle={t('dashboardSubtitle')}
        actions={
          <button className="px-4 py-2 bg-amber-600 text-white rounded-lg font-bold flex items-center gap-2 hover:bg-amber-700 transition-colors shadow-lg shadow-amber-900/20">
            {t('generateReport')}
            <ArrowRight className="w-4 h-4" />
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <StatCard 
          label={t('revenue')} 
          value={`${totalSalesValue.toLocaleString()} ${t('currency')}`} 
          trend={12.5} 
          icon={TrendingUp} 
          color="bg-emerald-500" 
        />
        <StatCard 
          label={t('activeLoyalists')} 
          value={totalCustomers.toString()} 
          trend={8.2} 
          icon={Users} 
          color="bg-blue-500" 
        />
        <StatCard 
          label={t('mixingFormulas')} 
          value={perfumes.length.toString()} 
          icon={FlaskConical} 
          color="bg-amber-500" 
        />
        <StatCard 
          label={t('lowStock')} 
          value={lowStockCount.toString()} 
          trend={-5.4} 
          icon={Package} 
          color="bg-rose-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card title={t('salesPerformance')} className="lg:col-span-2 min-w-0">
          <div className="h-[250px] md:h-[300px] w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={last7Days}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d97706" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#d97706" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }}
                  itemStyle={{ color: '#d97706' }}
                />
                <Area type="monotone" dataKey="sales" stroke="#d97706" fillOpacity={1} fill="url(#colorSales)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title={t('recentActivity')}>
          <div className="space-y-6">
            {recentSales.map((sale, idx) => (
              <div key={`${sale.id}-${idx}`} className="flex gap-4 group cursor-pointer text-start">
                <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 group-hover:border-zinc-700 transition-colors shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="flex-1 border-b border-zinc-800/50 pb-4 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{sale.items[0]?.name || 'Sale'} ...</p>
                  <p className="text-xs text-zinc-500 mt-1 truncate">
                    {customers.find(c => c.id === sale.customerId)?.name || 'Guest'} • {sale.total} {t('currency')}
                  </p>
                  <p className="text-[10px] text-zinc-600 mt-2 font-mono uppercase">{new Date(sale.createdAt).toLocaleTimeString()}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-700 mt-1 group-hover:text-zinc-500 shrink-0" />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
        <Card title={t('salesDensity')} className="min-w-0">
          <div className="h-[200px] md:h-[250px] w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title={t('inventoryConsumption')}>
           <div className="space-y-4">
              {products.filter(p => ['OIL', 'ALCOHOL'].includes(p.type)).slice(0, 4).map((p, idx) => (
                <div key={`${p.id}-${idx}`}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-zinc-400">{p.name}</span>
                    <span className="text-white font-mono">{p.stock} / {p.reorderLevel * 5} {p.unit}</span>
                  </div>
                  <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${p.stock < p.reorderLevel ? 'bg-rose-500' : 'bg-amber-600'}`} 
                      style={{ width: `${Math.min(100, (p.stock / (p.reorderLevel * 5)) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
           </div>
        </Card>
      </div>
    </PageWrapper>
  );
}
