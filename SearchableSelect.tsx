import React, { useState } from "react";
import { styles } from "./styles";

export const SearchableSelect = ({ options, value, onChange, placeholder }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const filtered = options.filter((o: any) => o.label.toLowerCase().includes(search.toLowerCase()));
  const selectedLabel = options.find((o: any) => o.value === value)?.label;

  return (
    <div style={{position: 'relative'}}>
      <div onClick={() => setIsOpen(!isOpen)} style={{...styles.input, cursor: 'pointer', display: 'flex', justifyContent: 'space-between'}}>
        <span>{selectedLabel || placeholder}</span>
        <span className="material-symbols-outlined">arrow_drop_down</span>
      </div>
      {isOpen && (
        <div style={{position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, background: 'white', border: '1px solid #cbd5e1', maxHeight: '200px', overflowY: 'auto', borderRadius: '6px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}}>
          <input autoFocus placeholder="Search..." style={{width: '100%', padding: '8px', border: 'none', borderBottom: '1px solid #eee', outline: 'none'}} value={search} onChange={e => setSearch(e.target.value)} />
          {filtered.map((opt: any) => (
            <div key={opt.value} onClick={() => { onChange(opt.value); setIsOpen(false); }} style={{padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f8fafc', fontSize: '0.85rem'}}>
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};