
import React, { useState, useEffect } from "react";
import { styles } from "./styles";
import { Transaction, Account } from "./types";
import { SearchableSelect } from "./SearchableSelect";

export const VoucherSystem = ({ onPostTransaction, accounts, transactions, onDelete, onUpdate, masterData, userRole }: { onPostTransaction: (t: Transaction) => void, accounts: Account[], transactions: Transaction[], onDelete: any, onUpdate: any, masterData: any, userRole: string }) => {
  const [mode, setMode] = useState<"select" | "entry" | "view">("select");
  const [type, setType] = useState<Transaction["type"]>("CPV");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState([{ drAcc: "", crAcc: "", amount: 0, narration: "" }]);
  const [chequeNo, setChequeNo] = useState("");
  const [postSuccess, setPostSuccess] = useState(false);
  const [lastVoucherNo, setLastVoucherNo] = useState("");
  const [searchVoucher, setSearchVoucher] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editVoucherId, setEditVoucherId] = useState("");
  const [showPrint, setShowPrint] = useState(false);
  
  // Budget tracking department
  const [selectedDept, setSelectedDept] = useState("");

  const CASH_ACC = "1-01-001";
  const BANK_ACC = "1-01-002"; 
  
  const cashAccName = accounts.find(a => a.code === CASH_ACC)?.name || "Cash in Hand";
  const bankAccName = accounts.find(a => a.code === BANK_ACC)?.name || "Bank Account";

  // Show only Name in dropdown as requested
  const level3 = accounts.filter(a => a.level === 3).map(a => ({ value: a.code, label: a.name }));

  // Helper to convert Number to Words
  const numberToWords = (num: number): string => {
      const a = ['','One ','Two ','Three ','Four ','Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
      const b = ['', '', 'Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];

      if ((num = num).toString().length > 9) return 'Overflow';
      const n: any = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
      if (!n) return ""; 
      let str = '';
      str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
      str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
      str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
      str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
      str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
      return str.trim();
  };

  // Initialize rows based on type for Double Entry Logic
  useEffect(() => {
     if(mode === 'entry' && !editMode) {
        if(type === 'CPV') {
           // Credit is Cash (Fixed), Debit is User Select
           setRows([{ drAcc: "", crAcc: CASH_ACC, amount: 0, narration: "" }]);
        } else if (type === 'CRV') {
           // Debit is Cash (Fixed), Credit is User Select
           setRows([{ drAcc: CASH_ACC, crAcc: "", amount: 0, narration: "" }]);
        } else if (type === 'BPV') {
           setRows([{ drAcc: "", crAcc: BANK_ACC, amount: 0, narration: "" }]);
        } else if (type === 'BRP') {
           setRows([{ drAcc: BANK_ACC, crAcc: "", amount: 0, narration: "" }]);
        } else {
           setRows([{ drAcc: "", crAcc: "", amount: 0, narration: "" }]);
        }
        setSelectedDept("");
     }
  }, [type, mode]);

  const handleSearchVoucher = () => {
     if(!searchVoucher) return;
     const foundTxns = transactions.filter(t => t.id === searchVoucher || t.voucherNo === searchVoucher);
     
     if(foundTxns.length > 0) {
        setEditVoucherId(foundTxns[0].voucherNo);
        setMode("view");
        setType(foundTxns[0].type);
        setDate(foundTxns[0].date);
        setSelectedDept(foundTxns[0].department || "");
        
        const mappedRows = foundTxns.map(t => ({
           drAcc: t.debitAccount,
           crAcc: t.creditAccount,
           amount: t.amount,
           narration: t.description
        }));
        setRows(mappedRows);
        if(foundTxns[0].chequeNo) setChequeNo(foundTxns[0].chequeNo);
        setLastVoucherNo(foundTxns[0].voucherNo);
     } else {
        alert("Voucher not found");
     }
  };

  const startEditFromView = () => {
      setEditMode(true);
      setMode("entry");
  }

  const addRow = () => {
      let newRow = { drAcc: "", crAcc: "", amount: 0, narration: "" };
      if(type === 'CPV') newRow.crAcc = CASH_ACC;
      if(type === 'CRV') newRow.drAcc = CASH_ACC;
      if(type === 'BPV') newRow.crAcc = BANK_ACC;
      if(type === 'BRP') newRow.drAcc = BANK_ACC;
      setRows([...rows, newRow]);
  };

  const removeRow = (i: number) => {
     if(rows.length > 1) setRows(rows.filter((_, idx) => idx !== i));
  };
  const updateRow = (i: number, field: string, val: any) => {
     const newRows = [...rows];
     (newRows[i] as any)[field] = val;
     setRows(newRows);
  };

  const handlePost = () => {
    if(rows.some(r => !r.amount || !r.narration || !r.drAcc || !r.crAcc)) return alert("Please complete all rows with valid Debit and Credit accounts.");
    
    // Require Department for Payments
    if((type === 'CPV' || type === 'BPV') && !selectedDept) {
        return alert("Please select a Department for expense tracking.");
    }

    const voucherNo = editMode ? editVoucherId : `VCH-${Date.now()}`; 
    
    if(editMode) {
       const oldTxns = transactions.filter(t => t.voucherNo === voucherNo);
       oldTxns.forEach(t => onDelete(t, false));
    }

    const newTransactions = rows.map((r, i) => {
       return {
          id: `${voucherNo}-${i}-${Date.now()}`,
          voucherNo: voucherNo,
          date,
          type,
          description: r.narration,
          debitAccount: r.drAcc,
          creditAccount: r.crAcc,
          amount: r.amount,
          chequeNo: (type === 'BPV' || type === 'BRP') ? chequeNo : undefined,
          status: 'Posted',
          department: selectedDept // Link transaction to dept
       };
    });

    newTransactions.forEach((t: any) => onPostTransaction(t));
    setPostSuccess(true);
    setLastVoucherNo(voucherNo);
  };

  const handleDeleteVoucher = () => {
     if(editVoucherId) {
        const txns = transactions.filter(t => t.voucherNo === editVoucherId);
        if(txns.length === 0) return alert("Voucher not found.");

        if(txns.some(t => t.status === 'DeletePending')) {
            alert("Deletion for this voucher is already pending approval.");
            return;
        }

        const isManager = userRole === "Admin" || userRole === "Finance Manager";
        const msg = isManager 
            ? `Are you sure you want to PERMANENTLY DELETE Voucher ${editVoucherId}?\n\nThis will remove ${txns.length} transaction entries.` 
            : `Are you sure you want to REQUEST DELETION for Voucher ${editVoucherId}?`;

        if(window.confirm(msg)) {
           // Pass !isManager as isRequest (if not manager, isRequest=true)
           txns.forEach(t => onDelete(t, !isManager));
           setMode("select");
           setEditMode(false);
           setEditVoucherId("");
        }
     }
  }

  // Helper to check fixed fields
  const getFixedAccountName = (type: string, side: 'Dr' | 'Cr') => {
      if(type === 'CPV' && side === 'Cr') return cashAccName;
      if(type === 'CRV' && side === 'Dr') return cashAccName;
      if(type === 'BPV' && side === 'Cr') return bankAccName;
      if(type === 'BRP' && side === 'Dr') return bankAccName;
      return "";
  }

  const VoucherCard = ({ id, label, sub, icon, color, bg }: any) => (
    <div 
      onClick={() => { setType(id); setMode("entry"); setEditMode(false); setPostSuccess(false); setDate(new Date().toISOString().slice(0, 10)); setRows([{ drAcc: "", crAcc: "", amount: 0, narration: "" }]); }}
      style={{
        backgroundColor: "white", padding: "30px", borderRadius: "12px", border: "1px solid #e2e8f0", 
        cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)", transition: "transform 0.2s", minHeight: "160px"
      }}
    >
      <div style={{padding: "16px", borderRadius: "12px", backgroundColor: bg, color: color, marginBottom: "16px"}}>
         <span className="material-symbols-outlined" style={{fontSize: "32px"}}>{icon}</span>
      </div>
      <div style={{fontWeight: 700, fontSize: "1rem", color: "#0f172a"}}>{label}</div>
      <div style={{fontSize: "0.8rem", color: "#64748b", marginTop: "4px"}}>{sub}</div>
      <div style={{marginTop: "12px", fontSize: "0.75rem", padding: "2px 8px", borderRadius: "4px", border: "1px solid #e2e8f0", color: "#94a3b8"}}>{id}</div>
    </div>
  );

  const PrintVoucherModal = () => {
      const total = rows.reduce((acc, r) => acc + r.amount, 0);
      return (
         <div style={styles.modalOverlay}>
            <div style={{...styles.modalContent, width: '210mm', height: '90vh', backgroundColor: 'white', padding: '40px'}}>
               <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: '20px'}} className="no-print">
                   <button style={styles.button("primary")} onClick={() => window.print()}>Print</button>
                   <button style={{...styles.button("secondary"), marginLeft: '10px'}} onClick={() => { setShowPrint(false); }}>Close</button>
               </div>
               
               <div id="printable-area" style={{border: '2px solid #000', padding: '20px', height: '100%', position: 'relative'}}>
                  <div style={{textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '10px', marginBottom: '20px'}}>
                      <h2 style={{margin: 0, textTransform: 'uppercase'}}>Ghazali Institute of Medical Sciences</h2>
                      <h4 style={{margin: '5px 0', fontWeight: 400}}>{type === 'CPV' ? 'Cash Payment Voucher' : type === 'CRV' ? 'Cash Receipt Voucher' : type === 'BPV' ? 'Bank Payment Voucher' : type === 'BRP' ? 'Bank Receipt Voucher' : 'Journal Voucher'}</h4>
                  </div>
                  
                  <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '20px'}}>
                      <div>
                          <div><strong>Voucher No:</strong> {lastVoucherNo}</div>
                          <div><strong>Type:</strong> {type}</div>
                          {selectedDept && <div><strong>Department:</strong> {selectedDept}</div>}
                      </div>
                      <div style={{textAlign: 'right'}}>
                          <div><strong>Date:</strong> {date}</div>
                          <div><strong>Time:</strong> {new Date().toLocaleTimeString()}</div>
                      </div>
                  </div>

                  <table style={{width: '100%', borderCollapse: 'collapse', marginTop: '20px'}}>
                      <thead>
                          <tr style={{borderBottom: '1px solid #000'}}>
                              <th style={{textAlign: 'left', padding: '8px'}}>Account Description</th>
                              <th style={{textAlign: 'left', padding: '8px'}}>Code</th>
                              <th style={{textAlign: 'right', padding: '8px'}}>Debit</th>
                              <th style={{textAlign: 'right', padding: '8px'}}>Credit</th>
                          </tr>
                      </thead>
                      <tbody>
                          {rows.map((r, i) => {
                              const drName = accounts.find(a => a.code === r.drAcc)?.name || r.drAcc;
                              const crName = accounts.find(a => a.code === r.crAcc)?.name || r.crAcc;
                              return (
                                  <React.Fragment key={i}>
                                      {/* Debit Entry */}
                                      <tr style={{borderBottom: '1px solid #eee'}}>
                                          <td style={{padding: '8px'}}>
                                              <div style={{fontWeight: 600}}>{drName} (Dr)</div>
                                              <div style={{fontSize: '0.9rem', color: '#555'}}>{r.narration}</div>
                                          </td>
                                          <td style={{padding: '8px'}}>{r.drAcc}</td>
                                          <td style={{textAlign: 'right', padding: '8px'}}>{r.amount.toLocaleString()}</td>
                                          <td style={{textAlign: 'right', padding: '8px'}}>-</td>
                                      </tr>
                                      {/* Credit Entry */}
                                      <tr style={{borderBottom: '1px solid #eee'}}>
                                          <td style={{padding: '8px', paddingLeft: '40px'}}>
                                              <div style={{fontWeight: 600}}>To: {crName} (Cr)</div>
                                          </td>
                                          <td style={{padding: '8px'}}>{r.crAcc}</td>
                                          <td style={{textAlign: 'right', padding: '8px'}}>-</td>
                                          <td style={{textAlign: 'right', padding: '8px'}}>{r.amount.toLocaleString()}</td>
                                      </tr>
                                  </React.Fragment>
                              )
                          })}
                          <tr style={{borderTop: '2px solid #000', fontWeight: 700, fontSize: '1.1rem'}}>
                              <td colSpan={2} style={{padding: '10px'}}>Total Amount</td>
                              <td style={{textAlign: 'right', padding: '10px'}}></td>
                              <td style={{textAlign: 'right', padding: '10px'}}>{rows.reduce((acc, r) => acc + r.amount, 0).toLocaleString()}</td>
                          </tr>
                      </tbody>
                  </table>
                  
                  <div style={{marginTop: '40px', fontStyle: 'italic'}}>
                      <strong>Amount in words:</strong> {numberToWords(rows.reduce((acc, r) => acc + r.amount, 0))} Rupees Only.
                  </div>

                  <div style={{position: 'absolute', bottom: '40px', left: '20px', right: '20px', display: 'flex', justifyContent: 'space-between'}}>
                      <div style={{textAlign: 'center', borderTop: '1px solid #000', width: '150px', paddingTop: '5px'}}>Prepare By</div>
                      <div style={{textAlign: 'center', borderTop: '1px solid #000', width: '150px', paddingTop: '5px'}}>Checked By</div>
                      <div style={{textAlign: 'center', borderTop: '1px solid #000', width: '150px', paddingTop: '5px'}}>Approved By</div>
                  </div>
               </div>
            </div>
         </div>
      );
   };

   if (mode === "select") {
    return (
      <div>
         <h2 style={{marginBottom: '5px'}}>Voucher Entry</h2>
         <p style={{color: '#64748b', marginBottom: '24px'}}>Double Entry System (Dr = Cr)</p>
         
         <div style={{marginBottom: '20px', display: 'flex', gap: '10px'}}>
            <input style={styles.input} placeholder="Search Voucher No..." value={searchVoucher} onChange={e => setSearchVoucher(e.target.value)} />
            <button style={styles.button("primary")} onClick={handleSearchVoucher}>Search</button>
         </div>

         <div style={{display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px"}}>
            <VoucherCard id="CPV" label="Cash Payment Voucher" sub="Dr: Expense/Asset | Cr: Cash" icon="payments" color="#ef4444" bg="#fee2e2" />
            <VoucherCard id="CRV" label="Cash Receipt Voucher" sub="Dr: Cash | Cr: Income/Party" icon="attach_money" color="#10b981" bg="#d1fae5" />
            <VoucherCard id="BPV" label="Bank Payment Voucher" sub="Dr: Expense | Cr: Bank" icon="account_balance" color="#f97316" bg="#ffedd5" />
            <VoucherCard id="BRP" label="Bank Receipt Voucher" sub="Dr: Bank | Cr: Income" icon="account_balance_wallet" color="#3b82f6" bg="#dbeafe" />
            <VoucherCard id="JV" label="Journal Voucher" sub="Adjustment (Non-Cash)" icon="description" color="#8b5cf6" bg="#ede9fe" />
         </div>
      </div>
    )
  }

  // --- VIEW MODE ---
  if (mode === "view") {
      const total = rows.reduce((s, r) => s + r.amount, 0);
      return (
          <div>
              {showPrint && <PrintVoucherModal />}
              <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px'}}>
                  <button onClick={() => setMode("select")} style={{background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#64748b'}}>
                      <span className="material-symbols-outlined">arrow_back</span> Back
                  </button>
                  <h2 style={{margin: 0}}>View Voucher: {editVoucherId}</h2>
              </div>

              <div style={styles.card}>
                  <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #e2e8f0'}}>
                      <div style={{display: 'flex', gap: '20px'}}>
                          <div><span style={{color: '#64748b', fontSize: '0.8rem'}}>Date:</span> <span style={{fontWeight: 600}}>{date}</span></div>
                          <div><span style={{color: '#64748b', fontSize: '0.8rem'}}>Type:</span> <span style={{fontWeight: 600}}>{type}</span></div>
                          {selectedDept && <div><span style={{color: '#64748b', fontSize: '0.8rem'}}>Dept:</span> <span style={{fontWeight: 600}}>{selectedDept}</span></div>}
                      </div>
                      <div style={{display: 'flex', gap: '10px'}}>
                          <button style={styles.button("primary")} onClick={startEditFromView}>Edit Voucher</button>
                          <button style={styles.button("danger")} onClick={handleDeleteVoucher}>Delete Voucher</button>
                          <button style={styles.button("secondary")} onClick={() => setShowPrint(true)}>Print</button>
                      </div>
                  </div>

                  <table style={styles.table}>
                      <thead>
                          <tr>
                              <th style={styles.th}>Dr Account</th>
                              <th style={styles.th}>Cr Account</th>
                              <th style={styles.th}>Narration</th>
                              <th style={{...styles.th, textAlign: 'right'}}>Amount</th>
                          </tr>
                      </thead>
                      <tbody>
                          {rows.map((r, i) => (
                              <tr key={i}>
                                  <td style={styles.td}>{r.drAcc}</td>
                                  <td style={styles.td}>{r.crAcc}</td>
                                  <td style={styles.td}>{r.narration}</td>
                                  <td style={{...styles.td, textAlign: 'right', fontWeight: 600}}>Rs {r.amount.toLocaleString()}</td>
                              </tr>
                          ))}
                          <tr style={{background: '#f8fafc', fontWeight: 700}}>
                              <td colSpan={3} style={{...styles.td, textAlign: 'right'}}>Total</td>
                              <td style={{...styles.td, textAlign: 'right'}}>Rs {total.toLocaleString()}</td>
                          </tr>
                      </tbody>
                  </table>
              </div>
          </div>
      );
  }

  const totalAmount = rows.reduce((s, r) => s + r.amount, 0);

  return (
    <div>
       {showPrint && <PrintVoucherModal />}

       <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px'}}>
         <button onClick={() => setMode("select")} style={{background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#64748b'}}>
            <span className="material-symbols-outlined">arrow_back</span> Back
         </button>
         <h2 style={{margin: 0}}>Voucher Entry <span style={{fontSize: '1rem', fontWeight: 400, color: '#94a3b8'}}>| {type} {editMode && "(EDIT MODE)"}</span></h2>
       </div>

       <div style={{...styles.card, padding: '0', overflow: 'hidden', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)'}}>
          {/* Header Bar */}
          <div style={{padding: '25px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
             <div style={{display: 'flex', gap: '30px', alignItems: 'center'}}>
               <div>
                  <label style={{fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px', display: 'block'}}>Voucher Date</label>
                  <input type="date" style={{...styles.input, background: 'white', color: '#0f172a', fontWeight: 500}} value={date} onChange={e => setDate(e.target.value)} />
               </div>
               <div>
                  <label style={{fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px', display: 'block'}}>Voucher No</label>
                  <div style={{fontSize: '1.1rem', fontWeight: 700, color: '#334155'}}>{editMode ? editVoucherId : "Auto-Generated"}</div>
               </div>
               {(type === 'CPV' || type === 'BPV') && (
                   <div>
                       <label style={{fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px', display: 'block'}}>Department</label>
                       <select style={{...styles.input, width: '200px', background: 'white'}} value={selectedDept} onChange={e => setSelectedDept(e.target.value)}>
                           <option value="">Select Department</option>
                           {masterData.departments.map((d:string) => <option key={d} value={d}>{d}</option>)}
                       </select>
                   </div>
               )}
               {(type === 'BPV' || type === 'BRP') && (
                  <div>
                     <label style={{fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px', display: 'block'}}>Cheque Number</label>
                     <input type="text" style={{...styles.input, width: '150px', background: 'white'}} value={chequeNo} onChange={e => setChequeNo(e.target.value)} placeholder="Enter cheque no..." />
                  </div>
               )}
             </div>
             <div style={{textAlign: 'right'}}>
                <div style={{fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase'}}>Total Amount</div>
                <div style={{fontSize: '1.8rem', fontWeight: 800, color: '#059669'}}>Rs {totalAmount.toLocaleString()}</div>
             </div>
          </div>

          <div style={{padding: '30px', backgroundColor: 'white'}}>
            {/* Table Header */}
            <div style={{display: 'flex', gap: '15px', padding: '0 15px 15px 15px', borderBottom: '2px solid #f1f5f9', marginBottom: '15px'}}>
                <div style={{width: '30px', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase'}}>#</div>
                <div style={{flex: 1, fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase'}}>Debit Account</div>
                <div style={{flex: 1, fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase'}}>Credit Account</div>
                <div style={{width: '180px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase'}}>Amount (Rs)</div>
                <div style={{flex: 1.5, fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase'}}>Narration / Description</div>
                <div style={{width: '40px'}}></div>
            </div>

            {rows.map((r, i) => (
              <div key={i} style={{display: 'flex', gap: '15px', marginBottom: '10px', alignItems: 'center', background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #f1f5f9', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.02)'}}>
                 <div style={{width: '30px', color: '#cbd5e1', fontWeight: 800, fontSize: '1rem'}}>{i + 1}</div>
                 
                 <div style={{flex: 1}}>
                    {(type === 'CRV' || type === 'BRP') ? 
                        <div style={{padding: '10px', background: '#e2e8f0', borderRadius: '6px', fontWeight: 600, color: '#475569', fontSize: '0.9rem'}}>{getFixedAccountName(type, 'Dr')}</div> :
                        <SearchableSelect options={level3} value={r.drAcc} onChange={(v:any) => updateRow(i, 'drAcc', v)} placeholder="Select Dr Account" />
                    }
                 </div>
                 
                 <div style={{flex: 1}}>
                     {(type === 'CPV' || type === 'BPV') ?
                         <div style={{padding: '10px', background: '#e2e8f0', borderRadius: '6px', fontWeight: 600, color: '#475569', fontSize: '0.9rem'}}>{getFixedAccountName(type, 'Cr')}</div> :
                         <SearchableSelect options={level3} value={r.crAcc} onChange={(v:any) => updateRow(i, 'crAcc', v)} placeholder="Select Cr Account" />
                     }
                 </div>
                 
                 <div style={{width: '180px'}}>
                    <div style={{position: 'relative'}}>
                        <span style={{position: 'absolute', left: '12px', top: '10px', fontSize: '0.9rem', color: '#94a3b8'}}>Rs</span>
                        <input 
                            type="number" 
                            style={{...styles.input, paddingLeft: '35px', textAlign: 'right', fontWeight: 700, fontSize: '1rem', color: '#0f172a', borderColor: r.amount > 0 ? '#10b981' : '#e2e8f0', background: 'white'}} 
                            value={r.amount} 
                            onChange={e => updateRow(i, 'amount', Number(e.target.value))} 
                            placeholder="0.00" 
                        />
                    </div>
                 </div>
                 
                 <div style={{flex: 1.5}}>
                    <input style={{...styles.input, background: 'white'}} value={r.narration} onChange={e => updateRow(i, 'narration', e.target.value)} placeholder="Description..." />
                 </div>

                 <div style={{width: '40px', display: 'flex', justifyContent: 'center'}}>
                    {rows.length > 1 && <button onClick={() => removeRow(i)} style={{border: 'none', background: '#fee2e2', color: '#ef4444', borderRadius: '8px', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'background 0.2s'}}><span className="material-symbols-outlined" style={{fontSize: '20px'}}>delete</span></button>}
                 </div>
              </div>
            ))}

            <div style={{marginTop: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
               <button style={{background: 'white', border: '2px dashed #cbd5e1', padding: '10px 20px', borderRadius: '8px', color: '#64748b', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s'}} onClick={addRow}>
                   <span className="material-symbols-outlined" style={{fontSize: '20px'}}>add_circle</span> Add Another Line
               </button>
               
               <div style={{display: 'flex', gap: '15px'}}>
                  {postSuccess ? (
                      <button style={{...styles.button("primary"), backgroundColor: '#0f172a', color: 'white', borderRadius: '8px', padding: '12px 30px'}} onClick={() => setShowPrint(true)}>
                          <span className="material-symbols-outlined">print</span> Print Voucher
                      </button>
                  ) : (
                      <button style={{...styles.button("primary"), padding: '12px 40px', fontSize: '1rem', borderRadius: '8px', boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)'}} onClick={handlePost}>
                          {editMode ? "Update Transaction" : "Post Transaction"}
                      </button>
                  )}
               </div>
            </div>
         </div>
      </div>
    </div>
  )
};
