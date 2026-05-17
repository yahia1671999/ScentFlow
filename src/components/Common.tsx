/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';

export const PageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.3, ease: 'easeOut' }}
    className="w-full max-w-7xl mx-auto"
  >
    {children}
  </motion.div>
);

export const Header: React.FC<{ title: string; subtitle?: string; actions?: React.ReactNode }> = ({ title, subtitle, actions }) => (
  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
    <div>
      <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">{title}</h2>
      {subtitle && <p className="text-sm md:text-base text-zinc-500 mt-1">{subtitle}</p>}
    </div>
    {actions && <div className="flex flex-wrap gap-2 md:gap-3">{actions}</div>}
  </div>
);

export const Card: React.FC<{ children: React.ReactNode; title?: string; className?: string }> = ({ children, title, className }) => (
  <div className={`bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden ${className}`}>
    {title && (
      <div className="px-6 py-4 border-bottom border-zinc-800 flex items-center justify-between">
        <h3 className="font-semibold text-zinc-300">{title}</h3>
      </div>
    )}
    <div className="p-6">{children}</div>
  </div>
);

export const StatCard: React.FC<{ label: string; value: string; trend?: number; icon: any; color: string }> = ({ label, value, trend, icon: Icon, color }) => (
  <Card className="flex-1 min-w-[200px] relative overflow-hidden group">
    <div className={`absolute -right-4 -top-4 w-16 h-16 md:w-24 md:h-24 rounded-full ${color} opacity-10 group-hover:opacity-20 transition-opacity duration-500`} />
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">{label}</p>
        <h4 className="text-2xl md:text-3xl font-bold text-white tracking-tighter">{value}</h4>
        {trend !== undefined && (
          <div className={`mt-2 flex items-center gap-1 text-[10px] md:text-xs font-bold ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            <span>{trend >= 0 ? '↑' : '↓'}</span>
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <div className={`p-2 md:p-3 rounded-lg md:rounded-xl ${color} bg-opacity-20`}>
        <Icon className={`w-5 h-5 md:w-6 md:h-6 ${color.replace('bg-', 'text-')}`} />
      </div>
    </div>
  </Card>
);
