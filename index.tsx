
import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { styles } from "./styles";
import { 
  Transaction, Student, Account, User, Employee, Budget, InventoryItem, InventoryIssuance, SMSLog, FeeStructure,
  INITIAL_PROGRAMS, INITIAL_SEMESTERS, INITIAL_BOARDS, INITIAL_CAMPUSES, INITIAL_ROLES, 
  INITIAL_ACCOUNTS, INITIAL_STUDENTS_DATA, INITIAL_USERS, INITIAL_SESSIONS, Campus, INITIAL_DEPARTMENTS, INITIAL_EMPLOYEES_DATA, INITIAL_INVENTORY, INITIAL_INVENTORY_CATEGORIES, INITIAL_TRANSACTIONS, StudentAttendance, EmployeeAttendance, INITIAL_FEE_STRUCTURES, BiometricSettings
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
        Your trial period has ended. Please contact the administrator to activate the full version.
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
     inventoryCategories: INITIAL_INVENTORY_CATEGORIES,
     biometric: { machineIP: "192.168.1.201", port: "4370", autoAttendance: true } as BiometricSettings
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
      const diffMs = Date.now() - startTime;
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
    let finalStatus: "Posted" | "Pending" = (userRole === "Cashier" || userRole === "Accountant") ? "Pending" : "Posted";
    
    const updatedTransactions = [...transactions, { ...t, status: finalStatus }];
    
    // Update student balance if it's a posted fee transaction
    let updatedStudents = [...students];
    if (finalStatus === "Posted" && t.studentId) {
       const studentIdx = updatedStudents.findIndex(s => s.admissionNo === t.studentId);
       if (studentIdx > -1) {
          const s = updatedStudents[studentIdx];
          let change = 0;
          if (t.debitAccount === '1-01-004') change += t.amount;
          if (t.creditAccount === '1-01-004') change -= t.amount;
          updatedStudents[studentIdx] = { ...s, balance: s.balance + change };
       }
    }

    setTransactions(updatedTransactions);
    setStudents(updatedStudents);
  };

  const handleUpdateMasterData = (key: string, value: any) => {
     setMasterData({ ...masterData, [key]: value });
  };

  const handleAddEmployee = (emp: Employee) => setEmployees([...employees, emp]);
  const handleUpdateEmployee = (emp: Employee) => setEmployees(employees.map(e => e.id === emp.id ? emp : e));
  const handleDeleteEmployee = (id: string) => {
      if(window.confirm("Delete employee record?")) setEmployees(employees.filter(e => e.id !== id));
  };

  const handleApprove = (id: string) => {
     const t = transactions.find(tx => tx.id === id);
     if (!t) return;
     
     const updatedTransactions = transactions.map(tx => tx.id === id ? { ...tx, status: 'Posted' as const } : tx);
     
     let updatedStudents = [...students];
     if (t.studentId) {
        const studentIdx = updatedStudents.findIndex(s => s.admissionNo === t.studentId);
        if (studentIdx > -1) {
           const s = updatedStudents[studentIdx];
           let change = 0;
           if (t.debitAccount === '1-01-004') change += t.amount;
           if (t.creditAccount === '1-01-004') change -= t.amount;
           updatedStudents[studentIdx] = { ...s, balance: s.balance + change };
        }
     }
     
     setTransactions(updatedTransactions);
     setStudents(updatedStudents);
  };

  const handleDeleteTransaction = (t: Transaction, isRequest: boolean = true) => {
     if (isRequest) {
        setTransactions(transactions.map(tx => tx.id === t.id ? { ...tx, status: 'DeletePending' as const } : tx));
        alert("Deletion request sent for approval.");
     } else {
        // Permanent Delete logic
        let updatedStudents = [...students];
        if (t.status === 'Posted' && t.studentId) {
            const sIdx = updatedStudents.findIndex(s => s.admissionNo === t.studentId);
            if (sIdx > -1) {
                const s = updatedStudents[sIdx];
                let reverseChange = 0;
                if (t.debitAccount === '1-01-004') reverseChange -= t.amount;
                if (t.creditAccount === '1-01-004') reverseChange += t.amount;
                updatedStudents[sIdx] = { ...s, balance: s.balance + reverseChange };
            }
        }
        setTransactions(transactions.filter(tx => tx.id !== t.id));
        setStudents(updatedStudents);
        setAuditLogs([...auditLogs, { id: Date.now(), refId: t.voucherNo || t.id, action: "Delete", user: currentUser, date: new Date().toLocaleString(), extraInfo: t.description }]);
     }
  };

  const handleUpdateTransaction = (oldT: Transaction, newT: Transaction) => {
      let updatedStudents = [...students];
      // Reverse old
      if (oldT.status === 'Posted' && oldT.studentId) {
          const sIdx = updatedStudents.findIndex(s => s.admissionNo === oldT.studentId);
          if (sIdx > -1) {
              let rev = 0;
              if (oldT.debitAccount === '1-01-004') rev -= oldT.amount;
              if (oldT.creditAccount === '1-01-004') rev += oldT.amount;
              updatedStudents[sIdx].balance += rev;
          }
      }
      // Apply new
      if (newT.status === 'Posted' && newT.studentId) {
          const sIdx = updatedStudents.findIndex(s => s.admissionNo === newT.studentId);
          if (sIdx > -1) {
              let app = 0;
              if (newT.debitAccount === '1-01-004') app += newT.amount;
              if (newT.creditAccount === '1-01-004') app -= newT.amount;
              updatedStudents[sIdx].balance += app;
          }
      }
      setTransactions(transactions.map(tx => tx.id === oldT.id ? newT : tx));
      setStudents(updatedStudents);
      setAuditLogs([...auditLogs, { id: Date.now(), refId: oldT.voucherNo || oldT.id, action: "Edit", user: currentUser, date: new Date().toLocaleString(), extraInfo: `Amount: ${oldT.amount} -> ${newT.amount}` }]);
  };

  const handleBulkGenerate = (newTxns: Transaction[]) => {
      let updatedStudents = [...students];
      newTxns.forEach(t => {
          const sIdx = updatedStudents.findIndex(s => s.admissionNo === t.studentId);
          if (sIdx > -1) updatedStudents[sIdx].balance += t.amount;
      });
      setTransactions([...transactions, ...newTxns]);
      setStudents(updatedStudents);
  };

  const handleAutoAttendance = (student: Student) => {
      const today = new Date().toISOString().slice(0, 10);
      const existing = studentAttendance.find(a => a.date === today && a.campus === student.campus && a.program === student.program && a.semester === student.semester);
      
      const record = { studentId: student.admissionNo, name: student.name, status: "Present" as const };
      
      if (existing) {
          if (existing.records.some(r => r.studentId === student.admissionNo)) return;
          const updated = { ...existing, records: [...existing.records, record] };
          setStudentAttendance(studentAttendance.map(a => a.id === existing.id ? updated : a));
      } else {
          const newAtt: StudentAttendance = {
              id: `ATT-AUTO-${Date.now()}`,
              date: today,
              campus: student.campus,
              program: student.program,
              semester: student.semester,
              teacher: "Biometric System",
              records: [record]
          };
          setStudentAttendance([...studentAttendance, newAtt]);
      }
  };

  const NavItem = ({ id, label, icon, subItems }: any) => {
    const isActive = activeTab === id || (subItems && subItems.some((s: any) => activeTab === s.id));
    const isExpanded = expandedMenu === id;

    return (
      <div style={{ marginBottom: '4px' }}>
        <div 
          onClick={() => {
            if (subItems) setExpandedMenu(isExpanded ? null : id);
            else { setActiveTab(id); setHrSubTab(null); setReportSubTab(null); setFinSubTab(null); }
          }}
          style={styles.navItem(isActive)}
        >
          <span className="material-symbols-outlined">{icon}</span>
          <span style={{ flex: 1 }}>{label}</span>
          {subItems && <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{isExpanded ? 'expand_less' : 'expand_more'}</span>}
        </div>
        {subItems && isExpanded && (
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: '2px' }}>
            {subItems.map((sub: any) => {
              const isSubActive = activeTab === sub.id && (!sub.val || 
                (sub.val === reportSubTab || sub.val === finSubTab || sub.val === hrSubTab));
              
              return (
                <div 
                  key={sub.label + sub.val} 
                  onClick={() => { 
                    setActiveTab(sub.id); 
                    if(sub.setter) sub.setter(sub.val); 
                  }}
                  style={styles.navSubItem(isSubActive)}
                >
                  {sub.label}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  if (!isAuthenticated) return <Login onLogin={(role: string, user: string) => { setIsAuthenticated(true); setUserRole(role); setCurrentUser(user); }} users={users} />;
  if (isTrialExpired) return <TrialLockScreen daysLeft={remainingDays} />;

  return (
    <div style={styles.appContainer}>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-area, #printable-area *, .print-header, .print-header *, .modal-printable, .modal-printable * { visibility: visible; }
          #printable-area, .modal-printable { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; }
          .no-print, .sidebar, .nav, .filter-bar, button { display: none !important; }
        }
      `}</style>
      {/* Sidebar */}
      <div className="no-print" style={styles.sidebar}>
        <div style={styles.brand}>
          <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>account_balance</span>
          <span>GIMS FINANCE</span>
        </div>

        <div style={{ padding: '16px', background: '#1e293b', margin: '16px', borderRadius: '12px', border: '1px solid #334155' }}>
           <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Logged in as</div>
           <div style={{ color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }}></div>
              {userRole}
           </div>
           <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>@{currentUser}</div>
           {remainingDays < 999 && <div style={{ fontSize: '0.7rem', color: '#f59e0b', marginTop: '8px', fontWeight: 600 }}>TRIAL: {remainingDays} Days Left</div>}
        </div>

        <div style={styles.nav}>
          {permissions[userRole].dashboard && <NavItem id="dashboard" label="Dashboard" icon="dashboard" />}
          
          {(permissions[userRole].students || permissions[userRole].promotion) && (
             <NavItem id="students_menu" label="Student Center" icon="school" subItems={[
                permissions[userRole].students && { id: 'students', label: 'Student Biodata' },
                permissions[userRole].promotion && { id: 'promotion', label: 'Student Promotion' }
             ].filter(Boolean)} />
          )}

          {permissions[userRole].cashbook && <NavItem id="cashbook" label="Cash Book" icon="menu_book" />}
          {permissions[userRole].vouchers && <NavItem id="vouchers" label="Voucher Entry" icon="receipt" />}
          
          {(permissions[userRole].fees || permissions[userRole].ledger || permissions[userRole].bulk) && (
            <NavItem id="fees_menu" label="Fee Management" icon="payments" subItems={[
               permissions[userRole].fees && { id: 'fees', label: 'Fee Collection' },
               permissions[userRole].ledger && { id: 'ledger', label: 'Student Ledger' },
               permissions[userRole].bulk && { id: 'bulk', label: 'Fee Generation' }
            ].filter(Boolean)} />
          )}

          {permissions[userRole].hr && (
            <NavItem id="hr" label="HR & Payroll" icon="badge" subItems={[
               { id: 'hr', label: 'Registration', val: 'registration', setter: setHrSubTab },
               { id: 'hr', label: 'Employee List', val: 'list', setter: setHrSubTab },
               { id: 'hr', label: 'Departments', val: 'departments', setter: setHrSubTab },
               { id: 'hr', label: 'Attendance', val: 'attendance', setter: setHrSubTab },
               { id: 'hr', label: 'Deductions', val: 'deductions', setter: setHrSubTab },
               { id: 'hr', label: 'Payroll Sheet', val: 'payroll_report', setter: setHrSubTab },
               { id: 'hr', label: 'Reports', val: 'employee_report', setter: setHrSubTab },
            ]} />
          )}

          {permissions[userRole].inventory && <NavItem id="inventory" label="Inventory" icon="inventory_2" />}
          {permissions[userRole].budget && <NavItem id="budget" label="Budgeting" icon="monitoring" />}

          {permissions[userRole].reports && (
            <NavItem id="reports" label="Operational Reports" icon="summarize" subItems={[
               { id: 'reports', label: 'Defaulters List', val: 'defaulters', setter: setReportSubTab },
               { id: 'reports', label: 'Student List', val: 'students_list', setter: setReportSubTab },
               { id: 'reports', label: 'Admission Register', val: 'admission_reg', setter: setReportSubTab },
               { id: 'reports', label: 'Hospital Report', val: 'hospital_report', setter: setReportSubTab },
               { id: 'reports', label: 'Student Attendance', val: 'student_attendance', setter: setReportSubTab },
            ]} />
          )}

          {permissions[userRole].financial && (
            <NavItem id="financial" label="Financial Statements" icon="account_balance" subItems={[
               { id: 'financial', label: 'Trial Balance', val: 'TB', setter: setFinSubTab },
               { id: 'financial', label: 'Profit & Loss', val: 'PL', setter: setFinSubTab },
               { id: 'financial', label: 'Income Statement', val: 'IS', setter: setFinSubTab },
               { id: 'financial', label: 'Balance Sheet', val: 'BS', setter: setFinSubTab },
               { id: 'financial', label: 'General Ledger', val: 'GL', setter: setFinSubTab },
               { id: 'financial', label: 'Revenue Dashboard', val: 'BGT', setter: setFinSubTab },
               { id: 'financial', label: 'Trans. Summary', val: 'TS', setter: setFinSubTab }
            ]} />
          )}

          {permissions[userRole].scanner && <NavItem id="scanner" label="Biometrics" icon="fingerprint" />}
          {permissions[userRole].sms && <NavItem id="sms" label="SMS Module" icon="sms" />}

          <div style={{ marginTop: '20px', borderTop: '1px solid #1e293b', paddingTop: '10px' }}>
            {permissions[userRole].approvals && <NavItem id="approvals" label="Approvals" icon="verified_user" />}
            {permissions[userRole].accounts && <NavItem id="accounts" label="Chart of Accounts" icon="account_tree" />}
            {permissions[userRole].master && <NavItem id="master" label="Master Data" icon="settings" />}
            {permissions[userRole].access && <NavItem id="access" label="Access Control" icon="lock" />}
            {permissions[userRole].import && <NavItem id="import" label="Data Import" icon="upload_file" />}
            {permissions[userRole].history && <NavItem id="history" label="History" icon="history" />}
          </div>
        </div>

        <div style={{ marginTop: 'auto', borderTop: '1px solid #1e293b', padding: '16px' }}>
           <button 
             onClick={() => setIsAuthenticated(false)}
             style={{ ...styles.button("secondary"), width: '100%', background: 'transparent', color: '#94a3b8', border: '1px solid #334155' }}
           >
             <span className="material-symbols-outlined">logout</span> Logout
           </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.main}>
        {activeTab === "dashboard" && permissions[userRole].dashboard && <Dashboard transactions={transactions} accounts={accounts} students={students} masterData={masterData} currentUser={currentUser} setActiveTab={setActiveTab} />}
        {activeTab === "students" && permissions[userRole].students && <StudentBiodata students={students} onAddStudent={(s: Student) => setStudents([...students, s])} onDeleteStudent={(id: string) => setStudents(students.filter(s => s.admissionNo !== id))} onUpdateStudent={(s: Student) => setStudents(students.map(st => st.admissionNo === s.admissionNo ? s : st))} masterData={masterData} currentUser={currentUser} feeStructures={feeStructures} />}
        {activeTab === "promotion" && permissions[userRole].promotion && <PromotionModule students={students} onUpdateStudents={setStudents} masterData={masterData} />}
        {activeTab === "cashbook" && permissions[userRole].cashbook && <CashBook transactions={transactions} students={students} accounts={accounts} masterData={masterData} userRole={userRole} onDelete={handleDeleteTransaction} onUpdate={handleUpdateTransaction} />}
        {activeTab === "vouchers" && permissions[userRole].vouchers && <VoucherSystem onPostTransaction={handlePostTransaction} accounts={accounts} transactions={transactions} onDelete={handleDeleteTransaction} onUpdate={handleUpdateTransaction} masterData={masterData} userRole={userRole} />}
        {activeTab === "fees" && permissions[userRole].fees && <FeeCollection students={students} onCollectFee={handlePostTransaction} masterData={masterData} accounts={accounts} currentUser={currentUser} />}
        {activeTab === "ledger" && permissions[userRole].ledger && <StudentLedger students={students} transactions={transactions} masterData={masterData} />}
        {activeTab === "bulk" && permissions[userRole].bulk && <FeeGenerationModule students={students} onGenerate={handleBulkGenerate} masterData={masterData} transactions={transactions} />}
        {activeTab === "reports" && permissions[userRole].reports && <ReportsModule students={students} transactions={transactions} masterData={masterData} subTab={reportSubTab} currentUser={currentUser} studentAttendance={studentAttendance} setStudentAttendance={setStudentAttendance} />}
        {activeTab === "financial" && permissions[userRole].financial && <FinancialStatements transactions={transactions} accounts={accounts} students={students} masterData={masterData} subTab={finSubTab} />}
        {activeTab === "hr" && permissions[userRole].hr && <HRModule employees={employees} onAddEmployee={handleAddEmployee} onUpdateEmployee={handleUpdateEmployee} onDeleteEmployee={handleDeleteEmployee} masterData={masterData} onUpdateMasterData={handleUpdateMasterData} employeeAttendance={employeeAttendance} setEmployeeAttendance={setEmployeeAttendance} subTab={hrSubTab} />}
        {activeTab === "inventory" && permissions[userRole].inventory && <InventoryModule inventory={inventory} setInventory={setInventory} issuances={issuances} setIssuances={setIssuances} employees={employees} masterData={masterData} currentUser={currentUser} onUpdateMasterData={handleUpdateMasterData} />}
        {activeTab === "budget" && permissions[userRole].budget && <BudgetModule budgets={budgets} setBudgets={setBudgets} masterData={masterData} transactions={transactions} students={students} />}
        {activeTab === "approvals" && permissions[userRole].approvals && <Approvals transactions={transactions} onApprove={handleApprove} onDelete={handleDeleteTransaction} onUpdate={handleUpdateTransaction} students={students} accounts={accounts} />}
        {activeTab === "accounts" && permissions[userRole].accounts && <ChartOfAccounts accounts={accounts} onAddAccount={(a: Account) => setAccounts([...accounts, a])} />}
        {activeTab === "master" && permissions[userRole].master && <MasterDataManager data={masterData} onUpdate={handleUpdateMasterData} students={students} users={users} onUpdateUsers={setUsers} roles={roles} onUpdateRoles={setRoles} feeStructures={feeStructures} onUpdateFeeStructures={setFeeStructures} />}
        {activeTab === "access" && permissions[userRole].access && <AccessControl permissions={permissions} onUpdate={setPermissions} roles={roles} />}
        {activeTab === "import" && permissions[userRole].import && <DataImport onImportStudents={(data: Student[]) => setStudents([...students, ...data])} onImportAccounts={(data: Account[]) => setAccounts([...accounts, ...data])} />}
        {activeTab === "history" && permissions[userRole].history && <HistoryModule logs={auditLogs} />}
        {activeTab === "scanner" && permissions[userRole].scanner && <FaceRecognitionScanner students={students} userRole={userRole} masterData={masterData} onAttend={handleAutoAttendance} />}
        {activeTab === "sms" && permissions[userRole].sms && <SMSModule students={students} masterData={masterData} smsHistory={smsHistory} setSmsHistory={setSmsHistory} />}
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
