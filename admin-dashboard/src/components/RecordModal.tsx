import React, { useState, useEffect } from 'react';
import { TableConfig } from '../App';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  schema: TableConfig;
  initialData: any | null;
}

export default function RecordModal({ onClose, onSave, schema, initialData }: ModalProps) {
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      const cleanForm = schema.fields.reduce((acc, field) => ({ ...acc, [field.key]: field.type === 'number' ? '' : '' }), {});
      setFormData(cleanForm);
    }
  }, [initialData, schema]);

  const handleChange = (key: string, value: any, type: 'text' | 'number') => {
    setFormData({ ...formData, [key]: type === 'number' ? Number(value) : value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
      <div className="bg-brand-cardBg border border-brand-border rounded-xl w-full max-w-lg overflow-hidden shadow-2xl border-t-4 border-t-brand-accent">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border bg-brand-darkBg/50">
          <h2 className="text-sm font-bold tracking-wide text-white uppercase">
            {initialData ? `Update Registry Record` : `Create Data Entries Pipeline`}
          </h2>
          <button onClick={onClose} className="text-brand-textMuted hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {schema.fields.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <label className="block text-xs font-semibold text-brand-textMuted uppercase tracking-wider">
                {field.label} {initialData && field.key === schema.idKey && <span className="text-brand-accent lowercase font-normal">(locked lookup key)</span>}
              </label>
              <input
                type={field.type}
                value={formData[field.key] ?? ''}
                placeholder={field.placeholder || `Enter entry for ${field.label.toLowerCase()}...`}
                onChange={(e) => handleChange(field.key, e.target.value, field.type)}
                required={field.key === schema.idKey}
                disabled={initialData && field.key === schema.idKey}
                className="w-full bg-brand-darkBg border border-brand-border rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              />
            </div>
          ))}

          <div className="flex justify-end gap-3 pt-4 border-t border-brand-border mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-400 hover:bg-brand-border/40 rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              type="submit"
              className="bg-brand-accent hover:bg-brand-accentHover text-brand-darkBg font-bold text-sm px-5 py-2.5 rounded-lg transition-all shadow-md shadow-emerald-500/10"
            >
              Apply Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}