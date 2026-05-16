import { useState } from 'react';
import { Calculator, BookOpen, PieChart, DollarSign, Plus, FileText, Download, ArrowUpDown } from 'lucide-react';
import { useAccounts, useSeedAccounts, useCreateAccount, useJournalEntries, useCreateJournalEntry, useTrialBalance, useBudgetLines, useCreateBudgetLine, useDonorTemplates } from '../hooks/useModuleApi';

export default function AccountingPage() {
  const [tab, setTab] = useState('coa');
  const [showForm, setShowForm] = useState(false);
  const [journalForm, setJournalForm] = useState({ description: '', date: new Date().toISOString().split('T')[0], lines: [{ account_id: '', debit: 0, credit: 0 }, { account_id: '', debit: 0, credit: 0 }] });
  const [accountForm, setAccountForm] = useState({ code: '', name: '', account_type: 'asset' });
  const [budgetForm, setBudgetForm] = useState({ project_id: '', account_id: '', period: '', amount: 0 });

  const { data: accounts = [], isLoading: accsLoading } = useAccounts();
  const seedAccounts = useSeedAccounts();
  const createAccount = useCreateAccount();
  const { data: journals = [], isLoading: journalsLoading } = useJournalEntries();
  const createJournal = useCreateJournalEntry();
  const { data: trialBalance = [], isLoading: tbLoading } = useTrialBalance();
  const { data: budgetLines = [], isLoading: blLoading } = useBudgetLines({});
  const createBudgetLine = useCreateBudgetLine();
  const { data: templates = [] } = useDonorTemplates();

  const totalDebit = journalForm.lines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0);
  const totalCredit = journalForm.lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const handleSubmitJournal = async () => {
    try {
      await createJournal.mutateAsync({ ...journalForm, lines: journalForm.lines.filter(l => l.account_id) });
      setJournalForm({ description: '', date: new Date().toISOString().split('T')[0], lines: [{ account_id: '', debit: 0, credit: 0 }, { account_id: '', debit: 0, credit: 0 }] });
      setShowForm(false);
    } catch (e) { console.error(e); }
  };

  const addLine = () => setJournalForm(p => ({ ...p, lines: [...p.lines, { account_id: '', debit: 0, credit: 0 }] }));

  const tabs = [
    { id: 'coa', label: 'شجرة الحسابات', icon: BookOpen },
    { id: 'journal', label: 'القيود المحاسبية', icon: FileText },
    { id: 'trial', label: 'ميزان المراجعة', icon: ArrowUpDown },
    { id: 'budget', label: 'خطوط الميزانية', icon: PieChart },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Calculator className="w-8 h-8 text-emerald-600" />
        <h1 className="text-2xl font-bold">المحاسبة والمالية المتقدمة</h1>
      </div>

      <div className="flex gap-2 border-b border-[var(--border)]">
        {tabs.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setShowForm(false); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.id ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'coa' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <button onClick={() => seedAccounts.mutate({})} disabled={seedAccounts.isPending}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 text-sm">
              {seedAccounts.isPending ? 'جاري التهيئة...' : 'تهيئة الحسابات الافتراضية'}
            </button>
            <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2">
              <Plus className="w-4 h-4" /> إضافة حساب
            </button>
          </div>
          {showForm && (
            <div className="bg-[var(--card)] p-4 rounded-xl border border-[var(--border)] space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <input type="text" value={accountForm.code} onChange={e => setAccountForm(p => ({ ...p, code: e.target.value }))} placeholder="كود الحساب" className="border border-[var(--border)] rounded-lg px-3 py-2" />
                <input type="text" value={accountForm.name} onChange={e => setAccountForm(p => ({ ...p, name: e.target.value }))} placeholder="اسم الحساب" className="border border-[var(--border)] rounded-lg px-3 py-2" />
                <select value={accountForm.account_type} onChange={e => setAccountForm(p => ({ ...p, account_type: e.target.value }))} className="border border-[var(--border)] rounded-lg px-3 py-2">
                  <option value="asset">أصل</option><option value="liability">التزام</option><option value="equity">حقوق ملكية</option>
                  <option value="revenue">إيراد</option><option value="expense">مصروف</option>
                </select>
              </div>
              <button onClick={async () => { await createAccount.mutateAsync(accountForm); setAccountForm({ code: '', name: '', account_type: 'asset' }); setShowForm(false); }}
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg">حفظ</button>
            </div>
          )}
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--bg-secondary)]">
                <tr><th className="text-right p-3">الكود</th><th className="text-right p-3">اسم الحساب</th><th className="text-right p-3">النوع</th></tr>
              </thead>
              <tbody>
                {accsLoading ? <tr><td colSpan={3} className="p-4 text-center">جاري التحميل...</td></tr> :
                  (accounts || []).map(a => (
                    <tr key={a.id} className="border-t border-[var(--border)]">
                      <td className="p-3 font-mono">{a.code}</td><td className="p-3">{a.name}</td>
                      <td className="p-3"><span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs">{a.account_type}</span></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'journal' && (
        <div className="space-y-4">
          <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> قيد محاسبي جديد
          </button>
          {showForm && (
            <div className="bg-[var(--card)] p-6 rounded-xl border border-[var(--border)] space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input type="text" value={journalForm.description} onChange={e => setJournalForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="وصف القيد" className="border border-[var(--border)] rounded-lg px-3 py-2" />
                <input type="date" value={journalForm.date} onChange={e => setJournalForm(p => ({ ...p, date: e.target.value }))}
                  className="border border-[var(--border)] rounded-lg px-3 py-2" />
              </div>
              <table className="w-full text-sm">
                <thead><tr><th className="text-right p-2">الحساب</th><th className="text-right p-2">مدين</th><th className="text-right p-2">دائن</th></tr></thead>
                <tbody>
                  {journalForm.lines.map((line, i) => (
                    <tr key={i}>
                      <td className="p-2">
                        <select value={line.account_id} onChange={e => { const lines = [...journalForm.lines]; lines[i].account_id = parseInt(e.target.value); setJournalForm(p => ({ ...p, lines })); }}
                          className="border border-[var(--border)] rounded px-2 py-1 w-full">
                          <option value="">اختر حساب</option>
                          {(accounts || []).map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                        </select>
                      </td>
                      <td className="p-2"><input type="number" value={line.debit} onChange={e => { const lines = [...journalForm.lines]; lines[i].debit = parseFloat(e.target.value) || 0; setJournalForm(p => ({ ...p, lines })); }} className="border border-[var(--border)] rounded px-2 py-1 w-full" /></td>
                      <td className="p-2"><input type="number" value={line.credit} onChange={e => { const lines = [...journalForm.lines]; lines[i].credit = parseFloat(e.target.value) || 0; setJournalForm(p => ({ ...p, lines })); }} className="border border-[var(--border)] rounded px-2 py-1 w-full" /></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-bold border-t"><td className="p-2">الإجمالي</td><td className="p-2">{totalDebit.toFixed(2)}</td><td className="p-2">{totalCredit.toFixed(2)}</td></tr>
                </tfoot>
              </table>
              <div className="flex gap-2">
                <button onClick={addLine} className="text-blue-600 text-sm">+ إضافة سطر</button>
                <div className="flex-1" />
                <span className={`text-sm ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>{isBalanced ? 'متوازن ✓' : 'غير متوازن ✗'}</span>
                <button onClick={handleSubmitJournal} disabled={!isBalanced || createJournal.isPending}
                  className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50">ترحيل القيد</button>
              </div>
            </div>
          )}
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--bg-secondary)]"><tr><th className="text-right p-3">#</th><th className="text-right p-3">التاريخ</th><th className="text-right p-3">الوصف</th><th className="text-right p-3">الحالة</th></tr></thead>
              <tbody>
                {journalsLoading ? <tr><td colSpan={4} className="p-4 text-center">جاري التحميل...</td></tr> :
                  (journals || []).map(j => (
                    <tr key={j.id} className="border-t border-[var(--border)]">
                      <td className="p-3 font-mono text-xs">JE-{j.id}</td><td className="p-3">{j.date}</td><td className="p-3">{j.description}</td>
                      <td className="p-3"><span className={`px-2 py-1 rounded text-xs ${j.is_posted ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{j.is_posted ? 'مرحّل' : 'مسودة'}</span></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'trial' && (
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
          <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
            <h2 className="font-semibold">ميزان المراجعة</h2>
            <span className="text-xs text-[var(--text-secondary)]">يعرض الحسابات المرحّلة فقط</span>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-[var(--bg-secondary)]"><tr><th className="text-right p-3">الكود</th><th className="text-right p-3">الحساب</th><th className="text-right p-3">مدين</th><th className="text-right p-3">دائن</th><th className="text-right p-3">الرصيد</th></tr></thead>
            <tbody>
              {tbLoading ? <tr><td colSpan={5} className="p-4 text-center">جاري التحميل...</td></tr> :
                (trialBalance || []).map(r => (
                  <tr key={r.account_id} className="border-t border-[var(--border)]">
                    <td className="p-3 font-mono">{r.code}</td><td className="p-3">{r.name}</td>
                    <td className="p-3 text-green-600">{r.debit?.toFixed(2)}</td><td className="p-3 text-red-600">{r.credit?.toFixed(2)}</td>
                    <td className="p-3 font-bold">{r.balance?.toFixed(2)}</td>
                  </tr>
                ))}
            </tbody>
            <tfoot>
              <tr className="font-bold border-t-2 bg-[var(--bg-secondary)]">
                <td colSpan={2} className="p-3">الإجمالي</td>
                <td className="p-3 text-green-600">{(trialBalance || []).reduce((s, r) => s + (r.debit || 0), 0).toFixed(2)}</td>
                <td className="p-3 text-red-600">{(trialBalance || []).reduce((s, r) => s + (r.credit || 0), 0).toFixed(2)}</td>
                <td className="p-3">{(trialBalance || []).reduce((s, r) => s + (r.balance || 0), 0).toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {tab === 'budget' && (
        <div className="space-y-4">
          <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> خط ميزانية جديد
          </button>
          {showForm && (
            <div className="bg-[var(--card)] p-4 rounded-xl border border-[var(--border)] space-y-3">
              <div className="grid grid-cols-4 gap-3">
                <input type="number" value={budgetForm.project_id} onChange={e => setBudgetForm(p => ({ ...p, project_id: parseInt(e.target.value) }))} placeholder="رقم المشروع" className="border border-[var(--border)] rounded-lg px-3 py-2" />
                <select value={budgetForm.account_id} onChange={e => setBudgetForm(p => ({ ...p, account_id: parseInt(e.target.value) }))} className="border border-[var(--border)] rounded-lg px-3 py-2">
                  <option value="">اختر حساب</option>{(accounts || []).map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                </select>
                <input type="text" value={budgetForm.period} onChange={e => setBudgetForm(p => ({ ...p, period: e.target.value }))} placeholder="الفترة (2024-Q1)" className="border border-[var(--border)] rounded-lg px-3 py-2" />
                <input type="number" value={budgetForm.amount} onChange={e => setBudgetForm(p => ({ ...p, amount: parseFloat(e.target.value) }))} placeholder="المبلغ" className="border border-[var(--border)] rounded-lg px-3 py-2" />
              </div>
              <button onClick={async () => { await createBudgetLine.mutateAsync(budgetForm); setShowForm(false); }} className="bg-emerald-600 text-white px-4 py-2 rounded-lg">حفظ</button>
            </div>
          )}
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--bg-secondary)]"><tr><th className="text-right p-3">المشروع</th><th className="text-right p-3">الحساب</th><th className="text-right p-3">الفترة</th><th className="text-right p-3">المبلغ</th></tr></thead>
              <tbody>
                {blLoading ? <tr><td colSpan={4} className="p-4 text-center">جاري التحميل...</td></tr> :
                  (budgetLines || []).map(b => (
                    <tr key={b.id} className="border-t border-[var(--border)]"><td className="p-3">{b.project_id}</td><td className="p-3">{b.account_id}</td><td className="p-3">{b.period}</td><td className="p-3 font-mono">{b.amount?.toFixed(2)}</td></tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
