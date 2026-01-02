
import React, { useState, useRef, useEffect } from "react";
import { styles } from "./styles";

export const SearchableSelect = ({ options, value, onChange, placeholder }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Enhanced search: checks both the Label (Name) and Value (Code)
  const filtered = options.filter((o: any) => 
    o.label.toLowerCase().includes(search.toLowerCase()) || 
    o.value.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOption = options.find((o: any) => o.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset search when opening
  const toggleDropdown = () => {
    if (!isOpen) setSearch("");
    setIsOpen(!isOpen);
  };

  return (
    <div ref={containerRef} style={{
        position: 'relative', 
        width: '100%', 
        zIndex: isOpen ? 2000 : 1 // CRITICAL: Higher z-index when open to stay above other rows
    }}>
      <div 
        onClick={toggleDropdown} 
        style={{
          ...styles.input, 
          cursor: 'pointer', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          backgroundColor: isOpen ? '#f8fafc' : 'white',
          borderColor: isOpen ? '#4f46e5' : '#cbd5e1',
          boxShadow: isOpen ? '0 0 0 3px rgba(79, 70, 229, 0.1)' : '0 1px 2px rgba(0,0,0,0.05)',
          height: '42px'
        }}
      >
        <span style={{
            color: selectedOption ? '#0f172a' : '#94a3b8', 
            whiteSpace: 'nowrap', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis',
            fontWeight: selectedOption ? 600 : 400,
            fontSize: '0.9rem'
        }}>
            {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="material-symbols-outlined" style={{
            fontSize: '20px', 
            transition: 'transform 0.2s', 
            transform: isOpen ? 'rotate(180deg)' : 'none',
            color: isOpen ? '#4f46e5' : '#64748b'
        }}>expand_more</span>
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute', 
          top: 'calc(100% + 6px)', 
          left: 0, 
          right: 0, 
          zIndex: 2001, 
          background: 'white', 
          border: '1px solid #e2e8f0', 
          maxHeight: '280px', 
          overflowY: 'auto', 
          borderRadius: '10px', 
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          animation: 'dropDown 0.2s ease-out'
        }}>
          <div style={{position: 'sticky', top: 0, padding: '10px', background: 'white', borderBottom: '1px solid #f1f5f9', zIndex: 10}}>
            <div style={{position: 'relative'}}>
                <input 
                    autoFocus 
                    placeholder="Search name or code..." 
                    style={{...styles.input, padding: '8px 12px 8px 35px', height: '38px', fontSize: '0.85rem'}} 
                    value={search} 
                    onChange={e => setSearch(e.target.value)} 
                />
                <span className="material-symbols-outlined" style={{position: 'absolute', left: '10px', top: '9px', fontSize: '18px', color: '#94a3b8'}}>search</span>
            </div>
          </div>
          <div style={{padding: '4px'}}>
            {filtered.length > 0 ? filtered.map((opt: any) => (
                <div 
                key={opt.value} 
                onClick={() => { onChange(opt.value); setIsOpen(false); setSearch(""); }} 
                style={{
                    padding: '10px 14px', 
                    cursor: 'pointer', 
                    borderRadius: '6px',
                    margin: '2px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: value === opt.value ? '#eff6ff' : 'transparent',
                    transition: 'all 0.1s'
                }}
                onMouseOver={e => { if(value !== opt.value) e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                onMouseOut={e => { if(value !== opt.value) e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                <div style={{flex: 1}}>
                    <div style={{fontWeight: value === opt.value ? 700 : 600, color: value === opt.value ? '#1e40af' : '#1e293b', fontSize: '0.85rem'}}>{opt.label}</div>
                    <div style={{fontSize: '0.75rem', color: '#64748b', marginTop: '2px', fontFamily: 'monospace'}}>{opt.value}</div>
                </div>
                {value === opt.value && <span className="material-symbols-outlined" style={{fontSize: '18px', color: '#3b82f6'}}>check_circle</span>}
                </div>
            )) : (
                <div style={{padding: '30px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem'}}>
                    <span className="material-symbols-outlined" style={{fontSize: '32px', display: 'block', marginBottom: '8px', opacity: 0.5}}>search_off</span>
                    No matching accounts
                </div>
            )}
          </div>
        </div>
      )}
      <style>{`
        @keyframes dropDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};
