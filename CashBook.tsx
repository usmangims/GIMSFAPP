
import React, { useState } from "react";
import { styles } from "./styles";
import { Transaction, Account, Student, FEE_HEADS_FILTER, Campus, FEE_HEADS_DROPDOWN } from "./types";
import { SearchableSelect } from "./SearchableSelect";

const CashBookDrilldown = ({ type, onClose, transactions, students, dateRange, accounts, masterData, userRole, onDelete, onUpdate }: any) => {
  const [filterCampus, setFilterCampus] = useState("All");
  const [filterFeeHead, setFilterFeeHead] = useState("All");
  
  const [localFrom, setLocalFrom] = useState(dateRange.from);
  const [localTo, setLocalTo] = useState(dateRange.to);

  const [filterBoard, setFilterBoard] = useState("All");
  const [filterSemester, setFilterSemester] = useState("All");
  const [filterProgram, setFilterProgram] = useState("All");

  // Edit State
  const [editingTxn, setEditingTxn] = useState<Transaction | null>(null);
  const [editForm, setEditForm] = useState({ amount: 0, account: "", feeHead: "" });

  const liquidAccounts = accounts.filter((a: Account) => a.code === "1-01-001" || (a.code.startsWith("1-01") && a.code !== "1-01-004"));

  const filtered = transactions.filter((t: Transaction) => {
    if (t.date < localFrom || t.date > localTo) return false;
    
    const isLiquid = (code: string) => code === "1-01-001" || (code.startsWith("1-01") && code !== "1-01-004");

    // Receipts: Debit Cash/Bank (Money In)
    if (type === 'receipts') {
        if (!isLiquid(t.debitAccount)) return false;
    }
    // Payments: Credit Cash/Bank (Money Out)
    if (type === 'payments') {
        if (!isLiquid(t.creditAccount)) return false;
    }

    const student = t.studentId ? students.find((st: Student) => st.admissionNo === t.studentId) : null;

    if (filterCampus !== "All") {
       if (student) { if (student.campus !== filterCampus) return false; }
       else if(filterCampus !== "All") return false; 
    }

    if (type === 'receipts') {
       if (filterBoard !== "All") {
          if(!student || student.board !== filterBoard) return false;
       }
       if (filterSemester !== "All") {
          if(!student || student.semester !== filterSemester) return false;
       }
       if (filterProgram !== "All") {
          if(!student || student.program !== filterProgram) return false;
       }
    }

    if (type === 'receipts' && filterFeeHead !== "All") {
       if(!t.details) return false;
       const key = filterFeeHead.replace(" Fee", "").toLowerCase();
       let val = 0;
       if (key === 'tuition') val = t.details.tuition;
       else if (key === 'admission') val = t.details.admission;
       else if (key === 'exam') val = t.details.exam;
       else if (key === 'registration') val = t.details.registration;
       else if (key === 'hospital') val = t.details.hospital;
       else if (key === 'affiliation') val = t.details.affiliation;
       else if (key === 'fine') val = t.details.fine;
       else if (key === 'grace mark') val = t.details.graceMark;
       else if (key === 'ufm') val = t.details.ufm;
       else if (key === 'id card') val = t.details.idCard;
       else if (key === 'arrear') val = t.details.arrear;
       else if (key === 'diploma') val = t.details.diploma;
       
       if (!val || val <= 0) return false;
    }

    return true;
  });

  const total = filtered.reduce((acc: number, t: Transaction) => acc + t.amount, 0);

  const getHeadName = (t: Transaction) => {
      if(t.details && (t.type === 'FEE' || t.type === 'FEE_RCV' || t.type === 'FEE_DUE')) {
          const breakdown = Object.entries(t.details)
             .filter(([k,v]:any) => v > 0 && k !== 'hospitalName' && k !== 'fineType' && k !== 'dueDate' && k !== 'months')
             .map(([k,v]) => {
                 // Remove "Fee" word if exists, capitalize
                 let label = k.replace(/([A-Z])/g, ' $1').trim();
                 label = label.charAt(0).toUpperCase() + label.slice(1);
                 return label.replace(/ Fee/g, "");
             })
             .join(", ");
          if(breakdown) return breakdown;
      }
      const accountCode = type === 'receipts' ? t.creditAccount : t.debitAccount;
      const accountName = accounts.find((a: Account) => a.code === accountCode)?.name;
      return (accountName || accountCode).replace(/ Fee/g, "");
  };

  const getStudentDetails = (studentId?: string) => {
     if(!studentId) return null;
     return students.find((s: Student) => s.admissionNo === studentId);
  }

  const canEdit = (txn: Transaction) => {
     if (userRole === "Admin" || userRole === "Finance Manager") return true;
     const isToday = txn.date === new Date().toISOString().slice(0, 10);
     if ((userRole === "Cashier" || userRole === "Accountant") && isToday) return true;
     return false;
  };

  const handleEditClick = (e: React.MouseEvent, txn: Transaction) => {
     e.stopPropagation();
     if (!canEdit(txn)) {
        alert("Permission denied. Only Admins/Managers can edit past records.");
        return;
     }
     
     // Determine the account to be edited (The Cash/Bank side)
     const currentAccount = type === 'receipts' ? txn.debitAccount : txn.creditAccount;
     
     // Determine Fee Head if applicable
     let currentHead = "";
     if(txn.details) {
         const foundKey = Object.keys(txn.details).find(k => txn.details[k] > 0 && k !== 'hospitalName' && k !== 'fineType' && k !== 'dueDate' && k !== 'months');
         if(foundKey) {
             const label = foundKey.charAt(0).toUpperCase() + foundKey.slice(1);
             currentHead = label.includes("Fee") ? label : label + " Fee";
         }
     }

     setEditingTxn(txn);
     setEditForm({
         amount: txn.amount,
         account: currentAccount,
         feeHead: currentHead
     });
  };

  const handleSaveEdit = () => {
      if(!editingTxn) return;
      
      let updatedDetails = editingTxn.details;
      let updatedDesc = editingTxn.description;

      // Update Fee Head logic if changed
      if (editForm.feeHead && editingTxn.details) {
          const map: any = {
            "Tuition Fee": "tuition", "Admission Fee": "admission", "Registration Fee": "registration",
            "Exam Fee": "exam", "Fine": "fine", "Arrear Fee": "arrear", "Hospital Fee": "hospital",
            "Diploma Fee": "diploma", "Affiliation Fee": "affiliation"
          };
          const key = map[editForm.feeHead] || editForm.feeHead.toLowerCase().replace(" fee", "");
          
          // Reset old details
          const newDetails: any = { ...editingTxn.details };
          Object.keys(newDetails).forEach(k => {
              if (typeof newDetails[k] === 'number') newDetails[k] = 0;
          });
          
          // Set new
          newDetails[key] = Number(editForm.amount);
          updatedDetails = newDetails;
          
          // Update Description
          const s = getStudentDetails(editingTxn.studentId);
          updatedDesc = `${editForm.feeHead} Collection - ${s ? s.name : ''}`;
      }

      const updatedTxn = {
          ...editingTxn,
          amount: Number(editForm.amount),
          // Update the Cash/Bank side
          debitAccount: type === 'receipts' ? editForm.account : editingTxn.debitAccount,
          creditAccount: type === 'payments' ? editForm.account : editingTxn.creditAccount,
          details: updatedDetails,
          description: updatedDesc
      };

      onUpdate(editingTxn, updatedTxn);
      setEditingTxn(null);
  };

  const handleDelete = (e: React.MouseEvent, txn: Transaction) => {
     e.stopPropagation();
     if (!canEdit(txn)) {
        alert("Permission denied");
        return;
     }
     
     const isManager = userRole === "Admin" || userRole === "Finance Manager";
     const msg = isManager ? "Permanently delete this transaction?" : "Request deletion for this transaction?";
     
     if(window.confirm(msg)) {
        onDelete(txn, !isManager);
     }
  };

  return (
    <div style={styles.modalOverlay}>
       <div style={{...styles.modalContent, width: '1100px', backgroundColor: '#f8fafc'}}>
          <div className="no-print" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #e2e8f0'}}>
             <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                <span className="material-symbols-outlined" style={{color: type === 'receipts' ? '#166534' : '#991b1b', fontSize: '28px'}}>
                    {type === 'receipts' ? 'trending_up' : 'trending_down'}
                </span>
                <div>
                    <h3 style={{margin: 0, color: '#0f172a'}}>{type === 'receipts' ? "Total Receipts" : "Total Payments"}</h3>
                    <span style={{fontSize: '0.85rem', color: '#64748b'}}>Cash & Bank Transactions</span>
                </div>
             </div>
             <div style={{display: 'flex', gap: '10px'}}>
               <button style={styles.button("secondary")} onClick={() => window.print()}>Print</button>
               <button onClick={onClose} style={{border: 'none', background: '#cbd5e1', cursor: 'pointer', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                 <span className="material-symbols-outlined">close</span>
               </button>
             </div>
          </div>

          <div id="printable-area">
              <div className="no-print" style={{display: 'flex', gap: '20px', marginBottom: '20px'}}>
                 <div style={{flex: 1, ...styles.card, padding: '15px', marginBottom: 0}}>
                    <label style={{...styles.label, marginBottom: '8px'}}>Date Range</label>
                    <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                       <input type="date" style={styles.input} value={localFrom} onChange={e => setLocalFrom(e.target.value)} />
                       <span style={{color: '#64748b'}}>to</span>
                       <input type="date" style={styles.input} value={localTo} onChange={e => setLocalTo(e.target.value)} />
                    </div>
                 </div>
                 <div style={{flex: 2, ...styles.card, padding: '15px', marginBottom: 0}}>
                    <label style={{...styles.label, marginBottom: '8px'}}>Filters</label>
                    <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
                      <select style={{...styles.input, width: 'auto', minWidth: '150px'}} value={filterCampus} onChange={e => setFilterCampus(e.target.value)}>
                        <option value="All">All Campuses</option>
                        {masterData.campuses.map((c: Campus) => <option key={c.name}>{c.name}</option>)}
                      </select>
                      
                      {type === 'receipts' && (
                         <>
                            <select style={{...styles.input, width: 'auto'}} value={filterBoard} onChange={e => setFilterBoard(e.target.value)}>
                               <option value="All">All Boards</option>
                               {masterData.boards.map((b: string) => <option key={b}>{b}</option>)}
                            </select>
                            <select style={{...styles.input, width: 'auto'}} value={filterSemester} onChange={e => setFilterSemester(e.target.value)}>
                               <option value="All">All Semesters</option>
                               {masterData.semesters.map((s: string) => <option key={s}>{s}</option>)}
                            </select>
                            <select style={{...styles.input, width: 'auto'}} value={filterFeeHead} onChange={e => setFilterFeeHead(e.target.value)}>
                               <option value="All">All Fee Heads</option>
                               {FEE_HEADS_FILTER.map(h => <option key={h}>{h}</option>)}
                            </select>
                         </>
                      )}
                    </div>
                 </div>
              </div>

              <div style={{backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden'}}>
                 <table style={styles.table}>
                    <thead>
                       <tr>
                          <th style={styles.th}>S.No</th>
                          <th style={styles.th}>Date</th>
                          {type === 'receipts' && (
                              <>
                                <th style={styles.th}>Receipt NO</th>
                                <th style={styles.th}>Adm No</th>
                                <th style={styles.th}>Student Name</th>
                                <th style={styles.th}>Father Name</th>
                                <th style={styles.th}>Program</th>
                              </>
                          )}
                          {type !== 'receipts' && <th style={styles.th}>Description</th>}
                          <th style={styles.th}>Head / Account</th>
                          <th style={{...styles.th, textAlign: 'right'}}>Amount</th>
                          <th style={styles.th}>Action</th>
                       </tr>
                    </thead>
                    <tbody>
                       {filtered.map((t: Transaction, idx: number) => {
                          const student = getStudentDetails(t.studentId);
                          return (
                             <tr key={t.id}>
                                <td style={styles.td}>{idx + 1}</td>
                                <td style={styles.td}>{t.date}</td>
                                {type === 'receipts' && (
                                    <>
                                        <td style={styles.td}>{t.voucherNo}</td>
                                        <td style={styles.td}>{student ? student.admissionNo : '-'}</td>
                                        <td style={styles.td}>
                                           {student ? <div style={{fontWeight: 600}}>{student.name}</div> : '-'}
                                        </td>
                                        <td style={styles.td}>{student ? student.fatherName : '-'}</td>
                                        <td style={styles.td}>{student ? `${student.program} (${student.semester})` : '-'}</td>
                                    </>
                                )}
                                {type !== 'receipts' && <td style={styles.td}>{t.description}</td>}
                                <td style={styles.td}>
                                   <span style={{background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem'}}>
                                      {getHeadName(t)}
                                   </span>
                                </td>
                                <td style={{...styles.td, textAlign: 'right', fontWeight: 600}}>Rs {t.amount.toLocaleString()}</td>
                                <td style={styles.td}>
                                   {canEdit(t) && (
                                      <div className="no-print" style={{display: 'flex', gap: '8px'}}>
                                         <button onClick={(e) => handleEditClick(e, t)} title="Edit" style={{cursor: 'pointer', border: 'none', background: '#dbeafe', color: '#1e40af', padding: '6px', borderRadius: '4px', display: 'flex', alignItems: 'center'}}><span className="material-symbols-outlined" style={{fontSize: '18px'}}>edit</span></button>
                                         <button onClick={(e) => handleDelete(e, t)} title="Delete" style={{cursor: 'pointer', border: 'none', background: '#fee2e2', color: '#b91c1c', padding: '6px', borderRadius: '4px', display: 'flex', alignItems: 'center'}}><span className="material-symbols-outlined" style={{fontSize: '18px'}}>delete</span></button>
                                      </div>
                                   )}
                                </td>
                             </tr>
                          );
                       })}
                       <tr style={{background: '#f8fafc', fontWeight: 700}}>
                          <td colSpan={type === 'receipts' ? 8 : 4} style={{...styles.td, textAlign: 'right', fontSize: '1rem'}}>TOTAL</td>
                          <td style={{...styles.td, textAlign: 'right', fontSize: '1rem', color: type === 'receipts' ? '#166534' : '#991b1b'}}>Rs {total.toLocaleString()}</td>
                          <td></td>
                       </tr>
                    </tbody>
                 </table>
              </div>
          </div>

          {/* Edit Modal */}
          {editingTxn && (
              <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100}}>
                  <div style={{backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '450px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)'}}>
                      <h3 style={{marginTop: 0, color: '#0f172a', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '20px'}}>Edit Transaction</h3>
                      
                      {/* Student Info Section */}
                      {editingTxn.studentId && (
                          <div style={{backgroundColor: '#f0f9ff', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #bae6fd'}}>
                              {(() => {
                                  const s = getStudentDetails(editingTxn.studentId);
                                  return s ? (
                                      <div>
                                          <div style={{fontSize: '0.85rem', color: '#64748b'}}>Student Details</div>
                                          <div style={{fontWeight: 700, fontSize: '1rem', color: '#0369a1'}}>{s.name}</div>
                                          <div style={{fontSize: '0.9rem', color: '#334155'}}>Father: {s.fatherName}</div>
                                      </div>
                                  ) : (
                                      <div>Student ID: {editingTxn.studentId}</div>
                                  );
                              })()}
                          </div>
                      )}

                      <div style={{marginBottom: '15px'}}>
                          <label style={styles.label}>Amount</label>
                          <input 
                              type="number" 
                              style={styles.input} 
                              value={editForm.amount} 
                              onChange={e => setEditForm({...editForm, amount: Number(e.target.value)})} 
                          />
                      </div>

                      <div style={{marginBottom: '15px'}}>
                          <label style={styles.label}>{type === 'receipts' ? "Deposit To (Debit Account)" : "Paid From (Credit Account)"}</label>
                          <select 
                              style={styles.input} 
                              value={editForm.account} 
                              onChange={e => setEditForm({...editForm, account: e.target.value})}
                          >
                              {liquidAccounts.map((a: Account) => (
                                  <option key={a.code} value={a.code}>{a.name} ({a.code})</option>
                              ))}
                          </select>
                      </div>

                      {type === 'receipts' && editingTxn.details && (
                          <div style={{marginBottom: '25px'}}>
                              <label style={styles.label}>Fee Head (Description)</label>
                              <select 
                                  style={styles.input} 
                                  value={editForm.feeHead} 
                                  onChange={e => setEditForm({...editForm, feeHead: e.target.value})}
                              >
                                  {FEE_HEADS_FILTER.map(h => <option key={h}>{h}</option>)}
                              </select>
                          </div>
                      )}

                      <div style={{display: 'flex', justifyContent: 'flex-end', gap: '10px'}}>
                          <button style={styles.button("secondary")} onClick={() => setEditingTxn(null)}>Cancel</button>
                          <button style={styles.button("primary")} onClick={handleSaveEdit}>Save Changes</button>
                      </div>
                  </div>
              </div>
          )}
       </div>
    </div>
  );
};

export const CashBook = ({ transactions, students, accounts, masterData, userRole, onDelete, onUpdate }: any) => {
  const [fromDate, setFromDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10));
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0, 10));
  const [drillDownType, setDrillDownType] = useState<'receipts' | 'payments' | null>(null);
  const [ledgerSearch, setLedgerSearch] = useState("");

  const postedTxns = transactions.filter((t:any) => t.status === "Posted");

  const isLiquid = (code: string) => code === "1-01-001" || (code.startsWith("1-01") && code !== "1-01-004");
  
  const liquidTxns = postedTxns.filter((t:any) => isLiquid(t.debitAccount) || isLiquid(t.creditAccount)).sort((a:any,b:any) => a.date.localeCompare(b.date));

  const groupedLedger: any[] = [];
  
  let openingBalance = 0;
  // Calculate specific bank balance (sum of accounts 1-01-XXX where XXX != 001 and != 004)
  let totalBankBalance = 0;
  
  // Calculate total bank balance from ALL transactions to date (for the box)
  postedTxns.forEach((t:any) => {
     let change = 0;
     if (t.debitAccount.startsWith("1-01") && t.debitAccount !== "1-01-001" && t.debitAccount !== "1-01-004") change += t.amount;
     if (t.creditAccount.startsWith("1-01") && t.creditAccount !== "1-01-001" && t.creditAccount !== "1-01-004") change -= t.amount;
     totalBankBalance += change;
  });

  liquidTxns.forEach((t:any) => {
     if(t.date < fromDate) {
        if (isLiquid(t.debitAccount)) openingBalance += t.amount;
        if (isLiquid(t.creditAccount)) openingBalance -= t.amount;
     }
  });

  const displayedTxns = liquidTxns.filter((t:any) => t.date >= fromDate && t.date <= toDate);
  let runningBalance = openingBalance;
  let totalReceipts = 0;
  let totalPayments = 0;

  const voucherGroups: Record<string, Transaction[]> = {};
  displayedTxns.forEach((t:any) => {
     const vKey = t.voucherNo || t.id;
     if(!voucherGroups[vKey]) voucherGroups[vKey] = [];
     voucherGroups[vKey].push(t);
  });

  const sortedVoucherKeys = Object.keys(voucherGroups).sort((a, b) => {
     return voucherGroups[a][0].date.localeCompare(voucherGroups[b][0].date);
  });

  sortedVoucherKeys.forEach(key => {
     const group = voucherGroups[key];
     let groupDr = 0;
     let groupCr = 0;
     let studentNames: string[] = [];

     group.forEach(t => {
        if(isLiquid(t.debitAccount)) groupDr += t.amount;
        if(isLiquid(t.creditAccount)) groupCr += t.amount;
        if(t.studentId) {
            const s = students.find((st:Student) => st.admissionNo === t.studentId);
            if(s) studentNames.push(s.name);
        }
     });
     
     runningBalance += groupDr - groupCr;
     totalReceipts += groupDr;
     totalPayments += groupCr;
     
     groupedLedger.push({
        id: key,
        date: group[0].date,
        description: group.length > 1 ? `Multiple Entries (${group.length})` : group[0].description,
        dr: groupDr,
        cr: groupCr,
        balance: runningBalance,
        details: group,
        studentNames: [...new Set(studentNames)].join(", ")
     });
  });

  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const todayReceiptsCount = liquidTxns.filter((t:any) => t.date === today && isLiquid(t.debitAccount)).length;
  const todayPaymentsCount = liquidTxns.filter((t:any) => t.date === today && isLiquid(t.creditAccount)).length;

  return (
    <div>
      <h2 style={{marginBottom: '5px'}}>Cash & Bank Book</h2>
      <p style={{color: '#64748b', marginBottom: '24px'}}>View all Cash and Bank receipts and payments with running balance</p>

      <div style={{...styles.grid3, gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: "15px"}}>
        <div style={{...styles.card, padding: '16px', display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: 0}}>
           <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
             <div style={{padding: '8px', background: '#f1f5f9', borderRadius: '6px'}}><span className="material-symbols-outlined" style={{fontSize: '20px'}}>account_balance_wallet</span></div>
             <div style={{fontSize: '0.75rem', color: '#64748b'}}>Opening Balance</div>
           </div>
           <div style={{fontSize: '1.25rem', fontWeight: 700, marginTop: '5px'}}>Rs {openingBalance.toLocaleString()}</div>
        </div>
        
        <div 
           onClick={() => setDrillDownType('receipts')}
           style={{...styles.card, padding: '16px', display: 'flex', flexDirection: 'column', gap: '5px', background: '#f0fdf4', borderColor: '#bbf7d0', cursor: 'pointer', marginBottom: 0}}
        >
           <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
             <div style={{padding: '8px', background: '#dcfce7', borderRadius: '6px', color: '#166534'}}><span className="material-symbols-outlined" style={{fontSize: '20px'}}>trending_up</span></div>
             <div style={{fontSize: '0.75rem', color: '#000'}}>Total Receipts</div>
           </div>
           <div style={{fontSize: '1.25rem', fontWeight: 700, color: '#000', marginTop: '5px'}}>Rs {totalReceipts.toLocaleString()}</div>
        </div>

        <div 
           onClick={() => setDrillDownType('payments')}
           style={{...styles.card, padding: '16px', display: 'flex', flexDirection: 'column', gap: '5px', background: '#fef2f2', borderColor: '#fecaca', cursor: 'pointer', marginBottom: 0}}
        >
           <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
             <div style={{padding: '8px', background: '#fee2e2', borderRadius: '6px', color: '#991b1b'}}><span className="material-symbols-outlined" style={{fontSize: '20px'}}>trending_down</span></div>
             <div style={{fontSize: '0.75rem', color: '#991b1b'}}>Total Payments</div>
           </div>
           <div style={{fontSize: '1.25rem', fontWeight: 700, color: '#b91c1c', marginTop: '5px'}}>Rs {totalPayments.toLocaleString()}</div>
        </div>

        <div style={{...styles.card, padding: '16px', display: 'flex', flexDirection: 'column', gap: '5px', background: '#eff6ff', borderColor: '#bfdbfe', marginBottom: 0}}>
           <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
             <div style={{padding: '8px', background: '#dbeafe', borderRadius: '6px', color: '#1e40af'}}><span className="material-symbols-outlined" style={{fontSize: '20px'}}>wallet</span></div>
             <div style={{fontSize: '0.75rem', color: '#1e40af'}}>Closing Balance</div>
           </div>
           <div style={{fontSize: '1.25rem', fontWeight: 700, color: '#1d4ed8', marginTop: '5px'}}>Rs {runningBalance.toLocaleString()}</div>
        </div>

        <div style={{...styles.card, padding: '16px', display: 'flex', flexDirection: 'column', gap: '5px', background: '#fff7ed', borderColor: '#ffedd5', marginBottom: 0}}>
           <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
             <div style={{padding: '8px', background: '#ffedd5', borderRadius: '6px', color: '#c2410c'}}><span className="material-symbols-outlined" style={{fontSize: '20px'}}>account_balance</span></div>
             <div style={{fontSize: '0.75rem', color: '#c2410c'}}>Total Bank Bal</div>
           </div>
           <div style={{fontSize: '1.25rem', fontWeight: 700, color: '#c2410c', marginTop: '5px'}}>Rs {totalBankBalance.toLocaleString()}</div>
        </div>
      </div>

      {drillDownType && (
         <CashBookDrilldown 
            type={drillDownType} 
            onClose={() => setDrillDownType(null)} 
            transactions={postedTxns} 
            students={students}
            accounts={accounts}
            masterData={masterData}
            dateRange={{from: fromDate, to: toDate}} 
            userRole={userRole}
            onDelete={onDelete}
            onUpdate={onUpdate}
         />
      )}

      <div className="no-print" style={{...styles.card, padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', marginTop: '20px'}}>
         <div style={{display: 'flex', gap: '20px'}}>
            <div>
              <label style={styles.label}>From Date</label>
              <input type="date" style={styles.input} value={fromDate} onChange={e => setFromDate(e.target.value)} />
            </div>
            <div>
              <label style={styles.label}>To Date</label>
              <input type="date" style={styles.input} value={toDate} onChange={e => setToDate(e.target.value)} />
            </div>
         </div>
         <button style={styles.button("secondary")} onClick={() => window.print()}>
            <span className="material-symbols-outlined">print</span> Print
         </button>
      </div>

      <div style={styles.card} id="printable-area">
         <div className="no-print" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
            <div style={{display: 'flex', gap: '8px', alignItems: 'center', color: '#0f172a', fontWeight: 600}}>
               <span className="material-symbols-outlined" style={{color: '#059669'}}>table_view</span> Cash & Bank Ledger
            </div>
            <div style={{width: '300px'}}>
               <input 
                  style={styles.input} 
                  placeholder="Search Voucher, Narration, Amount..." 
                  value={ledgerSearch}
                  onChange={e => setLedgerSearch(e.target.value)}
               />
            </div>
         </div>
         <table style={styles.table}>
            <thead>
               <tr>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Voucher No</th>
                  <th style={styles.th}>Narration / Description</th>
                  <th style={{...styles.th, textAlign: 'right', color: '#166534'}}>Receipt (Dr)</th>
                  <th style={{...styles.th, textAlign: 'right', color: '#991b1b'}}>Payment (Cr)</th>
                  <th style={{...styles.th, textAlign: 'right'}}>Balance</th>
               </tr>
            </thead>
            <tbody>
               <tr style={{background: '#f8fafc', fontWeight: 600}}>
                  <td style={styles.td}>{fromDate}</td>
                  <td style={styles.td}>-</td>
                  <td style={styles.td}>Opening Balance B/F</td>
                  <td style={{...styles.td, textAlign: 'right'}}>-</td>
                  <td style={{...styles.td, textAlign: 'right'}}>-</td>
                  <td style={{...styles.td, textAlign: 'right'}}>Rs {openingBalance.toLocaleString()}</td>
               </tr>
               {groupedLedger.map(r => {
                  const matchesSearch = !ledgerSearch || 
                                        r.id.toLowerCase().includes(ledgerSearch.toLowerCase()) || 
                                        r.description.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
                                        (r.dr && r.dr.toString().includes(ledgerSearch)) ||
                                        (r.cr && r.cr.toString().includes(ledgerSearch));
                  
                  return (
                     <React.Fragment key={r.id}>
                     <tr 
                        style={{
                           cursor: 'pointer', 
                           background: matchesSearch && ledgerSearch ? '#fef08a' : expandedRow === r.id ? '#f0f9ff' : 'transparent',
                           borderLeft: matchesSearch && ledgerSearch ? '4px solid #f59e0b' : 'none'
                        }}
                        onClick={() => setExpandedRow(expandedRow === r.id ? null : r.id)}
                     >
                        <td style={styles.td}>{r.date}</td>
                        <td style={styles.td}><span style={{fontSize: '0.75rem', padding: '2px 6px', border: '1px solid #e2e8f0', borderRadius: '4px'}}>{r.id}</span></td>
                        <td style={styles.td}>
                        <div style={{fontWeight: 500, display: 'flex', alignItems: 'center', gap: '5px'}}>
                           <span className="material-symbols-outlined" style={{fontSize: '16px', color: '#3b82f6'}}>{expandedRow === r.id ? 'expand_less' : 'expand_more'}</span>
                           {r.description}
                           {r.studentNames && <span style={{fontSize: '0.7rem', background: '#dcfce7', color: '#166534', padding: '1px 4px', borderRadius: '4px', marginLeft: '5px'}}>Student</span>}
                        </div>
                        </td>
                        <td style={{...styles.td, textAlign: 'right', color: r.dr ? '#166534' : '#ccc'}}>{r.dr ? `+ ${r.dr.toLocaleString()}` : '-'}</td>
                        <td style={{...styles.td, textAlign: 'right', color: r.cr ? '#991b1b' : '#ccc'}}>{r.cr ? `- ${r.cr.toLocaleString()}` : '-'}</td>
                        <td style={{...styles.td, textAlign: 'right', fontWeight: 600}}>Rs {r.balance.toLocaleString()}</td>
                     </tr>
                     {expandedRow === r.id && (
                        <tr style={{background: '#f8fafc'}}>
                           <td colSpan={6} style={{padding: '10px 20px'}}>
                              <div style={{fontSize: '0.8rem', fontWeight: 600, marginBottom: '5px', color: '#64748b'}}>Transaction Breakdown:</div>
                              {r.details.map((d: any, i: number) => {
                                 const s = students.find((st:Student) => st.admissionNo === d.studentId);
                                 return (
                                    <div key={i} style={{display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px dashed #e2e8f0'}}>
                                       <span style={{color: '#334155'}}>
                                          {d.description} 
                                          {s && <span style={{fontWeight: 600, marginLeft: '5px'}}> - {s.name} ({s.program})</span>}
                                          <span style={{fontSize: '0.75rem', color: '#94a3b8', marginLeft: '10px'}}>({d.debitAccount} / {d.creditAccount})</span>
                                       </span>
                                       <span style={{fontWeight: 600}}>{d.amount.toLocaleString()}</span>
                                    </div>
                                 );
                              })}
                           </td>
                        </tr>
                     )}
                     </React.Fragment>
                  );
               })}
               <tr style={{background: '#eff6ff', fontWeight: 700}}>
                  <td style={styles.td}>{toDate}</td>
                  <td style={styles.td}>-</td>
                  <td style={styles.td}>Closing Balance C/F</td>
                  <td style={{...styles.td, textAlign: 'right', color: '#166534'}}>{totalReceipts.toLocaleString()}</td>
                  <td style={{...styles.td, textAlign: 'right', color: '#991b1b'}}>{totalPayments.toLocaleString()}</td>
                  <td style={{...styles.td, textAlign: 'right', color: '#1e40af'}}>Rs {runningBalance.toLocaleString()}</td>
               </tr>
            </tbody>
         </table>
      </div>
    </div>
  );
};
