import React from 'react';
import { TableConfig } from '../App';
import { Edit3, Inbox } from 'lucide-react';

interface TableProps {
  data: any[];
  schema: TableConfig;
  loading: boolean;
  onEdit: (record: any) => void;
}

export default function DynamicTable({ data, schema, loading, onEdit }: TableProps) {
  if (loading) {
    return (
      <div className="bg-brand-cardBg border border-brand-border rounded-xl p-16 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-t-brand-accent border-r-transparent border-brand-border"></div>
        <p className="text-brand-textMuted mt-4 text-sm font-medium">Fetching live database records...</p>
      </div>
    );
  }

  // Detects if a field key corresponds to Arabic properties to apply custom text alignments
  const isArabicField = (key: string) => key.toLowerCase().includes('arabic') || key.toLowerCase().includes('_ar');

  return (
    <div className="bg-brand-cardBg border border-brand-border rounded-xl overflow-hidden shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-brand-darkBg/60 border-b border-brand-border">
              {schema.fields.map((field) => (
                <th 
                  key={field.key} 
                  className={`px-6 py-4 text-xs font-bold uppercase tracking-wider text-brand-textMuted ${
                    isArabicField(field.key) ? 'text-right' : 'text-left'
                  }`}
                >
                  {field.label}
                </th>
              ))}
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-brand-textMuted text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border/40">
            {data.length === 0 ? (
              <tr>
                <td colSpan={schema.fields.length + 1} className="px-6 py-16 text-center text-brand-textMuted">
                  <Inbox className="h-8 w-8 mx-auto mb-3 opacity-20 text-brand-accent" />
                  <p className="text-sm font-medium">No live records returned from this target endpoint.</p>
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr key={index} className="hover:bg-slate-800/30 transition-colors group">
                  {schema.fields.map((field) => (
                    <td 
                      key={field.key} 
                      dir={isArabicField(field.key) ? 'rtl' : 'ltr'}
                      className={`px-6 py-4 text-sm font-medium text-slate-200 whitespace-nowrap ${
                        isArabicField(field.key) ? 'text-right font-sans' : 'text-left font-mono text-[13px]'
                      }`}
                    >
                      {row[field.key] !== undefined && row[field.key] !== null && row[field.key] !== '' ? (
                        String(row[field.key])
                      ) : (
                        <span className="text-slate-600 italic text-xs select-none">—</span>
                      )}
                    </td>
                  ))}
                  <td className="px-6 py-4 text-sm text-right whitespace-nowrap">
                    <button 
                      onClick={() => onEdit(row)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold bg-brand-darkBg border border-brand-border text-brand-accent hover:border-brand-accent hover:bg-brand-accent hover:text-brand-darkBg px-3 py-2 rounded-lg transition-all shadow-sm"
                    >
                      <Edit3 className="h-3 w-3" /> Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}