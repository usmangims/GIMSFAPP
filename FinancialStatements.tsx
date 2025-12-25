
import React, { useState, useEffect } from "react";
import { styles } from "./styles";
import { Transaction, Student, Account, Campus } from "./types";
import { SearchableSelect } from "./SearchableSelect";

export const FinancialStatements = ({ transactions, accounts, students, masterData, subTab }: any) => {
  const [reportType, setReportType] = useState<"TB" | "IS" | "BS" | "GL" | "TS" | "BGT" | "PROG_SUM" | "BOARD_SUM" | "IE_SUM">((subTab as any) || "TB");
  
  useEffect(() => { if(subTab) setReportType(subTab as any); }, [subTab]);

  const [fromDate, setFromDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10));
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedGlAccount, setSelectedGlAccount] = useState("");
  const [tsTab, setTsTab] = useState<"ALL" | "INCOME" | "EXPENSE">("ALL");

  const postedTxns = transactions.filter((t: any) => t.status === "Posted");

  const getBalance = (accCode: string, start: string, end: string, includeLiabilityCreation = true) => {
    return postedTxns
      .filter((t:any) => {
          if (t.date < start || t.date > end) return false;
          if (!includeLiabilityCreation && t.type === 'FEE_DUE') return false;
          return true;
      })
      .reduce((sum: number, t:any) => {
        if (t.debitAccount === accCode) return sum + t.amount;
        if (t.creditAccount === accCode) return sum - t.amount;
        return sum;
      }, 0);
  };

  let content = null;

  // --- 1. Trial Balance ---
  if (reportType === "TB") {
     const trialRows = accounts.filter((a:any) => a.level === 3).map((acc:any) => {
       const bal = getBalance(acc.code, "2000-01-01", toDate);
       return { ...acc, debit: bal > 0 ? bal : 0, credit: bal < 0 ? Math.abs(bal) : 0 };
     }).filter((r:any) => r.debit !== 0 || r.credit !== 0);

     const totalDr = trialRows.reduce((s:number, r:any) => s + r.debit, 0);
     const totalCr = trialRows.reduce((s:number, r:any) => s + r.credit, 0);

     content = (
       <div id="printable-area">
         <div style={{textAlign: 'center', marginBottom: '30px'}}>
            <h2 style={{textTransform: 'uppercase', marginBottom: '5px'}}>Ghazali Institute of Medical Sciences</h2>
            <div style={{fontSize: '1.2rem', fontWeight: 600}}>Trial Balance</div>
            <div style={{color: '#64748b'}}>As at {toDate}</div>
         </div>
         <table style={styles.table}>
            <thead>
               <tr>
                  <th style={styles.th}>Code</th>
                  <th style={styles.th}>Account Name</th>
                  <th style={styles.th}>Category</th>
                  <th style={{...styles.th, textAlign: 'right'}}>Debit (Rs)</th>
                  <th style={{...styles.th, textAlign: 'right'}}>Credit (Rs)</th>
               </tr>
            </thead>
            <tbody>
               {trialRows.map((r:any) => (
                 <tr key={r.code}>
                   <td style={styles.td}>{r.code}</td>
                   <td style={styles.td}>{r.name}</td>
                   <td style={styles.td}><span style={styles.badge(r.category)}>{r.category}</span></td>
                   <td style={{...styles.td, textAlign: 'right'}}>{r.debit ? r.debit.toLocaleString() : '-'}</td>
                   <td style={{...styles.td, textAlign: 'right'}}>{r.credit ? r.credit.toLocaleString() : '-'}</td>
                 </tr>
               ))}
               <tr style={{background: '#f8fafc', fontWeight: 700}}>
                  <td colSpan={3} style={{...styles.td, textAlign: 'right'}}>TOTAL</td>
                  <td style={{...styles.td, textAlign: 'right'}}>{totalDr.toLocaleString()}</td>
                  <td style={{...styles.td, textAlign: 'right'}}>{totalCr.toLocaleString()}</td>
               </tr>
            </tbody>
         </table>
       </div>
     );
  }

  // --- 2. Income Statement ---
  if (reportType === "IS") {
    const incomeAccs = accounts.filter((a:any) => a.category === "Income" && a.level === 3);
    const expenseAccs = accounts.filter((a:any) => a.category === "Expense" && a.level === 3);
    let totalIncome = 0; let totalExpense = 0;
    
    const incomeRows = incomeAccs.map((a:any) => {
      const bal = Math.abs(getBalance(a.code, fromDate, toDate, false)); 
      totalIncome += bal;
      return { ...a, amount: bal };
    }).filter(r => r.amount > 0);

    const expenseRows = expenseAccs.map((a:any) => {
      const bal = getBalance(a.code, fromDate, toDate, true);
      totalExpense += bal;
      return { ...a, amount: bal };
    }).filter(r => r.amount > 0);

    const netProfit = totalIncome - totalExpense;

    content = (
      <div id="printable-area">
         <div style={{textAlign: 'center', marginBottom: '30px'}}>
            <h2 style={{textTransform: 'uppercase', marginBottom: '5px'}}>Ghazali Institute of Medical Sciences</h2>
            <div style={{fontSize: '1.2rem', fontWeight: 600}}>Income Statement (Cash Basis)</div>
            <div style={{color: '#64748b'}}>For the period {fromDate} to {toDate}</div>
         </div>
         <div style={styles.grid2}>
            <div>
               <h4 style={{color: '#166534', borderBottom: '2px solid #166534', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px'}}>Revenue</h4>
               <table style={styles.table}>
                  <tbody>{incomeRows.map((r:any) => (<tr key={r.code}><td style={{padding: '8px 0'}}>{r.name}</td><td style={{textAlign: 'right'}}>{r.amount.toLocaleString()}</td></tr>))}
                  <tr style={{background: '#f0fdf4', fontWeight: 700}}><td style={{padding: '12px 0'}}>Total Revenue</td><td style={{textAlign: 'right'}}>{totalIncome.toLocaleString()}</td></tr></tbody>
               </table>
            </div>
            <div>
               <h4 style={{color: '#b91c1c', borderBottom: '2px solid #b91c1c', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px'}}>Expenditure</h4>
               <table style={styles.table}>
                  <tbody>{expenseRows.map((r:any) => (<tr key={r.code}><td style={{padding: '8px 0'}}>{r.name}</td><td style={{textAlign: 'right'}}>{r.amount.toLocaleString()}</td></tr>))}
                  <tr style={{background: '#fef2f2', fontWeight: 700}}><td style={{padding: '12px 0'}}>Total Expenditure</td><td style={{textAlign: 'right'}}>{totalExpense.toLocaleString()}</td></tr></tbody>
               </table>
            </div>
         </div>
         <div style={{marginTop: '30px', padding: '20px', borderRadius: '8px', backgroundColor: netProfit >= 0 ? '#ecfdf5' : '#fef2f2', border: '1px solid #cbd5e1'}}>
            <h3 style={{margin: 0, display: 'flex', justifyContent: 'space-between'}}><span>Net Surplus/Deficit</span><span>Rs {Math.abs(netProfit).toLocaleString()}</span></h3>
         </div>
      </div>
    );
  }

  // --- 3. Balance Sheet ---
  if (reportType === "BS") {
    const assetAccs = accounts.filter((a: any) => a.category === "Asset" && a.level === 3);
    const liabilityAccs = accounts.filter((a: any) => a.category === "Liability" && a.level === 3);
    let totalAssets = 0; let totalLiabilities = 0;

    const assetRows = assetAccs.map((a: any) => {
        const bal = getBalance(a.code, "2000-01-01", toDate, true); 
        if(bal !== 0) { totalAssets += bal; return { name: a.name, amount: bal }; }
        return null;
    }).filter(r => r);

    const liabilityRows = liabilityAccs.map((a: any) => {
        const bal = Math.abs(getBalance(a.code, "2000-01-01", toDate, true)); 
        if(bal !== 0) { totalLiabilities += bal; return { name: a.name, amount: bal }; }
        return null;
    }).filter(r => r);

    const income = accounts.filter((a:any) => a.category === 'Income' && a.level === 3).reduce((acc: number, a:any) => acc + Math.abs(getBalance(a.code, "2000-01-01", toDate, false)), 0);
    const expense = accounts.filter((a:any) => a.category === 'Expense' && a.level === 3).reduce((acc: number, a:any) => acc + getBalance(a.code, "2000-01-01", toDate), 0);
    const currentProfit = income - expense;

    content = (
      <div id="printable-area">
         <div style={{textAlign: 'center', marginBottom: '40px'}}>
            <h2 style={{textTransform: 'uppercase'}}>Balance Sheet</h2>
            <div style={{color: '#64748b'}}>As at {toDate}</div>
         </div>
         <div style={styles.grid2}>
             <div><h3 style={{borderBottom: '2px solid #1d4ed8'}}>Assets</h3><table style={styles.table}><tbody>{assetRows.map((r: any, i: number) => (<tr key={i}><td style={{padding: '8px 0'}}>{r.name}</td><td style={{textAlign: 'right'}}>{r.amount.toLocaleString()}</td></tr>))}<tr style={{background: '#eff6ff', fontWeight: 700}}><td style={{padding: '12px 0'}}>Total Assets</td><td style={{textAlign: 'right'}}>{totalAssets.toLocaleString()}</td></tr></tbody></table></div>
             <div><h3 style={{borderBottom: '2px solid #9333ea'}}>Liabilities & Equity</h3><table style={styles.table}><tbody>{liabilityRows.map((r: any, i: number) => (<tr key={i}><td style={{padding: '8px 0'}}>{r.name}</td><td style={{textAlign: 'right'}}>{r.amount.toLocaleString()}</td></tr>))}<tr style={{borderBottom: '1px solid #eee'}}><td style={{padding: '8px 0'}}>Retained Earnings (Current)</td><td style={{textAlign: 'right'}}>{currentProfit.toLocaleString()}</td></tr><tr style={{background: '#fdf4ff', fontWeight: 700}}><td style={{padding: '12px 0'}}>Total Liab & Equity</td><td style={{textAlign: 'right'}}>{(totalLiabilities + currentProfit).toLocaleString()}</td></tr></tbody></table></div>
         </div>
      </div>
    );
  }

  // --- 4. General Ledger ---
  if (reportType === "GL") {
    const accOptions = accounts.filter((a: Account) => a.level === 3).map((a: Account) => ({ value: a.code, label: `${a.code} - ${a.name}` }));
    let runningBal = 0;
    const glTransactions = selectedGlAccount ? postedTxns.filter(t => t.debitAccount === selectedGlAccount || t.creditAccount === selectedGlAccount)
      .sort((a,b) => a.date.localeCompare(b.date))
      .map(t => {
        const dr = t.debitAccount === selectedGlAccount ? t.amount : 0;
        const cr = t.creditAccount === selectedGlAccount ? t.amount : 0;
        runningBal += (dr - cr);
        return { ...t, dr, cr, runningBal };
      }) : [];

    content = (
      <div>
        <div className="no-print" style={{marginBottom: '20px'}}>
           <label style={styles.label}>Select Ledger Account</label>
           <SearchableSelect options={accOptions} value={selectedGlAccount} onChange={setSelectedGlAccount} placeholder="Search Account..." />
        </div>
        {selectedGlAccount && (
          <div id="printable-area">
             <div style={{textAlign: 'center', marginBottom: '20px'}}><h2 style={{textTransform: 'uppercase'}}>General Ledger</h2><h4>{accounts.find(a => a.code === selectedGlAccount)?.name}</h4></div>
             <table style={styles.table}>
                <thead><tr><th style={styles.th}>Date</th><th style={styles.th}>Voucher</th><th style={styles.th}>Description</th><th style={{...styles.th, textAlign: 'right'}}>Debit</th><th style={{...styles.th, textAlign: 'right'}}>Credit</th><th style={{...styles.th, textAlign: 'right'}}>Balance</th></tr></thead>
                <tbody>{glTransactions.map(t => (<tr key={t.id}><td>{t.date}</td><td>{t.voucherNo}</td><td>{t.description}</td><td style={{textAlign: 'right'}}>{t.dr ? t.dr.toLocaleString() : '-'}</td><td style={{textAlign: 'right'}}>{t.cr ? t.cr.toLocaleString() : '-'}</td><td style={{textAlign: 'right', fontWeight: 600}}>{t.runningBal.toLocaleString()}</td></tr>))}</tbody>
             </table>
          </div>
        )}
      </div>
    );
  }

  // --- 5. Program/Board Summary ---
  if (reportType === "PROG_SUM" || reportType === "BOARD_SUM") {
    const isProg = reportType === "PROG_SUM";
    const groups = isProg ? masterData.programs : masterData.boards;
    const stats = groups.map((g: string) => {
      const groupStudents = students.filter((s: Student) => isProg ? s.program === g : s.board === g);
      const studentIds = groupStudents.map(s => s.admissionNo);
      const collected = postedTxns.filter(t => (t.type === 'FEE' || t.type === 'FEE_RCV') && studentIds.includes(t.studentId || ""))
        .reduce((sum, t) => sum + t.amount, 0);
      const receivable = groupStudents.reduce((sum, s) => sum + s.balance, 0);
      return { name: g, count: groupStudents.length, collected, receivable };
    }).filter((s: any) => s.count > 0);

    content = (
      <div id="printable-area">
        <div style={{textAlign: 'center', marginBottom: '30px'}}><h2 style={{textTransform: 'uppercase'}}>{isProg ? "Program" : "Board"} Name Summary</h2></div>
        <table style={styles.table}>
          <thead><tr><th style={styles.th}>{isProg ? "Program" : "Board"} Name</th><th style={styles.th}>Students</th><th style={{...styles.th, textAlign: 'right'}}>Collected</th><th style={{...styles.th, textAlign: 'right'}}>Receivable</th><th style={{...styles.th, textAlign: 'right'}}>Total Revenue</th></tr></thead>
          <tbody>{stats.map((s: any) => (<tr key={s.name}><td>{s.name}</td><td>{s.count}</td><td style={{textAlign: 'right', color: '#166534'}}>{s.collected.toLocaleString()}</td><td style={{textAlign: 'right', color: '#b91c1c'}}>{s.receivable.toLocaleString()}</td><td style={{textAlign: 'right', fontWeight: 600}}>{(s.collected + s.receivable).toLocaleString()}</td></tr>))}</tbody>
        </table>
      </div>
    );
  }

  // --- 6. Inc/Exp Summary ---
  if (reportType === "IE_SUM") {
    const categories = ["Asset", "Liability", "Equity", "Income", "Expense"];
    const catStats = categories.map(cat => {
      const accs = accounts.filter((a: Account) => a.category === cat && a.level === 3);
      const total = accs.reduce((sum: number, a: Account) => sum + Math.abs(getBalance(a.code, fromDate, toDate, true)), 0);
      return { name: cat, amount: total };
    });
    content = (
      <div id="printable-area">
        <div style={{textAlign: 'center', marginBottom: '30px'}}><h2 style={{textTransform: 'uppercase'}}>Income & Expense Summary</h2></div>
        <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
          {catStats.map(c => (
            <div key={c.name} style={{padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
               <div><div style={{fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase'}}>{c.name}</div><div style={{fontSize: '1.5rem', fontWeight: 700}}>{c.amount.toLocaleString()}</div></div>
               <div style={{width: '200px', height: '10px', background: '#e2e8f0', borderRadius: '5px', overflow: 'hidden'}}><div style={{width: '60%', height: '100%', background: '#4f46e5'}}></div></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- 7. Projected Revenue (BGT) ---
  if (reportType === "BGT") {
    const totalPotential = students.reduce((sum: number, s: Student) => sum + s.totalCourseFee, 0);
    const totalCollected = postedTxns.filter((t: Transaction) => t.type === 'FEE' || t.type === 'FEE_RCV').reduce((sum: number, t: Transaction) => sum + t.amount, 0);
    const totalDues = students.reduce((sum: number, s: Student) => sum + s.balance, 0);

    const uniqueClasses: any[] = [];
    students.forEach((s: Student) => {
        if(s.status === 'Left Student') return;
        const key = `${s.program}-${s.semester}`;
        if(!uniqueClasses.find(c => c.key === key)) {
            uniqueClasses.push({
                key,
                program: s.program,
                semester: s.semester,
                monthly: Math.round(s.tuitionFee / 6),
                semesterFee: s.tuitionFee,
                yearly: s.tuitionFee * 2
            });
        }
    });

    content = (
      <div id="printable-area">
        <div style={{textAlign: 'center', marginBottom: '30px'}}><h1 style={{textTransform: 'uppercase', fontSize: '1.8rem', color: '#0f172a'}}>Projected Revenue Dashboard</h1></div>
        <div style={{...styles.grid3, marginBottom: '40px'}}>
           <div style={{...styles.card, background: '#f0fdf4', textAlign: 'center', marginBottom: 0}}><h5>Collected</h5><div style={{fontSize: '1.5rem', fontWeight: 700, color: '#166534'}}>Rs {totalCollected.toLocaleString()}</div></div>
           <div style={{...styles.card, background: '#fef2f2', textAlign: 'center', marginBottom: 0}}><h5>Receivables</h5><div style={{fontSize: '1.5rem', fontWeight: 700, color: '#b91c1c'}}>Rs {totalDues.toLocaleString()}</div></div>
           <div style={{...styles.card, background: '#eff6ff', textAlign: 'center', marginBottom: 0}}><h5>Total Projected</h5><div style={{fontSize: '1.5rem', fontWeight: 700, color: '#1e40af'}}>Rs {totalPotential.toLocaleString()}</div></div>
        </div>

        <div style={{display: 'flex', flexDirection: 'column', gap: '40px'}}>
            <div>
                <h3 style={{borderLeft: '4px solid #4f46e5', paddingLeft: '10px', color: '#0f172a', marginBottom: '15px'}}>Monthly Wise Fee Breakdown</h3>
                <table style={styles.table}>
                    <thead>
                        <tr style={{background: '#f8fafc'}}>
                            <th style={styles.th}>S.No</th>
                            <th style={styles.th}>Programs</th>
                            <th style={styles.th}>Semester</th>
                            <th style={{...styles.th, textAlign: 'right'}}>Monthly Fee</th>
                        </tr>
                    </thead>
                    <tbody>
                        {uniqueClasses.map((c, i) => (
                            <tr key={i}>
                                <td style={styles.td}>{i + 1}</td>
                                <td style={{...styles.td, fontWeight: 600}}>{c.program}</td>
                                <td style={styles.td}>{c.semester}</td>
                                <td style={{...styles.td, textAlign: 'right', fontWeight: 700, color: '#4f46e5'}}>Rs {c.monthly.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div>
                <h3 style={{borderLeft: '4px solid #10b981', paddingLeft: '10px', color: '#0f172a', marginBottom: '15px'}}>Semester Wise Fee Breakdown</h3>
                <table style={styles.table}>
                    <thead>
                        <tr style={{background: '#f8fafc'}}>
                            <th style={styles.th}>S.No</th>
                            <th style={styles.th}>Programs</th>
                            <th style={styles.th}>Semester</th>
                            <th style={{...styles.th, textAlign: 'right'}}>Semester Fee</th>
                        </tr>
                    </thead>
                    <tbody>
                        {uniqueClasses.map((c, i) => (
                            <tr key={i}>
                                <td style={styles.td}>{i + 1}</td>
                                <td style={{...styles.td, fontWeight: 600}}>{c.program}</td>
                                <td style={styles.td}>{c.semester}</td>
                                <td style={{...styles.td, textAlign: 'right', fontWeight: 700, color: '#10b981'}}>Rs {c.semesterFee.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div>
                <h3 style={{borderLeft: '4px solid #f97316', paddingLeft: '10px', color: '#0f172a', marginBottom: '15px'}}>Yearly Wise Fee Breakdown</h3>
                <table style={styles.table}>
                    <thead>
                        <tr style={{background: '#f8fafc'}}>
                            <th style={styles.th}>S.No</th>
                            <th style={styles.th}>Programs</th>
                            <th style={styles.th}>Semester</th>
                            <th style={{...styles.th, textAlign: 'right'}}>Yearly Fee</th>
                        </tr>
                    </thead>
                    <tbody>
                        {uniqueClasses.map((c, i) => (
                            <tr key={i}>
                                <td style={styles.td}>{i + 1}</td>
                                <td style={{...styles.td, fontWeight: 600}}>{c.program}</td>
                                <td style={styles.td}>{c.semester}</td>
                                <td style={{...styles.td, textAlign: 'right', fontWeight: 700, color: '#f97316'}}>Rs {c.yearly.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        <p style={{color: '#64748b', fontSize: '0.9rem', marginTop: '40px', fontStyle: 'italic'}}>Note: Calculated amounts are based on current semester enrollment and tuition fees.</p>
      </div>
    );
  }

  // --- 8. Transaction Summary ---
  if (reportType === "TS") {
    const filteredTxns = transactions.filter((t:any) => t.date >= fromDate && t.date <= toDate && t.status === "Posted" && t.type !== 'FEE_DUE');
    const displayTxns = filteredTxns.filter((t:any) => {
        if(tsTab === 'INCOME') return t.creditAccount.startsWith('4');
        if(tsTab === 'EXPENSE') return t.debitAccount.startsWith('5');
        return true;
    });
    content = (
        <div id="printable-area">
            <div className="no-print" style={{marginBottom: '15px', display: 'flex', gap: '5px'}}>
                <button style={styles.tabButton(tsTab === 'ALL')} onClick={() => setTsTab('ALL')}>All</button>
                <button style={styles.tabButton(tsTab === 'INCOME')} onClick={() => setTsTab('INCOME')}>Income Only</button>
                <button style={styles.tabButton(tsTab === 'EXPENSE')} onClick={() => setTsTab('EXPENSE')}>Expense Only</button>
            </div>
            <table style={styles.table}>
                <thead><tr><th style={styles.th}>Date</th><th style={styles.th}>Voucher</th><th style={styles.th}>Description</th><th style={{...styles.th, textAlign: 'right'}}>Amount</th></tr></thead>
                <tbody>{displayTxns.map((t:any) => (<tr key={t.id}><td>{t.date}</td><td>{t.voucherNo}</td><td>{t.description}</td><td style={{textAlign: 'right'}}>{t.amount.toLocaleString()}</td></tr>))}</tbody>
            </table>
        </div>
    );
  }

  return (
    <div style={styles.card}>
      <div className="no-print" style={{marginBottom: '20px', display: 'flex', gap: '20px', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px'}}>
         {reportType !== "BGT" ? (
             <div style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
                <div><label style={styles.label}>From Date</label><input type="date" style={styles.input} value={fromDate} onChange={e => setFromDate(e.target.value)} /></div>
                <div><label style={styles.label}>To Date</label><input type="date" style={styles.input} value={toDate} onChange={e => setToDate(e.target.value)} /></div>
             </div>
         ) : (
             <div style={{fontWeight: 600, color: '#475569'}}>Summary View (No Date Filter Required)</div>
         )}
         <div style={{marginLeft: 'auto'}}><button style={styles.button("secondary")} onClick={() => window.print()}><span className="material-symbols-outlined">print</span> Print</button></div>
      </div>
      {content}
    </div>
  );
};
