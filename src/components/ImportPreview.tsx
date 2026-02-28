import React, { useState } from 'react';

type StockParsed = { name: string; qty: number; unit?: string };
type ChecklistParsed = { section?: string; text: string };

type Props = {
  open: boolean;
  type: 'stock' | 'checklist';
  items: StockParsed[] | ChecklistParsed[];
  sections?: string[];
  onCancel: () => void;
  onAccept: (items: any[]) => void;
};

const ImportPreview: React.FC<Props> = ({ open, items, type, sections, onCancel, onAccept }) => {
  const [local, setLocal] = useState<any[]>(() => (items as any[]).map(i => ({ ...i, _keep: true })));

  React.useEffect(() => { setLocal((items as any[]).map(i => ({ ...i, _keep: true }))); }, [items]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="bg-white rounded-xl w-full max-w-3xl p-4 m-4 card z-10">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold">Import preview ({type})</h3>
            <div className="muted text-sm">Review parsed items before importing</div>
          </div>
          <div className="flex gap-2">
            <button onClick={onCancel} className="btn">Cancel</button>
            <button onClick={() => onAccept(local.filter(i => i._keep))} className="btn-primary">Import</button>
          </div>
        </div>

        <div className="space-y-2 max-h-[50vh] overflow-auto">
          {local.map((it, idx) => (
            <div key={idx} className="flex items-center gap-3 p-2 rounded-md border border-[rgba(15,23,36,0.04)]">
              <input type="checkbox" checked={!!it._keep} onChange={(e) => setLocal(prev => { const copy = [...prev]; copy[idx]._keep = e.target.checked; return copy; })} />
              {type === 'stock' ? (
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                  <input className="col-span-1 md:col-span-2 p-2 rounded-md" value={it.name} onChange={(e) => setLocal(prev => { const copy = [...prev]; copy[idx].name = e.target.value; return copy; })} />
                  <input className="p-2 rounded-md w-full md:w-24" value={String(it.qty)} onChange={(e) => setLocal(prev => { const copy = [...prev]; copy[idx].qty = Number(e.target.value || 0); return copy; })} />
                  {sections && (
                    <select value={it.section || ''} onChange={(e) => setLocal(prev => { const copy = [...prev]; copy[idx].section = e.target.value; return copy; })} className="p-2 rounded-md">
                      <option value="">Assign section</option>
                      {sections.map((s: string) => (<option key={s} value={s}>{s}</option>))}
                    </select>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex items-center gap-3">
                  <input className="p-2 rounded-md flex-1" value={it.section || ''} onChange={(e) => setLocal(prev => { const copy = [...prev]; copy[idx].section = e.target.value; return copy; })} placeholder="Section" />
                  <input className="p-2 rounded-md flex-1" value={it.text} onChange={(e) => setLocal(prev => { const copy = [...prev]; copy[idx].text = e.target.value; return copy; })} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ImportPreview;
