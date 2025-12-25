
import React, { useState } from "react";
import { styles } from "./styles";
import { Budget, Transaction, MONTHS, Student, Campus } from "./types";

export const BudgetModule = ({ budgets = [], setBudgets, masterData, transactions = [], students = [] }: any) => {
    const [view, setView] = useState<"list" | "create" | "variance">("list");
    
    // Create Budget State
    const [newBudget, setNewBudget] = useState<Partial<Budget>>({ year: "2025", department: "", totalBudget: 0 });
    
    // Variance Report State
    const [varYear, setVarYear] = useState("2025");
    const [varDept, setVarDept] = useState("All");

    const handleCreate = () => {
        if(!newBudget.department || !newBudget.totalBudget) return alert("Please fill all fields");
        
        // Auto-distribute evenly
        const monthlyAmount = Math.floor(newBudget.totalBudget / 12);
        const allocations = MONTHS.map(m => ({ month: m, allocated: monthlyAmount }));
        
        // Add remainder to December
        const remainder = newBudget.totalBudget - (monthlyAmount * 12);
        allocations[11].allocated += remainder;

        const budget: Budget = {
            id: `BGT-${Date.now()}`,
            year: newBudget.year || "2025",
            department: newBudget.department,
            totalBudget: newBudget.totalBudget,
            allocations
        };

        setBudgets([...budgets, budget]);
        setNewBudget({ year: "2025", department: "", totalBudget: 0 });
        setView("list");
    };

    const handleDelete = (id: string) => {
        if(window.confirm("Delete Budget?")) {
            setBudgets(budgets.filter((b:Budget) => b.id !== id));
        }
    };

    const updateAllocation = (budgetId: string, monthIndex: number, newVal: number) => {
        const budget = budgets.find((b:Budget) => b.id === budgetId);
        if(!budget) return;
        
        const newAllocations = [...budget.allocations];
        newAllocations[monthIndex].allocated = newVal;
        
        const newTotal = newAllocations.reduce((acc, curr) => acc + curr.allocated, 0);
        
        const updatedBudget = { ...budget, allocations: newAllocations, totalBudget: newTotal };
        setBudgets(budgets.map((b:Budget) => b.id === budgetId ? updatedBudget : b));
    };

    // --- Variance Logic ---
    const getVarianceData = () => {
        const filteredBudgets = budgets.filter((b:Budget) => 
            b.year === varYear && (varDept === "All" || b.department === varDept)
        );

        return filteredBudgets.map((b:Budget) => {
            const rowData = b.allocations.map((alloc, idx) => {
                // Get actual expenses for this Department + Month + Year
                // Note: Transaction date is YYYY-MM-DD. Need to match Month name.
                const monthNum = idx + 1; // 1-12
                const monthStr = monthNum.toString().padStart(2, '0');
                const datePrefix = `${b.year}-${monthStr}`;
                
                const actual = transactions
                    .filter((t:Transaction) => 
                        t.department === b.department && 
                        t.date.startsWith(datePrefix) &&
                        (t.debitAccount.startsWith('5') || t.creditAccount.startsWith('1')) && // Expense logic: debit exp or credit cash linked to dept
                        t.type !== 'FEE' // Exclude fees
                    )
                    .reduce((acc:number, t:Transaction) => acc + t.amount, 0);

                const variance = alloc.allocated - actual;
                const variancePct = alloc.allocated > 0 ? (variance / alloc.allocated) * 100 : 0;
                
                return {
                    month: alloc.month,
                    allocated: alloc.allocated,
                    actual,
                    variance,
                    variancePct,
                    remaining: variance 
                };
            });

            // Calculate Totals
            const totalAllocated = rowData.reduce((a, r) => a + r.allocated, 0);
            const totalActual = rowData.reduce((a, r) => a + r.actual, 0);
            const totalVariance = totalAllocated - totalActual;
            const totalRemPct = totalAllocated > 0 ? (totalVariance / totalAllocated) * 100 : 0;

            return {
                budget: b,
                rows: rowData,
                totals: { allocated: totalAllocated, actual: totalActual, variance: totalVariance, remPct: totalRemPct }
            };
        });
    };

    const varianceReports = view === 'variance' ? getVarianceData() : [];

    // Calculate Campus Stats for Default View
    const campusStats = masterData.campuses.map((c: Campus) => {
        const studentsInCampus = students.filter((s: Student) => s.campus === c.name);
        const projectedRevenue = studentsInCampus.reduce((acc: number, s: Student) => acc + s.totalCourseFee, 0); // Or use semester fee if "Projected Revenue" means next sem
        return { name: c.name, revenue: projectedRevenue, count: studentsInCampus.length };
    });

    return (
        <div>
            <h2 style={{marginBottom: '5px'}}>Budget Management Module</h2>
            <p style={{color: '#64748b', marginBottom: '24px'}}>Create budgets, track allocations and monitor variance</p>

            <div className="no-print" style={{marginBottom: '20px', display: 'flex', gap: '10px'}}>
                <button style={styles.button(view === 'list' ? 'primary' : 'secondary')} onClick={() => setView('list')}>All Budgets</button>
                <button style={styles.button(view === 'create' ? 'primary' : 'secondary')} onClick={() => setView('create')}>Create New Budget</button>
                <button style={styles.button(view === 'variance' ? 'primary' : 'secondary')} onClick={() => setView('variance')}>Variance Reports</button>
            </div>

            {view === 'list' && (
                <div>
                    {/* Campus Wise Projected Revenue */}
                    <div style={{display: 'flex', gap: '20px', marginBottom: '30px', overflowX: 'auto'}}>
                        {campusStats.map((c: any) => (
                            <div key={c.name} style={{...styles.card, flex: 1, minWidth: '220px', marginBottom: 0, borderTop: '4px solid #4f46e5', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
                                <div>
                                    <div style={{fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase'}}>{c.name}</div>
                                    <div style={{fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', marginTop: '5px'}}>Rs {c.revenue.toLocaleString()}</div>
                                </div>
                                <div style={{fontSize: '0.8rem', color: '#64748b', marginTop: '10px'}}>{c.count} Students (Projected)</div>
                            </div>
                        ))}
                    </div>

                    <div style={styles.card}>
                        <h3 style={{margin: '0 0 15px 0'}}>Departmental Budgets</h3>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>Department</th>
                                    <th style={styles.th}>Year</th>
                                    <th style={{...styles.th, textAlign: 'right'}}>Total Budget</th>
                                    <th style={styles.th}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {budgets.map((b: Budget) => (
                                    <tr key={b.id}>
                                        <td style={styles.td}>{b.department}</td>
                                        <td style={styles.td}>{b.year}</td>
                                        <td style={{...styles.td, textAlign: 'right', fontWeight: 600}}>{b.totalBudget.toLocaleString()}</td>
                                        <td style={styles.td}>
                                            <button onClick={() => handleDelete(b.id)} style={{border: 'none', background: '#fee2e2', color: '#b91c1c', padding: '6px', borderRadius: '4px', cursor: 'pointer'}}>Delete</button>
                                        </td>
                                    </tr>
                                ))}
                                {budgets.length === 0 && <tr><td colSpan={4} style={{padding: '20px', textAlign: 'center', color: '#94a3b8'}}>No budgets defined</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {view === 'create' && (
                <div style={{...styles.card, maxWidth: '600px'}}>
                    <h3 style={{marginTop: 0}}>Create Annual Budget</h3>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                        <div>
                            <label style={styles.label}>Fiscal Year</label>
                            <select style={styles.input} value={newBudget.year} onChange={e => setNewBudget({...newBudget, year: e.target.value})}>
                                <option>2024</option>
                                <option>2025</option>
                                <option>2026</option>
                            </select>
                        </div>
                        <div>
                            <label style={styles.label}>Department</label>
                            <select style={styles.input} value={newBudget.department} onChange={e => setNewBudget({...newBudget, department: e.target.value})}>
                                <option value="">Select Department</option>
                                {masterData.departments.map((d:string) => <option key={d}>{d}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={styles.label}>Total Annual Amount</label>
                            <input type="number" style={styles.input} value={newBudget.totalBudget} onChange={e => setNewBudget({...newBudget, totalBudget: Number(e.target.value)})} />
                        </div>
                        <button style={styles.button("primary")} onClick={handleCreate}>Create & Auto-Distribute</button>
                    </div>
                </div>
            )}

            {view === 'variance' && (
                <div id="printable-area">
                    <div className="no-print" style={{...styles.card, padding: '15px', display: 'flex', gap: '15px', alignItems: 'center'}}>
                        <div>
                            <label style={styles.label}>Year</label>
                            <select style={{...styles.input, width: '120px'}} value={varYear} onChange={e => setVarYear(e.target.value)}>
                                <option>2024</option>
                                <option>2025</option>
                                <option>2026</option>
                            </select>
                        </div>
                        <div>
                            <label style={styles.label}>Department</label>
                            <select style={{...styles.input, width: '200px'}} value={varDept} onChange={e => setVarDept(e.target.value)}>
                                <option value="All">All Departments</option>
                                {masterData.departments.map((d:string) => <option key={d}>{d}</option>)}
                            </select>
                        </div>
                        <button style={{...styles.button("secondary"), marginLeft: 'auto'}} onClick={() => window.print()}>Print Report</button>
                    </div>

                    {varianceReports.map((rep: any) => (
                        <div key={rep.budget.id} style={{...styles.card, marginBottom: '30px'}}>
                            <div style={{display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', marginBottom: '15px'}}>
                                <h3 style={{margin: 0, color: '#0f172a'}}>{rep.budget.department} Budget Variance ({rep.budget.year})</h3>
                                <div style={{textAlign: 'right'}}>
                                    <div style={{fontSize: '0.8rem', color: '#64748b'}}>Total Remaining</div>
                                    <div style={{fontWeight: 700, color: rep.totals.remPct < 10 ? '#b91c1c' : '#166534'}}>
                                        {rep.totals.remPct < 10 && <span className="material-symbols-outlined" style={{fontSize: '16px', verticalAlign: 'middle', marginRight: '4px'}}>warning</span>}
                                        Rs {rep.totals.variance.toLocaleString()} ({rep.totals.remPct.toFixed(1)}%)
                                    </div>
                                </div>
                            </div>

                            <table style={styles.table}>
                                <thead>
                                    <tr style={{background: '#f8fafc'}}>
                                        <th style={styles.th}>Month</th>
                                        <th style={{...styles.th, textAlign: 'right'}}>Allocated</th>
                                        <th style={{...styles.th, textAlign: 'right'}}>Actual Expense</th>
                                        <th style={{...styles.th, textAlign: 'right'}}>Variance</th>
                                        <th style={{...styles.th, textAlign: 'right'}}>Var %</th>
                                        <th style={styles.th}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rep.rows.map((row: any, idx: number) => (
                                        <tr key={idx}>
                                            <td style={styles.td}>{row.month}</td>
                                            <td style={{...styles.td, textAlign: 'right'}}>
                                                <input 
                                                    className="no-print"
                                                    type="number" 
                                                    value={row.allocated} 
                                                    onChange={(e) => updateAllocation(rep.budget.id, idx, Number(e.target.value))}
                                                    style={{width: '80px', border: '1px solid #e2e8f0', padding: '2px', textAlign: 'right'}} 
                                                />
                                                <span style={{display: 'none'}} className="print-only">{row.allocated}</span>
                                            </td>
                                            <td style={{...styles.td, textAlign: 'right', color: '#be123c'}}>{row.actual.toLocaleString()}</td>
                                            <td style={{...styles.td, textAlign: 'right', fontWeight: 600, color: row.variance >= 0 ? '#166534' : '#b91c1c'}}>
                                                {row.variance.toLocaleString()}
                                            </td>
                                            <td style={{...styles.td, textAlign: 'right'}}>{row.variancePct.toFixed(1)}%</td>
                                            <td style={styles.td}>
                                                {row.remaining < (row.allocated * 0.1) && row.allocated > 0 ? (
                                                    <span style={{color: '#b91c1c', fontWeight: 700, fontSize: '0.75rem'}}>CRITICAL</span>
                                                ) : row.variance < 0 ? (
                                                    <span style={{color: '#b91c1c', fontSize: '0.75rem'}}>Over Budget</span>
                                                ) : (
                                                    <span style={{color: '#166534', fontSize: '0.75rem'}}>On Track</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    <tr style={{background: '#eff6ff', fontWeight: 700}}>
                                        <td style={styles.td}>TOTAL</td>
                                        <td style={{...styles.td, textAlign: 'right'}}>{rep.totals.allocated.toLocaleString()}</td>
                                        <td style={{...styles.td, textAlign: 'right', color: '#be123c'}}>{rep.totals.actual.toLocaleString()}</td>
                                        <td style={{...styles.td, textAlign: 'right', color: rep.totals.variance >= 0 ? '#166534' : '#b91c1c'}}>{rep.totals.variance.toLocaleString()}</td>
                                        <td style={{...styles.td, textAlign: 'right'}}>{rep.totals.remPct.toFixed(1)}%</td>
                                        <td style={styles.td}></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    ))}
                    <style>{`
                        @media print {
                            .no-print { display: none !important; }
                            .print-only { display: inline !important; }
                            input { border: none !important; background: transparent !important; }
                        }
                    `}</style>
                </div>
            )}
        </div>
    );
};
