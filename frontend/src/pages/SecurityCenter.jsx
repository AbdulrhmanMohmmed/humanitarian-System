import { useState } from 'react';
import { Shield, Key, Smartphone, Monitor, Trash2, Copy, Plus, Check, AlertTriangle } from 'lucide-react';
import { useMfaStatus, useMfaSetup, useMfaConfirm, useMfaDisable, useApiKeys, useCreateApiKey, useRevokeApiKey, useSessions, useTerminateSession } from '../hooks/useModuleApi';
import { useLanguage } from '../contexts/LanguageContext';

export default function SecurityCenter() {
  const { t } = useLanguage();
  const [tab, setTab] = useState('mfa');
  const [mfaCode, setMfaCode] = useState('');
  const [keyName, setKeyName] = useState('');
  const [keyScopes, setKeyScopes] = useState('read');
  const [newKey, setNewKey] = useState(null);
  const [backupCodes, setBackupCodes] = useState([]);
  const [mfaSecret, setMfaSecret] = useState('');

  const { data: mfaStatus } = useMfaStatus();
  const mfaSetup = useMfaSetup();
  const mfaConfirm = useMfaConfirm();
  const mfaDisable = useMfaDisable();
  const { data: apiKeys = [], isLoading: keysLoading } = useApiKeys();
  const createKey = useCreateApiKey();
  const revokeKey = useRevokeApiKey();
  const { data: sessions = [], isLoading: sessionsLoading } = useSessions();
  const terminateSession = useTerminateSession();

  const handleMfaSetup = async () => {
    try {
      const result = await mfaSetup.mutateAsync({});
      setMfaSecret(result.secret);
      setBackupCodes(result.backup_codes || []);
    } catch (e) { console.error(e); }
  };

  const handleMfaConfirm = async () => {
    try {
      await mfaConfirm.mutateAsync({ code: mfaCode });
      setMfaCode('');
      setMfaSecret('');
    } catch (e) { console.error(e); }
  };

  const handleCreateKey = async () => {
    try {
      const result = await createKey.mutateAsync({ name: keyName, scopes: keyScopes });
      setNewKey(result.key);
      setKeyName('');
    } catch (e) { console.error(e); }
  };

  const tabs = [
    { id: 'mfa', label: 'المصادقة الثنائية', icon: Smartphone },
    { id: 'keys', label: 'مفاتيح API', icon: Key },
    { id: 'sessions', label: 'الجلسات النشطة', icon: Monitor },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="w-8 h-8 text-blue-600" />
        <h1 className="text-2xl font-bold">مركز الأمان</h1>
      </div>

      <div className="flex gap-2 border-b border-[var(--border)]">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'mfa' && (
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6 space-y-4">
          <h2 className="text-lg font-semibold">المصادقة الثنائية (TOTP)</h2>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${mfaStatus?.mfa_enabled ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {mfaStatus?.mfa_enabled ? 'مفعّلة' : 'غير مفعّلة'}
            </span>
          </div>
          {!mfaStatus?.mfa_enabled && !mfaSecret && (
            <button onClick={handleMfaSetup} disabled={mfaSetup.isPending}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
              <Plus className="w-4 h-4" /> {mfaSetup.isPending ? 'جاري الإعداد...' : 'تفعيل المصادقة الثنائية'}
            </button>
          )}
          {mfaSecret && (
            <div className="space-y-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <p className="text-sm">امسح رمز QR أو أدخل السر يدوياً في تطبيق المصادقة:</p>
              <code className="block bg-white dark:bg-gray-800 p-3 rounded font-mono text-sm break-all">{mfaSecret}</code>
              {backupCodes.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">رموز النسخ الاحتياطي (احفظها في مكان آمن):</p>
                  <div className="grid grid-cols-4 gap-2">
                    {backupCodes.map((code, i) => (
                      <code key={i} className="bg-white dark:bg-gray-800 p-2 rounded text-center text-xs font-mono">{code}</code>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <input type="text" value={mfaCode} onChange={e => setMfaCode(e.target.value)}
                  placeholder="أدخل رمز TOTP" className="border border-[var(--border)] rounded-lg px-3 py-2 w-40 text-center font-mono" />
                <button onClick={handleMfaConfirm} disabled={mfaConfirm.isPending || mfaCode.length < 6}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2">
                  <Check className="w-4 h-4" /> تأكيد
                </button>
              </div>
            </div>
          )}
          {mfaStatus?.mfa_enabled && (
            <button onClick={() => mfaDisable.mutate({})}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> تعطيل المصادقة الثنائية
            </button>
          )}
        </div>
      )}

      {tab === 'keys' && (
        <div className="space-y-4">
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6 space-y-4">
            <h2 className="text-lg font-semibold">إنشاء مفتاح API جديد</h2>
            <div className="flex gap-3">
              <input type="text" value={keyName} onChange={e => setKeyName(e.target.value)}
                placeholder="اسم المفتاح" className="border border-[var(--border)] rounded-lg px-3 py-2 flex-1" />
              <select value={keyScopes} onChange={e => setKeyScopes(e.target.value)}
                className="border border-[var(--border)] rounded-lg px-3 py-2">
                <option value="read">قراءة فقط</option>
                <option value="read,write">قراءة وكتابة</option>
                <option value="read,write,admin">كامل الصلاحيات</option>
              </select>
              <button onClick={handleCreateKey} disabled={!keyName || createKey.isPending}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
                <Plus className="w-4 h-4" /> إنشاء
              </button>
            </div>
            {newKey && (
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <p className="text-sm font-medium text-green-700 mb-2">المفتاح الجديد (انسخه الآن، لن يظهر مرة أخرى):</p>
                <div className="flex items-center gap-2">
                  <code className="bg-white dark:bg-gray-800 p-2 rounded font-mono text-xs flex-1 break-all">{newKey}</code>
                  <button onClick={() => { navigator.clipboard.writeText(newKey); }} className="p-2 hover:bg-gray-100 rounded">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--bg-secondary)]">
                <tr>
                  <th className="text-right p-3">الاسم</th>
                  <th className="text-right p-3">البادئة</th>
                  <th className="text-right p-3">الصلاحيات</th>
                  <th className="text-right p-3">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {keysLoading ? (
                  <tr><td colSpan={4} className="p-4 text-center text-[var(--text-secondary)]">جاري التحميل...</td></tr>
                ) : (apiKeys || []).map(k => (
                  <tr key={k.id} className="border-t border-[var(--border)]">
                    <td className="p-3 font-medium">{k.name}</td>
                    <td className="p-3 font-mono text-xs">{k.prefix || k.key_prefix}</td>
                    <td className="p-3"><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">{k.scopes}</span></td>
                    <td className="p-3">
                      <button onClick={() => revokeKey.mutate(k.id)} className="text-red-600 hover:text-red-800 flex items-center gap-1 text-xs">
                        <Trash2 className="w-3 h-3" /> إلغاء
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'sessions' && (
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--bg-secondary)]">
              <tr>
                <th className="text-right p-3">الجهاز</th>
                <th className="text-right p-3">عنوان IP</th>
                <th className="text-right p-3">آخر نشاط</th>
                <th className="text-right p-3">الحالة</th>
                <th className="text-right p-3">إجراء</th>
              </tr>
            </thead>
            <tbody>
              {sessionsLoading ? (
                <tr><td colSpan={5} className="p-4 text-center text-[var(--text-secondary)]">جاري التحميل...</td></tr>
              ) : (sessions || []).map(s => (
                <tr key={s.id} className="border-t border-[var(--border)]">
                  <td className="p-3">{s.device_info || 'غير معروف'}</td>
                  <td className="p-3 font-mono text-xs">{s.ip_address}</td>
                  <td className="p-3 text-xs">{s.last_active_at ? new Date(s.last_active_at).toLocaleString('ar') : '-'}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {s.is_active ? 'نشطة' : 'منتهية'}
                    </span>
                  </td>
                  <td className="p-3">
                    {s.is_active && (
                      <button onClick={() => terminateSession.mutate(s.id)} className="text-red-600 hover:text-red-800 text-xs flex items-center gap-1">
                        <Trash2 className="w-3 h-3" /> إنهاء
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
