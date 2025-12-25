import React, { useState } from "react";
import { styles } from "./styles";
import { Transaction, Account, Student, Campus, MONTHS } from "./types";

export const Dashboard = ({ transactions, accounts, students, masterData, currentUser }: { transactions: Transaction[], accounts: Account[], students: Student[], masterData: any, currentUser: string }) => {
  const [showDailyReport, setShowDailyReport] = useState(false);
  const postedTxns = transactions.filter(t => t.status === "Posted");

  const totalStudents = students.length;
  const cashInHand = postedTxns.reduce((acc, t) => {
    if (t.debitAccount === "1-01-001") return acc + t.amount;
    if (t.creditAccount === "1-01-001") return acc - t.amount;
    return acc;
  }, 0);

  const bankBalance = postedTxns.reduce((acc, t) => {
     let change = 0;
     if (t.debitAccount.startsWith("1-01") && t.debitAccount !== "1-01-001" && t.debitAccount !== "1-01-004") change += t.amount;
     if (t.creditAccount.startsWith("1-01") && t.creditAccount !== "1-01-001" && t.creditAccount !== "1-01-004") change -= t.amount;
     return acc + change;
  }, 0);
  
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthlyCollection = postedTxns
    .filter(t => t.date.startsWith(currentMonth) && (t.type === 'FEE' || t.type === 'FEE_RCV'))
    .reduce((acc, t) => acc + t.amount, 0);

  const totalReceivable = students.reduce((acc, s) => acc + (s.balance > 0 ? s.balance : 0), 0);

  const campusStats = masterData.campuses.map((campus: Campus) => {
    const campusStudents = students.filter(s => s.campus === campus.name);
    const studIds = campusStudents.map(s => s.admissionNo);
    const collected = postedTxns
      .filter(t => studIds.includes(t.studentId || "") && (t.type === 'FEE' || t.type === 'FEE_RCV'))
      .reduce((sum, t) => sum + t.amount, 0);
    const receivable = campusStudents.reduce((sum, s) => sum + s.balance, 0);
    
    return { campus: campus.name, students: campusStudents.length, collected, receivable };
  });

  // --- Graph Logic: Yearly Recovery ---
  const currentYear = new Date().getFullYear();
  const graphData = MONTHS.map((m, idx) => {
      const monthNum = (idx + 1).toString().padStart(2, '0');
      const total = postedTxns
          .filter(t => t.date.startsWith(`${currentYear}-${monthNum}`) && (t.type === 'FEE' || t.type === 'FEE_RCV'))
          .reduce((sum, t) => sum + t.amount, 0);
      return { month: m.substring(0, 3), amount: total };
  });

  const maxAmount = Math.max(...graphData.map(d => d.amount), 100000); 

  // Daily Report Dynamic Logic
  const today = new Date().toISOString().slice(0, 10);
  const todayTxns = postedTxns.filter(t => t.date === today);
  const getAccountName = (code: string) => accounts.find(a => a.code === code)?.name || code;

  const incomeAgg: Record<string, number> = {};
  const expenseAgg: Record<string, number> = {};

  todayTxns.forEach(t => {
      const isDrLiquid = t.debitAccount === "1-01-001" || (t.debitAccount.startsWith("1-01") && t.debitAccount !== "1-01-004");
      const isCrLiquid = t.creditAccount === "1-01-001" || (t.creditAccount.startsWith("1-01") && t.creditAccount !== "1-01-004");
      if (isDrLiquid) {
          let headName = getAccountName(t.creditAccount);
          if (t.details) {
              const dKeys = Object.keys(t.details).filter(k => t.details[k] > 0 && k !== 'hospitalName' && k !== 'fineType' && k !== 'dueDate' && k !== 'months');
              if(dKeys.length > 0) headName = dKeys.map(k => k.charAt(0).toUpperCase() + k.slice(1)).join(", ");
          }
          incomeAgg[headName] = (incomeAgg[headName] || 0) + t.amount;
      }
      if (isCrLiquid) {
          const headName = getAccountName(t.debitAccount);
          expenseAgg[headName] = (expenseAgg[headName] || 0) + t.amount;
      }
  });

  const totalReceiptsToday = Object.values(incomeAgg).reduce((a,b) => a+b, 0);
  const totalPaymentsToday = Object.values(expenseAgg).reduce((a,b) => a+b, 0);

  const handleExportPDF = () => {
    const element = document.getElementById('daily-report-content');
    if (!element) return;
    const opt = {
      margin: 10,
      filename: `GIMS_Daily_Report_${today}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    (window as any).html2pdf().from(element).set(opt).save();
  };

  return (
    <div>
      <div style={{marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px'}}>
         <h1 style={{margin: '0 0 5px 0', fontSize: '1.8rem', color: '#15803d', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px'}}>Ghazali Institute of Medical Sciences</h1>
         <h3 style={{margin: 0, color: '#334155', fontWeight: 500}}>Welcome, <span style={{color: '#15803d', fontWeight: 700}}>{currentUser}</span></h3>
      </div>
      
      <h2 style={{marginBottom: '10px'}}>Dashboard</h2>
      <p style={{color: '#64748b', marginBottom: '24px'}}>Overview of financial activities</p>

      <div style={{display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "20px"}}>
        <div style={styles.kpiCard("#3b82f6", "#eff6ff")}>
           <div>
             <div style={{fontSize: '0.8rem', color: '#3b82f6', fontWeight: 600}}>Total Students</div>
             <div style={{fontSize: '2rem', fontWeight: 700, color: '#1e3a8a'}}>{totalStudents}</div>
           </div>
           <div style={{alignSelf: 'flex-end', padding: '8px', background: '#dbeafe', borderRadius: '8px', color: '#3b82f6'}}>
             <span className="material-symbols-outlined">groups</span>
           </div>
        </div>
        <div style={styles.kpiCard("#8b5cf6", "#f5f3ff")}>
           <div>
             <div style={{fontSize: '0.8rem', color: '#8b5cf6', fontWeight: 600}}>Monthly Collection</div>
             <div style={{fontSize: '2rem', fontWeight: 700, color: '#5b21b6'}}>Rs {monthlyCollection.toLocaleString()}</div>
           </div>
           <div style={{alignSelf: 'flex-end', padding: '8px', background: '#ede9fe', borderRadius: '8px', color: '#8b5cf6'}}>
             <span className="material-symbols-outlined">calendar_month</span>
           </div>
        </div>
        <div style={styles.kpiCard("#f97316", "#ffedd5")}>
           <div>
             <div style={{fontSize: '0.8rem', color: '#c2410c', fontWeight: 600}}>Bank Balance</div>
             <div style={{fontSize: '2rem', fontWeight: 700, color: '#9a3412'}}>Rs {bankBalance.toLocaleString()}</div>
           </div>
           <div style={{alignSelf: 'flex-end', padding: '8px', background: '#fed7aa', borderRadius: '8px', color: '#f97316'}}>
             <span className="material-symbols-outlined">account_balance</span>
           </div>
        </div>
        <div style={styles.kpiCard("#10b981", "#ecfdf5")}>
           <div>
             <div style={{fontSize: '0.8rem', color: '#000', fontWeight: 600}}>Cash in Hand</div>
             <div style={{fontSize: '2rem', fontWeight: 700, color: '#000'}}>Rs {cashInHand.toLocaleString()}</div>
           </div>
           <div style={{alignSelf: 'flex-end', padding: '8px', background: '#d1fae5', borderRadius: '8px', color: '#10b981'}}>
             <span className="material-symbols-outlined">account_balance_wallet</span>
           </div>
        </div>
        <div style={{...styles.kpiCard("#f43f5e", "#fff1f2"), cursor: 'pointer'}} onClick={() => setShowDailyReport(true)}>
           <div>
             <div style={{fontSize: '0.8rem', color: '#f43f5e', fontWeight: 600}}>Daily Rcv/Pmt</div>
             <div style={{fontSize: '1.2rem', fontWeight: 700, color: '#9f1239'}}>Report</div>
             <div style={{fontSize: '0.7rem', color: '#be123c', marginTop: '4px'}}>Click to view</div>
           </div>
           <div style={{alignSelf: 'flex-end', padding: '8px', background: '#ffe4e6', borderRadius: '8px', color: '#f43f5e'}}>
             <span className="material-symbols-outlined">description</span>
           </div>
        </div>
      </div>

      {showDailyReport && (
         <div style={styles.modalOverlay}>
            <div style={{...styles.modalContent, width: '850px', padding: '0', overflow: 'hidden'}}>
               <div className="no-print" style={{padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc'}}>
                  <h3 style={{margin: 0}}>Daily Financial Report</h3>
                  <div style={{display: 'flex', gap: '10px'}}>
                     <button style={{...styles.button("primary"), background: '#1e293b'}} onClick={handleExportPDF}>
                        <span className="material-symbols-outlined">picture_as_pdf</span> Export PDF
                     </button>
                     <button style={styles.button("secondary")} onClick={() => window.print()}>
                        <span className="material-symbols-outlined">print</span> Print
                     </button>
                     <button style={{border: 'none', background: 'transparent', cursor: 'pointer'}} onClick={() => setShowDailyReport(false)}><span className="material-symbols-outlined">close</span></button>
                  </div>
               </div>
               
               <div id="daily-report-content" style={{padding: '40px', backgroundColor: 'white'}}>
                  <div style={{textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid #0f172a', paddingBottom: '20px'}}>
                      <h2 style={{margin: '0 0 5px 0', textTransform: 'uppercase', letterSpacing: '2px'}}>Ghazali Institute of Medical Sciences</h2>
                      <div style={{fontSize: '1.2rem', fontWeight: 600, color: '#475569'}}>Daily Receipt & Payment Summary</div>
                      <div style={{marginTop: '10px', fontSize: '0.9rem'}}>Date: <span style={{fontWeight: 700, color: '#0f172a'}}>{today}</span></div>
                  </div>

                  <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px'}}>
                     {/* Income Section */}
                     <div>
                        <h4 style={{borderBottom: '2px solid #166534', paddingBottom: '10px', color: '#166534', display: 'flex', alignItems: 'center', gap: '8px'}}>
                           <span className="material-symbols-outlined">arrow_downward</span> Income (Receipts)
                        </h4>
                        <table style={{width: '100%', borderCollapse: 'collapse'}}>
                           <tbody>
                              {Object.entries(incomeAgg).map(([head, amount]) => (
                                  <tr key={head} style={{borderBottom: '1px solid #f1f5f9'}}>
                                      <td style={{padding: '12px 0', color: '#334155'}}>{head}</td>
                                      <td style={{textAlign: 'right', padding: '12px 0', fontWeight: 600}}>Rs {amount.toLocaleString()}</td>
                                  </tr>
                              ))}
                              <tr style={{background: '#f0fdf4'}}>
                                  <td style={{padding: '12px 10px', fontWeight: 700}}>Total Receipts</td>
                                  <td style={{textAlign: 'right', padding: '12px 10px', fontWeight: 700, color: '#166534'}}>Rs {totalReceiptsToday.toLocaleString()}</td>
                              </tr>
                           </tbody>
                        </table>
                     </div>

                     {/* Expense Section */}
                     <div>
                        <h4 style={{borderBottom: '2px solid #b91c1c', paddingBottom: '10px', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '8px'}}>
                           <span className="material-symbols-outlined">arrow_upward</span> Expenses (Payments)
                        </h4>
                        <table style={{width: '100%', borderCollapse: 'collapse'}}>
                           <tbody>
                              {Object.entries(expenseAgg).map(([head, amount]) => (
                                  <tr key={head} style={{borderBottom: '1px solid #f1f5f9'}}>
                                      <td style={{padding: '12px 0', color: '#334155'}}>{head}</td>
                                      <td style={{textAlign: 'right', padding: '12px 0', fontWeight: 600}}>Rs {amount.toLocaleString()}</td>
                                  </tr>
                              ))}
                              <tr style={{background: '#fef2f2'}}>
                                  <td style={{padding: '12px 10px', fontWeight: 700}}>Total Payments</td>
                                  <td style={{textAlign: 'right', padding: '12px 10px', fontWeight: 700, color: '#b91c1c'}}>Rs {totalPaymentsToday.toLocaleString()}</td>
                              </tr>
                           </tbody>
                        </table>
                     </div>
                  </div>

                  <div style={{marginTop: '40px', padding: '25px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                     <div>
                        <div style={{fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Net Day Cash Position</div>
                        <div style={{fontSize: '1.8rem', fontWeight: 800, color: '#0f172a'}}>Rs {(totalReceiptsToday - totalPaymentsToday).toLocaleString()}</div>
                     </div>
                     <div style={{textAlign: 'right'}}>
                        <div style={{fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Closing Cash Balance</div>
                        <div style={{fontSize: '1.8rem', fontWeight: 800, color: '#1d4ed8'}}>Rs {cashInHand.toLocaleString()}</div>
                     </div>
                  </div>

                  <div style={{marginTop: '60px', display: 'flex', justifyContent: 'space-between'}}>
                      <div style={{textAlign: 'center', width: '200px'}}><div style={{borderBottom: '1px solid #cbd5e1', marginBottom: '5px'}}></div><div style={{fontSize: '0.8rem'}}>Cashier Signature</div></div>
                      <div style={{textAlign: 'center', width: '200px'}}><div style={{borderBottom: '1px solid #cbd5e1', marginBottom: '5px'}}></div><div style={{fontSize: '0.8rem'}}>Finance Manager</div></div>
                  </div>
               </div>
            </div>
         </div>
      )}

      <div style={{marginTop: '30px'}}>
        <h3 style={{display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', color: '#0f172a'}}>
          <span className="material-symbols-outlined" style={{color: '#059669'}}>domain</span> Campus Wise Recovery
        </h3>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '15px'}}>
           {campusStats.map((stat: any) => (
             <div key={stat.campus} style={styles.card}>
                <h4 style={{margin: '0 0 15px 0', color: '#334155'}}>{stat.campus}</h4>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem'}}>
                   <span style={{color: '#64748b'}}>Students</span>
                   <span style={{fontWeight: 600}}>{stat.students}</span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem'}}>
                   <span style={{color: '#64748b'}}>Collected</span>
                   <span style={{fontWeight: 600, color: '#059669'}}>Rs {stat.collected.toLocaleString()}</span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem'}}>
                   <span style={{color: '#64748b'}}>Receivable</span>
                   <span style={{fontWeight: 600, color: '#ef4444'}}>Rs {stat.receivable.toLocaleString()}</span>
                </div>
             </div>
           ))}
        </div>
      </div>

      {/* NEW: Yearly Recovery Trend Graph */}
      <div style={{marginTop: '10px', ...styles.card, padding: '30px'}}>
         <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px'}}>
            <h3 style={{margin: '0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '10px', color: '#1e293b'}}>
                <span className="material-symbols-outlined" style={{color: '#4f46e5'}}>analytics</span> 
                Annual Recovery Trend ({currentYear})
            </h3>
            <div style={{display: 'flex', gap: '15px', fontSize: '0.8rem', fontWeight: 600}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}><div style={{width: '12px', height: '12px', borderRadius: '3px', background: 'linear-gradient(to top, #4f46e5, #10b981)'}}></div> Fee Collection</div>
            </div>
         </div>

         <div style={{height: '350px', position: 'relative', width: '100%', display: 'flex', alignItems: 'flex-end', paddingBottom: '30px', paddingLeft: '50px', boxSizing: 'border-box'}}>
            {/* Y-Axis Labels */}
            <div style={{position: 'absolute', left: 0, top: 0, bottom: '30px', width: '45px', display: 'flex', flexDirection: 'column-reverse', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'right', paddingRight: '10px'}}>
                <span>0</span>
                <span>{(maxAmount * 0.25).toLocaleString()}</span>
                <span>{(maxAmount * 0.5).toLocaleString()}</span>
                <span>{(maxAmount * 0.75).toLocaleString()}</span>
                <span>{maxAmount.toLocaleString()}</span>
            </div>

            {/* Grid Lines */}
            <div style={{position: 'absolute', left: '50px', right: 0, top: 0, bottom: '30px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', zIndex: 0}}>
                {[0, 1, 2, 3, 4].map(i => <div key={i} style={{width: '100%', height: '1px', background: '#f1f5f9'}}></div>)}
            </div>

            {/* Bars */}
            <div style={{display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', width: '100%', height: '100%', zIndex: 1}}>
                {graphData.map((d, i) => {
                    const heightPct = (d.amount / maxAmount) * 100;
                    return (
                        <div key={i} style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', position: 'relative'}}>
                            <div 
                                title={`${d.month}: Rs ${d.amount.toLocaleString()}`}
                                style={{
                                    width: '40%', 
                                    height: `${heightPct}%`, 
                                    background: 'linear-gradient(to top, #4f46e5, #10b981)',
                                    borderRadius: '6px 6px 0 0',
                                    transition: 'all 0.3s ease',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                    minHeight: d.amount > 0 ? '4px' : '0'
                                }}
                                onMouseOver={(e) => (e.currentTarget.style.filter = 'brightness(1.1)')}
                                onMouseOut={(e) => (e.currentTarget.style.filter = 'none')}
                            ></div>
                            <div style={{position: 'absolute', bottom: '-25px', fontSize: '0.75rem', fontWeight: 600, color: '#64748b'}}>{d.month}</div>
                        </div>
                    )
                })}
            </div>
         </div>
      </div>
    </div>
  );
};