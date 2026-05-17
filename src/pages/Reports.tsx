/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PageWrapper, Header, Card } from '../components/Common.tsx';
import { useStore } from '../store.tsx';
import { 
  BarChart3, 
  FileText, 
  Download, 
  ArrowRight,
  TrendingUp,
  PieChart,
  Calendar,
  RefreshCw
} from 'lucide-react';

import * as XLSX from 'xlsx';

export default function Reports() {
  const { t, sales, purchases, expenses, returns, customers, products } = useStore();
  const [generatingId, setGeneratingId] = React.useState<number | null>(null);

  const handleGenerate = (idx: number) => {
    setGeneratingId(idx);
    
    // Simulate generation delay
    setTimeout(() => {
      try {
        let ws_data: any[] = [];
        let filename = "report.xlsx";

        if (idx === 0) { // Sales Report
          ws_data = sales.map(s => ({
            [t('invoiceNumber')]: s.id,
            [t('invoiceDate')]: new Date(s.createdAt).toLocaleString(),
            [t('customers')]: s.customerId,
            [t('subtotal')]: s.subtotal,
            [t('discountAmount')]: s.discount,
            [t('total')]: s.total,
            [t('paymentMethods')]: s.paymentMethod
          }));
          filename = `sales_report_${new Date().toISOString().split('T')[0]}.xlsx`;
        } else if (idx === 1) { // P&L
          ws_data = [
            { [t('category')]: t('revenue'), [t('total')]: sales.reduce((a, s) => a + s.total, 0) },
            { [t('category')]: t('expenses'), [t('total')]: expenses.reduce((a, e) => a + e.amount, 0) },
            { [t('category')]: t('purchases'), [t('total')]: purchases.reduce((a, p) => a + p.paidAmount, 0) },
            { [t('category')]: t('returnsSubtitle'), [t('total')]: returns.reduce((a, r) => a + r.totalAmount, 0) }
          ];
          filename = `pl_statement_${new Date().toISOString().split('T')[0]}.xlsx`;
        } else if (idx === 2) { // Inventory
          ws_data = products.map(p => ({
            [t('productName')]: p.name,
            [t('productType')]: p.type,
            [t('productStock')]: p.stock,
            [t('unit')]: p.unit,
            [t('costUnit')]: p.costPrice,
            [t('salePrice')]: p.salePrice,
            [t('totalPrice')]: p.stock * p.costPrice
          }));
          filename = `inventory_aging_${new Date().toISOString().split('T')[0]}.xlsx`;
        } else if (idx === 3) { // Customers
          ws_data = customers.map(c => ({
            [t('fullName')]: c.name,
            [t('phone')]: c.phone,
            [t('points')]: c.points,
            [t('recentActivity' as any)]: new Date(c.lastVisit).toLocaleDateString()
          }));
          filename = `customer_report_${new Date().toISOString().split('T')[0]}.xlsx`;
        }

        const ws = XLSX.utils.json_to_sheet(ws_data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Report");
        XLSX.writeFile(wb, filename);

        setGeneratingId(null);
        alert(t('transactionComplete'));
      } catch (err) {
        console.error(err);
        alert(t('failedGenerate'));
        setGeneratingId(null);
      }
    }, 1500);
  };

  const reportsList = [
    { title: t('dailySalesReport'), desc: t('dailySalesDesc'), icon: FileText },
    { title: t('profitLossStatement'), desc: t('profitLossDesc'), icon: TrendingUp },
    { title: t('inventoryAging'), desc: t('inventoryAgingDesc'), icon: BarChart3 },
    { title: t('customerSegmentation'), desc: t('customerSegDesc'), icon: PieChart }
  ];

  return (
    <PageWrapper>
      <Header 
        title={t('businessIntelligence')} 
        subtitle={t('reportSubtitle')}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {reportsList.map((report, idx) => (
           <Card key={idx} className="group hover:border-amber-600/50 transition-all cursor-pointer">
              <div className="flex flex-col sm:flex-row gap-6">
                 <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 group-hover:text-amber-500 group-hover:bg-amber-600/10 transition-all shrink-0">
                    <report.icon className="w-8 h-8" />
                 </div>
                 <div className="flex-1 text-start">
                    <h4 className="text-lg font-bold text-white mb-1">{report.title}</h4>
                    <p className="text-sm text-zinc-500 mb-6">{report.desc}</p>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                       <div className="flex items-center gap-2 text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                          <Download className="w-3 h-3" />
                          PDF • EXCEL • CSV
                       </div>
                       <button 
                        onClick={() => handleGenerate(idx)}
                        disabled={generatingId === idx}
                        className="flex items-center gap-2 text-xs font-bold text-amber-600 hover:text-amber-400 transition-colors whitespace-nowrap disabled:opacity-50"
                       >
                          {generatingId === idx ? <RefreshCw className="w-3 h-3 animate-spin" /> : null}
                          {t('generate')} <ArrowRight className="w-4 h-4" />
                       </button>
                    </div>
                 </div>
              </div>
           </Card>
         ))}
      </div>

      <div className="mt-12">
         <Card title={t('customReportBuilder')} className="border-dashed border-zinc-800 bg-transparent">
            <div className="flex flex-col items-center justify-center py-12 text-center">
               <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-6">
                  <Calendar className="w-8 h-8 text-zinc-700" />
               </div>
               <h4 className="text-xl font-bold text-zinc-400">{t('buildCustomReport')}</h4>
               <p className="text-zinc-600 mt-2 max-w-md">{t('buildCustomReportDesc')}</p>
               <button className="mt-8 px-8 py-3 bg-zinc-800 text-zinc-300 rounded-xl font-bold text-sm hover:bg-zinc-700 transition-all">
                  {t('launchVisualBuilder')}
               </button>
            </div>
         </Card>
      </div>
    </PageWrapper>
  );
}
