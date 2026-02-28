import React, { useState, useEffect } from 'react';

type Props = {
  onChange?: (sections: string[]) => void;
};

const STORAGE_KEY = 'cafe_sections_v1';

function loadSections(): string[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') || []; } catch { return []; }
}

function saveSections(s: string[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }

const SectionsManager: React.FC<Props> = ({ onChange }) => {
  const [sections, setSections] = useState<string[]>(() => loadSections());
  const [value, setValue] = useState('');

  useEffect(() => onChange?.(sections), [sections]);

  function add() {
    if (!value.trim()) return;
    const next = [...sections, value.trim()];
    setSections(next); saveSections(next); setValue('');
  }

  function remove(idx: number) {
    const next = sections.filter((_, i) => i !== idx);
    setSections(next); saveSections(next);
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold">Sections</div>
        <div className="muted text-sm">Organize inventory & checklists</div>
      </div>
      <div className="flex gap-2 mb-3">
        <input value={value} onChange={e => setValue(e.target.value)} placeholder="New section" className="p-2 rounded-md flex-1" />
        <button onClick={add} className="btn-primary">Add</button>
      </div>
      <div className="flex flex-wrap gap-2">
        {sections.length === 0 && <div className="muted">No sections yet</div>}
        {sections.map((s, i) => (
          <div key={s} className="flex items-center gap-2 bg-[rgba(0,0,0,0.03)] rounded-full px-3 py-1">
            <div className="text-sm">{s}</div>
            <button onClick={() => remove(i)} className="text-red-600">×</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SectionsManager;
