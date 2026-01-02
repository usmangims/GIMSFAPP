
import React, { useState, useEffect } from "react";
import { styles } from "./styles";
import { Transaction, Student, Account, Campus } from "./types";
import { SearchableSelect } from "./SearchableSelect";

export const FinancialStatements = ({ transactions, accounts, students, masterData, subTab }: any) => {
  const [reportType, setReportType] = useState<"TB" | "IS" | "BS" | "GL" | "TS" | "BGT" | "PL" | "PROG_SUM" | "BOARD_SUM" | "IE_SUM">((subTab as any) || "TB");
  
  useEffect(() => { if(subTab) setReportType(subTab as any); }, [subTab]);

  const [fromDate, setFromDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10));
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedGlAccount, setSelectedGlAccount] = useState("");
  const [tsTab, setTsTab] = useState<"ALL" | "INCOME" | "EXPENSE">("ALL");

  const postedTxns = transactions.filter((t: any) => t.status === "Posted");

  // Professional Ledger Styles
  const ledgerTableStyle = {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontSize: "0.95rem",
    border: "1px solid #e2e8f0",
    backgroundColor: "white",
  };

  const ledgerThStyle = {
    backgroundColor: "#f1f5f9",
    color: "#475569",
    fontWeight: "700",
    textTransform: "uppercase" as const,
    fontSize: "0.75rem",
    letterSpacing: "0.5px",
    padding: "14px 16px",
    border: "1px solid #e2e8f0",
    textAlign: "left" as const,
  };

  const ledgerTdStyle = (isNumeric = false, isBold = false) => ({
    padding: "12px 16px",
    border: "1px solid #e2e8f0",
    textAlign: isNumeric ? ("right" as const) : ("left" as const),
    color: "#1e293b",
    fontWeight: isBold ? "700" : "400",
    fontFamily: isNumeric ? "'JetBrains Mono', monospace" : "inherit",
  });

  const zebraRowStyle = (index: number) => ({
    backgroundColor: index % 2 === 0 ? "white" : "#f8fafc",
  });

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

  const handleExportPDF = (id: string, filename: string) => {
    const element = document.getElementById(id);
    if (!element) return;
    const opt = {
      margin: 10,
      filename: `${filename}_${new Date().toISOString().slice(0,10)}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    (window as any).html2pdf().from(element).set(opt).save();
  };

  const handleExportExcel = (tableId: string, filename: string) => {
      const table = document.querySelector(`#${tableId} table`);
      if (!table) return;
      const XLSX = (window as any).XLSX;
      const wb = XLSX.utils.table_to_book(table);
      XLSX.writeFile(wb, `${filename}_${new Date().toISOString().slice(0,10)}.xlsx`);
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
         <table style={ledgerTableStyle}>
            <thead>
               <tr>
                  <th style={ledgerThStyle}>Code</th>
                  <th style={ledgerThStyle}>Account Name</th>
                  <th style={ledgerThStyle}>Category</th>
                  <th style={{...ledgerThStyle, textAlign: 'right'}}>Debit (Rs)</th>
                  <th style={{...ledgerThStyle, textAlign: 'right'}}>Credit (Rs)</th>
               </tr>
            </thead>
            <tbody>
               {trialRows.map((r:any, idx: number) => (
                 <tr key={r.code} style={zebraRowStyle(idx)}>
                   <td style={ledgerTdStyle()}>{r.code}</td>
                   <td style={ledgerTdStyle(false, true)}>{r.name}</td>
                   <td style={ledgerTdStyle()}><span style={styles.badge(r.category)}>{r.category}</span></td>
                   <td style={ledgerTdStyle(true)}>{r.debit ? r.debit.toLocaleString() : '-'}</td>
                   <td style={ledgerTdStyle(true)}>{r.credit ? r.credit.toLocaleString() : '-'}</td>
                 </tr>
               ))}
               <tr style={{background: '#f1f5f9', fontWeight: 700}}>
                  <td colSpan={3} style={ledgerTdStyle(true, true)}>TOTAL</td>
                  <td style={ledgerTdStyle(true, true)}>{totalDr.toLocaleString()}</td>
                  <td style={ledgerTdStyle(true, true)}>{totalCr.toLocaleString()}</td>
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
               <table style={ledgerTableStyle}>
                  <thead>
                    <tr><th style={ledgerThStyle}>Particulars</th><th style={{...ledgerThStyle, textAlign: 'right'}}>Amount (Rs)</th></tr>
                  </thead>
                  <tbody>{incomeRows.map((r:any, idx: number) => (
                    <tr key={r.code} style={zebraRowStyle(idx)}>
                        <td style={ledgerTdStyle()}>{r.name}</td>
                        <td style={ledgerTdStyle(true)}>{r.amount.toLocaleString()}</td>
                    </tr>))}
                  <tr style={{background: '#f0fdf4', fontWeight: 700}}><td style={ledgerTdStyle(false, true)}>Total Revenue</td><td style={ledgerTdStyle(true, true)}>{totalIncome.toLocaleString()}</td></tr></tbody>
               </table>
            </div>
            <div>
               <h4 style={{color: '#b91c1c', borderBottom: '2px solid #b91c1c', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px'}}>Expenditure</h4>
               <table style={ledgerTableStyle}>
                  <thead>
                    <tr><th style={ledgerThStyle}>Particulars</th><th style={{...ledgerThStyle, textAlign: 'right'}}>Amount (Rs)</th></tr>
                  </thead>
                  <tbody>{expenseRows.map((r:any, idx: number) => (
                    <tr key={r.code} style={zebraRowStyle(idx)}>
                        <td style={ledgerTdStyle()}>{r.name}</td>
                        <td style={ledgerTdStyle(true)}>{r.amount.toLocaleString()}</td>
                    </tr>))}
                  <tr style={{background: '#fef2f2', fontWeight: 700}}><td style={ledgerTdStyle(false, true)}>Total Expenditure</td><td style={ledgerTdStyle(true, true)}>{totalExpense.toLocaleString()}</td></tr></tbody>
               </table>
            </div>
         </div>
         <div style={{marginTop: '30px', padding: '24px', borderRadius: '12px', backgroundColor: netProfit >= 0 ? '#ecfdf5' : '#fef2f2', border: `2px solid ${netProfit >= 0 ? '#166534' : '#b91c1c'}`}}>
            <h3 style={{margin: 0, display: 'flex', justifyContent: 'space-between', color: netProfit >= 0 ? '#065f46' : '#991b1b'}}>
                <span style={{textTransform: 'uppercase', letterSpacing: '1px'}}>Net Surplus/Deficit</span>
                <span style={{fontWeight: 900}}>Rs {Math.abs(netProfit).toLocaleString()}</span>
            </h3>
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
             <div>
                <h3 style={{borderBottom: '2px solid #1d4ed8', paddingBottom: '10px', color: '#1d4ed8'}}>Assets</h3>
                <table style={ledgerTableStyle}>
                    <thead><tr><th style={ledgerThStyle}>Particulars</th><th style={{...ledgerThStyle, textAlign: 'right'}}>Amount (Rs)</th></tr></thead>
                    <tbody>{assetRows.map((r: any, i: number) => (
                        <tr key={i} style={zebraRowStyle(i)}>
                            <td style={ledgerTdStyle()}>{r.name}</td>
                            <td style={ledgerTdStyle(true)}>{r.amount.toLocaleString()}</td>
                        </tr>))}<tr style={{background: '#eff6ff', fontWeight: 700}}>
                            <td style={ledgerTdStyle(false, true)}>Total Assets</td>
                            <td style={ledgerTdStyle(true, true)}>{totalAssets.toLocaleString()}</td>
                        </tr>
                    </tbody>
                </table>
             </div>
             <div>
                <h3 style={{borderBottom: '2px solid #9333ea', paddingBottom: '10px', color: '#9333ea'}}>Liabilities & Equity</h3>
                <table style={ledgerTableStyle}>
                    <thead><tr><th style={ledgerThStyle}>Particulars</th><th style={{...ledgerThStyle, textAlign: 'right'}}>Amount (Rs)</th></tr></thead>
                    <tbody>{liabilityRows.map((r: any, i: number) => (
                        <tr key={i} style={zebraRowStyle(i)}>
                            <td style={ledgerTdStyle()}>{r.name}</td>
                            <td style={ledgerTdStyle(true)}>{r.amount.toLocaleString()}</td>
                        </tr>))}<tr style={{borderBottom: '1px solid #eee'}}>
                            <td style={ledgerTdStyle()}>Retained Earnings (Current)</td>
                            <td style={ledgerTdStyle(true)}>{currentProfit.toLocaleString()}</td>
                        </tr><tr style={{background: '#fdf4ff', fontWeight: 700}}>
                            <td style={ledgerTdStyle(false, true)}>Total Liab & Equity</td>
                            <td style={ledgerTdStyle(true, true)}>{(totalLiabilities + currentProfit).toLocaleString()}</td>
                        </tr>
                    </tbody>
                </table>
             </div>
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
             <div style={{textAlign: 'center', marginBottom: '20px'}}><h2 style={{textTransform: 'uppercase'}}>General Ledger</h2><h4 style={{color: '#475569'}}>{accounts.find(a => a.code === selectedGlAccount)?.name} ({selectedGlAccount})</h4></div>
             <table style={ledgerTableStyle}>
                <thead>
                    <tr>
                        <th style={ledgerThStyle}>Date</th>
                        <th style={ledgerThStyle}>Voucher</th>
                        <th style={ledgerThStyle}>Description</th>
                        <th style={{...ledgerThStyle, textAlign: 'right'}}>Debit</th>
                        <th style={{...ledgerThStyle, textAlign: 'right'}}>Credit</th>
                        <th style={{...ledgerThStyle, textAlign: 'right'}}>Balance</th>
                    </tr>
                </thead>
                <tbody>
                    {glTransactions.map((t: any, idx: number) => (
                        <tr key={t.id} style={zebraRowStyle(idx)}>
                            <td style={ledgerTdStyle()}>{t.date}</td>
                            <td style={ledgerTdStyle()}><span style={{fontFamily: 'monospace', fontWeight: 600}}>{t.voucherNo}</span></td>
                            <td style={ledgerTdStyle()}>{t.description}</td>
                            <td style={ledgerTdStyle(true)}>{t.dr ? t.dr.toLocaleString() : '-'}</td>
                            <td style={ledgerTdStyle(true)}>{t.cr ? t.cr.toLocaleString() : '-'}</td>
                            <td style={ledgerTdStyle(true, true)}>{t.runningBal.toLocaleString()}</td>
                        </tr>
                    ))}
                    {glTransactions.length === 0 && <tr><td colSpan={6} style={{...ledgerTdStyle(), textAlign: 'center', padding: '40px', color: '#94a3b8'}}>No transaction history for this account.</td></tr>}
                </tbody>
             </table>
          </div>
        )}
      </div>
    );
  }

  // --- 5. Profit and Loss ---
  if (reportType === "PL") {
    const feeIncomeAccs = accounts.filter((a:any) => a.category === "Income" && a.level === 3 && a.name.toLowerCase().includes("fee"));
    const otherIncomeAccs = accounts.filter((a:any) => a.category === "Income" && a.level === 3 && !a.name.toLowerCase().includes("fee"));
    
    const salaryAccs = accounts.filter((a:any) => a.category === "Expense" && a.level === 3 && a.name.toLowerCase().includes("salar"));
    const utilityAccs = accounts.filter((a:any) => a.category === "Expense" && a.level === 3 && (a.name.toLowerCase().includes("util") || a.name.toLowerCase().includes("bill")));
    const otherExpenseAccs = accounts.filter((a:any) => a.category === "Expense" && a.level === 3 && !salaryAccs.includes(a) && !utilityAccs.includes(a));

    const getAggregatedRows = (accList: Account[]) => accList.map(a => ({
        name: a.name,
        amount: Math.abs(getBalance(a.code, fromDate, toDate, a.category === 'Expense'))
    })).filter(r => r.amount > 0);

    const feeIncomeRows = getAggregatedRows(feeIncomeAccs);
    const otherIncomeRows = getAggregatedRows(otherIncomeAccs);
    const salaryRows = getAggregatedRows(salaryAccs);
    const utilityRows = getAggregatedRows(utilityAccs);
    const otherExpenseRows = getAggregatedRows(otherExpenseAccs);

    const totalIncome = [...feeIncomeRows, ...otherIncomeRows].reduce((s, r) => s + r.amount, 0);
    const totalExpense = [...salaryRows, ...utilityRows, ...otherExpenseRows].reduce((s, r) => s + r.amount, 0);
    const netResult = totalIncome - totalExpense;

    content = (
        <div id="printable-area">
            <div style={{textAlign: 'center', marginBottom: '30px'}}>
                <h1 style={{textTransform: 'uppercase', fontSize: '1.8rem', color: '#0f172a', margin: '0 0 5px 0'}}>Ghazali Institute of Medical Sciences</h1>
                <h3 style={{margin: 0, fontWeight: 600, color: '#475569'}}>Profit and Loss Account</h3>
                <div style={{color: '#64748b', fontSize: '0.9rem', marginTop: '5px'}}>Period: <strong>{fromDate}</strong> to <strong>{toDate}</strong></div>
            </div>

            <div style={styles.grid2}>
                <div style={{...styles.card, padding: '0', border: '1px solid #e2e8f0', overflow: 'hidden'}}>
                    <h4 style={{padding: '16px', margin: 0, background: '#f0fdf4', color: '#166534', borderBottom: '2px solid #dcfce7', display: 'flex', alignItems: 'center', gap: '8px'}}>
                        <span className="material-symbols-outlined">trending_up</span> Income Details
                    </h4>
                    <table style={ledgerTableStyle}>
                        <thead><tr><th style={ledgerThStyle}>Particulars</th><th style={{...ledgerThStyle, textAlign: 'right'}}>Amount (Rs)</th></tr></thead>
                        <tbody>
                            {feeIncomeRows.length > 0 && <tr style={{background: '#f8fafc'}}><td colSpan={2} style={{...ledgerTdStyle(), fontWeight: 800, fontSize: '0.7rem', color: '#64748b', backgroundColor: '#f1f5f9'}}>STUDENT FEES</td></tr>}
                            {feeIncomeRows.map((r, i) => <tr key={i} style={zebraRowStyle(i)}><td style={ledgerTdStyle()}>{r.name}</td><td style={ledgerTdStyle(true)}>{r.amount.toLocaleString()}</td></tr>)}
                            {otherIncomeRows.length > 0 && <tr style={{background: '#f8fafc'}}><td colSpan={2} style={{...ledgerTdStyle(), fontWeight: 800, fontSize: '0.7rem', color: '#64748b', backgroundColor: '#f1f5f9'}}>OTHER REVENUE</td></tr>}
                            {otherIncomeRows.map((r, i) => <tr key={i} style={zebraRowStyle(i)}><td style={ledgerTdStyle()}>{r.name}</td><td style={ledgerTdStyle(true)}>{r.amount.toLocaleString()}</td></tr>)}
                        </tbody>
                        <tfoot>
                            <tr style={{background: '#dcfce7', fontWeight: 800}}>
                                <td style={ledgerTdStyle(false, true)}>TOTAL INCOME</td>
                                <td style={ledgerTdStyle(true, true)}>Rs {totalIncome.toLocaleString()}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div style={{...styles.card, padding: '0', border: '1px solid #e2e8f0', overflow: 'hidden'}}>
                    <h4 style={{padding: '16px', margin: 0, background: '#fef2f2', color: '#b91c1c', borderBottom: '2px solid #fee2e2', display: 'flex', alignItems: 'center', gap: '8px'}}>
                        <span className="material-symbols-outlined">trending_down</span> Operating Expenses
                    </h4>
                    <table style={ledgerTableStyle}>
                        <thead><tr><th style={ledgerThStyle}>Particulars</th><th style={{...ledgerThStyle, textAlign: 'right'}}>Amount (Rs)</th></tr></thead>
                        <tbody>
                            {salaryRows.length > 0 && <tr style={{background: '#f8fafc'}}><td colSpan={2} style={{...ledgerTdStyle(), fontWeight: 800, fontSize: '0.7rem', color: '#64748b', backgroundColor: '#f1f5f9'}}>PAYROLL & SALARIES</td></tr>}
                            {salaryRows.map((r, i) => <tr key={i} style={zebraRowStyle(i)}><td style={ledgerTdStyle()}>{r.name}</td><td style={ledgerTdStyle(true)}>{r.amount.toLocaleString()}</td></tr>)}
                            {utilityRows.length > 0 && <tr style={{background: '#f8fafc'}}><td colSpan={2} style={{...ledgerTdStyle(), fontWeight: 800, fontSize: '0.7rem', color: '#64748b', backgroundColor: '#f1f5f9'}}>UTILITY BILLS</td></tr>}
                            {utilityRows.map((r, i) => <tr key={i} style={zebraRowStyle(i)}><td style={ledgerTdStyle()}>{r.name}</td><td style={ledgerTdStyle(true)}>{r.amount.toLocaleString()}</td></tr>)}
                            {otherExpenseRows.length > 0 && <tr style={{background: '#f8fafc'}}><td colSpan={2} style={{...ledgerTdStyle(), fontWeight: 800, fontSize: '0.7rem', color: '#64748b', backgroundColor: '#f1f5f9'}}>OTHER EXPENDITURE</td></tr>}
                            {otherExpenseRows.map((r, i) => <tr key={i} style={zebraRowStyle(i)}><td style={ledgerTdStyle()}>{r.name}</td><td style={ledgerTdStyle(true)}>{r.amount.toLocaleString()}</td></tr>)}
                        </tbody>
                        <tfoot>
                            <tr style={{background: '#fee2e2', fontWeight: 800}}>
                                <td style={ledgerTdStyle(false, true)}>TOTAL EXPENSE</td>
                                <td style={ledgerTdStyle(true, true)}>Rs {totalExpense.toLocaleString()}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            <div style={{marginTop: '20px', padding: '30px', borderRadius: '16px', background: netResult >= 0 ? '#ecfdf5' : '#fef2f2', border: `2px solid ${netResult >= 0 ? '#166534' : '#b91c1c'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <div>
                    <div style={{fontSize: '1rem', color: netResult >= 0 ? '#166534' : '#b91c1c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px'}}>Net Profit / Loss Summary</div>
                    <div style={{fontSize: '2.5rem', fontWeight: 900, color: netResult >= 0 ? '#166534' : '#b91c1c'}}>
                        {netResult >= 0 ? 'Surplus (Profit)' : 'Deficit (Loss)'}: Rs {Math.abs(netResult).toLocaleString()}
                    </div>
                </div>
                <div style={{textAlign: 'right'}}>
                    <div style={{fontSize: '0.9rem', color: '#64748b', marginBottom: '5px'}}>Operating Margin</div>
                    <div style={{fontSize: '1.5rem', fontWeight: 700, color: netResult >= 0 ? '#166534' : '#b91c1c'}}>{totalIncome > 0 ? ((netResult/totalIncome)*100).toFixed(2) : 0}%</div>
                </div>
            </div>
        </div>
    );
  }

  // --- 6. Program/Board Summary ---
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
        <div style={{textAlign: 'center', marginBottom: '30px'}}><h2 style={{textTransform: 'uppercase'}}>{isProg ? "Program" : "Board"} Summary Report</h2></div>
        <table style={ledgerTableStyle}>
          <thead>
            <tr>
                <th style={ledgerThStyle}>{isProg ? "Program" : "Board"} Name</th>
                <th style={ledgerThStyle}>Students</th>
                <th style={{...ledgerThStyle, textAlign: 'right'}}>Collected</th>
                <th style={{...ledgerThStyle, textAlign: 'right'}}>Receivable</th>
                <th style={{...ledgerThStyle, textAlign: 'right'}}>Total Revenue</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((s: any, idx: number) => (
                <tr key={s.name} style={zebraRowStyle(idx)}>
                    <td style={ledgerTdStyle(false, true)}>{s.name}</td>
                    <td style={ledgerTdStyle()}>{s.count}</td>
                    <td style={ledgerTdStyle(true)}>{s.collected.toLocaleString()}</td>
                    <td style={ledgerTdStyle(true)}>{s.receivable.toLocaleString()}</td>
                    <td style={ledgerTdStyle(true, true)}>{(s.collected + s.receivable).toLocaleString()}</td>
                </tr>
            ))}
          </tbody>
        </table>
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
           <div style={{...styles.card, background: '#f0fdf4', textAlign: 'center', marginBottom: 0, border: '1px solid #bbf7d0'}}><h5>Collected</h5><div style={{fontSize: '1.5rem', fontWeight: 900, color: '#166534'}}>Rs {totalCollected.toLocaleString()}</div></div>
           <div style={{...styles.card, background: '#fef2f2', textAlign: 'center', marginBottom: 0, border: '1px solid #fecaca'}}><h5>Receivables</h5><div style={{fontSize: '1.5rem', fontWeight: 900, color: '#b91c1c'}}>Rs {totalDues.toLocaleString()}</div></div>
           <div style={{...styles.card, background: '#eff6ff', textAlign: 'center', marginBottom: 0, border: '1px solid #bfdbfe'}}><h5>Total Projected</h5><div style={{fontSize: '1.5rem', fontWeight: 900, color: '#1e40af'}}>Rs {totalPotential.toLocaleString()}</div></div>
        </div>

        <div style={{display: 'flex', flexDirection: 'column', gap: '40px'}}>
            <div>
                <h3 style={{borderLeft: '4px solid #4f46e5', paddingLeft: '10px', color: '#0f172a', marginBottom: '15px'}}>Monthly Fee Projections</h3>
                <table style={ledgerTableStyle}>
                    <thead>
                        <tr>
                            <th style={ledgerThStyle}>S.No</th>
                            <th style={ledgerThStyle}>Programs</th>
                            <th style={ledgerThStyle}>Semester</th>
                            <th style={{...ledgerThStyle, textAlign: 'right'}}>Monthly Fee</th>
                        </tr>
                    </thead>
                    <tbody>
                        {uniqueClasses.map((c, i) => (
                            <tr key={i} style={zebraRowStyle(i)}>
                                <td style={ledgerTdStyle()}>{i + 1}</td>
                                <td style={ledgerTdStyle(false, true)}>{c.program}</td>
                                <td style={ledgerTdStyle()}>{c.semester}</td>
                                <td style={ledgerTdStyle(true, true)}>Rs {c.monthly.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div>
                <h3 style={{borderLeft: '4px solid #10b981', paddingLeft: '10px', color: '#0f172a', marginBottom: '15px'}}>Semester Fee Projections</h3>
                <table style={ledgerTableStyle}>
                    <thead>
                        <tr>
                            <th style={ledgerThStyle}>S.No</th>
                            <th style={ledgerThStyle}>Programs</th>
                            <th style={ledgerThStyle}>Semester</th>
                            <th style={{...ledgerThStyle, textAlign: 'right'}}>Semester Fee</th>
                        </tr>
                    </thead>
                    <tbody>
                        {uniqueClasses.map((c, i) => (
                            <tr key={i} style={zebraRowStyle(i)}>
                                <td style={ledgerTdStyle()}>{i + 1}</td>
                                <td style={ledgerTdStyle(false, true)}>{c.program}</td>
                                <td style={ledgerTdStyle()}>{c.semester}</td>
                                <td style={ledgerTdStyle(true, true)}>Rs {c.semesterFee.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
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
                <button style={styles.tabButton(tsTab === 'ALL')} onClick={() => setTsTab('ALL')}>All Entries</button>
                <button style={styles.tabButton(tsTab === 'INCOME')} onClick={() => setTsTab('INCOME')}>Receipts Only</button>
                <button style={styles.tabButton(tsTab === 'EXPENSE')} onClick={() => setTsTab('EXPENSE')}>Payments Only</button>
            </div>
            <table style={ledgerTableStyle}>
                <thead>
                    <tr>
                        <th style={ledgerThStyle}>Date</th>
                        <th style={ledgerThStyle}>Voucher No</th>
                        <th style={ledgerThStyle}>Narration / Details</th>
                        <th style={{...ledgerThStyle, textAlign: 'right'}}>Amount (Rs)</th>
                    </tr>
                </thead>
                <tbody>
                    {displayTxns.map((t:any, idx: number) => (
                        <tr key={t.id} style={zebraRowStyle(idx)}>
                            <td style={ledgerTdStyle()}>{t.date}</td>
                            <td style={ledgerTdStyle()}><span style={{fontFamily: 'monospace', fontWeight: 600}}>{t.voucherNo}</span></td>
                            <td style={ledgerTdStyle()}>{t.description}</td>
                            <td style={ledgerTdStyle(true, true)}>{t.amount.toLocaleString()}</td>
                        </tr>
                    ))}
                    {displayTxns.length === 0 && <tr><td colSpan={4} style={{...ledgerTdStyle(), textAlign: 'center', padding: '40px', color: '#94a3b8'}}>No posted transactions for selected criteria.</td></tr>}
                </tbody>
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
             <div style={{fontWeight: 600, color: '#475569'}}>Summary View (Active Enrollment)</div>
         )}
         <div style={{marginLeft: 'auto', display: 'flex', gap: '10px'}}>
             {reportType === 'PL' && (
                 <>
                    <button style={{...styles.button("primary"), background: '#1e293b'}} onClick={() => handleExportPDF('printable-area', 'Profit_Loss_Report')}>
                        <span className="material-symbols-outlined">picture_as_pdf</span> Export PDF
                    </button>
                    <button style={{...styles.button("secondary"), background: '#166534', color: 'white'}} onClick={() => handleExportExcel('printable-area', 'Profit_Loss_Report')}>
                        <span className="material-symbols-outlined">table_chart</span> Excel
                    </button>
                 </>
             )}
            <button style={styles.button("secondary")} onClick={() => window.print()}><span className="material-symbols-outlined">print</span> Print</button>
         </div>
      </div>
      {content}
    </div>
  );
};
