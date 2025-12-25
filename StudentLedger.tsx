import React, { useState, useEffect, useRef } from "react";
import { styles } from "./styles";
import { Transaction, Student } from "./types";

export const StudentLedger = ({ students, transactions, masterData }: { students: Student[], transactions: Transaction[], masterData: any }) => {
   const [searchName, setSearchName] = useState("");
   const [searchFather, setSearchFather] = useState("");
   const [searchAdm, setSearchAdm] = useState("");
   const [searchReceipt, setSearchReceipt] = useState("");
   const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
   const [showPrintPreview, setShowPrintPreview] = useState(false);
   
   // Keyboard Navigation State
   const [selectedIndex, setSelectedIndex] = useState(-1);
   const listRef = useRef<HTMLDivElement>(null);

   const searchResults = students.filter(s => {
      if(!searchName && !searchFather && !searchAdm && !searchReceipt) return false;
      const matchName = !searchName || s.name.toLowerCase().includes(searchName.toLowerCase());
      const matchFather = !searchFather || s.fatherName.toLowerCase().includes(searchFather.toLowerCase());
      const matchAdm = !searchAdm || s.admissionNo.toLowerCase().includes(searchAdm.toLowerCase());
      return matchName && matchFather && matchAdm;
   });

   useEffect(() => {
      setSelectedIndex(-1);
   }, [searchName, searchFather, searchAdm, searchReceipt]);

   useEffect(() => {
      if (selectedIndex >= 0 && listRef.current) {
         const listItems = listRef.current.children;
         if (listItems[selectedIndex]) {
            (listItems[selectedIndex] as HTMLElement).scrollIntoView({ block: 'nearest' });
         }
      }
   }, [selectedIndex]);

   useEffect(() => {
      if(searchReceipt) {
         const txn = transactions.find(t => (t.voucherNo === searchReceipt || t.id === searchReceipt) && t.studentId);
         if(txn) {
            const s = students.find(st => st.admissionNo === txn.studentId);
            if(s) setSelectedStudent(s);
         }
      }
   }, [searchReceipt, transactions, students]);

   const handleSelect = (s: Student) => {
      setSelectedStudent(s);
      setSearchName(""); setSearchFather(""); setSearchAdm(""); setSearchReceipt("");
      setSelectedIndex(-1);
   };

   const handleKeyDown = (e: React.KeyboardEvent) => {
      if (searchResults.length === 0) return;
      if (e.key === "ArrowDown") {
         e.preventDefault();
         setSelectedIndex(prev => (prev < searchResults.length - 1 ? prev + 1 : prev));
      } else if (e.key === "ArrowUp") {
         e.preventDefault();
         setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === "Enter") {
         e.preventDefault();
         if (selectedIndex !== -1 && searchResults[selectedIndex]) {
            handleSelect(searchResults[selectedIndex]);
         }
      }
   };

   const handleExportPDF = () => {
      const element = document.getElementById('ledger-printable-content');
      if (!element) return;
      const opt = {
         margin: 10,
         filename: `Ledger_${selectedStudent?.admissionNo}_${new Date().toISOString().slice(0,10)}.pdf`,
         image: { type: 'jpeg', quality: 0.98 },
         html2canvas: { scale: 2, useCORS: true },
         jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      (window as any).html2pdf().from(element).set(opt).save();
   };

   let ledgerData: any = { rows: [], totalBilled: 0, totalPaid: 0, balance: 0 };
   if(selectedStudent) {
      const studTxns = transactions.filter(t => t.studentId === selectedStudent.admissionNo && t.status === "Posted")
         .sort((a,b) => {
             if (a.date !== b.date) return a.date.localeCompare(b.date);
             return a.id.localeCompare(b.id);
         });
      
      let runningBalance = 0;
      ledgerData.rows = studTxns.map(t => {
         let dr = 0; let cr = 0;
         if (t.debitAccount === '1-01-004' || t.type === 'FEE_DUE') dr = t.amount;
         else if (t.creditAccount === '1-01-004' || t.type === 'FEE_RCV' || t.type === 'FEE') cr = t.amount;
         
         runningBalance += (dr - cr);
         ledgerData.totalBilled += dr;
         ledgerData.totalPaid += cr;
         return { ...t, dr, cr, balance: runningBalance };
      });
      ledgerData.balance = ledgerData.totalBilled - ledgerData.totalPaid;
   }

   const PrintPreviewModal = () => (
      <div style={styles.modalOverlay}>
         <div style={{...styles.modalContent, width: '210mm', padding: '0', backgroundColor: '#f1f5f9'}}>
            <div className="no-print" style={{padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white'}}>
               <h3 style={{margin: 0}}>Ledger Print Preview</h3>
               <div style={{display: 'flex', gap: '10px'}}>
                  <button style={{...styles.button("primary"), background: '#1e293b'}} onClick={handleExportPDF}>
                     <span className="material-symbols-outlined">picture_as_pdf</span> Export PDF
                  </button>
                  <button style={styles.button("secondary")} onClick={() => window.print()}>
                     <span className="material-symbols-outlined">print</span> Print Now
                  </button>
                  <button style={styles.button("danger")} onClick={() => setShowPrintPreview(false)}>Close</button>
               </div>
            </div>
            
            <div id="ledger-printable-content" style={{padding: '40px', backgroundColor: 'white', minHeight: '297mm'}}>
               <div style={{textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '20px', marginBottom: '30px'}}>
                  <h1 style={{margin: '0 0 5px 0', textTransform: 'uppercase', fontSize: '1.8rem'}}>Ghazali Institute of Medical Sciences</h1>
                  <h3 style={{margin: 0, fontWeight: 600, color: '#475569'}}>Student Statement of Account</h3>
                  <div style={{marginTop: '10px', fontSize: '0.9rem'}}>Date Generated: {new Date().toLocaleDateString()}</div>
               </div>

               <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '30px', background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0'}}>
                  <div>
                     <div style={{fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px'}}>Student Particulars</div>
                     <div style={{fontSize: '1.2rem', fontWeight: 800, color: '#0f172a'}}>{selectedStudent?.name}</div>
                     <div style={{fontSize: '1rem', color: '#334155'}}>S/O: {selectedStudent?.fatherName}</div>
                     <div style={{fontSize: '0.9rem', color: '#64748b', marginTop: '5px'}}>ID: {selectedStudent?.admissionNo} | {selectedStudent?.program} ({selectedStudent?.semester})</div>
                  </div>
                  <div style={{textAlign: 'right'}}>
                     <div style={{fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px'}}>Campus</div>
                     <div style={{fontSize: '1.1rem', fontWeight: 700}}>{selectedStudent?.campus}</div>
                     <div style={{fontSize: '0.9rem', color: '#64748b', marginTop: '5px'}}>Phone: {selectedStudent?.phone}</div>
                  </div>
               </div>

               <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '30px'}}>
                  <div style={{padding: '20px', border: '1px solid #cbd5e1', borderRadius: '10px', textAlign: 'center'}}>
                     <div style={{fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase'}}>Total Billed</div>
                     <div style={{fontSize: '1.5rem', fontWeight: 800, color: '#1e293b'}}>Rs {ledgerData.totalBilled.toLocaleString()}</div>
                  </div>
                  <div style={{padding: '20px', border: '1px solid #cbd5e1', borderRadius: '10px', textAlign: 'center'}}>
                     <div style={{fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase'}}>Total Paid</div>
                     <div style={{fontSize: '1.5rem', fontWeight: 800, color: '#166534'}}>Rs {ledgerData.totalPaid.toLocaleString()}</div>
                  </div>
                  <div style={{padding: '20px', border: '2px solid #0f172a', borderRadius: '10px', textAlign: 'center', background: '#f8fafc'}}>
                     <div style={{fontSize: '0.75rem', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase'}}>Current Balance</div>
                     <div style={{fontSize: '1.5rem', fontWeight: 800, color: ledgerData.balance > 0 ? '#b91c1c' : '#166534'}}>Rs {ledgerData.balance.toLocaleString()}</div>
                  </div>
               </div>

               <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem'}}>
                  <thead>
                     <tr style={{background: '#0f172a', color: 'white'}}>
                        <th style={{padding: '12px', textAlign: 'left', border: '1px solid #334155'}}>Date</th>
                        <th style={{padding: '12px', textAlign: 'left', border: '1px solid #334155'}}>Voucher/Ref</th>
                        <th style={{padding: '12px', textAlign: 'left', border: '1px solid #334155'}}>Description</th>
                        <th style={{padding: '12px', textAlign: 'right', border: '1px solid #334155'}}>Dr (Due)</th>
                        <th style={{padding: '12px', textAlign: 'right', border: '1px solid #334155'}}>Cr (Paid)</th>
                        <th style={{padding: '12px', textAlign: 'right', border: '1px solid #334155'}}>Balance</th>
                     </tr>
                  </thead>
                  <tbody>
                     {ledgerData.rows.map((r: any, idx: number) => (
                        <tr key={idx}>
                           <td style={{padding: '10px', border: '1px solid #e2e8f0'}}>{r.date}</td>
                           <td style={{padding: '10px', border: '1px solid #e2e8f0', fontFamily: 'monospace'}}>{r.voucherNo || r.id}</td>
                           <td style={{padding: '10px', border: '1px solid #e2e8f0'}}>{r.description}</td>
                           <td style={{padding: '10px', border: '1px solid #e2e8f0', textAlign: 'right'}}>{r.dr ? r.dr.toLocaleString() : '-'}</td>
                           <td style={{padding: '10px', border: '1px solid #e2e8f0', textAlign: 'right'}}>{r.cr ? r.cr.toLocaleString() : '-'}</td>
                           <td style={{padding: '10px', border: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 700}}>{r.balance.toLocaleString()}</td>
                        </tr>
                     ))}
                  </tbody>
               </table>

               <div style={{marginTop: '60px', display: 'flex', justifyContent: 'space-between'}}>
                  <div style={{textAlign: 'center', width: '200px'}}><div style={{borderBottom: '1px solid #000', marginBottom: '5px'}}></div><div style={{fontSize: '0.8rem'}}>Prepared By</div></div>
                  <div style={{textAlign: 'center', width: '200px'}}><div style={{borderBottom: '1px solid #000', marginBottom: '5px'}}></div><div style={{fontSize: '0.8rem'}}>Finance Controller</div></div>
               </div>
            </div>
         </div>
      </div>
   );

   return (
      <div>
         {showPrintPreview && <PrintPreviewModal />}
         <h2 style={{marginBottom: '5px'}}>Student Ledger</h2>
         <p style={{color: '#64748b', marginBottom: '24px'}}>Financial history and statement of account</p>

         <div className="no-print" style={{marginBottom: '20px', background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0'}}>
             <label style={{...styles.label, marginBottom: '10px', display: 'block'}}>Search Student</label>
             <div style={{display: 'flex', gap: '15px'}}>
               <div style={{flex: 1}}><input style={styles.input} placeholder="By Name" value={searchName} onChange={e => setSearchName(e.target.value)} onKeyDown={handleKeyDown} /></div>
               <div style={{flex: 1}}><input style={styles.input} placeholder="By Father Name" value={searchFather} onChange={e => setSearchFather(e.target.value)} onKeyDown={handleKeyDown} /></div>
               <div style={{flex: 1}}><input style={styles.input} placeholder="By Adm No" value={searchAdm} onChange={e => setSearchAdm(e.target.value)} onKeyDown={handleKeyDown} /></div>
               <div style={{flex: 1}}><input style={{...styles.input, borderColor: '#3b82f6'}} placeholder="Trace by Receipt No" value={searchReceipt} onChange={e => setSearchReceipt(e.target.value)} /></div>
             </div>
             {searchResults.length > 0 && !searchReceipt && (
               <div ref={listRef} style={{maxHeight: '200px', overflowY: 'auto', border: '1px solid #cbd5e1', background: 'white', borderRadius: '8px', marginTop: '10px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}}>
                  {searchResults.map((s, idx) => (
                     <div key={s.admissionNo} onClick={() => handleSelect(s)} style={{padding: '10px 15px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background 0.1s', backgroundColor: idx === selectedIndex ? '#eff6ff' : 'white', borderLeft: idx === selectedIndex ? '4px solid #3b82f6' : '4px solid transparent'}} onMouseEnter={() => setSelectedIndex(idx)}>
                        <div><div style={{fontWeight: 600, color: '#334155'}}>{s.name}</div><div style={{fontSize: '0.8rem', color: '#64748b'}}>F: {s.fatherName}</div></div>
                        <span style={{color: '#64748b', fontSize: '0.8rem', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px'}}>{s.admissionNo}</span>
                     </div>
                  ))}
               </div>
             )}
         </div>

         {selectedStudent ? (
            <div>
               <div className="no-print" style={{background: 'white', padding: '25px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <div style={{display: 'flex', gap: '20px', alignItems: 'center'}}>
                      <div style={{width: '70px', height: '70px', borderRadius: '50%', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #cbd5e1', overflow: 'hidden'}}>
                          {selectedStudent.photo ? <img src={selectedStudent.photo} style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : <span className="material-symbols-outlined" style={{fontSize: '32px', color: '#94a3b8'}}>person</span>}
                      </div>
                      <div>
                          <h2 style={{margin: '0 0 5px 0', color: '#0f172a'}}>{selectedStudent.name}</h2>
                          <div style={{color: '#64748b', fontSize: '0.85rem'}}>{selectedStudent.admissionNo} • {selectedStudent.program}</div>
                      </div>
                  </div>
                  <div style={{display: 'flex', gap: '15px'}}>
                      <button style={{...styles.button("primary"), background: '#1e293b'}} onClick={() => setShowPrintPreview(true)}>
                         <span className="material-symbols-outlined">print_preview</span> Print Preview
                      </button>
                      <button style={styles.button("secondary")} onClick={handleExportPDF}>
                         <span className="material-symbols-outlined">download</span> Export PDF
                      </button>
                  </div>
               </div>

               <div style={styles.card}>
                  <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '25px'}}>
                     <div style={{padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center'}}>
                        <div style={{fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700}}>Total Billed</div>
                        <div style={{fontSize: '1.2rem', fontWeight: 800}}>Rs {ledgerData.totalBilled.toLocaleString()}</div>
                     </div>
                     <div style={{padding: '15px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', textAlign: 'center'}}>
                        <div style={{fontSize: '0.7rem', color: '#166534', textTransform: 'uppercase', fontWeight: 700}}>Total Paid</div>
                        <div style={{fontSize: '1.2rem', fontWeight: 800, color: '#15803d'}}>Rs {ledgerData.totalPaid.toLocaleString()}</div>
                     </div>
                     <div style={{padding: '15px', background: '#fff1f2', borderRadius: '8px', border: '1px solid #fecaca', textAlign: 'center'}}>
                        <div style={{fontSize: '0.7rem', color: '#9f1239', textTransform: 'uppercase', fontWeight: 700}}>Current Balance</div>
                        <div style={{fontSize: '1.2rem', fontWeight: 800, color: ledgerData.balance > 0 ? '#be123c' : '#166534'}}>Rs {ledgerData.balance.toLocaleString()}</div>
                     </div>
                  </div>

                  <table style={styles.table}>
                     <thead>
                        <tr><th style={styles.th}>Date</th><th style={styles.th}>Ref</th><th style={styles.th}>Description</th><th style={{...styles.th, textAlign: 'right'}}>Dr</th><th style={{...styles.th, textAlign: 'right'}}>Cr</th><th style={{...styles.th, textAlign: 'right'}}>Balance</th></tr>
                     </thead>
                     <tbody>
                        {ledgerData.rows.map((r:any) => (
                           <tr key={r.id}>
                              <td style={styles.td}>{r.date}</td>
                              <td style={styles.td}><span style={{fontSize: '0.75rem', fontFamily: 'monospace'}}>{r.voucherNo || r.id}</span></td>
                              <td style={styles.td}>{r.description}</td>
                              <td style={{...styles.td, textAlign: 'right', color: '#b91c1c'}}>{r.dr ? r.dr.toLocaleString() : '-'}</td>
                              <td style={{...styles.td, textAlign: 'right', color: '#15803d'}}>{r.cr ? r.cr.toLocaleString() : '-'}</td>
                              <td style={{...styles.td, textAlign: 'right', fontWeight: 700}}>{r.balance.toLocaleString()}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         ) : (
            <div style={{textAlign: 'center', padding: '60px', background: 'white', borderRadius: '12px', border: '1px dashed #cbd5e1'}}>
               <span className="material-symbols-outlined" style={{fontSize: '64px', color: '#e2e8f0', marginBottom: '10px'}}>manage_search</span>
               <h3 style={{color: '#94a3b8', margin: 0}}>Search for a student to view their ledger</h3>
            </div>
         )}
      </div>
   );
};