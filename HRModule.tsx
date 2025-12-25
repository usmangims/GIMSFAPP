
import React, { useState, useEffect } from "react";
import { styles } from "./styles";
import { Employee, EMPLOYEE_CATEGORIES, INITIAL_DEPARTMENTS, MONTHS, Transaction, Campus, DeductionRecord, KPK_DISTRICTS, EmployeeAttendance } from "./types";

export const HRModule = ({ employees, onAddEmployee, onUpdateEmployee, onDeleteEmployee, masterData, onPostPayroll, onUpdateMasterData, employeeAttendance = [], setEmployeeAttendance }: any) => {
   const [activeTab, setActiveTab] = useState("registration");
   
   // Print Preview State
   const [printPreview, setPrintPreview] = useState<{type: 'slip' | 'form', data: any} | null>(null);

   // Registration State
   const [formData, setFormData] = useState<Employee>({
      id: "EMP-" + (Math.floor(Math.random() * 1000)), name: "", fatherName: "", designation: "Lecturer", department: "Academics", 
      campus: "Main Campus", basicSalary: 0, security: 0, joiningDate: new Date().toISOString().slice(0, 10), 
      phone: "", cnic: "", dob: "", gender: "Male", maritalStatus: "Single", email: "", address: "", district: "Peshawar", nationality: "Pakistani",
      employeeType: "Permanent", bankName: "", accountNumber: "", status: "Active", photo: "", documents: ""
   });

   // Deduction State
   const [deductionMonth, setDeductionMonth] = useState("December, 2025");
   const [deductionType, setDeductionType] = useState("Late Coming");
   const [deductionSearch, setDeductionSearch] = useState("");
   const [selectedEmps, setSelectedEmps] = useState<string[]>([]);
   const [deductionInputs, setDeductionInputs] = useState<Record<string, {days: number, amount: number}>>({});
   const [deductionHistory, setDeductionHistory] = useState<DeductionRecord[]>([]);

   // Payroll & Reports Filters
   const [filterMonth, setFilterMonth] = useState("December, 2025");
   const [filterCampus, setFilterCampus] = useState("All Campuses");
   const [filterDept, setFilterDept] = useState("All Departments");
   const [filterStatus, setFilterStatus] = useState("All Status");
   const [search, setSearch] = useState("");

   // Attendance State
   const [attDate, setAttDate] = useState(new Date().toISOString().slice(0, 10));
   const [showAttModal, setShowAttModal] = useState(false);
   const [attSearch, setAttSearch] = useState("");
   const [attSelectedIds, setAttSelectedIds] = useState<string[]>([]); // For multi-select in modal
   const [attExceptions, setAttExceptions] = useState<Record<string, "Absent" | "Late" | "Leave">>({});

   // Report State
   const [reportTab, setReportTab] = useState<"payroll_campus" | "deduction" | "security" | "attendance">("payroll_campus");
   const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
   const [reportSearch, setReportSearch] = useState("");

   // Department State
   const [newDept, setNewDept] = useState("");

   // --- Formatting Helper Functions ---
   const formatCNIC = (val: string) => {
      const digits = val.replace(/\D/g, '').slice(0, 13);
      if (digits.length <= 5) return digits;
      if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
      return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
   };

   const formatPhone = (val: string) => {
      const digits = val.replace(/\D/g, '').slice(0, 11);
      if (digits.length <= 4) return digits;
      return `${digits.slice(0, 4)}-${digits.slice(4)}`;
   };

   const handleSave = () => {
      if(!formData.name || !formData.id || !formData.basicSalary) return alert("Please fill required fields (Code, Name, Salary)");
      const exists = employees.find((e:Employee) => e.id === formData.id);
      if(exists) {
          onUpdateEmployee(formData);
      } else {
          onAddEmployee(formData);
      }
      setFormData({ id: "EMP-" + (Math.floor(Math.random() * 1000)), name: "", fatherName: "", designation: "Lecturer", department: "Academics", campus: "Main Campus", basicSalary: 0, security: 0, joiningDate: new Date().toISOString().slice(0, 10), phone: "", cnic: "", dob: "", gender: "Male", maritalStatus: "Single", email: "", address: "", district: "Peshawar", nationality: "Pakistani", employeeType: "Permanent", bankName: "", accountNumber: "", status: "Active", photo: "", documents: "" });
      alert("Employee Saved Successfully");
   };

   const handlePrintForm = () => {
       setPrintPreview({ type: 'form', data: formData });
   };

   const handlePrintSalarySlip = (employee: any) => {
        setPrintPreview({ type: 'slip', data: employee });
   }

   const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
         const reader = new FileReader();
         reader.onloadend = () => {
            setFormData({ ...formData, photo: reader.result as string });
         };
         reader.readAsDataURL(file);
      }
   };

   // Filtering Logic for List
   const getFilteredEmployees = () => {
       return employees.filter((e: Employee) => {
           if(filterCampus !== "All Campuses" && e.campus !== filterCampus) return false;
           if(filterDept !== "All Departments" && e.department !== filterDept) return false;
           if(filterStatus !== "All Status" && e.status !== filterStatus) return false;
           if(search && !e.name.toLowerCase().includes(search.toLowerCase()) && !e.id.toLowerCase().includes(search.toLowerCase())) return false;
           return true;
       });
   };

   const filteredEmployees = getFilteredEmployees();

   // Filtering Logic for Deductions (Separate to use deductionSearch)
   const getDeductionEmployees = () => {
       return employees.filter((e: Employee) => {
           if(filterCampus !== "All Campuses" && e.campus !== filterCampus) return false;
           if(filterDept !== "All Departments" && e.department !== filterDept) return false;
           if(deductionSearch && !e.name.toLowerCase().includes(deductionSearch.toLowerCase()) && !e.id.toLowerCase().includes(deductionSearch.toLowerCase())) return false;
           return true;
       });
   };

   const deductionEmployees = getDeductionEmployees();

   // --- Attendance Logic (Exception Based) ---
   
   // Handle search selection in modal
   const handleAttSearchSelect = (id: string) => {
       if(attSelectedIds.includes(id)) {
           setAttSelectedIds(attSelectedIds.filter(sid => sid !== id));
       } else {
           setAttSelectedIds([...attSelectedIds, id]);
       }
   };

   const markSelected = (status: "Absent" | "Late" | "Leave") => {
       const newExceptions = { ...attExceptions };
       attSelectedIds.forEach(id => {
           newExceptions[id] = status;
       });
       setAttExceptions(newExceptions);
       setAttSelectedIds([]);
       setAttSearch(""); // Reset search for next batch
   };

   const removeException = (id: string) => {
       const newExceptions = { ...attExceptions };
       delete newExceptions[id];
       setAttExceptions(newExceptions);
   };

   const saveAttendance = () => {
       // Filter active employees only
       const activeEmps = employees.filter((e: Employee) => e.status === "Active");
       
       const newRecords = activeEmps.map((e: Employee) => ({
           id: `${e.id}-${attDate}`,
           employeeId: e.id,
           name: e.name,
           date: attDate,
           status: attExceptions[e.id] || "Present" // Default Present if not in exceptions
       }));

       // Remove old records for this date
       const filteredOld = employeeAttendance.filter((a: EmployeeAttendance) => a.date !== attDate);
       setEmployeeAttendance([...filteredOld, ...newRecords]);
       
       alert(`Attendance Saved! ${Object.keys(attExceptions).length} Exceptions, ${activeEmps.length - Object.keys(attExceptions).length} Present.`);
       setShowAttModal(false);
       setAttExceptions({});
   };

   // Filter for Modal Search
   const filteredAttSearch = employees.filter((e: Employee) => 
       e.status === 'Active' && 
       (e.name.toLowerCase().includes(attSearch.toLowerCase()) || e.id.toLowerCase().includes(attSearch.toLowerCase()))
   );


   // --- Deduction Logic ---
   const handleDeductionSelect = (id: string) => {
       if(selectedEmps.includes(id)) {
           setSelectedEmps(selectedEmps.filter(e => e !== id));
           const newInputs = {...deductionInputs};
           delete newInputs[id];
           setDeductionInputs(newInputs);
       } else {
           setSelectedEmps([...selectedEmps, id]);
       }
   };

   const handleDeductionInput = (id: string, days: number, salary: number) => {
       // Logic: Deduction Amount = (Basic Salary / 30) * Days
       const amount = Math.round((salary / 30) * days);
       setDeductionInputs(prev => ({...prev, [id]: {days, amount}}));
   };

   const applyDeductions = () => {
       if(selectedEmps.length === 0) return alert("No employees selected");
       
       const newRecords: DeductionRecord[] = selectedEmps.map(empId => {
           const emp = employees.find((e:Employee) => e.id === empId);
           const inp = deductionInputs[empId] || {days: 0, amount: 0};
           return {
               id: Date.now() + "-" + empId,
               employeeId: empId,
               employeeName: emp?.name || "",
               type: deductionType,
               month: deductionMonth,
               amount: inp.amount,
               days: inp.days,
               date: new Date().toISOString().slice(0, 10),
               remarks: `${deductionType} - ${inp.days} days deducted`
           };
       });

       setDeductionHistory([...deductionHistory, ...newRecords]);
       setSelectedEmps([]);
       setDeductionInputs({});
       alert("Deductions Applied Successfully");
   };

   // --- Payroll Stats ---
   const calculatePayrollStats = () => {
       const emps = getFilteredEmployees();
       const totalSalary = emps.reduce((acc:number, e:Employee) => acc + e.basicSalary, 0);
       const totalDed = deductionHistory
           .filter(d => d.month === filterMonth && emps.some(e => e.id === d.employeeId))
           .reduce((acc, d) => acc + d.amount, 0);
       
       return { count: emps.length, gross: totalSalary, deduction: totalDed, net: totalSalary - totalDed };
   };

   // --- Reporting Helpers ---
   const getPayrollByCampus = () => {
       const report: any = {};
       masterData.campuses.forEach((c: Campus) => {
           report[c.name] = { count: 0, gross: 0, deductions: 0, net: 0, employees: [] };
       });

       employees.forEach((e: Employee) => {
           if(e.status !== 'Active') return;
           if(report[e.campus]) {
               const empDeductions = deductionHistory
                   .filter(d => d.employeeId === e.id) 
                   .reduce((sum, d) => sum + d.amount, 0);
               
               const security = e.security || 0;
               const net = e.basicSalary - empDeductions; 

               report[e.campus].count++;
               report[e.campus].gross += e.basicSalary;
               report[e.campus].deductions += empDeductions;
               report[e.campus].net += net;
               report[e.campus].employees.push({ ...e, net, empDeductions });
           }
       });
       return report;
   };

   const getEmployeePayrollDetails = () => {
       const emps = getFilteredEmployees();
       return emps.map(e => {
           const deductions = deductionHistory.filter(d => d.month === filterMonth && d.employeeId === e.id);
           const totalDeductedDays = deductions.reduce((acc, d) => acc + (d.days || 0), 0);
           const totalDeductedAmount = deductions.reduce((acc, d) => acc + d.amount, 0);
           const payableDays = 30 - totalDeductedDays;
           
           const securityDeduction = e.security || 0;
           const netPay = e.basicSalary - totalDeductedAmount - securityDeduction;
           
           return {
               ...e,
               totalDeductedDays,
               totalDeductedAmount,
               securityDeduction,
               payableDays,
               netPay
           };
       });
   };

   const handleAddDept = () => {
       if(newDept && !masterData.departments.includes(newDept)) {
           onUpdateMasterData('departments', [...masterData.departments, newDept]);
           setNewDept("");
       }
   };
   
   const handleDeleteDept = (dept: string) => {
       if(window.confirm(`Delete Department: ${dept}?`)) {
           onUpdateMasterData('departments', masterData.departments.filter((d: string) => d !== dept));
       }
   }

   const stats = calculatePayrollStats();
   const payrollDetails = getEmployeePayrollDetails();

   const NavTab = ({ id, label, icon }: any) => (
       <div 
           onClick={() => setActiveTab(id)}
           style={{
               padding: '12px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
               color: activeTab === id ? '#4f46e5' : '#64748b',
               borderBottom: activeTab === id ? '2px solid #4f46e5' : '2px solid transparent',
               fontWeight: activeTab === id ? 600 : 500, transition: 'all 0.2s', fontSize: '0.9rem'
           }}
       >
           <span className="material-symbols-outlined" style={{fontSize: '20px'}}>{icon}</span>
           {label}
       </div>
   );

   const StatWidget = ({ label, value, sub, color, bg, icon }: any) => (
       <div style={{
           backgroundColor: 'white', borderRadius: '16px', padding: '24px', flex: 1,
           boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
           display: 'flex', flexDirection: 'column', border: '1px solid #f1f5f9', position: 'relative', overflow: 'hidden'
       }}>
           <div style={{position: 'absolute', top: '-10px', right: '-10px', width: '80px', height: '80px', borderRadius: '50%', background: bg, opacity: 0.5}}></div>
           <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', position: 'relative'}}>
               <div>
                   <div style={{fontSize: '0.85rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px'}}>{label}</div>
                   <div style={{fontSize: '1.75rem', fontWeight: 800, color: '#1e293b', marginTop: '5px'}}>{value}</div>
               </div>
               <div style={{padding: '10px', backgroundColor: bg, borderRadius: '12px', color: color}}>
                   <span className="material-symbols-outlined">{icon}</span>
               </div>
           </div>
           {sub && <div style={{fontSize: '0.8rem', color: '#94a3b8'}}>{sub}</div>}
       </div>
   );

   const PrintPreviewModal = () => {
       if (!printPreview) return null;
       const { type, data } = printPreview;

       return (
           <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000}}>
               <div style={{width: '850px', height: '90vh', backgroundColor: 'white', borderRadius: '8px', display: 'flex', flexDirection: 'column', overflow: 'hidden'}}>
                   <div className="no-print" style={{padding: '15px 20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc'}}>
                       <h3 style={{margin: 0, color: '#0f172a'}}>Print Preview</h3>
                       <div style={{display: 'flex', gap: '10px'}}>
                           <button style={{...styles.button("primary"), padding: '8px 16px'}} onClick={() => window.print()}>
                               <span className="material-symbols-outlined" style={{fontSize: '18px'}}>print</span> Print
                           </button>
                           <button style={{...styles.button("secondary"), padding: '8px 16px', background: 'white', border: '1px solid #cbd5e1'}} onClick={() => setPrintPreview(null)}>Close</button>
                       </div>
                   </div>
                   
                   <div style={{flex: 1, overflowY: 'auto', padding: '40px', backgroundColor: '#525659'}}>
                       <div id="printable-area" style={{background: 'white', padding: '40px', minHeight: '1000px', boxShadow: '0 4px 10px rgba(0,0,0,0.2)', width: '100%', maxWidth: '210mm', margin: '0 auto', boxSizing: 'border-box'}}>
                           {/* HEADER */}
                           <div style={{textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid #0f172a', paddingBottom: '15px'}}>
                               <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', marginBottom: '10px'}}>
                                   <span className="material-symbols-outlined" style={{fontSize: '40px', color: '#166534'}}>account_balance</span>
                                   <h2 style={{margin: 0, textTransform: 'uppercase', color: '#0f172a', fontSize: '1.8rem', letterSpacing: '1px'}}>Ghazali Institute</h2>
                               </div>
                               <div style={{fontSize: '1.1rem', color: '#334155', fontWeight: 500}}>of Medical Sciences</div>
                               <h3 style={{margin: '15px 0 0 0', fontWeight: 600, color: '#000', textTransform: 'uppercase', fontSize: '1.2rem', padding: '5px', background: '#f1f5f9', display: 'inline-block', borderRadius: '4px'}}>
                                   {type === 'slip' ? `Salary Slip for ${filterMonth}` : 'Employee Registration Form'}
                               </h3>
                           </div>

                           {type === 'slip' && (
                               // SALARY SLIP LAYOUT
                               <div>
                                   <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '30px', background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0'}}>
                                       <div style={{lineHeight: '1.6'}}>
                                           <div><strong>Name:</strong> {data.name}</div>
                                           <div><strong>Designation:</strong> {data.designation}</div>
                                           <div><strong>Department:</strong> {data.department}</div>
                                       </div>
                                       <div style={{textAlign: 'right', lineHeight: '1.6'}}>
                                           <div><strong>Emp ID:</strong> {data.id}</div>
                                           <div><strong>Date:</strong> {new Date().toLocaleDateString()}</div>
                                           <div><strong>Campus:</strong> {data.campus}</div>
                                       </div>
                                   </div>
                                   
                                   <table style={{width: '100%', borderCollapse: 'collapse', marginBottom: '30px', border: '1px solid #cbd5e1'}}>
                                       <thead>
                                           <tr style={{background: '#f1f5f9'}}>
                                               <th style={{padding: '12px', border: '1px solid #cbd5e1', textAlign: 'left'}}>Earnings</th>
                                               <th style={{padding: '12px', border: '1px solid #cbd5e1', textAlign: 'right', width: '120px'}}>Amount</th>
                                               <th style={{padding: '12px', border: '1px solid #cbd5e1', textAlign: 'left'}}>Deductions</th>
                                               <th style={{padding: '12px', border: '1px solid #cbd5e1', textAlign: 'right', width: '120px'}}>Amount</th>
                                           </tr>
                                       </thead>
                                       <tbody>
                                           <tr>
                                               <td style={{padding: '12px', borderRight: '1px solid #cbd5e1', verticalAlign: 'top'}}>
                                                   <div>Basic Salary</div>
                                                   {/* Add other allowances here if any */}
                                               </td>
                                               <td style={{padding: '12px', textAlign: 'right', borderRight: '1px solid #cbd5e1', verticalAlign: 'top', fontWeight: 600}}>
                                                   {data.basicSalary.toLocaleString()}
                                               </td>
                                               <td style={{padding: '12px', borderRight: '1px solid #cbd5e1', verticalAlign: 'top'}}>
                                                   {data.totalDeductedDays > 0 ? (
                                                       <div>Absence / Late ({data.totalDeductedDays} days)</div>
                                                   ) : null}
                                                   {data.securityDeduction > 0 && <div>Security Deduction</div>}
                                                   {data.totalDeductedDays === 0 && data.securityDeduction === 0 && <div style={{color: '#94a3b8'}}>No Deductions</div>}
                                               </td>
                                               <td style={{padding: '12px', textAlign: 'right', verticalAlign: 'top', color: '#b91c1c'}}>
                                                   {(data.totalDeductedAmount + data.securityDeduction) > 0 ? (data.totalDeductedAmount + data.securityDeduction).toLocaleString() : '-'}
                                               </td>
                                           </tr>
                                           {/* Spacer Row to give height */}
                                           <tr style={{height: '150px'}}>
                                               <td style={{borderRight: '1px solid #cbd5e1'}}></td>
                                               <td style={{borderRight: '1px solid #cbd5e1'}}></td>
                                               <td style={{borderRight: '1px solid #cbd5e1'}}></td>
                                               <td></td>
                                           </tr>
                                           <tr style={{background: '#f8fafc', fontWeight: 'bold', borderTop: '2px solid #cbd5e1'}}>
                                               <td style={{padding: '12px', borderRight: '1px solid #cbd5e1'}}>Gross Salary</td>
                                               <td style={{padding: '12px', textAlign: 'right', borderRight: '1px solid #cbd5e1'}}>{data.basicSalary.toLocaleString()}</td>
                                               <td style={{padding: '12px', borderRight: '1px solid #cbd5e1'}}>Total Deductions</td>
                                               <td style={{padding: '12px', textAlign: 'right', color: '#b91c1c'}}>{(data.totalDeductedAmount + data.securityDeduction || 0).toLocaleString()}</td>
                                           </tr>
                                       </tbody>
                                   </table>

                                   <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: '60px'}}>
                                       <div style={{padding: '20px 30px', background: '#f0fdf4', border: '2px solid #166534', borderRadius: '8px', minWidth: '250px', textAlign: 'right'}}>
                                           <div style={{fontSize: '0.9rem', color: '#166534', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px'}}>Net Payable Amount</div>
                                           <div style={{fontSize: '1.8rem', fontWeight: 800, color: '#166534'}}>Rs {(data.netPay || data.basicSalary).toLocaleString()}</div>
                                       </div>
                                   </div>

                                   <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '40px'}}>
                                       <div style={{textAlign: 'center', width: '200px'}}>
                                           <div style={{borderBottom: '1px solid #000', marginBottom: '5px', height: '1px'}}></div>
                                           <div style={{fontSize: '0.9rem'}}>Employee Signature</div>
                                       </div>
                                       <div style={{textAlign: 'center', width: '200px'}}>
                                           <div style={{borderBottom: '1px solid #000', marginBottom: '5px', height: '1px'}}></div>
                                           <div style={{fontSize: '0.9rem'}}>Director / Admin Signature</div>
                                       </div>
                                   </div>
                               </div>
                           )}

                           {type === 'form' && (
                               // REGISTRATION FORM LAYOUT
                               <div style={{fontSize: '0.95rem', lineHeight: '1.5'}}>
                                   {/* ... (Existing Form Layout) ... */}
                                   <div style={{display: 'flex', gap: '30px', marginBottom: '30px'}}>
                                       <div style={{width: '140px', height: '160px', border: '1px dashed #94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', borderRadius: '4px'}}>
                                           {data.photo ? <img src={data.photo} style={{width: '100%', height: '100%', objectFit: 'cover'}}/> : <span style={{color:'#cbd5e1'}}>Photo</span>}
                                       </div>
                                       <div style={{flex: 1}}>
                                           <table style={{width: '100%', borderCollapse: 'collapse'}}>
                                               <tbody>
                                                   <tr><td style={{padding: '10px 5px', borderBottom: '1px solid #eee', fontWeight: 'bold'}}>Employee Code:</td><td style={{padding: '10px 5px', borderBottom: '1px solid #eee'}}>{data.id}</td></tr>
                                                   <tr><td style={{padding: '10px 5px', borderBottom: '1px solid #eee', fontWeight: 'bold'}}>Full Name:</td><td style={{padding: '10px 5px', borderBottom: '1px solid #eee'}}>{data.name}</td></tr>
                                                   <tr><td style={{padding: '10px 5px', borderBottom: '1px solid #eee', fontWeight: 'bold'}}>Father Name:</td><td style={{padding: '10px 5px', borderBottom: '1px solid #eee'}}>{data.fatherName}</td></tr>
                                                   <tr><td style={{padding: '10px 5px', borderBottom: '1px solid #eee', fontWeight: 'bold'}}>CNIC:</td><td style={{padding: '10px 5px', borderBottom: '1px solid #eee'}}>{data.cnic}</td></tr>
                                               </tbody>
                                           </table>
                                       </div>
                                   </div>
                                   {/* ... (Rest of Form Layout) ... */}
                               </div>
                           )}
                       </div>
                   </div>
               </div>
           </div>
       );
   }

   return (
      <div style={{fontFamily: "'Inter', sans-serif"}}>
         <PrintPreviewModal />
         
         <div className="no-print" style={{marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
             <div>
                <h2 style={{margin: '0 0 5px 0', color: '#1e293b'}}>HR & Payroll</h2>
                <p style={{margin: 0, color: '#64748b', fontSize: '0.9rem'}}>Manage workforce, attendance and compensation</p>
             </div>
         </div>

         <div className="no-print" style={{backgroundColor: 'white', borderRadius: '12px', padding: '0 20px', marginBottom: '30px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', overflowX: 'auto'}}>
             <NavTab id="registration" label="Employee Registration" icon="person_add" />
             <NavTab id="list" label="Employees" icon="group" />
             <NavTab id="departments" label="Departments" icon="apartment" />
             <NavTab id="attendance" label="Daily Attendance" icon="calendar_month" />
             <NavTab id="deductions" label="Deductions" icon="money_off" />
             <NavTab id="payroll_report" label="Payroll" icon="payments" />
             <NavTab id="employee_report" label="Reports" icon="assessment" />
         </div>

         {/* REGISTRATION */}
         {activeTab === "registration" && (
             <div className="no-print" style={{...styles.card, maxWidth: '1100px', margin: '0 auto', borderTop: '4px solid #4f46e5'}}>
                 <div style={{display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid #f1f5f9'}}>
                     <div style={{width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#e0e7ff', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                         <span className="material-symbols-outlined" style={{fontSize: '28px'}}>badge</span>
                     </div>
                     <div>
                         <h3 style={{margin: 0, color: '#0f172a'}}>Employee Registration</h3>
                         <div style={{fontSize: '0.85rem', color: '#64748b'}}>Fill in the details to register a new staff member</div>
                     </div>
                 </div>

                 <div style={{display: 'flex', gap: '40px'}}>
                     {/* Left Column: Photo & Docs */}
                     <div style={{width: '240px', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                         <div style={{width: '160px', height: '160px', background: '#f8fafc', borderRadius: '50%', marginBottom: '20px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '4px solid #fff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}}>
                            {formData.photo ? <img src={formData.photo} style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : <span className="material-symbols-outlined" style={{fontSize: '64px', color: '#cbd5e1'}}>person</span>}
                         </div>
                         <label style={{...styles.button("secondary"), fontSize: '0.85rem', width: '100%', justifyContent: 'center', marginBottom: '10px', backgroundColor: 'white', border: '1px solid #e2e8f0'}}>
                             <span className="material-symbols-outlined" style={{fontSize: '18px'}}>add_a_photo</span> Upload Photo
                             <input type="file" accept="image/*" style={{display: 'none'}} onChange={handlePhotoUpload} />
                         </label>
                     </div>

                     {/* Right Column: Forms */}
                     <div style={{flex: 1}}>
                        <div style={{marginBottom: '30px'}}>
                            <h4 style={{margin: '0 0 20px 0', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem'}}><span className="material-symbols-outlined" style={{fontSize: '20px', color: '#4f46e5'}}>person</span> Personal Information</h4>
                            <div style={styles.grid3}>
                                <div><label style={styles.label}>Employee Code *</label><input style={styles.input} value={formData.id} onChange={e => setFormData({...formData, id: e.target.value})} /></div>
                                <div><label style={styles.label}>Full Name *</label><input style={styles.input} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                                <div><label style={styles.label}>Father Name</label><input style={styles.input} value={formData.fatherName} onChange={e => setFormData({...formData, fatherName: e.target.value})} /></div>
                                <div><label style={styles.label}>CNIC (#####-#######-#)</label><input style={styles.input} value={formData.cnic} onChange={e => setFormData({...formData, cnic: formatCNIC(e.target.value)})} placeholder="12345-1234567-1" /></div>
                                <div><label style={styles.label}>Phone (####-#######)</label><input style={styles.input} value={formData.phone} onChange={e => setFormData({...formData, phone: formatPhone(e.target.value)})} placeholder="03XX-XXXXXXX" /></div>
                                <div><label style={styles.label}>Date of Birth</label><input type="date" style={styles.input} value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} /></div>
                                <div>
                                    <label style={styles.label}>Gender</label>
                                    <select style={styles.input} value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}><option>Male</option><option>Female</option></select>
                                </div>
                                <div>
                                    <label style={styles.label}>Nationality</label>
                                    <select style={styles.input} value={formData.nationality} onChange={e => setFormData({...formData, nationality: e.target.value})}>
                                        <option>Pakistani</option>
                                        <option>Afghan</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={styles.label}>District</label>
                                    <select style={styles.input} value={formData.district} onChange={e => setFormData({...formData, district: e.target.value})}>
                                        <option value="">Select District</option>
                                        {KPK_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div style={{marginTop: '20px'}}>
                                <label style={styles.label}>Address</label>
                                <input style={styles.input} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Full address" />
                            </div>
                        </div>

                        <div style={{marginBottom: '30px'}}>
                            <h4 style={{margin: '0 0 20px 0', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem'}}><span className="material-symbols-outlined" style={{fontSize: '20px', color: '#4f46e5'}}>work</span> Employment Details</h4>
                            <div style={styles.grid3}>
                                <div>
                                    <label style={styles.label}>Campus *</label>
                                    <select style={styles.input} value={formData.campus} onChange={e => setFormData({...formData, campus: e.target.value})}>{masterData.campuses.map((c:Campus) => <option key={c.name}>{c.name}</option>)}</select>
                                </div>
                                <div>
                                    <label style={styles.label}>Department *</label>
                                    <select style={styles.input} value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})}>{masterData.departments.map((d:string) => <option key={d}>{d}</option>)}</select>
                                </div>
                                <div>
                                    <label style={styles.label}>Designation *</label>
                                    <select style={styles.input} value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})}>{EMPLOYEE_CATEGORIES.map(c => <option key={c}>{c}</option>)}</select>
                                </div>
                                <div>
                                    <label style={styles.label}>Employee Type</label>
                                    <select style={styles.input} value={formData.employeeType} onChange={e => setFormData({...formData, employeeType: e.target.value})}><option>Permanent</option><option>Contract</option><option>Visiting</option></select>
                                </div>
                                <div><label style={styles.label}>Joining Date</label><input type="date" style={styles.input} value={formData.joiningDate} onChange={e => setFormData({...formData, joiningDate: e.target.value})} /></div>
                                <div><label style={styles.label}>Basic Salary *</label><input type="number" style={styles.input} value={formData.basicSalary} onChange={e => setFormData({...formData, basicSalary: Number(e.target.value)})} /></div>
                                <div><label style={styles.label}>Security Deduction</label><input type="number" style={styles.input} value={formData.security} onChange={e => setFormData({...formData, security: Number(e.target.value)})} placeholder="Amount to cut" /></div>
                            </div>
                        </div>

                        <div style={{marginBottom: '30px'}}>
                            <h4 style={{margin: '0 0 20px 0', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem'}}><span className="material-symbols-outlined" style={{fontSize: '20px', color: '#4f46e5'}}>account_balance</span> Bank Details</h4>
                            <div style={styles.grid2}>
                                <div><label style={styles.label}>Bank Name</label><input style={styles.input} value={formData.bankName} onChange={e => setFormData({...formData, bankName: e.target.value})} /></div>
                                <div><label style={styles.label}>Account Number</label><input style={styles.input} value={formData.accountNumber} onChange={e => setFormData({...formData, accountNumber: e.target.value})} /></div>
                            </div>
                        </div>

                        <div style={{textAlign: 'right', display: 'flex', gap: '15px', justifyContent: 'flex-end', paddingTop: '20px', borderTop: '1px solid #f1f5f9'}}>
                            {formData.id && formData.name && (
                                <button style={styles.button("secondary")} onClick={handlePrintForm}>
                                    <span className="material-symbols-outlined">print</span> Print Form
                                </button>
                            )}
                            <button style={{...styles.button("primary"), padding: '12px 30px', backgroundColor: '#4f46e5'}} onClick={handleSave}>
                                <span className="material-symbols-outlined">save</span> Save Employee Record
                            </button>
                        </div>
                     </div>
                 </div>
             </div>
         )}

         {/* ATTENDANCE TAB - EXCEPTION BASED */}
         {activeTab === "attendance" && (
             <div className="no-print" style={styles.card}>
                 <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                     <h3 style={{margin: 0, color: '#0f172a'}}>Daily Attendance</h3>
                     <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                         <input type="date" style={styles.input} value={attDate} onChange={e => setAttDate(e.target.value)} />
                         <button style={styles.button("primary")} onClick={() => setShowAttModal(true)}>
                             <span className="material-symbols-outlined">edit_calendar</span> Mark Attendance
                         </button>
                     </div>
                 </div>

                 {/* Display Summary for Selected Date */}
                 <div style={{marginBottom: '20px'}}>
                     <h4>Summary for {attDate}:</h4>
                     {employeeAttendance.filter((a:any) => a.date === attDate).length === 0 ? (
                         <div style={{color: '#64748b'}}>No attendance recorded for this date.</div>
                     ) : (
                         <div style={{display: 'flex', gap: '20px'}}>
                             <div style={{background: '#dcfce7', padding: '10px 20px', borderRadius: '8px', color: '#166534'}}>
                                 Present: {employeeAttendance.filter((a:any) => a.date === attDate && a.status === 'Present').length}
                             </div>
                             <div style={{background: '#fee2e2', padding: '10px 20px', borderRadius: '8px', color: '#991b1b'}}>
                                 Absent: {employeeAttendance.filter((a:any) => a.date === attDate && a.status === 'Absent').length}
                             </div>
                             <div style={{background: '#fff7ed', padding: '10px 20px', borderRadius: '8px', color: '#c2410c'}}>
                                 Late/Leave: {employeeAttendance.filter((a:any) => a.date === attDate && (a.status === 'Late' || a.status === 'Leave')).length}
                             </div>
                         </div>
                     )}
                 </div>

                 {showAttModal && (
                     <div style={styles.modalOverlay}>
                         <div style={{...styles.modalContent, width: '900px', height: '80vh', display: 'flex', flexDirection: 'column'}}>
                             <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                                 <h3 style={{margin: 0}}>Mark Attendance - {attDate}</h3>
                                 <button onClick={() => setShowAttModal(false)} style={{background: 'transparent', border: 'none', cursor: 'pointer'}}>✕</button>
                             </div>
                             
                             <div style={{background: '#f0f9ff', padding: '15px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem', color: '#0369a1', border: '1px solid #bae6fd'}}>
                                 <strong>Note:</strong> All active employees will be marked <strong>PRESENT</strong> automatically. Only search and select employees who are Absent, Late, or on Leave.
                             </div>

                             <div style={{display: 'flex', gap: '20px', flex: 1, minHeight: 0}}>
                                 {/* Left: Search & Select */}
                                 <div style={{flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid #e2e8f0', paddingRight: '20px'}}>
                                     <input 
                                         style={{...styles.input, marginBottom: '10px'}} 
                                         placeholder="Search Employee..." 
                                         value={attSearch}
                                         onChange={e => setAttSearch(e.target.value)}
                                         autoFocus
                                     />
                                     <div style={{flex: 1, overflowY: 'auto', border: '1px solid #eee', borderRadius: '8px'}}>
                                         {attSearch && filteredAttSearch.map(e => (
                                             <div 
                                                 key={e.id} 
                                                 onClick={() => handleAttSearchSelect(e.id)}
                                                 style={{
                                                     padding: '10px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer',
                                                     background: attSelectedIds.includes(e.id) ? '#eff6ff' : 'white',
                                                     display: 'flex', justifyContent: 'space-between'
                                                 }}
                                             >
                                                 <div>
                                                     <div style={{fontWeight: 600}}>{e.name}</div>
                                                     <div style={{fontSize: '0.8rem', color: '#64748b'}}>{e.id} • {e.department}</div>
                                                 </div>
                                                 {attSelectedIds.includes(e.id) && <span style={{color: '#3b82f6'}}>✓</span>}
                                             </div>
                                         ))}
                                     </div>
                                     <div style={{marginTop: '10px', display: 'flex', gap: '5px'}}>
                                         <button onClick={() => markSelected('Absent')} disabled={attSelectedIds.length === 0} style={{...styles.button("danger"), flex: 1, justifyContent: 'center'}}>Mark Absent</button>
                                         <button onClick={() => markSelected('Leave')} disabled={attSelectedIds.length === 0} style={{...styles.button("secondary"), background: '#3b82f6', color: 'white', flex: 1, justifyContent: 'center'}}>Mark Leave</button>
                                         <button onClick={() => markSelected('Late')} disabled={attSelectedIds.length === 0} style={{...styles.button("secondary"), background: '#f59e0b', color: 'white', flex: 1, justifyContent: 'center'}}>Mark Late</button>
                                     </div>
                                 </div>

                                 {/* Right: Exceptions List */}
                                 <div style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
                                     <h4 style={{marginTop: 0, color: '#334155'}}>Exceptions ({Object.keys(attExceptions).length})</h4>
                                     <div style={{flex: 1, overflowY: 'auto', background: '#f8fafc', borderRadius: '8px', padding: '10px'}}>
                                         {Object.entries(attExceptions).map(([id, status]) => {
                                             const emp = employees.find(e => e.id === id);
                                             return (
                                                 <div key={id} style={{background: 'white', padding: '10px', marginBottom: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                                     <div>
                                                         <div style={{fontWeight: 600}}>{emp?.name}</div>
                                                         <span style={{fontSize: '0.8rem', padding: '2px 6px', borderRadius: '4px', background: status === 'Absent' ? '#fee2e2' : '#fff7ed', color: status === 'Absent' ? '#b91c1c' : '#c2410c'}}>{status}</span>
                                                     </div>
                                                     <button onClick={() => removeException(id)} style={{border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8'}}>✕</button>
                                                 </div>
                                             )
                                         })}
                                         {Object.keys(attExceptions).length === 0 && <div style={{color: '#94a3b8', fontStyle: 'italic', textAlign: 'center'}}>No exceptions marked. Everyone is Present.</div>}
                                     </div>
                                     <button onClick={saveAttendance} style={{...styles.button("primary"), marginTop: '20px', width: '100%', justifyContent: 'center'}}>
                                         Submit Attendance
                                     </button>
                                 </div>
                             </div>
                         </div>
                     </div>
                 )}
             </div>
         )}

         {/* DEPARTMENTS TAB */}
         {activeTab === "departments" && (
             <div className="no-print" style={styles.card}>
                 <h3 style={{marginTop: 0, color: '#0f172a'}}>Departments</h3>
                 <p style={{color: '#64748b', marginBottom: '20px'}}>Organize institute structure</p>
                 
                 <div style={{display: 'flex', gap: '10px', marginBottom: '30px', background: '#f8fafc', padding: '20px', borderRadius: '12px'}}>
                     <input style={{...styles.input, width: '300px'}} placeholder="Enter New Department Name" value={newDept} onChange={e => setNewDept(e.target.value)} />
                     <button style={{...styles.button("primary"), backgroundColor: '#4f46e5'}} onClick={handleAddDept}>+ Add Department</button>
                 </div>

                 <table style={styles.table}>
                     <thead><tr><th style={styles.th}>Department Name</th><th style={{...styles.th, width: '100px'}}>Action</th></tr></thead>
                     <tbody>
                         {masterData.departments.map((d: string) => (
                             <tr key={d}>
                                 <td style={styles.td}><span style={{fontWeight: 600, color: '#334155'}}>{d}</span></td>
                                 <td style={styles.td}>
                                     <button style={{border: 'none', background: '#fee2e2', color: '#b91c1c', cursor: 'pointer', padding: '6px', borderRadius: '4px'}} onClick={() => handleDeleteDept(d)}>
                                         <span className="material-symbols-outlined" style={{fontSize: '18px'}}>delete</span>
                                     </button>
                                 </td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
             </div>
         )}

         {/* EMPLOYEE LIST */}
         {activeTab === "list" && (
             <div className="no-print" style={styles.card}>
                 <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                    <div>
                        <h3 style={{margin: 0, color: '#0f172a'}}>Employee Directory</h3>
                        <div style={{fontSize: '0.85rem', color: '#64748b'}}>Total {filteredEmployees.length} records found</div>
                    </div>
                 </div>

                 <div style={{display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap', padding: '15px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0'}}>
                     <input style={{...styles.input, width: '250px', borderColor: '#cbd5e1'}} placeholder="Search by name or code..." value={search} onChange={e => setSearch(e.target.value)} />
                     <select style={{...styles.input, width: 'auto'}} value={filterCampus} onChange={e => setFilterCampus(e.target.value)}><option>All Campuses</option>{masterData.campuses.map((c:Campus) => <option key={c.name}>{c.name}</option>)}</select>
                     <select style={{...styles.input, width: 'auto'}} value={filterDept} onChange={e => setFilterDept(e.target.value)}><option>All Departments</option>{masterData.departments.map((d:string) => <option key={d}>{d}</option>)}</select>
                     <select style={{...styles.input, width: 'auto'}} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}><option>All Status</option><option>Active</option><option>Inactive</option></select>
                 </div>

                 <table style={styles.table}>
                     <thead>
                        <tr>
                            <th style={styles.th}>Employee</th>
                            <th style={styles.th}>Position</th>
                            <th style={styles.th}>Location</th>
                            <th style={styles.th}>Salary</th>
                            <th style={styles.th}>Status</th>
                            <th style={styles.th}>Actions</th>
                        </tr>
                     </thead>
                     <tbody>
                         {filteredEmployees.map((e: Employee) => (
                             <tr key={e.id} style={{transition: 'background 0.2s'}}>
                                 <td style={styles.td}>
                                     <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                                         <div style={{width: '36px', height: '36px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'}}>
                                            {e.photo ? <img src={e.photo} style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : <span className="material-symbols-outlined" style={{fontSize: '20px', color: '#94a3b8'}}>person</span>}
                                         </div>
                                         <div>
                                             <div style={{fontWeight: 600, color: '#0f172a'}}>{e.name}</div>
                                             <div style={{fontSize: '0.75rem', color: '#64748b'}}>{e.id}</div>
                                         </div>
                                     </div>
                                 </td>
                                 <td style={styles.td}>
                                     <div style={{fontSize: '0.9rem', color: '#334155'}}>{e.designation}</div>
                                     <div style={{fontSize: '0.75rem', color: '#64748b'}}>{e.department}</div>
                                 </td>
                                 <td style={styles.td}>{e.campus}</td>
                                 <td style={{...styles.td, fontWeight: 600}}>Rs {e.basicSalary.toLocaleString()}</td>
                                 <td style={styles.td}>
                                     <span style={{
                                         padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600,
                                         backgroundColor: e.status === 'Active' ? '#dcfce7' : '#fee2e2',
                                         color: e.status === 'Active' ? '#166534' : '#991b1b'
                                     }}>
                                         {e.status}
                                     </span>
                                 </td>
                                 <td style={styles.td}>
                                     <div style={{display: 'flex', gap: '8px'}}>
                                         <button style={{border: 'none', background: '#e0e7ff', color: '#4338ca', cursor: 'pointer', padding: '6px', borderRadius: '4px'}} onClick={() => { setFormData(e); setActiveTab("registration"); }}><span className="material-symbols-outlined" style={{fontSize: '18px'}}>edit</span></button>
                                         <button style={{border: 'none', background: '#fee2e2', color: '#b91c1c', cursor: 'pointer', padding: '6px', borderRadius: '4px'}} onClick={() => onDeleteEmployee(e.id)}><span className="material-symbols-outlined" style={{fontSize: '18px'}}>delete</span></button>
                                     </div>
                                 </td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
             </div>
         )}

         {/* DEDUCTIONS */}
         {activeTab === "deductions" && (
             <div className="no-print" style={styles.card}>
                 <h3 style={{marginTop: 0, color: '#0f172a'}}>Daily Deductions</h3>
                 <p style={{color: '#64748b', marginBottom: '20px'}}>Mark absenteeism or late arrivals</p>

                 <div style={{background: '#fffbeb', padding: '24px', borderRadius: '12px', marginBottom: '30px', border: '1px solid #fcd34d'}}>
                     <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                        <h4 style={{margin: 0, color: '#92400e'}}>1. Filter & Select Criteria</h4>
                     </div>
                     <div style={styles.grid4}>
                         <div><label style={styles.label}>Month</label><input style={styles.input} value={deductionMonth} onChange={e => setDeductionMonth(e.target.value)} /></div>
                         <div><label style={styles.label}>Campus</label><select style={styles.input} value={filterCampus} onChange={e => setFilterCampus(e.target.value)}><option>All Campuses</option>{masterData.campuses.map((c:Campus) => <option key={c.name}>{c.name}</option>)}</select></div>
                         <div><label style={styles.label}>Department</label><select style={styles.input} value={filterDept} onChange={e => setFilterDept(e.target.value)}><option>All Departments</option>{masterData.departments.map((d:string) => <option key={d}>{d}</option>)}</select></div>
                         <div><label style={styles.label}>Search</label><input style={styles.input} placeholder="Employee..." value={deductionSearch} onChange={e => setDeductionSearch(e.target.value)} /></div>
                     </div>
                     <div style={{marginTop: '20px', display: 'flex', gap: '15px', alignItems: 'end', borderTop: '1px solid #fde68a', paddingTop: '15px'}}>
                         <div style={{flex: 1}}>
                             <label style={styles.label}>Deduction Type</label>
                             <select style={styles.input} value={deductionType} onChange={e => setDeductionType(e.target.value)}><option>Late Coming</option><option>Absent</option><option>Advance Salary</option><option>Tax</option><option>Other</option></select>
                         </div>
                         <button style={{...styles.button("secondary"), background: 'white'}} onClick={() => setSelectedEmps(deductionEmployees.map(e => e.id))}>Select All Found</button>
                         <button style={{...styles.button("secondary"), background: 'white'}} onClick={() => setSelectedEmps([])}>Clear Selection</button>
                     </div>
                 </div>

                 <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                     <h4 style={{margin: 0, color: '#334155'}}>Employee List ({deductionEmployees.length})</h4>
                     <button style={{...styles.button("primary"), backgroundColor: '#b91c1c'}} onClick={applyDeductions} disabled={selectedEmps.length === 0}>
                         Apply to {selectedEmps.length} Selected
                     </button>
                 </div>

                 <div style={{maxHeight: '400px', overflowY: 'auto', marginBottom: '30px', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: 'inset 0 2px 4px 0 rgba(0,0,0,0.05)'}}>
                     <table style={styles.table}>
                         <thead style={{position: 'sticky', top: 0, zIndex: 1, boxShadow: '0 1px 2px rgba(0,0,0,0.1)'}}>
                             <tr>
                                 <th style={{...styles.th, width: '50px', textAlign: 'center'}}>Select</th>
                                 <th style={styles.th}>Employee Details</th>
                                 <th style={styles.th}>Basic Salary</th>
                                 <th style={styles.th}>Per Day Rate</th>
                                 <th style={styles.th}>Deduct Days</th>
                                 <th style={styles.th}>Calculated Amount</th>
                             </tr>
                         </thead>
                         <tbody>
                             {deductionEmployees.map((e: Employee) => {
                                 const isSelected = selectedEmps.includes(e.id);
                                 const perDay = Math.round(e.basicSalary / 30);
                                 const inp = deductionInputs[e.id] || {days: 0, amount: 0};
                                 return (
                                     <tr key={e.id} style={{background: isSelected ? '#fff7ed' : 'white'}}>
                                         <td style={{...styles.td, textAlign: 'center'}}>
                                             <input type="checkbox" checked={isSelected} onChange={() => handleDeductionSelect(e.id)} style={{width: '18px', height: '18px', cursor: 'pointer'}} />
                                         </td>
                                         <td style={styles.td}>
                                             <div style={{fontWeight: 600, color: '#0f172a'}}>{e.name}</div>
                                             <div style={{fontSize: '0.75rem', color: '#64748b'}}>{e.department} • {e.id}</div>
                                         </td>
                                         <td style={styles.td}>Rs {e.basicSalary.toLocaleString()}</td>
                                         <td style={styles.td}>Rs {perDay}</td>
                                         <td style={styles.td}>
                                             <input 
                                                 type="number" 
                                                 style={{...styles.input, width: '80px', padding: '6px', borderColor: isSelected ? '#f97316' : '#cbd5e1', fontWeight: 600}} 
                                                 disabled={!isSelected}
                                                 value={inp.days}
                                                 placeholder="0"
                                                 onChange={(ev) => handleDeductionInput(e.id, Number(ev.target.value), e.basicSalary)}
                                             />
                                         </td>
                                         <td style={{...styles.td, fontWeight: 'bold', color: '#c2410c'}}>Rs {inp.amount.toLocaleString()}</td>
                                     </tr>
                                 )
                             })}
                         </tbody>
                     </table>
                 </div>

                 <h4 style={{color: '#0f172a', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', marginTop: '40px'}}>Recent Deduction History</h4>
                 <table style={styles.table}>
                     <thead><tr><th style={styles.th}>Employee</th><th style={styles.th}>Type</th><th style={styles.th}>Month</th><th style={styles.th}>Days</th><th style={styles.th}>Amount</th><th style={styles.th}>Date</th></tr></thead>
                     <tbody>
                         {deductionHistory.slice().reverse().map((d: DeductionRecord) => (
                             <tr key={d.id}>
                                 <td style={styles.td}><span style={{fontWeight: 500}}>{d.employeeName}</span></td>
                                 <td style={styles.td}><span style={styles.badge('Liability')}>{d.type}</span></td>
                                 <td style={styles.td}>{d.month}</td>
                                 <td style={styles.td}>{d.days}</td>
                                 <td style={{...styles.td, color: '#b91c1c', fontWeight: 600}}>{d.amount.toLocaleString()}</td>
                                 <td style={{...styles.td, color: '#64748b', fontSize: '0.8rem'}}>{d.date}</td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
             </div>
         )}

         {/* PAYROLL REPORT */}
         {activeTab === "payroll_report" && (
             <div className="no-print">
                 <div style={{...styles.card, padding: '20px', marginBottom: '30px'}}>
                     <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <h3 style={{margin: 0, color: '#0f172a'}}>Monthly Payroll Generation</h3>
                        <button style={styles.button("secondary")} onClick={() => window.print()}>
                            <span className="material-symbols-outlined">print</span> Print List
                        </button>
                     </div>
                     <div style={{margin: '20px 0', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '12px', background: '#f8fafc'}}>
                        <div style={styles.grid4}>
                            <div><label style={styles.label}>Payroll Month</label><input style={styles.input} value={filterMonth} onChange={e => setFilterMonth(e.target.value)} /></div>
                            <div><label style={styles.label}>Campus</label><select style={styles.input} value={filterCampus} onChange={e => setFilterCampus(e.target.value)}><option>All Campuses</option>{masterData.campuses.map((c:Campus) => <option key={c.name}>{c.name}</option>)}</select></div>
                            <div><label style={styles.label}>Department</label><select style={styles.input} value={filterDept} onChange={e => setFilterDept(e.target.value)}><option>All Departments</option>{masterData.departments.map((d:string) => <option key={d}>{d}</option>)}</select></div>
                            <div><label style={styles.label}>Status</label><select style={styles.input} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}><option>All Status</option><option>Active</option><option>Inactive</option></select></div>
                        </div>
                     </div>
                 </div>

                 <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px'}}>
                     <StatWidget label="Total Staff" value={stats.count} icon="groups" color="#4f46e5" bg="#e0e7ff" />
                     <StatWidget label="Gross Salary" value={`Rs ${stats.gross.toLocaleString()}`} icon="payments" color="#166534" bg="#dcfce7" />
                     <StatWidget label="Deductions" value={`Rs ${stats.deduction.toLocaleString()}`} icon="trending_down" color="#b91c1c" bg="#fee2e2" />
                     <StatWidget label="Net Payable" value={`Rs ${stats.net.toLocaleString()}`} icon="account_balance_wallet" color="#0284c7" bg="#e0f2fe" />
                 </div>

                 <div style={styles.card} id="printable-area">
                    <h4 style={{color: '#0f172a', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px', margin: '0 0 20px 0'}}>Detailed Payroll Sheet</h4>
                    <div style={{overflowX: 'auto'}}>
                         <table style={styles.table}>
                             <thead>
                                 <tr>
                                     <th style={styles.th}>Code</th>
                                     <th style={styles.th}>Name</th>
                                     <th style={styles.th}>Department</th>
                                     <th style={styles.th}>Basic Salary</th>
                                     <th style={{...styles.th, textAlign: 'center'}}>Total Days</th>
                                     <th style={{...styles.th, textAlign: 'center', color: '#b91c1c'}}>Ded. Days</th>
                                     <th style={{...styles.th, textAlign: 'center', color: '#166534'}}>Payable</th>
                                     <th style={{...styles.th, textAlign: 'right', color: '#b91c1c'}}>Ded. Amount</th>
                                     <th style={{...styles.th, textAlign: 'right'}}>Net Pay</th>
                                     <th style={styles.th} className="no-print">Action</th>
                                 </tr>
                             </thead>
                             <tbody>
                                 {payrollDetails.map((e: any) => (
                                     <tr key={e.id}>
                                         <td style={styles.td}><span style={{fontSize: '0.8rem', color: '#64748b'}}>{e.id}</span></td>
                                         <td style={styles.td}><span style={{fontWeight: 600, color: '#0f172a'}}>{e.name}</span><br/><span style={{fontSize: '0.75rem', color: '#64748b'}}>{e.designation}</span></td>
                                         <td style={styles.td}>{e.department}</td>
                                         <td style={styles.td}>Rs {e.basicSalary.toLocaleString()}</td>
                                         <td style={{...styles.td, textAlign: 'center'}}>30</td>
                                         <td style={{...styles.td, textAlign: 'center', color: e.totalDeductedDays > 0 ? '#b91c1c' : 'inherit', fontWeight: e.totalDeductedDays > 0 ? 700 : 400}}>{e.totalDeductedDays}</td>
                                         <td style={{...styles.td, textAlign: 'center', fontWeight: 'bold'}}>{e.payableDays}</td>
                                         <td style={{...styles.td, textAlign: 'right', color: e.totalDeductedAmount > 0 ? '#b91c1c' : 'inherit'}}>{(e.totalDeductedAmount + e.securityDeduction).toLocaleString()}</td>
                                         <td style={{...styles.td, textAlign: 'right', fontWeight: 'bold', fontSize: '1rem', color: '#0f172a'}}>Rs {e.netPay.toLocaleString()}</td>
                                         <td style={styles.td} className="no-print">
                                             <button onClick={() => handlePrintSalarySlip(e)} style={{padding: '6px 12px', background: '#334155', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', transition: 'background 0.2s'}}>
                                                 <span className="material-symbols-outlined" style={{fontSize: '16px'}}>print</span> Slip
                                             </button>
                                         </td>
                                     </tr>
                                 ))}
                             </tbody>
                         </table>
                    </div>
                 </div>
             </div>
         )}

         {/* HR REPORTS TAB */}
         {activeTab === "employee_report" && (
             <div className="no-print" style={styles.card}>
                 <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                     <h3 style={{margin: 0, color: '#0f172a'}}>Analytics & Reports</h3>
                 </div>

                 <div style={{display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px'}}>
                     <button onClick={() => setReportTab("payroll_campus")} style={{...styles.tabButton(reportTab === 'payroll_campus')}}>Payroll (Campus Wise)</button>
                     <button onClick={() => setReportTab("deduction")} style={{...styles.tabButton(reportTab === 'deduction')}}>Deduction Report</button>
                     <button onClick={() => setReportTab("security")} style={{...styles.tabButton(reportTab === 'security')}}>Security Report</button>
                     <button onClick={() => setReportTab("attendance")} style={{...styles.tabButton(reportTab === 'attendance')}}>Attendance Report</button>
                 </div>

                 {/* Payroll Campus Wise */}
                 {reportTab === "payroll_campus" && (
                     <div id="printable-area">
                         <div style={{textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid #0f172a', paddingBottom: '15px'}}>
                             <h2 style={{margin: 0, textTransform: 'uppercase'}}>Campus Wise Payroll Summary</h2>
                             <div style={{color: '#64748b'}}>For the month of: <strong>{filterMonth}</strong></div>
                         </div>
                         {Object.entries(getPayrollByCampus()).map(([campus, data]: any) => (
                             <div key={campus} style={{marginBottom: '40px', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)'}}>
                                 <div style={{background: '#f8fafc', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0'}}>
                                     <h3 style={{margin: 0, color: '#1e293b'}}>{campus}</h3>
                                     <div style={{display: 'flex', gap: '20px', fontSize: '0.9rem'}}>
                                         <div>Employees: <strong>{data.count}</strong></div>
                                         <div style={{color: '#166534'}}>Total Net Pay: <strong>Rs {data.net.toLocaleString()}</strong></div>
                                     </div>
                                 </div>
                                 <table style={styles.table}>
                                     <thead style={{background: '#f1f5f9'}}>
                                         <tr>
                                             <th style={{...styles.th, padding: '12px'}}>Employee Name</th>
                                             <th style={{...styles.th, padding: '12px'}}>Designation</th>
                                             <th style={{...styles.th, padding: '12px', textAlign: 'right'}}>Basic Salary</th>
                                             <th style={{...styles.th, padding: '12px', textAlign: 'right'}}>Deductions</th>
                                             <th style={{...styles.th, padding: '12px', textAlign: 'right'}}>Net Payable</th>
                                         </tr>
                                     </thead>
                                     <tbody>
                                         {data.employees.length > 0 ? data.employees.map((e: any) => (
                                             <tr key={e.id}>
                                                 <td style={{...styles.td, padding: '10px 12px'}}>{e.name} <span style={{fontSize: '0.75rem', color: '#64748b'}}>({e.id})</span></td>
                                                 <td style={{...styles.td, padding: '10px 12px'}}>{e.designation}</td>
                                                 <td style={{...styles.td, padding: '10px 12px', textAlign: 'right'}}>{e.basicSalary.toLocaleString()}</td>
                                                 <td style={{...styles.td, padding: '10px 12px', textAlign: 'right', color: '#b91c1c'}}>{e.empDeductions.toLocaleString()}</td>
                                                 <td style={{...styles.td, padding: '10px 12px', textAlign: 'right', fontWeight: 'bold', color: '#0f172a'}}>{e.net.toLocaleString()}</td>
                                             </tr>
                                         )) : <tr><td colSpan={5} style={{padding: '20px', textAlign: 'center', color: '#94a3b8'}}>No employees found</td></tr>}
                                     </tbody>
                                 </table>
                             </div>
                         ))}
                         <div className="no-print" style={{textAlign: 'right'}}>
                            <button style={styles.button("primary")} onClick={() => window.print()}><span className="material-symbols-outlined">print</span> Print Full Report</button>
                         </div>
                     </div>
                 )}

                 {/* Deduction Report */}
                 {reportTab === "deduction" && (
                     <div id="printable-area">
                         <div style={{textAlign: 'center', marginBottom: '30px'}}>
                             <h2 style={{margin: 0, textTransform: 'uppercase'}}>Deduction Report</h2>
                             <div style={{color: '#64748b'}}>Historical Record of Deductions</div>
                         </div>
                         
                         <div style={{display: 'flex', gap: '20px', marginBottom: '20px'}}>
                             <div style={{flex: 1, padding: '20px', background: '#fff7ed', borderRadius: '8px', border: '1px solid #fed7aa'}}>
                                 <div style={{fontSize: '0.9rem', color: '#9a3412', fontWeight: 600}}>Total Deductions Amount</div>
                                 <div style={{fontSize: '1.8rem', fontWeight: 800, color: '#c2410c'}}>Rs {deductionHistory.reduce((a, b) => a + b.amount, 0).toLocaleString()}</div>
                             </div>
                             <div style={{flex: 1, padding: '20px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca'}}>
                                 <div style={{fontSize: '0.9rem', color: '#991b1b', fontWeight: 600}}>Total Records</div>
                                 <div style={{fontSize: '1.8rem', fontWeight: 800, color: '#b91c1c'}}>{deductionHistory.length}</div>
                             </div>
                         </div>

                         <table style={{...styles.table, border: '1px solid #e2e8f0'}}>
                             <thead style={{background: '#f8fafc'}}>
                                 <tr>
                                     <th style={{...styles.th, padding: '12px'}}>Date</th>
                                     <th style={{...styles.th, padding: '12px'}}>Employee</th>
                                     <th style={{...styles.th, padding: '12px'}}>Type</th>
                                     <th style={{...styles.th, padding: '12px'}}>Month</th>
                                     <th style={{...styles.th, padding: '12px'}}>Amount</th>
                                     <th style={{...styles.th, padding: '12px'}}>Remarks</th>
                                 </tr>
                             </thead>
                             <tbody>
                                 {deductionHistory.length > 0 ? deductionHistory.map((d: DeductionRecord) => (
                                     <tr key={d.id}>
                                         <td style={{...styles.td, padding: '10px 12px'}}>{d.date}</td>
                                         <td style={{...styles.td, padding: '10px 12px', fontWeight: 500}}>{d.employeeName}</td>
                                         <td style={{...styles.td, padding: '10px 12px'}}><span style={styles.badge('Liability')}>{d.type}</span></td>
                                         <td style={{...styles.td, padding: '10px 12px'}}>{d.month}</td>
                                         <td style={{...styles.td, padding: '10px 12px', color: '#b91c1c', fontWeight: 600}}>{d.amount.toLocaleString()}</td>
                                         <td style={{...styles.td, padding: '10px 12px', color: '#64748b'}}>{d.remarks}</td>
                                     </tr>
                                 )) : <tr><td colSpan={6} style={{padding: '30px', textAlign: 'center', color: '#94a3b8'}}>No records found</td></tr>}
                             </tbody>
                         </table>
                         <div className="no-print" style={{textAlign: 'right', marginTop: '20px'}}>
                            <button style={styles.button("secondary")} onClick={() => window.print()}><span className="material-symbols-outlined">print</span> Print Report</button>
                         </div>
                     </div>
                 )}

                 {/* Security Report */}
                 {reportTab === "security" && (
                     <div id="printable-area">
                         <div style={{textAlign: 'center', marginBottom: '30px'}}>
                             <h2 style={{margin: 0, textTransform: 'uppercase'}}>Employee Security Deposit Report</h2>
                             <div style={{color: '#64748b'}}>Held Security Amounts</div>
                         </div>

                         <div style={{marginBottom: '20px', padding: '20px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                             <div>
                                 <div style={{color: '#166534', fontWeight: 600}}>Total Security Held</div>
                                 <div style={{fontSize: '2rem', fontWeight: 800, color: '#15803d'}}>Rs {employees.reduce((a,b) => a + (b.security||0), 0).toLocaleString()}</div>
                             </div>
                             <div style={{textAlign: 'right'}}>
                                 <div style={{color: '#166534', fontWeight: 600}}>Employees Contributing</div>
                                 <div style={{fontSize: '2rem', fontWeight: 800, color: '#15803d'}}>{employees.filter(e => (e.security || 0) > 0).length}</div>
                             </div>
                         </div>

                         <table style={{...styles.table, border: '1px solid #e2e8f0'}}>
                             <thead style={{background: '#f8fafc'}}>
                                 <tr>
                                     <th style={{...styles.th, padding: '12px'}}>Employee ID</th>
                                     <th style={{...styles.th, padding: '12px'}}>Name</th>
                                     <th style={{...styles.th, padding: '12px'}}>Campus</th>
                                     <th style={{...styles.th, padding: '12px'}}>Designation</th>
                                     <th style={{...styles.th, padding: '12px', textAlign: 'right'}}>Security Amount</th>
                                 </tr>
                             </thead>
                             <tbody>
                                 {employees.filter(e => (e.security || 0) > 0).map((e: Employee) => (
                                     <tr key={e.id}>
                                         <td style={{...styles.td, padding: '10px 12px'}}>{e.id}</td>
                                         <td style={{...styles.td, padding: '10px 12px', fontWeight: 500}}>{e.name}</td>
                                         <td style={{...styles.td, padding: '10px 12px'}}>{e.campus}</td>
                                         <td style={{...styles.td, padding: '10px 12px'}}>{e.designation}</td>
                                         <td style={{...styles.td, padding: '10px 12px', textAlign: 'right', fontWeight: 'bold', color: '#166534'}}>{e.security?.toLocaleString()}</td>
                                     </tr>
                                 ))}
                             </tbody>
                         </table>
                         <div className="no-print" style={{textAlign: 'right', marginTop: '20px'}}>
                            <button style={styles.button("secondary")} onClick={() => window.print()}><span className="material-symbols-outlined">print</span> Print Report</button>
                         </div>
                     </div>
                 )}

                 {/* Attendance Report */}
                 {reportTab === "attendance" && (
                     <div id="printable-area">
                         <div style={{textAlign: 'center', marginBottom: '30px'}}>
                             <h2 style={{margin: 0, textTransform: 'uppercase'}}>Attendance History Report</h2>
                         </div>
                         
                         <div className="no-print" style={{display: 'flex', gap: '15px', marginBottom: '20px', background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0'}}>
                             <div style={{flex: 1}}>
                                 <label style={styles.label}>Select Month</label>
                                 <input type="month" style={styles.input} value={reportMonth} onChange={e => setReportMonth(e.target.value)} />
                             </div>
                             <div style={{flex: 2}}>
                                 <label style={styles.label}>Search Employee</label>
                                 <input style={styles.input} placeholder="Name or ID..." value={reportSearch} onChange={e => setReportSearch(e.target.value)} />
                             </div>
                         </div>

                         <table style={{...styles.table, border: '1px solid #e2e8f0'}}>
                             <thead style={{background: '#f8fafc'}}>
                                 <tr>
                                     <th style={{...styles.th, padding: '12px'}}>Date</th>
                                     <th style={{...styles.th, padding: '12px'}}>Employee</th>
                                     <th style={{...styles.th, padding: '12px'}}>Status</th>
                                 </tr>
                             </thead>
                             <tbody>
                                 {employeeAttendance
                                     .filter(a => a.date.startsWith(reportMonth) && (!reportSearch || a.name.toLowerCase().includes(reportSearch.toLowerCase())))
                                     .sort((a, b) => b.date.localeCompare(a.date))
                                     .map((a: EmployeeAttendance) => (
                                     <tr key={a.id}>
                                         <td style={{...styles.td, padding: '10px 12px'}}>{a.date}</td>
                                         <td style={{...styles.td, padding: '10px 12px'}}>{a.name} <span style={{color: '#64748b', fontSize: '0.8rem'}}>({a.employeeId})</span></td>
                                         <td style={{...styles.td, padding: '10px 12px'}}>
                                             <span style={{
                                                 padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600,
                                                 background: a.status === 'Present' ? '#dcfce7' : a.status === 'Absent' ? '#fee2e2' : '#fff7ed',
                                                 color: a.status === 'Present' ? '#166534' : a.status === 'Absent' ? '#b91c1c' : '#c2410c',
                                                 display: 'inline-block', minWidth: '60px', textAlign: 'center'
                                             }}>
                                                 {a.status}
                                             </span>
                                         </td>
                                     </tr>
                                 ))}
                                 {employeeAttendance.filter(a => a.date.startsWith(reportMonth)).length === 0 && 
                                    <tr><td colSpan={3} style={{padding: '30px', textAlign: 'center', color: '#94a3b8'}}>No attendance records found for this month</td></tr>
                                 }
                             </tbody>
                         </table>
                         <div className="no-print" style={{textAlign: 'right', marginTop: '20px'}}>
                            <button style={styles.button("secondary")} onClick={() => window.print()}><span className="material-symbols-outlined">print</span> Print Report</button>
                         </div>
                     </div>
                 )}
             </div>
         )}
      </div>
   );
};
