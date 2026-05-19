import { useState, useEffect } from 'react';
import { 
  Banknote, Plus, Calendar, Download, 
  CheckCircle2, AlertCircle, Clock, Search,
  Users, TrendingUp, DollarSign, ArrowUpRight,
  FileText, ShieldCheck, MoreVertical, Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';

const PayrollPage = () => {
  const toast = useToast();
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayroll, setSelectedPayroll] = useState(null);

  useEffect(() => {
    fetchPayrolls();
  }, []);

  const fetchPayrolls = async () => {
    try {
      const { data } = await api.get('/api/hr/payroll/payrolls');
      setPayrolls(data);
    } catch (err) {
      console.error('Failed to fetch payrolls', err);
    } finally {
      setLoading(false);
    }
  };

  const generatePayroll = async () => {
    const now = new Date();
    try {
      await api.post(`/api/hr/payroll/generate/${now.getFullYear()}/${now.getMonth() + 1}`);
      fetchPayrolls();
    } catch (err) {
      alert('Payroll already exists for this period or error occurred');
    }
  };

  const stats = [
    { label: 'إجمالي الرواتب (أكتوبر)', value: '$45,200', change: '+2.5%', icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'الموظفين النشطين', value: '124', change: '+3', icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'قيد المراجعة', value: '2', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'الامتثال الضريبي', value: '100%', icon: ShieldCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
             <div className="p-2 bg-blue-600 rounded-2xl text-white shadow-xl shadow-blue-200">
               <Banknote size={28} />
             </div>
             الرواتب والأجور المتقدمة
          </h1>
          <p className="text-slate-500 font-bold mt-1">أتمتة كشوف المرتبات، الحوافز، والضرائب الشهرية</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={generatePayroll}
            className="h-12 px-6 rounded-2xl bg-slate-900 text-white font-black text-sm hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg"
          >
            <Plus size={20} />
            توليد رواتب الشهر الحالي
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="p-6 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-start justify-between">
              <div className={cn('p-3 rounded-2xl transition-transform group-hover:scale-110 duration-500', stat.bg)}>
                <stat.icon className={cn('w-6 h-6', stat.color)} />
              </div>
              {stat.change && (
                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                  {stat.change}
                </span>
              )}
            </div>
            <div className="mt-4">
               <p className="text-2xl font-black text-slate-900">{stat.value}</p>
               <p className="text-xs font-bold text-slate-400 mt-1">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
         {/* Payroll List */}
         <div className="xl:col-span-2 space-y-4">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
               <Calendar className="text-blue-600" size={20} />
               كشوفات الرواتب السابقة
            </h3>
            
            <div className="grid gap-4">
               {loading ? (
                 [1,2,3].map(i => <div key={i} className="h-24 bg-slate-100 animate-pulse rounded-3xl" />)
               ) : payrolls.length > 0 ? (
                 payrolls.map((payroll) => (
                   <motion.div
                    key={payroll.id}
                    layoutId={`payroll-${payroll.id}`}
                    onClick={() => setSelectedPayroll(payroll)}
                    className={cn(
                      'p-6 rounded-[2rem] border transition-all cursor-pointer flex items-center justify-between',
                      selectedPayroll?.id === payroll.id ? 'bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-100' : 'bg-white border-slate-100 hover:border-blue-200 shadow-sm'
                    )}
                   >
                     <div className="flex items-center gap-6">
                        <div className={cn('w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black', 
                          selectedPayroll?.id === payroll.id ? 'bg-blue-500 text-white' : 'bg-slate-50 text-slate-700'
                        )}>
                           <span className="text-xs uppercase opacity-60">Month</span>
                           <span className="text-lg">{payroll.month}</span>
                        </div>
                        <div>
                           <h4 className="font-black">كشف رواتب {payroll.month} / {payroll.year}</h4>
                           <p className={cn('text-xs font-bold mt-1', selectedPayroll?.id === payroll.id ? 'text-blue-100' : 'text-slate-400')}>
                             إجمالي المنصرف: {payroll.total_net.toLocaleString()} {payroll.currency}
                           </p>
                        </div>
                     </div>
                     <div className="flex items-center gap-4">
                        <span className={cn('px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider', 
                          payroll.status === 'paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'
                        )}>
                          {payroll.status}
                        </span>
                        <Settings size={18} className="opacity-40" />
                     </div>
                   </motion.div>
                 ))
               ) : (
                 <div className="p-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                    <p className="font-bold text-slate-400 text-sm">لا توجد كشوفات رواتب بعد</p>
                 </div>
               )}
            </div>
         </div>

         {/* Detailed View */}
         <div className="space-y-6">
            <AnimatePresence mode="wait">
               {selectedPayroll ? (
                 <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-xl"
                 >
                    <div className="flex items-center justify-between mb-8">
                       <h3 className="text-xl font-black text-slate-900">تفاصيل الكشف</h3>
                       <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Download size={20} /></button>
                    </div>

                    <div className="space-y-6">
                       <div className="p-6 rounded-3xl bg-slate-900 text-white">
                          <p className="text-xs font-bold text-slate-400 mb-2">صافي الرواتب المستحق</p>
                          <div className="flex items-baseline gap-2">
                             <span className="text-3xl font-black">{selectedPayroll.total_net.toLocaleString()}</span>
                             <span className="text-sm font-bold text-slate-500">{selectedPayroll.currency}</span>
                          </div>
                          <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-2 gap-4">
                             <div>
                               <p className="text-[10px] font-bold text-slate-500 uppercase">Gross Total</p>
                               <p className="text-sm font-black">{selectedPayroll.total_gross.toLocaleString()}</p>
                             </div>
                             <div>
                               <p className="text-[10px] font-bold text-slate-500 uppercase">Employee Count</p>
                               <p className="text-sm font-black">124</p>
                             </div>
                          </div>
                       </div>

                       <div className="space-y-3">
                          <h4 className="text-sm font-black text-slate-700">توزيع الصرف بالعملات</h4>
                          {[
                            { currency: 'USD', amount: '22,400', percentage: 65, color: 'bg-blue-500' },
                            { currency: 'YER', amount: '12,500,000', percentage: 35, color: 'bg-indigo-500' }
                          ].map((item, i) => (
                            <div key={i} className="space-y-2">
                               <div className="flex justify-between text-xs font-bold">
                                  <span>{item.currency}</span>
                                  <span className="text-slate-400">{item.amount}</span>
                               </div>
                               <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                  <div className={cn('h-full rounded-full', item.color)} style={{ width: `${item.percentage}%` }} />
                               </div>
                            </div>
                          ))}
                       </div>

                       <button onClick={() => { toast.show('تم اعتماد وصرف الرواتب بنجاح'); }} className="w-full py-4 rounded-2xl bg-blue-600 text-white font-black text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2">
                          <CheckCircle2 size={18} />
                          اعتماد وصرف الرواتب
                       </button>
                    </div>
                 </motion.div>
               ) : (
                 <div className="p-8 rounded-[2.5rem] bg-blue-50 border border-blue-100 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-blue-600 shadow-sm">
                       <TrendingUp size={32} />
                    </div>
                    <div>
                       <h4 className="font-black text-blue-900">تحليلات الرواتب</h4>
                       <p className="text-xs font-bold text-blue-600 mt-1">اختر كشفاً من القائمة الجانبية لعرض التحليلات التفصيلية وإجراءات الصرف.</p>
                    </div>
                 </div>
               )}
            </AnimatePresence>

            <div className="p-6 rounded-[2rem] bg-white border border-slate-100 shadow-sm">
               <h4 className="font-black text-slate-800 mb-4 flex items-center gap-2 text-sm">
                  <AlertCircle className="text-orange-500" size={16} />
                  تنبيهات الامتثال
               </h4>
               <div className="space-y-3">
                  {[
                    'تحديث بيانات التأمينات لـ 4 موظفين جدد',
                    'موعد تقديم كشف الضرائب الربعي: 15 أكتوبر'
                  ].map((note, i) => (
                    <div key={i} className="text-xs font-bold text-slate-500 border-r-4 border-orange-200 pr-3 py-1">
                      {note}
                    </div>
                  ))}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default PayrollPage;
