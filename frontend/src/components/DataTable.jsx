import { Trash2 } from 'lucide-react';

export default function DataTable({ columns, data, onDelete, emptyMsg = 'لا توجد بيانات' }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-10 text-center text-gray-400">
        {emptyMsg}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 text-right font-semibold text-gray-600">
                  {col.label}
                </th>
              ))}
              {onDelete && <th className="px-4 py-3 text-center font-semibold text-gray-600 w-16">حذف</th>}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={row.id || i} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-gray-700">
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
                {onDelete && (
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => onDelete(row.id)} className="text-red-400 hover:text-red-600 transition">
                      <Trash2 size={16} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
