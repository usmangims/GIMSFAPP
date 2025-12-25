
import React, { useState, useEffect, useRef } from "react";
import { styles } from "./styles";
import { Transaction, Account, Student, HOSPITALS, FINE_TYPES } from "./types";

export const FeeCollection = ({ students, onCollectFee, masterData, accounts, currentUser }: { students: Student[], onCollectFee: (t: Transaction) => void, masterData: any, accounts: Account[], currentUser: string }) => {
  const [searchName, setSearchName] = useState("");
  const [searchFather, setSearchFather] = useState("");
  const [searchAdm, setSearchAdm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Keyboard Navigation State
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const listRef = useRef<HTMLDivElement>(null);

  const [fees, setFees] = useState({
     admission: 0, tuition: 0, arrear: 0, exam: 0, hospital: 0, registration: 0, diploma: 0, affiliation: 0, fine: 0, graceMark: 0, ufm: 0, idCard: 0
  });

  const [hospitalName, setHospitalName] = useState("");
  const [fineType, setFineType] = useState(FINE_TYPES[0]);
  const [paymentMode, setPaymentMode] = useState("1-01-001");
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastTxn, setLastTxn] = useState<Transaction | null>(null);

  const liquidAccounts = accounts.filter(a => a.code === "1-01-001" || (a.category === "Asset" && a.level === 3 && a.name.toLowerCase().includes("bank")));

  const searchResults = students.filter(s => {
     if(!searchName && !searchFather && !searchAdm) return false;
     const matchName = !searchName || s.name.toLowerCase().includes(searchName.toLowerCase());
     const matchFather = !searchFather || s.fatherName.toLowerCase().includes(searchFather.toLowerCase());
     const matchAdm = !searchAdm || s.admissionNo.toLowerCase().includes(searchAdm.toLowerCase());
     return matchName && matchFather && matchAdm;
  });

  // Reset selection when search criteria changes
  useEffect(() => {
      setSelectedIndex(-1);
  }, [searchName, searchFather, searchAdm]);

  // Scroll selected item into view
  useEffect(() => {
      if (selectedIndex >= 0 && listRef.current) {
         const listItems = listRef.current.children;
         if (listItems[selectedIndex]) {
            listItems[selectedIndex].scrollIntoView({ block: 'nearest' });
         }
      }
  }, [selectedIndex]);

  const handleSelect = (s: Student) => {
    setSelectedStudent(s);
    setSearchName(""); setSearchFather(""); setSearchAdm("");
    
    // Auto-populate Arrear if dues exist, otherwise Tuition
    if (s.balance > 0) {
        setFees({ ...fees, arrear: s.balance, tuition: 0 });
    } else {
        setFees({ ...fees, tuition: s.tuitionFee, arrear: 0 });
    }
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

  const handlePost = (createLiability: boolean) => {
    if(!selectedStudent) return;
    const total = (Object.values(fees) as number[]).reduce((a, b) => a + b, 0);
    if(total <= 0) return alert("Total amount must be greater than 0");

    if (fees.hospital > 0 && !hospitalName) {
       return alert("Please select a Hospital from the dropdown before proceeding.");
    }

    const t: Transaction = {
      id: `FEE-${Date.now()}`,
      voucherNo: `RCPT/${new Date().getFullYear()}/${Math.floor(Math.random() * 1000000)}`,
      date: new Date().toISOString().slice(0, 10),
      type: createLiability ? "FEE_DUE" : "FEE_RCV", 
      description: `Fee Collection - ${selectedStudent.name} (${selectedStudent.semester})`,
      debitAccount: createLiability ? "1-01-004" : paymentMode,
      creditAccount: "4-01-001", 
      amount: total,
      status: createLiability ? "Posted" : "Pending",
      studentId: selectedStudent.admissionNo,
      details: { ...fees, hospitalName: fees.hospital > 0 ? hospitalName : '', fineType: fees.fine > 0 ? fineType : '' },
      recordedBy: currentUser
    };

    onCollectFee(t);
    setLastTxn(t);
    if(!createLiability) {
        setShowReceipt(true);
    } else {
        alert("Liability Created Successfully");
        resetForm();
    }
  };

  const resetForm = () => {
    setSelectedStudent(null);
    setFees({ admission: 0, tuition: 0, arrear: 0, exam: 0, hospital: 0, registration: 0, diploma: 0, affiliation: 0, fine: 0, graceMark: 0, ufm: 0, idCard: 0 });
    setHospitalName("");
  };

  const ReceiptTemplate = ({ title }: { title: string }) => {
     const d = new Date();
     const printDate = d.toLocaleDateString();
     const printTime = d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
     const dueDate = new Date(d.setDate(d.getDate() + 14)).toLocaleDateString(); 

     return (
      <div style={{width: '320px', padding: '15px', border: '1px solid #000', borderRadius: '2px', backgroundColor: 'white', display: 'flex', flexDirection: 'column', fontSize: '0.75rem', fontFamily: 'serif'}}>
          <div style={{textAlign: 'center', marginBottom: '8px'}}>
              <h3 style={{margin: '0 0 2px 0', textTransform: 'uppercase', fontSize: '0.9rem', color: '#000', fontWeight: 'bold'}}>GHAZALI INSTITUTE OF MEDICAL SCIENCES</h3>
              <div style={{fontSize: '0.8rem', fontWeight: 'bold', textDecoration: 'underline', marginBottom: '2px'}}>{title}</div>
              <div style={{fontSize: '0.75rem', color: '#333'}}>Fee Receipt / Challan</div>
          </div>
          
          <div style={{borderBottom: '1px solid #000', marginBottom: '10px'}}></div>

          <div style={{backgroundColor: '#f1f5f9', padding: '6px', display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderRadius: '4px'}}>
              <div>
                  <div style={{color: '#64748b', fontSize: '0.65rem', textTransform: 'uppercase'}}>Challan No</div>
                  <div style={{fontWeight: 700, fontSize: '0.9rem'}}>{lastTxn?.voucherNo}</div>
              </div>
              <div style={{textAlign: 'right'}}>
                  <div style={{color: '#64748b', fontSize: '0.65rem', textTransform: 'uppercase'}}>Receipt Date</div>
                  <div style={{fontWeight: 700, fontSize: '0.9rem'}}>{lastTxn?.date ? new Date(lastTxn.date).toLocaleDateString() : '-'}</div>
              </div>
          </div>

          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '15px'}}>
              <div>
                  <div style={{fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase'}}>Student Name</div>
                  <div style={{fontWeight: 600, textTransform: 'uppercase'}}>{selectedStudent?.name}</div>
              </div>
              <div>
                  <div style={{fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase'}}>Father Name</div>
                  <div style={{fontWeight: 600, textTransform: 'uppercase'}}>{selectedStudent?.fatherName}</div>
              </div>
              <div>
                  <div style={{fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase'}}>Program / Technology</div>
                  <div style={{fontWeight: 600}}>{selectedStudent?.program} - {selectedStudent?.semester}</div>
              </div>
              <div>
                  <div style={{fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase'}}>Admission No</div>
                  <div style={{fontWeight: 600}}>{selectedStudent?.admissionNo}</div>
              </div>
              <div style={{gridColumn: 'span 2'}}>
                  <div style={{fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase'}}>Campus</div>
                  <div style={{fontWeight: 600}}>{selectedStudent?.campus}</div>
              </div>
          </div>

          <div style={{borderBottom: '1px solid #e2e8f0', marginBottom: '8px'}}></div>

          <div style={{marginBottom: '4px', fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700}}>Fee Particulars</div>
          <table style={{width: '100%', borderCollapse: 'collapse', marginBottom: '10px'}}>
              <thead>
                 <tr style={{borderBottom: '1px solid #000'}}>
                     <th style={{textAlign: 'left', padding: '3px 0', fontSize: '0.8rem'}}>Description</th>
                     <th style={{textAlign: 'right', padding: '3px 0', fontSize: '0.8rem'}}>Amount (Rs)</th>
                 </tr>
              </thead>
              <tbody>
                  {Object.entries(lastTxn?.details || {}).map(([k,v]:any) => {
                      if(v > 0 && k !== 'hospitalName' && k !== 'fineType' && k !== 'dueDate' && k !== 'months') {
                          let label = k.replace(/([A-Z])/g, ' $1').trim();
                          label = label.charAt(0).toUpperCase() + label.slice(1);
                          if(!label.toLowerCase().includes('fee') && !['fine', 'total', 'arrear'].includes(k)) label += " Fee";
                          if (k === 'arrear') label = "Balance / Arrear";
                          
                          if (k === 'hospital' && lastTxn?.details?.hospitalName) {
                              label += ` (${lastTxn.details.hospitalName})`;
                          }
                          if (k === 'fine' && lastTxn?.details?.fineType) {
                              label += ` (${lastTxn.details.fineType})`;
                          }

                          return <tr key={k} style={{borderBottom: '1px dashed #e2e8f0'}}>
                              <td style={{padding: '4px 0', color: '#000'}}>{label}</td>
                              <td style={{textAlign: 'right', padding: '4px 0', color: '#000', fontWeight: 600}}>+{v.toLocaleString()}</td>
                          </tr>
                      }
                      return null;
                  })}
              </tbody>
              <tfoot>
                  <tr style={{borderTop: '1.5px solid #000'}}>
                      <td style={{padding: '8px 0', fontWeight: 700, fontSize: '0.9rem'}}>Total Amount</td>
                      <td style={{textAlign: 'right', padding: '8px 0', fontWeight: 700, fontSize: '0.9rem'}}>Rs {lastTxn?.amount.toLocaleString()}</td>
                  </tr>
              </tfoot>
          </table>

          <div style={{marginTop: 'auto'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#334155', marginBottom: '5px'}}>
                  <div>Due Date: <strong>{dueDate}</strong></div>
                  <div style={{rowGap: '2px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end'}}>
                      <div style={{width: '50px', height: '50px', background: '#000', marginBottom: '3px'}}></div> 
                      <div style={{fontSize: '0.55rem'}}>Scan to Verify</div>
                  </div>
              </div>
              <div style={{display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.65rem', color: '#334155', marginBottom: '15px'}}>
                  <div>Print Date: <strong>{printDate}</strong></div>
                  <div>Print Time: <strong>{printTime}</strong></div>
                  <div>Printed By: <strong>{currentUser}</strong></div>
              </div>
              
              <div style={{borderTop: '1px dashed #000', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', marginTop: '10px'}}>
                  <div style={{borderTop: '1px solid #000', width: '45%', textAlign: 'center', paddingTop: '3px', fontSize: '0.65rem'}}>Student Signature</div>
                  <div style={{borderTop: '1px solid #000', width: '45%', textAlign: 'center', paddingTop: '3px', fontSize: '0.65rem'}}>Cashier Signature</div>
              </div>
          </div>
      </div>
     );
  };

  return (
    <div style={{display: 'flex', gap: '25px', alignItems: 'start'}}>
      {showReceipt && (
          <div style={styles.modalOverlay}>
              <style>{`
                  @page { size: A4 landscape; margin: 10mm; }
                  @media print {
                      body { visibility: hidden; }
                      #printable-area { 
                          visibility: visible; 
                          position: absolute; 
                          left: 0; 
                          top: 0; 
                          width: 100%; 
                          display: flex !important; 
                          flex-direction: row !important; 
                          justify-content: space-between !important;
                      }
                      .no-print { display: none !important; }
                  }
              `}</style>
              <div style={{backgroundColor: '#e2e8f0', padding: '20px', width: '100%', height: '100vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                  <div className="no-print" style={{width: '100%', maxWidth: '1100px', display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center'}}>
                       <div style={{color: '#0f172a', fontWeight: 700, fontSize: '1.2rem'}}>Print Preview (A4 Landscape)</div>
                       <div style={{display: 'flex', gap: '10px'}}>
                         <button style={styles.button("primary")} onClick={() => window.print()}>Print Receipt</button>
                         <button style={{...styles.button("secondary"), background: 'white'}} onClick={() => { setShowReceipt(false); resetForm(); }}>Close</button>
                      </div>
                  </div>
                  <div id="printable-area" style={{display: 'flex', flexDirection: 'row', gap: '15px', backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', width: '100%', maxWidth: '1100px', justifyContent: 'center'}}>
                      <ReceiptTemplate title="Student Copy" />
                      <div style={{borderLeft: '1px dashed #000'}}></div>
                      <ReceiptTemplate title="Bank Copy" />
                      <div style={{borderLeft: '1px dashed #000'}}></div>
                      <ReceiptTemplate title="Institute Copy" />
                  </div>
              </div>
          </div>
      )}

      {/* LEFT COLUMN: Student Selection */}
      <div style={{width: '350px'}}>
         <div style={{...styles.card, padding: '20px', borderTop: '4px solid #0f172a', minHeight: '600px'}}>
             <h3 style={{margin: '0 0 20px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px'}}>
                <span className="material-symbols-outlined" style={{color: '#0ea5e9'}}>person_search</span> Find Student
             </h3>
             
             <div style={{marginBottom: '20px'}}>
                <div style={{marginBottom: '10px'}}><input style={styles.input} placeholder="Admission No (e.g. KMU-24...)" value={searchAdm} onChange={e => setSearchAdm(e.target.value)} onKeyDown={handleKeyDown} /></div>
                <div style={{marginBottom: '10px'}}><input style={styles.input} placeholder="Student Name" value={searchName} onChange={e => setSearchName(e.target.value)} onKeyDown={handleKeyDown} /></div>
                <div style={{marginBottom: '10px'}}><input style={styles.input} placeholder="Father Name" value={searchFather} onChange={e => setSearchFather(e.target.value)} onKeyDown={handleKeyDown} /></div>
                
                {searchResults.length > 0 && (
                   <div ref={listRef} style={{maxHeight: '300px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc', marginTop: '10px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}}>
                      {searchResults.map((s, idx) => (
                         <div 
                            key={s.admissionNo} 
                            onClick={() => handleSelect(s)} 
                            onMouseEnter={() => setSelectedIndex(idx)}
                            style={{
                                padding: '12px', 
                                cursor: 'pointer', 
                                borderBottom: '1px solid #eee', 
                                transition: 'background 0.1s',
                                backgroundColor: idx === selectedIndex ? '#eff6ff' : 'transparent',
                                borderLeft: idx === selectedIndex ? '4px solid #3b82f6' : '4px solid transparent'
                            }}
                         >
                            <div style={{fontWeight: 600, color: '#334155'}}>{s.name}</div>
                            <div style={{fontSize: '0.8rem', color: '#64748b'}}>S/O: <span style={{fontWeight: 600}}>{s.fatherName}</span></div>
                            <div style={{fontSize: '0.75rem', color: '#94a3b8'}}>{s.admissionNo} • {s.program}</div>
                         </div>
                      ))}
                   </div>
                )}
             </div>

             {selectedStudent ? (
                <div style={{textAlign: 'center', padding: '20px', background: 'linear-gradient(to bottom, #f0f9ff, #e0f2fe)', borderRadius: '12px', border: '1px solid #bae6fd'}}>
                   <div style={{width: '80px', height: '80px', borderRadius: '50%', background: 'white', margin: '0 auto 10px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #fff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}>
                        {selectedStudent.photo ? <img src={selectedStudent.photo} style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}}/> : <span className="material-symbols-outlined" style={{fontSize: '40px', color: '#cbd5e1'}}>person</span>}
                   </div>
                   <h3 style={{margin: '0 0 5px 0', color: '#0369a1'}}>{selectedStudent.name}</h3>
                   <div style={{fontSize: '0.9rem', color: '#334155', fontWeight: 600}}>S/O: {selectedStudent.fatherName}</div>
                   <div style={{fontSize: '0.9rem', color: '#334155', fontWeight: 500, marginTop: '5px'}}>{selectedStudent.program} ({selectedStudent.semester})</div>
                   <div style={{fontSize: '0.8rem', color: '#64748b', marginBottom: '15px'}}>{selectedStudent.admissionNo}</div>
                   
                   <div style={{background: 'white', padding: '10px', borderRadius: '8px', marginBottom: '10px'}}>
                        <div style={{fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase'}}>Current Balance</div>
                        <div style={{fontSize: '1.5rem', fontWeight: 800, color: selectedStudent.balance > 0 ? '#ef4444' : '#166534'}}>
                            Rs {selectedStudent.balance.toLocaleString()}
                        </div>
                   </div>
                   <button style={{background: 'transparent', border: 'none', color: '#0284c7', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline'}} onClick={resetForm}>Clear Selection</button>
                </div>
             ) : (
                <div style={{padding: '30px 20px', textAlign: 'center', color: '#94a3b8', border: '2px dashed #e2e8f0', borderRadius: '12px'}}>
                    <span className="material-symbols-outlined" style={{fontSize: '48px', marginBottom: '10px', color: '#cbd5e1'}}>assignment_ind</span>
                    <p style={{margin: 0}}>Select a student to proceed</p>
                </div>
             )}
         </div>
      </div>

      {/* RIGHT COLUMN: Fee Entry */}
      <div style={{flex: 1}}>
         <div style={{...styles.card, padding: '30px', borderTop: '4px solid #166534', opacity: selectedStudent ? 1 : 0.6, pointerEvents: selectedStudent ? 'auto' : 'none', transition: 'opacity 0.2s'}}>
             <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '15px'}}>
                <h3 style={{margin: 0, color: '#166534', display: 'flex', alignItems: 'center', gap: '10px'}}>
                    <span className="material-symbols-outlined">payments</span> Fee Breakdown
                </h3>
                <div style={{fontSize: '0.9rem', color: '#64748b'}}>{new Date().toLocaleDateString()}</div>
             </div>

             <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px'}}>
                {[
                  { label: "Tuition Fee", key: "tuition" }, { label: "Admission Fee", key: "admission" },
                  { label: "Exam Fee", key: "exam" }, { label: "Registration Fee", key: "registration" },
                  { label: "Arrear Fee", key: "arrear" }, { label: "Diploma Fee", key: "diploma" },
                  { label: "Affiliation Fee", key: "affiliation" }, { label: "ID Card Fee", key: "idCard" },
                  { label: "Grace Mark Fee", key: "graceMark" }, { label: "UFM Fee", key: "ufm" },
                ].map(f => (
                   <div key={f.key}>
                      <label style={{fontSize: '0.8rem', color: '#475569', fontWeight: 600, display: 'block', marginBottom: '4px'}}>{f.label}</label>
                      <div style={{position: 'relative'}}>
                          <span style={{position: 'absolute', left: '10px', top: '10px', color: '#94a3b8', fontSize: '0.9rem'}}>Rs</span>
                          <input 
                            type="number" 
                            style={{...styles.input, paddingLeft: '35px', fontWeight: (fees as any)[f.key] > 0 ? 'bold' : 'normal', color: (fees as any)[f.key] > 0 ? '#0f172a' : '#64748b'}} 
                            value={(fees as any)[f.key]} 
                            onChange={e => setFees({...fees, [f.key]: Number(e.target.value)})}
                            onFocus={(e) => e.target.select()}
                          />
                      </div>
                   </div>
                ))}
             </div>

             {/* Special Fees Section */}
             <div style={{background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '30px'}}>
                 <div style={{display: 'flex', gap: '20px', marginBottom: '15px'}}>
                     <div style={{flex: 1}}>
                        <label style={{fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px', display: 'block'}}>Hospital Fee</label>
                        <div style={{display: 'flex', gap: '10px'}}>
                            <select style={{...styles.input, flex: 1}} value={hospitalName} onChange={e => setHospitalName(e.target.value)}>
                                <option value="">Select Hospital</option>
                                {HOSPITALS.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                            <div style={{position: 'relative', width: '120px'}}>
                                <span style={{position: 'absolute', left: '10px', top: '10px', color: '#94a3b8', fontSize: '0.9rem'}}>Rs</span>
                                <input type="number" style={{...styles.input, paddingLeft: '35px'}} value={fees.hospital} onChange={e => setFees({...fees, hospital: Number(e.target.value)})} onFocus={(e) => e.target.select()} />
                            </div>
                        </div>
                     </div>
                     <div style={{flex: 1}}>
                        <label style={{fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px', display: 'block'}}>Fine</label>
                        <div style={{display: 'flex', gap: '10px'}}>
                            <select style={{...styles.input, flex: 1}} value={fineType} onChange={e => setFineType(e.target.value)}>
                                {FINE_TYPES.map(f => <option key={f}>{f}</option>)}
                            </select>
                            <div style={{position: 'relative', width: '120px'}}>
                                <span style={{position: 'absolute', left: '10px', top: '10px', color: '#94a3b8', fontSize: '0.9rem'}}>Rs</span>
                                <input type="number" style={{...styles.input, paddingLeft: '35px'}} value={fees.fine} onChange={e => setFees({...fees, fine: Number(e.target.value)})} onFocus={(e) => e.target.select()} />
                            </div>
                        </div>
                     </div>
                 </div>
             </div>

             {/* Payment Footer */}
             <div style={{background: '#0f172a', padding: '20px', borderRadius: '12px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                 <div>
                     <div style={{fontSize: '0.9rem', color: '#94a3b8'}}>Total Payable Amount</div>
                     <div style={{fontSize: '2rem', fontWeight: 700}}>Rs {(Object.values(fees) as number[]).reduce((a, b) => a + b, 0).toLocaleString()}</div>
                 </div>
                 <div style={{textAlign: 'right'}}>
                     <label style={{display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '5px'}}>Deposit Account</label>
                     <select style={{padding: '8px', borderRadius: '6px', border: 'none', fontSize: '0.9rem', width: '200px', background: '#334155', color: 'white', outline: 'none'}} value={paymentMode} onChange={e => setPaymentMode(e.target.value)}>
                        {liquidAccounts.map(a => <option key={a.code} value={a.code}>{a.name}</option>)}
                     </select>
                 </div>
             </div>

             <div style={{display: 'flex', gap: '15px'}}>
                <button 
                    onClick={() => handlePost(true)} 
                    disabled={!selectedStudent}
                    style={{flex: 1, padding: '15px', borderRadius: '8px', border: '2px solid #e2e8f0', background: 'white', fontSize: '1rem', fontWeight: 600, color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s'}}
                >
                    <span className="material-symbols-outlined">pending_actions</span> Create Liability Only
                </button>
                <button 
                    onClick={() => handlePost(false)} 
                    disabled={!selectedStudent}
                    style={{flex: 2, padding: '15px', borderRadius: '8px', border: 'none', background: '#166534', fontSize: '1.1rem', fontWeight: 600, color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 6px rgba(22, 101, 52, 0.3)', transition: 'all 0.2s'}}
                >
                    <span className="material-symbols-outlined">print</span> Collect Payment & Print
                </button>
             </div>
         </div>
      </div>
    </div>
  );
};
