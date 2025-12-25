
import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { styles } from "./styles";
import { 
  Transaction, Student, Account, User, Employee, Budget, InventoryItem, InventoryIssuance, SMSLog, FeeStructure,
  INITIAL_PROGRAMS, INITIAL_SEMESTERS, INITIAL_BOARDS, INITIAL_CAMPUSES, INITIAL_ROLES, 
  INITIAL_ACCOUNTS, INITIAL_STUDENTS_DATA, INITIAL_USERS, INITIAL_SESSIONS, Campus, INITIAL_DEPARTMENTS, INITIAL_EMPLOYEES_DATA, INITIAL_INVENTORY, INITIAL_INVENTORY_CATEGORIES, INITIAL_TRANSACTIONS, StudentAttendance, EmployeeAttendance, INITIAL_FEE_STRUCTURES
} from "./types";

import { Dashboard } from "./Dashboard";
import { StudentBiodata } from "./StudentBiodata";
import { CashBook } from "./CashBook";
import { VoucherSystem } from "./VoucherSystem";
import { FeeCollection } from "./FeeCollection";
import { StudentLedger } from "./StudentLedger";
import { FeeGenerationModule } from "./FeeGenerationModule";
import { ReportsModule } from "./ReportsModule";
import { FinancialStatements } from "./FinancialStatements";
import { ChartOfAccounts } from "./ChartOfAccounts";
import { Approvals } from "./Approvals";
import { MasterDataManager } from "./MasterDataManager";
import { AccessControl } from "./AccessControl";
import { DataImport } from "./DataImport";
import { HistoryModule } from "./HistoryModule";
import { HRModule } from "./HRModule";
import { BudgetModule } from "./BudgetModule";
import { InventoryModule } from "./InventoryModule";
import { FaceRecognitionScanner } from "./FaceRecognitionScanner";
import { PromotionModule } from "./PromotionModule";
import { Login } from "./Login";
import { SMSModule } from "./SMSModule";

