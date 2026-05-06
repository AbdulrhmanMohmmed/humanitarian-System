import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Leaf, Droplets, Trash2, Wind, 
  BarChart3, Globe, ShieldCheck, 
  ArrowDown, Cloud, Zap, Trees
} from 'lucide-react';
import { cn } from '../lib/utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const GREEN_DATA = [
  { month: 'Jan', footprint: 45, water: 20 },
  { month: 'Feb', footprint: 40, water: 25 },
  { month: 'Mar', footprint: 35, water: 18 },
  { month: 'Apr', footprint: 30, water: 15 },
];

export default function GreenMEAL() {
  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-3">
            <Leaf size={14} />
            Environmental & Climate MEAL Tracker (Sphere 2024)
          </div>
          <h1 className="text-4xl font-black text-[var(--text-primary)]">المتابعة والتقييم الأخضر</h1>
          <p className="text-[var(--text-secondary)] font-medium mt-2">تتبع البصمة البيئية للمشاريع وإدارة الموارد بشكل مستدام وصديق للبيئة.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {[
            { label: 'البصمة الكربونية', value: '1.2t', sub: 'CO2e per project', trend: '-12%', icon: Cloud, color: 'text-sky-600' },
            { label: 'استهلاك المياه', value: '450m³', sub: 'Monthly usage', trend: '-5%', icon: Droplets, color: 'text-blue-500' },
            { label: 'إدارة النفايات', value: '85%', sub: 'Recycling rate', trend: '+15%', icon: Trash2, color: 'text-emerald-600' },
            { label: 'كفاءة الطاقة', value: 'A+', sub: 'Renewable source', trend: 'Stable', icon: Zap, color: 'text-amber-500' },
         ].map(stat => (
            <div key={stat.label} className="card-elite p-6 space-y-4">
               <div className="flex items-center justify-between">
                  <div className={cn("p-2 rounded-xl bg-slate-100 dark:bg-white/5", stat.color)}>
                     <stat.icon size={20} />
                  </div>
                  <span className={cn("text-[10px] font-black", stat.trend.startsWith('-') || stat.trend === 'Stable' ? 'text-emerald-600' : 'text-rose-600')}>{stat.trend}</span>
               </div>
               <div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</h3>
                  <div className="text-3xl font-black mt-1">{stat.value}</div>
                  <p className="text-[10px] font-bold opacity-40 mt-1 uppercase">{stat.sub}</p>
               </div>
            </div>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 card-elite p-8">
            <h3 className="font-black text-sm mb-8 flex items-center gap-3">
               <BarChart3 size={18} className="text-emerald-600" /> تحليل البصمة الكربونية والمائية
            </h3>
            <div className="h-[350px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={GREEN_DATA}>
                     <defs>
                        <linearGradient id="colorF" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                           <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.1} />
                     <XAxis dataKey="month" tick={{ fontSize: 10, fontWeight: 900 }} axisLine={false} tickLine={false} />
                     <YAxis tick={{ fontSize: 10, fontWeight: 900 }} axisLine={false} tickLine={false} />
                     <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }}
                     />
                     <Area type="monotone" dataKey="footprint" stroke="#10b981" fillOpacity={1} fill="url(#colorF)" strokeWidth={4} />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="card-elite p-8 bg-slate-900 text-white border-none shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10"><Trees size={150} /></div>
            <div className="relative z-10 h-full flex flex-col justify-between">
               <div>
                  <h3 className="text-2xl font-black mb-4">الامتزام البيئي النخبوي</h3>
                  <p className="text-sm font-medium opacity-60 leading-relaxed mb-8">
                     هذا المشروع يمتثل لـ 95% من معايير Sphere البيئية الجديدة. تم تقليل البلاستيك أحادي الاستخدام بنسبة 100% في كافة أنشطة التوزيع.
                  </p>
               </div>
               <div className="space-y-4">
                  <div className="p-4 bg-white/10 rounded-2xl flex items-center gap-4">
                     <Globe size={24} className="text-emerald-400" />
                     <div>
                        <div className="text-[10px] font-black uppercase opacity-60">توفير انبعاثات</div>
                        <div className="text-lg font-black">2.4 Ton CO2e</div>
                     </div>
                  </div>
                  <button className="w-full h-12 bg-emerald-600 rounded-xl font-black text-xs shadow-xl shadow-black/20">تنزيل تقرير الاستدامة</button>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