// --- Trial & Expiry Component ---
const TrialLockScreen = ({ daysLeft }: { daysLeft: number }) => (
  <div style={{
    height: '100vh', width: '100vw', background: '#0f172a', display: 'flex', 
    justifyContent: 'center', alignItems: 'center', fontFamily: "'Inter', sans-serif"
  }}>
    <div style={{
      background: 'white', padding: '50px', borderRadius: '24px', textAlign: 'center',
      maxWidth: '500px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
    }}>
      <div style={{
        width: '80px', height: '80px', background: '#fee2e2', color: '#ef4444',
        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 20px auto'
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: '48px' }}>lock</span>
      </div>
      <h1 style={{ color: '#0f172a', margin: '0 0 10px 0' }}>Trial Period Expired</h1>
      <p style={{ color: '#64748b', fontSize: '1.1rem', lineHeight: '1.6' }}>
        Aap ka trial period khatam ho chuka hai. 
        Software ko mazeed istemal karne ke liye administrator se raabta karein aur full version purchase karein.
      </p>
      <div style={{ 
        marginTop: '30px', padding: '20px', background: '#f8fafc', 
        borderRadius: '12px', border: '1px solid #e2e8f0' 
      }}>
        <div style={{ fontWeight: 700, color: '#334155', marginBottom: '5px' }}>Contact for Activation:</div>
        <div style={{ color: '#4f46e5', fontSize: '1.2rem', fontWeight: 600 }}>+92 3XX XXXXXXX</div>
        <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '10px' }}>System ID: {localStorage.getItem('gims_sys_id')}</div>
      </div>
    </div>
  </div>
);

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [reportSubTab, setReportSubTab] = useState<string | null>(null);
  const [finSubTab, setFinSubTab] = useState<string | null>(null);
  const [hrSubTab, setHrSubTab] = useState<string | null>(null);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  const [userRole, setUserRole] = useState("Admin");
  const [roles, setRoles] = useState(INITIAL_ROLES);

  const [isTrialExpired, setIsTrialExpired] = useState(false);
  const [remainingDays, setRemainingDays] = useState(7);
  
  const [masterData, setMasterData] = useState({
     campuses: INITIAL_CAMPUSES,
     boards: INITIAL_BOARDS,
     programs: INITIAL_PROGRAMS,
     semesters: INITIAL_SEMESTERS,
     sessions: INITIAL_SESSIONS,
     departments: INITIAL_DEPARTMENTS,
     inventoryCategories: INITIAL_INVENTORY_CATEGORIES
  });

  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS_DATA);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES_DATA);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [issuances, setIssuances] = useState<InventoryIssuance[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [studentAttendance, setStudentAttendance] = useState<StudentAttendance[]>([]);
  const [employeeAttendance, setEmployeeAttendance] = useState<EmployeeAttendance[]>([]);
  const [smsHistory, setSmsHistory] = useState<SMSLog[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>(INITIAL_FEE_STRUCTURES);

  const [permissions, setPermissions] = useState<any>({
     "Admin": { dashboard: true, cashbook: true, reports: true, vouchers: true, fees: true, bulk: true, ledger: true, students: true, promotion: true, accounts: true, approvals: true, master: true, access: true, import: true, history: true, financial: true, hr: true, budget: true, inventory: true, scanner: true, sms: true, settings: true },
     "Finance Manager": { dashboard: true, cashbook: true, reports: true, vouchers: true, fees: true, bulk: true, ledger: true, students: true, promotion: true, accounts: true, approvals: true, master: true, access: false, import: true, history: true, financial: true, hr: true, budget: true, inventory: true, scanner: true, sms: true, settings: true },
     "Accountant": { dashboard: true, cashbook: true, reports: true, vouchers: true, fees: true, bulk: false, ledger: true, students: false, promotion: false, accounts: false, approvals: false, master: false, access: false, import: false, history: false, financial: false, hr: false, budget: false, inventory: true, scanner: false, sms: false, settings: true },
     "Cashier": { dashboard: false, cashbook: false, reports: false, vouchers: false, fees: true, bulk: false, ledger: false, students: false, promotion: false, accounts: false, approvals: false, master: false, access: false, import: false, history: false, financial: false, hr: false, budget: false, inventory: false, scanner: false, sms: false, settings: true }
  });

  // --- Real SMS Integration Function ---
  const sendRealSMS = async (number: string, message: string) => {
      console.log(`[SMS-LOG] To: ${number}, Msg: ${message}`);
  };

  useEffect(() => {
    const sysIdKey = 'gims_sys_id';
    if (!localStorage.getItem(sysIdKey)) {
      localStorage.setItem(sysIdKey, Date.now().toString());
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const userObj = users.find(u => u.username === currentUser);
      if (userRole === "Admin" || (userObj && userObj.isTrialUser === false)) {
        setIsTrialExpired(false);
        setRemainingDays(999);
        return;
      }
      const TRIAL_PERIOD_DAYS = 7;
      const startTime = parseInt(localStorage.getItem('gims_sys_id') || Date.now().toString());
      const currentTime = Date.now();
      const diffMs = currentTime - startTime;
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      if (diffDays > TRIAL_PERIOD_DAYS) setIsTrialExpired(true);
      else setRemainingDays(Math.ceil(TRIAL_PERIOD_DAYS - diffDays));
    }
  }, [isAuthenticated, currentUser, userRole, users]);

  useEffect(() => {
    const load = (key: string, setter: Function) => {
        const saved = localStorage.getItem(`gims_${key}`);
        if(saved) {
            try { setter(JSON.parse(saved)); } catch(e) { console.error("Error loading "+key, e); }
        }
    };
    load("masterData", setMasterData);
    load("students", setStudents);
    load("transactions", setTransactions);
    load("employees", setEmployees);
    load("accounts", setAccounts);
    load("users", setUsers);
    load("roles", setRoles);
    load("permissions", setPermissions);
    load("budgets", setBudgets);
    load("inventory", setInventory);
    load("issuances", setIssuances);
    load("auditLogs", setAuditLogs);
    load("studentAttendance", setStudentAttendance);
    load("employeeAttendance", setEmployeeAttendance);
    load("smsHistory", setSmsHistory);
    load("feeStructures", setFeeStructures);
  }, []);

  useEffect(() => { localStorage.setItem("gims_masterData", JSON.stringify(masterData)); }, [masterData]);
  useEffect(() => { localStorage.setItem("gims_students", JSON.stringify(students)); }, [students]);
  useEffect(() => { localStorage.setItem("gims_transactions", JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem("gims_employees", JSON.stringify(employees)); }, [employees]);
  useEffect(() => { localStorage.setItem("gims_accounts", JSON.stringify(accounts)); }, [accounts]);
  useEffect(() => { localStorage.setItem("gims_users", JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem("gims_roles", JSON.stringify(roles)); }, [roles]);
  useEffect(() => { localStorage.setItem("gims_permissions", JSON.stringify(permissions)); }, [permissions]);
  useEffect(() => { localStorage.setItem("gims_budgets", JSON.stringify(budgets)); }, [budgets]);
  useEffect(() => { localStorage.setItem("gims_inventory", JSON.stringify(inventory)); }, [inventory]);
  useEffect(() => { localStorage.setItem("gims_issuances", JSON.stringify(issuances)); }, [issuances]);
  useEffect(() => { localStorage.setItem("gims_auditLogs", JSON.stringify(auditLogs)); }, [auditLogs]);
  useEffect(() => { localStorage.setItem("gims_studentAttendance", JSON.stringify(studentAttendance)); }, [studentAttendance]);
  useEffect(() => { localStorage.setItem("gims_employeeAttendance", JSON.stringify(employeeAttendance)); }, [employeeAttendance]);
  useEffect(() => { localStorage.setItem("gims_smsHistory", JSON.stringify(smsHistory)); }, [smsHistory]);
  useEffect(() => { localStorage.setItem("gims_feeStructures", JSON.stringify(feeStructures)); }, [feeStructures]);

  const handlePostTransaction = (t: Transaction) => {
    let finalStatus: "Posted" | "Pending" = "Posted";
    if (userRole === "Cashier" || userRole === "Accountant") {
       finalStatus = "Pending";
       alert("Transaction sent for approval");
    } else {
       finalStatus = "Posted";
    }

    if (finalStatus === "Posted") {
       if (t.type === 'FEE_DUE' && t.studentId) {
          setStudents(prev => prev.map(s => s.admissionNo === t.studentId ? { ...s, balance: s.balance + t.amount } : s));
       } 
       else if ((t.type === 'FEE_RCV' || t.type === 'FEE') && t.studentId) {
          setStudents(prev => {
              const updated = prev.map(s => s.admissionNo === t.studentId ? { ...s, balance: s.balance - t.amount } : s);
              const target = updated.find(s => s.admissionNo === t.studentId);
              if (target && target.smsNumber) {
                  const msg = `Dear ${target.name}, Rs. ${t.amount} deposit successfully. New Balance: Rs. ${target.balance}. GIMS.`;
                  sendRealSMS(target.smsNumber, msg);
                  // Log auto-fee SMS to history
                  const now = new Date();
                  setSmsHistory(prevHist => [{
                      id: `AUTO-FEE-${Date.now()}`,
                      date: now.toISOString().slice(0, 10),
                      time: now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                      studentName: target.name,
                      admissionNo: target.admissionNo,
                      phone: target.smsNumber,
                      message: msg,
                      status: "Sent Successfully"
                  }, ...prevHist]);
              }
              return updated;
          });
       }
    }
    setTransactions(prev => [...prev, { ...t, status: finalStatus, recordedBy: currentUser || userRole }]);
  };

  const handleUpdateTransaction = (oldTxn: Transaction, newTxn: Transaction) => {
     setTransactions(prev => prev.map(t => t.id === oldTxn.id ? newTxn : t));
     let extraInfo = "";
     if(oldTxn.studentId) {
         const student = students.find(s => s.admissionNo === oldTxn.studentId);
         if(student) extraInfo = `${student.name} s/o ${student.fatherName}`;
     }
     setAuditLogs(prev => [...prev, { id: Date.now(), action: "Edit", refId: oldTxn.voucherNo || oldTxn.id, user: userRole, date: new Date().toLocaleString(), extraInfo: extraInfo }]);
  };

  const handleDeleteTransaction = (txn: Transaction, isRequest: boolean = false) => {
     if (isRequest) {
        setTransactions(prev => prev.map(t => t.id === txn.id ? { ...t, status: 'DeletePending' } : t));
        alert("Deletion requested. Sent to Finance Manager for approval.");
     } else {
        setTransactions(prev => prev.filter(t => t.id !== txn.id));
        let extraInfo = "";
        if(txn.studentId) {
            const student = students.find(s => s.admissionNo === txn.studentId);
            if(student) extraInfo = `${student.name} s/o ${student.fatherName}`;
        }
        setAuditLogs(prev => [...prev, { id: Date.now(), action: "Delete", refId: txn.voucherNo || txn.id, user: userRole, date: new Date().toLocaleString(), extraInfo: extraInfo }]);
     }
  };

  const handleApprove = (id: string) => {
     const txn = transactions.find(t => t.id === id);
     if(txn) {
        const updated = { ...txn, status: "Posted" as const };
        setTransactions(prev => prev.map(t => t.id === id ? updated : t));
        if(updated.type === 'FEE_DUE' && updated.studentId) {
            setStudents(prev => prev.map(s => s.admissionNo === updated.studentId ? { ...s, balance: s.balance + updated.amount } : s));
        } else if ((updated.type === 'FEE_RCV' || updated.type === 'FEE') && updated.studentId) {
            setStudents(prev => {
                const newList = prev.map(s => s.admissionNo === updated.studentId ? { ...s, balance: s.balance - updated.amount } : s);
                const s = newList.find(st => st.admissionNo === updated.studentId);
                if (s && s.smsNumber) {
                    const msg = `Transaction Approved: Rs. ${updated.amount} received. New Balance: Rs. ${s.balance}. Regards GIMS Admin.`;
                    sendRealSMS(s.smsNumber, msg);
                    const now = new Date();
                    setSmsHistory(prevHist => [{
                        id: `AUTO-APP-${Date.now()}`,
                        date: now.toISOString().slice(0, 10),
                        time: now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                        studentName: s.name,
                        admissionNo: s.admissionNo,
                        phone: s.smsNumber,
                        message: msg,
                        status: "Sent Successfully"
                    }, ...prevHist]);
                }
                return newList;
            });
        }
     }
  };

  const handleAddAccount = (acc: any) => {
     setAccounts([...accounts, acc]);
     if(acc.openingBalance > 0) {
        const t: Transaction = {
           id: `OP-${Date.now()}`, voucherNo: `JV-OPEN`, date: new Date().toISOString().slice(0, 10),
           type: 'JV', description: `Opening Balance - ${acc.name}`,
           debitAccount: acc.category === 'Asset' || acc.category === 'Expense' ? acc.code : '3-01-001', 
           creditAccount: acc.category === 'Asset' || acc.category === 'Expense' ? '3-01-001' : acc.code,
           amount: acc.openingBalance, status: 'Posted'
        };
        setTransactions(prev => [...prev, t]);
     }
  };

  const handleImportStudents = (data: any[]) => {
     const newStudents = data.map((d: any) => ({ ...d, balance: Number(d.balance || 0), tuitionFee: Number(d.tuitionFee || 0), admissionFee: Number(d.admissionFee || 0), miscCharges: Number(d.miscCharges || 0), affiliationFee: Number(d.affiliationFee || 0), totalCourseFee: Number(d.totalCourseFee || 0) }));
     setStudents(prev => [...prev, ...newStudents]);
  };

  const handleImportAccounts = (data: any[]) => {
     const newAccs = data.map((d: any) => ({ ...d, level: Number(d.level) }));
     setAccounts(prev => [...prev, ...newAccs]);
  };

  const updateMasterData = (key: string, val: any) => {
     setMasterData(prev => ({ ...prev, [key]: val }));
  };

  const handleLogin = (role: string, username: string) => {
      setUserRole(role); setCurrentUser(username); setIsAuthenticated(true);
  };

  const handleLogout = () => {
      setIsAuthenticated(false); setCurrentUser(""); setActiveTab("dashboard");
      setIsTrialExpired(false);
  };

  const SettingsComponent = () => {
      const [currentPass, setCurrentPass] = useState("");
      const [newPass, setNewPass] = useState("");
      const handleChangePassword = () => {
          if (!currentPass || !newPass) return alert("Please enter both current and new passwords");
          const user = users.find(u => u.username === currentUser);
          if (user) {
              if(user.password === currentPass) {
                  const updatedUsers = [...users];
                  const idx = updatedUsers.findIndex(u => u.username === currentUser);
                  updatedUsers[idx] = { ...user, password: newPass };
                  setUsers(updatedUsers);
                  alert("Password updated successfully!");
                  setCurrentPass(""); setNewPass("");
              } else { alert("Incorrect current password."); }
          }
      };
      return (
        <div style={styles.card}>
            <h2 style={{marginBottom: '20px', color: '#000'}}>Settings</h2>
            <div style={{marginBottom: '30px'}}>
                <h3 style={{color: '#000', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '20px'}}>Account Settings</h3>
                <div style={styles.grid2}>
                    <div><label style={styles.label}>Current Password</label><input type="password" style={styles.input} placeholder="********" value={currentPass} onChange={e => setCurrentPass(e.target.value)} /></div>
                    <div><label style={styles.label}>New Password</label><input type="password" style={styles.input} placeholder="********" value={newPass} onChange={e => setNewPass(e.target.value)} /></div>
                </div>
                <button style={{...styles.button("primary"), marginTop: '15px'}} onClick={handleChangePassword}>Update Password</button>
            </div>
            <div>
                <h3 style={{color: '#000', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '20px'}}>Logout</h3>
                <button style={styles.button("danger")} onClick={handleLogout}>Logout</button>
            </div>
        </div>
      );
  };

  const renderContent = () => {
    switch(activeTab) {
      case "dashboard": return <Dashboard transactions={transactions} accounts={accounts} students={students} masterData={masterData} currentUser={currentUser || userRole} />;
      case "students": return <StudentBiodata students={students} onAddStudent={(s: Student) => setStudents([...students, s])} onDeleteStudent={(id: string) => setStudents(students.filter(s => s.admissionNo !== id))} onUpdateStudent={(s: Student) => setStudents(students.map(st => st.admissionNo === s.admissionNo ? s : st))} masterData={masterData} currentUser={currentUser || userRole} feeStructures={feeStructures} />;
      case "promotion": return <PromotionModule students={students} onUpdateStudents={setStudents} masterData={masterData} />;
      case "cashbook": return <CashBook transactions={transactions} students={students} accounts={accounts} masterData={masterData} userRole={userRole} onDelete={handleDeleteTransaction} onUpdate={handleUpdateTransaction} />;
      case "vouchers": return <VoucherSystem onPostTransaction={handlePostTransaction} accounts={accounts} transactions={transactions} onDelete={handleDeleteTransaction} onUpdate={handleUpdateTransaction} masterData={masterData} userRole={userRole} />;
      case "fees": return <FeeCollection students={students} onCollectFee={handlePostTransaction} masterData={masterData} accounts={accounts} currentUser={currentUser} />;
      case "ledger": return <StudentLedger students={students} transactions={transactions} masterData={masterData} />;
      case "bulk": return <FeeGenerationModule students={students} onGenerate={(txns: Transaction[]) => { txns.forEach(t => handlePostTransaction(t)); }} masterData={masterData} transactions={transactions} />;
      case "reports": return <ReportsModule students={students} transactions={transactions} masterData={masterData} subTab={reportSubTab} currentUser={currentUser || userRole} studentAttendance={studentAttendance} setStudentAttendance={setStudentAttendance} />;
      case "financial": return <FinancialStatements transactions={transactions} accounts={accounts} students={students} masterData={masterData} subTab={finSubTab} />;
      case "accounts": return <ChartOfAccounts accounts={accounts} onAddAccount={handleAddAccount} />;
      case "approvals": return <Approvals transactions={transactions} onApprove={handleApprove} onDelete={handleDeleteTransaction} onUpdate={handleUpdateTransaction} students={students} accounts={accounts} />;
      case "master": return <MasterDataManager data={masterData} onUpdate={updateMasterData} students={students} users={users} onUpdateUsers={setUsers} roles={roles} onUpdateRoles={setRoles} feeStructures={feeStructures} onUpdateFeeStructures={setFeeStructures} />;
      case "access": return <AccessControl permissions={permissions} onUpdate={setPermissions} roles={roles} />;
      case "import": return <DataImport onImportStudents={handleImportStudents} onImportAccounts={handleImportAccounts} />;
      case "history": return <HistoryModule logs={auditLogs} />;
      case "hr": return <HRModule employees={employees} onAddEmployee={(e: Employee) => setEmployees([...employees, e])} onUpdateEmployee={(e: Employee) => setEmployees(employees.map(emp => emp.id === e.id ? e : emp))} onDeleteEmployee={(id: string) => setEmployees(employees.filter(e => e.id !== id))} masterData={masterData} onPostPayroll={handlePostTransaction} onUpdateMasterData={updateMasterData} employeeAttendance={employeeAttendance} setEmployeeAttendance={setEmployeeAttendance} subTab={hrSubTab} />;
      case "budget": return <BudgetModule budgets={budgets} setBudgets={setBudgets} masterData={masterData} transactions={transactions} students={students} />;
      case "inventory": return <InventoryModule inventory={inventory} setInventory={setInventory} issuances={issuances} setIssuances={setIssuances} employees={employees} masterData={masterData} currentUser={currentUser || userRole} onUpdateMasterData={updateMasterData} />;
      case "scanner": return <FaceRecognitionScanner students={students} userRole={userRole} />;
      case "sms": return <SMSModule students={students} masterData={masterData} smsHistory={smsHistory} setSmsHistory={setSmsHistory} />;
      case "settings": return <SettingsComponent />;
      default: return <Dashboard transactions={transactions} accounts={accounts} students={students} masterData={masterData} currentUser={currentUser || userRole} />;
    }
  };

  const checkPerm = (mod: string) => {
     return permissions[userRole]?.[mod];
  };

  if (isTrialExpired) {
    return (
       <div style={{position:'relative'}}>
          <TrialLockScreen daysLeft={0} />
          <button 
             onClick={handleLogout} 
             style={{position:'absolute', top: '20px', right: '20px', ...styles.button("secondary")}}
          >Logout</button>
       </div>
    );
  }

  if (!isAuthenticated) {
      return <Login onLogin={handleLogin} users={users} />;
  }

  return (
    <div style={styles.appContainer}>
      <div style={styles.sidebar}>
        <div style={styles.brand}>
          <span className="material-symbols-outlined">account_balance</span>
          <div style={{display:'flex', flexDirection:'column'}}>
             <span style={{fontSize: '1.5rem', fontWeight: 800, letterSpacing: '2px'}}>GIMS</span>
          </div>
        </div>
        <div style={{padding: '0 16px', marginBottom: '20px'}}>
           <div style={{padding: '12px', background: '#1e293b', borderRadius: '8px', border: '1px solid #334155'}}>
               <div style={{fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px'}}>Logged in as</div>
               <div style={{color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px'}}>
                   <div style={{width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e'}}></div>
                   {userRole}
               </div>
               <div style={{fontSize: '0.8rem', color: '#64748b', marginTop: '2px'}}>@{currentUser}</div>
           </div>
        </div>
        <div style={styles.nav}>
          {checkPerm("dashboard") && <div style={styles.navItem(activeTab === "dashboard")} onClick={() => { setActiveTab("dashboard"); setExpandedMenu(null); }}><span className="material-symbols-outlined">dashboard</span> Dashboard</div>}
          {checkPerm("cashbook") && <div style={styles.navItem(activeTab === "cashbook")} onClick={() => { setActiveTab("cashbook"); setExpandedMenu(null); }}><span className="material-symbols-outlined">menu_book</span> Cash Book</div>}
          {checkPerm("students") && <div style={styles.navItem(activeTab === "students")} onClick={() => { setActiveTab("students"); setExpandedMenu(null); }}><span className="material-symbols-outlined">school</span> Student Biodata</div>}
          {checkPerm("promotion") && <div style={styles.navItem(activeTab === "promotion")} onClick={() => { setActiveTab("promotion"); setExpandedMenu(null); }}><span className="material-symbols-outlined">upgrade</span> Promotion</div>}
          {checkPerm("scanner") && <div style={styles.navItem(activeTab === "scanner")} onClick={() => { setActiveTab("scanner"); setExpandedMenu(null); }}><span className="material-symbols-outlined">face</span> Security Scanner</div>}
          {checkPerm("sms") && <div style={styles.navItem(activeTab === "sms")} onClick={() => { setActiveTab("sms"); setExpandedMenu(null); }}><span className="material-symbols-outlined">sms</span> SMS Center</div>}
          {checkPerm("fees") && <div style={styles.navItem(activeTab === "fees")} onClick={() => { setActiveTab("fees"); setExpandedMenu(null); }}><span className="material-symbols-outlined">payments</span> Fee Collection</div>}
          {checkPerm("ledger") && <div style={styles.navItem(activeTab === "ledger")} onClick={() => { setActiveTab("ledger"); setExpandedMenu(null); }}><span className="material-symbols-outlined">history_edu</span> Student Ledger</div>}
          {checkPerm("bulk") && <div style={styles.navItem(activeTab === "bulk")} onClick={() => { setActiveTab("bulk"); setExpandedMenu(null); }}><span className="material-symbols-outlined">playlist_add_check</span> Fee Generation</div>}
          
          {checkPerm("reports") && (
             <>
               <div style={{...styles.navItem(activeTab === "reports"), justifyContent: 'space-between'}} onClick={() => setExpandedMenu(expandedMenu === 'reports' ? null : 'reports')}>
                  <div style={{display:'flex', gap:'12px', alignItems:'center'}}><span className="material-symbols-outlined">summarize</span> Reports</div>
                  <span className="material-symbols-outlined" style={{fontSize: '18px'}}>{expandedMenu === 'reports' ? 'expand_less' : 'expand_more'}</span>
               </div>
               {expandedMenu === 'reports' && (
                  <div>
                     <div style={styles.navSubItem(reportSubTab === "defaulters")} onClick={() => { setActiveTab("reports"); setReportSubTab("defaulters"); }}>Defaulters List</div>
                     <div style={styles.navSubItem(reportSubTab === "students_list")} onClick={() => { setActiveTab("reports"); setReportSubTab("students_list"); }}>Students List</div>
                     <div style={styles.navSubItem(reportSubTab === "admission_reg")} onClick={() => { setActiveTab("reports"); setReportSubTab("admission_reg"); }}>Admission Register</div>
                     <div style={styles.navSubItem(reportSubTab === "hospital_report")} onClick={() => { setActiveTab("reports"); setReportSubTab("hospital_report"); }}>Hospital Report</div>
                     <div style={styles.navSubItem(reportSubTab === "student_attendance")} onClick={() => { setActiveTab("reports"); setReportSubTab("student_attendance"); }}>Student Attendance</div>
                  </div>
               )}
             </>
          )}

          {checkPerm("financial") && (
             <>
               <div style={{...styles.navItem(activeTab === "financial"), justifyContent: 'space-between'}} onClick={() => setExpandedMenu(expandedMenu === 'financial' ? null : 'financial')}>
                  <div style={{display:'flex', gap:'12px', alignItems:'center'}}><span className="material-symbols-outlined">bar_chart</span> Financial Statements</div>
                  <span className="material-symbols-outlined" style={{fontSize: '18px'}}>{expandedMenu === 'financial' ? 'expand_less' : 'expand_more'}</span>
               </div>
               {expandedMenu === 'financial' && (
                  <div>
                     <div style={styles.navSubItem(finSubTab === "TB")} onClick={() => { setActiveTab("financial"); setFinSubTab("TB"); }}>Trial Balance</div>
                     <div style={styles.navSubItem(finSubTab === "IS")} onClick={() => { setActiveTab("financial"); setFinSubTab("IS"); }}>Income Statement</div>
                     <div style={styles.navSubItem(finSubTab === "BS")} onClick={() => { setActiveTab("financial"); setFinSubTab("BS"); }}>Balance Sheet</div>
                     <div style={styles.navSubItem(finSubTab === "GL")} onClick={() => { setActiveTab("financial"); setFinSubTab("GL"); }}>General Ledger</div>
                     <div style={styles.navSubItem(finSubTab === "TS")} onClick={() => { setActiveTab("financial"); setFinSubTab("TS"); }}>Transaction Summary</div>
                     <div style={styles.navSubItem(finSubTab === "PROG_SUM")} onClick={() => { setActiveTab("financial"); setFinSubTab("PROG_SUM"); }}>Program Summary</div>
                     <div style={styles.navSubItem(finSubTab === "BOARD_SUM")} onClick={() => { setActiveTab("financial"); setFinSubTab("BOARD_SUM"); }}>Board Summary</div>
                     <div style={styles.navSubItem(finSubTab === "IE_SUM")} onClick={() => { setActiveTab("financial"); setFinSubTab("IE_SUM"); }}>Inc/Exp Summary</div>
                     <div style={styles.navSubItem(finSubTab === "BGT")} onClick={() => { setActiveTab("financial"); setFinSubTab("BGT"); }}>Projected Revenue</div>
                  </div>
               )}
             </>
          )}

          {checkPerm("vouchers") && <div style={styles.navItem(activeTab === "vouchers")} onClick={() => { setActiveTab("vouchers"); setExpandedMenu(null); }}><span className="material-symbols-outlined">receipt</span> Vouchers</div>}
          {checkPerm("accounts") && <div style={styles.navItem(activeTab === "accounts")} onClick={() => { setActiveTab("accounts"); setExpandedMenu(null); }}><span className="material-symbols-outlined">account_tree</span> Chart of Accounts</div>}
          
          {checkPerm("hr") && (
             <>
               <div style={{...styles.navItem(activeTab === "hr"), justifyContent: 'space-between'}} onClick={() => setExpandedMenu(expandedMenu === 'hr' ? null : 'hr')}>
                  <div style={{display:'flex', gap:'12px', alignItems:'center'}}><span className="material-symbols-outlined">badge</span> HR Section</div>
                  <span className="material-symbols-outlined" style={{fontSize: '18px'}}>{expandedMenu === 'hr' ? 'expand_less' : 'expand_more'}</span>
               </div>
               {expandedMenu === 'hr' && (
                  <div>
                     <div style={styles.navSubItem(hrSubTab === "registration")} onClick={() => { setActiveTab("hr"); setHrSubTab("registration"); }}>Registration</div>
                     <div style={styles.navSubItem(hrSubTab === "list")} onClick={() => { setActiveTab("hr"); setHrSubTab("list"); }}>Employee List</div>
                     <div style={styles.navSubItem(hrSubTab === "attendance")} onClick={() => { setActiveTab("hr"); setHrSubTab("attendance"); }}>Daily Attendance</div>
                     <div style={styles.navSubItem(hrSubTab === "deductions")} onClick={() => { setActiveTab("hr"); setHrSubTab("deductions"); }}>Manage Deductions</div>
                     <div style={styles.navSubItem(hrSubTab === "payroll_report")} onClick={() => { setActiveTab("hr"); setHrSubTab("payroll_report"); }}>Payroll Processing</div>
                     <div style={styles.navSubItem(hrSubTab === "departments")} onClick={() => { setActiveTab("hr"); setHrSubTab("departments"); }}>Departments</div>
                     <div style={styles.navSubItem(hrSubTab === "employee_report")} onClick={() => { setActiveTab("hr"); setHrSubTab("employee_report"); }}>HR Reports</div>
                  </div>
               )}
             </>
          )}

          {checkPerm("approvals") && <div style={styles.navItem(activeTab === "approvals")} onClick={() => { setActiveTab("approvals"); setExpandedMenu(null); }}>
             <span className="material-symbols-outlined">verified</span> Approvals
          </div>}
          {checkPerm("budget") && <div style={styles.navItem(activeTab === "budget")} onClick={() => { setActiveTab("budget"); setExpandedMenu(null); }}><span className="material-symbols-outlined">account_balance_wallet</span> Budgeting</div>}
          {checkPerm("inventory") && <div style={styles.navItem(activeTab === "inventory")} onClick={() => { setActiveTab("inventory"); setExpandedMenu(null); }}><span className="material-symbols-outlined">inventory_2</span> Inventory</div>}
          {checkPerm("master") && <div style={styles.navItem(activeTab === "master")} onClick={() => { setActiveTab("master"); setExpandedMenu(null); }}><span className="material-symbols-outlined">settings</span> Master Data</div>}
          {checkPerm("access") && <div style={styles.navItem(activeTab === "access")} onClick={() => { setActiveTab("access"); setExpandedMenu(null); }}><span className="material-symbols-outlined">lock</span> Access Control</div>}
          {checkPerm("import") && <div style={styles.navItem(activeTab === "import")} onClick={() => { setActiveTab("import"); setExpandedMenu(null); }}><span className="material-symbols-outlined">upload_file</span> Data Import</div>}
          {checkPerm("history") && <div style={styles.navItem(activeTab === "history")} onClick={() => { setActiveTab("history"); setExpandedMenu(null); }}><span className="material-symbols-outlined">history</span> History</div>}
          
          {checkPerm("settings") && <div style={styles.navItem(activeTab === "settings")} onClick={() => { setActiveTab("settings"); setExpandedMenu(null); }}><span className="material-symbols-outlined">settings_applications</span> Settings</div>}
        </div>
      </div>
      <div style={styles.main}>
        {renderContent()}
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
