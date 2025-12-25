
import React, { useState, useEffect } from "react";
import { styles } from "./styles";
import { Transaction, Student, HOSPITALS, Campus, INITIAL_TEACHERS, StudentAttendance } from "./types";

export const ReportsModule = ({ students, transactions, masterData, subTab, currentUser, studentAttendance = [], setStudentAttendance }: any) => {
   const [activeTab, setActiveTab] = useState(subTab || "defaulters");
   
   useEffect(() => { if(subTab) setActiveTab(subTab); }, [subTab]);

   // Pagination States
   const [pageDefaulters, setPageDefaulters] = useState(1);
   const [pageStudents, setPageStudents] = useState(1);
   const [pageAdmissions, setPageAdmissions] = useState(1);
   const itemsPerPage = 15;

   const [prog, setProg] = useState("All");
   const [sem, setSem] = useState("All");
   const [camp, setCamp] = useState("All");
   const [gender, setGender] = useState("All");
   const [status, setStatus] = useState("All");
   
   const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
   const [selectedProgram, setSelectedProgram] = useState<string | null>(null);

   const [dateFrom, setDateFrom] = useState(new Date().getFullYear() + "-01-01");
   const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));

   const [attDate, setAttDate] = useState(new Date().toISOString().slice(0, 10));
   const [selectedTeacher, setSelectedTeacher] = useState("All");
   const [viewHistoryMonth, setViewHistoryMonth] = useState(new Date().toISOString().slice(0, 7));
   
   const [attSearch, setAttSearch] = useState("");
   const [attSelectedIds, setAttSelectedIds] = useState<string[]>([]);
   const [attExceptions, setAttExceptions] = useState<Record<string, "Absent" | "Late" | "Leave">>({});
   const [showAttModal, setShowAttModal] = useState(false);

   const [histCampus, setHistCampus] = useState("All");
   const [histProgram, setHistProgram] = useState("All");
   const [histSemester, setHistSemester] = useState("All");
   const [histTeacher, setHistTeacher] = useState("All");

   const [showBlankSheet, setShowBlankSheet] = useState(false);

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
       setAttSearch(""); 
   };

   const removeException = (id: string) => {
       const newExceptions = { ...attExceptions };
       delete newExceptions[id];
       setAttExceptions(newExceptions);
   };

   const saveStudentAttendance = () => {
       if (prog === "All" || sem === "All") return alert("Please select Program and Semester first.");
       
       const activeStudentsForClass = students.filter((s: Student) => 
           (s.status !== 'Left Student' && s.status !== 'Course Completed') && 
           (prog === "All" || s.program === prog) &&
           (sem === "All" || s.semester === sem) &&
           (camp === "All" || s.campus === camp)
       );

       if (activeStudentsForClass.length === 0) return alert("No active students found for selected criteria.");

       const newRecord: StudentAttendance = {
           id: `ATT-${Date.now()}`,
           date: attDate,
           campus: camp,
           program: prog,
           semester: sem,
           teacher: selectedTeacher,
           records: activeStudentsForClass.map((s: Student) => ({
               studentId: s.admissionNo,
               name: s.name,
               status: attExceptions[s.admissionNo] || "Present"
           }))
       };

       setStudentAttendance([...studentAttendance, newRecord]);
       setShowAttModal(false);
       setAttExceptions({});
       alert("Attendance saved successfully!");
   };

   const filteredAttSearch = students.filter((s: Student) => 
       (s.status !== 'Left Student' && s.status !== 'Course Completed') && 
       (s.name.toLowerCase().includes(attSearch.toLowerCase()) || s.admissionNo.toLowerCase().includes(attSearch.toLowerCase())) &&
       (prog === "All" || s.program === prog) &&
       (sem === "All" || s.semester === sem) &&
       (camp === "All" || s.campus === camp)
   );

   const formatDateDisplay = (dateString: string) => {
       if(!dateString) return "";
       const [y, m, d] = dateString.split('-');
       return `${d}/${m}/${y}`;
   };

   const PaginationControls = ({ current, total, onPageChange }: any) => (
       <div className="no-print" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '20px', padding: '15px', borderTop: '1px solid #e2e8f0'}}>
           <button 
               style={{...styles.button("secondary"), padding: '8px 15px', opacity: current === 1 ? 0.5 : 1}} 
               disabled={current === 1} 
               onClick={() => onPageChange(current - 1)}
           >
               <span className="material-symbols-outlined">chevron_left</span> Previous
           </button>
           <div style={{fontWeight: 600, fontSize: '0.9rem', color: '#475569'}}>Page {current} of {total || 1}</div>
           <button 
               style={{...styles.button("secondary"), padding: '8px 15px', opacity: current === total ? 0.5 : 1}} 
               disabled={current === total || total === 0} 
               onClick={() => onPageChange(current + 1)}
           >
               Next <span className="material-symbols-outlined">chevron_right</span>
           </button>
       </div>
   );

   const ReportHeader = ({ title, subTitle }: { title: string, subTitle?: string }) => (
       <div id="printable-area" style={{marginBottom: '20px', display: 'none'}} className="print-header">
           <div style={{textAlign: 'center', marginBottom: '15px', borderBottom: '2px solid #000', paddingBottom: '10px'}}>
               <h1 style={{margin: '0', textTransform: 'uppercase', color: '#000', fontSize: '1.8rem'}}>Ghazali Institute of Medical Sciences</h1>
               <div style={{fontSize: '1.2rem', fontWeight: 600, marginTop: '5px'}}>{title}</div>
               {subTitle && <div style={{fontSize: '1rem', marginTop: '2px'}}>{subTitle}</div>}
           </div>
           <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#333', marginBottom: '15px'}}>
               <div>Generated By: <strong>{currentUser || 'System'}</strong></div>
               <div>Date: {new Date().toLocaleDateString()} | Time: {new Date().toLocaleTimeString()}</div>
           </div>
       </div>
   );

   const FilterBar = ({ children }: any) => (
       <div className="no-print" style={{
           display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center',
           background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0',
           marginBottom: '20px'
       }}>
           {children}
       </div>
   );

   const FilterItem = ({ label, children, width = 'auto' }: any) => (
       <div style={{width}}>
           <label style={{...styles.label, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px'}}>{label}</label>
           {children}
       </div>
   );

   const filteredStudentsClass = students.filter((s: Student) => {
       if(prog !== "All" && s.program !== prog) return false;
       if(sem !== "All" && s.semester !== sem) return false;
       if(camp !== "All" && s.campus !== camp) return false;
       if(s.status === "Left Student" || s.status === "Course Completed") return false;
       return true;
   });

   let content = null;

   if(activeTab === "defaulters") {
      const allDefaulters = students.filter((s: Student) => s.balance > 0);
      let filteredList = allDefaulters;
      if(prog !== "All") filteredList = filteredList.filter((s:Student) => s.program === prog);
      if(sem !== "All") filteredList = filteredList.filter((s:Student) => s.semester === sem);
      if(camp !== "All") filteredList = filteredList.filter((s:Student) => s.campus === camp);
      if(selectedBoard) {
          filteredList = filteredList.filter((s:Student) => s.board === selectedBoard);
          if(selectedProgram) filteredList = filteredList.filter((s:Student) => s.program === selectedProgram);
      }
      filteredList.sort((a:Student,b:Student) => b.balance - a.balance);
      const totalDefaulterAmount = filteredList.reduce((acc:number, s:Student) => acc + s.balance, 0);

      const campusSummary = masterData.campuses.map((c: Campus, idx: number) => {
          const cDefaulters = allDefaulters.filter((s: Student) => s.campus === c.name);
          const cBalance = cDefaulters.reduce((acc: number, s: Student) => acc + s.balance, 0);
          const colors = ["#4f46e5", "#ef4444", "#8b5cf6", "#f59e0b"];
          const bgs = ["#eef2ff", "#fef2f2", "#f5f3ff", "#fffbeb"];
          return {
              name: c.name,
              count: cDefaulters.length,
              balance: cBalance,
              color: colors[idx % colors.length],
              bg: bgs[idx % bgs.length]
          };
      });

      const totalPages = Math.ceil(filteredList.length / itemsPerPage);
      const paginatedList = filteredList.slice((pageDefaulters - 1) * itemsPerPage, pageDefaulters * itemsPerPage);

      content = (
         <div id="printable-area">
            <ReportHeader title="Defaulters List" subTitle={selectedBoard ? `${selectedBoard} - ${selectedProgram || 'All Programs'}` : 'All Defaulters'} />
            
            <FilterBar>
               <FilterItem label="Campus" width="200px">
                  <select style={styles.input} value={camp} onChange={e => { setCamp(e.target.value); setPageDefaulters(1); }}>
                     <option value="All">All Campuses</option>
                     {masterData.campuses.map((c: Campus) => <option key={c.name}>{c.name}</option>)}
                  </select>
               </FilterItem>
               <FilterItem label="Technology" width="200px">
                  <select style={styles.input} value={prog} onChange={e => { setProg(e.target.value); setPageDefaulters(1); }}>
                     <option value="All">All Programs</option>
                     {masterData.programs.map((p:string) => <option key={p}>{p}</option>)}
                  </select>
               </FilterItem>
               <FilterItem label="Semester" width="150px">
                  <select style={styles.input} value={sem} onChange={e => { setSem(e.target.value); setPageDefaulters(1); }}>
                     <option value="All">All Semesters</option>
                     {masterData.semesters.map((s:string) => <option key={s}>{s}</option>)}
                  </select>
               </FilterItem>
               <div style={{marginLeft: 'auto', textAlign: 'right'}}>
                  <div style={{fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px'}}>Overall Outstanding</div>
                  <div style={{fontWeight: 800, fontSize: '1.4rem', color: '#b91c1c'}}>Rs {totalDefaulterAmount.toLocaleString()}</div>
               </div>
            </FilterBar>

            <div className="no-print" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px'}}>
               {campusSummary.map((stat: any) => (
                  <div key={stat.name} style={{
                     ...styles.kpiCard(stat.color, stat.bg),
                     borderLeft: `5px solid ${stat.color}`,
                     boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                     minHeight: '100px',
                     padding: '16px 20px'
                  }}>
                     <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                        <div>
                           <div style={{fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px'}}>{stat.name}</div>
                           <div style={{fontSize: '1.35rem', fontWeight: 800, color: '#1e293b'}}>Rs {stat.balance.toLocaleString()}</div>
                        </div>
                        <div style={{padding: '8px', background: 'white', borderRadius: '10px', color: stat.color, border: `1px solid ${stat.color}20`}}>
                           <span className="material-symbols-outlined">domain</span>
                        </div>
                     </div>
                  </div>
               ))}
            </div>

            <div style={styles.card}>
               <table style={styles.table}><thead><tr style={{background: '#fff1f2'}}><th style={styles.th}>S.No</th><th style={styles.th}>Name</th><th style={styles.th}>Father</th><th style={styles.th}>Program</th><th style={styles.th}>Phone</th><th style={{...styles.th, textAlign: 'right'}}>Outstanding</th><th style={{...styles.th, textAlign: 'center'}}>Photo</th></tr></thead>
               <tbody>
                   {paginatedList.map((s: Student, i: number) => (
                       <tr key={s.admissionNo}>
                           <td style={styles.td}>{(pageDefaulters - 1) * itemsPerPage + i + 1}</td>
                           <td style={styles.td}><div style={{fontWeight: 600}}>{s.name}</div><div style={{fontSize: '0.75rem', color: '#64748b'}}>{s.admissionNo}</div></td>
                           <td style={styles.td}>{s.fatherName}</td>
                           <td style={styles.td}>{s.program} ({s.semester})</td>
                           <td style={styles.td}>{s.phone}</td>
                           <td style={{...styles.td, textAlign: 'right', color: '#b91c1c', fontWeight: 700}}>Rs {s.balance.toLocaleString()}</td>
                           <td style={{...styles.td, textAlign: 'center'}}>
                               <div style={{width: '60px', height: '60px', borderRadius: '4px', border: '1px solid #ddd', overflow: 'hidden', margin: '0 auto', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                   {s.photo ? <img src={s.photo} style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : <span className="material-symbols-outlined" style={{fontSize: '28px', color: '#cbd5e1'}}>person</span>}
                               </div>
                           </td>
                       </tr>
                   ))}
               </tbody>
               </table>
               <PaginationControls current={pageDefaulters} total={totalPages} onPageChange={setPageDefaulters} />
            </div>
         </div>
      );
   } else if (activeTab === "students_list") {
      const filtered = students.filter((s: Student) => {
         if(prog !== "All" && s.program !== prog) return false;
         if(sem !== "All" && s.semester !== sem) return false;
         if(camp !== "All" && s.campus !== camp) return false;
         if(gender !== "All" && s.gender !== gender) return false;
         if(status !== "All" && s.status !== status) return false;
         return true;
      });

      const totalPages = Math.ceil(filtered.length / itemsPerPage);
      const paginatedList = filtered.slice((pageStudents - 1) * itemsPerPage, pageStudents * itemsPerPage);

      content = (
         <div id="printable-area">
             <ReportHeader title="Student List" subTitle={`${prog !== 'All' ? prog : 'All Programs'} ${sem !== 'All' ? `(${sem})` : ''}`} />
             
             <FilterBar>
                <FilterItem label="Campus">
                  <select style={styles.input} value={camp} onChange={e => { setCamp(e.target.value); setPageStudents(1); }}>
                    <option value="All">All Campuses</option>
                    {masterData.campuses.map((c: Campus) => <option key={c.name}>{c.name}</option>)}
                  </select>
                </FilterItem>
                <FilterItem label="Program">
                  <select style={styles.input} value={prog} onChange={e => { setProg(e.target.value); setPageStudents(1); }}>
                    <option value="All">All Programs</option>
                    {masterData.programs.map((p:string) => <option key={p}>{p}</option>)}
                  </select>
                </FilterItem>
                <FilterItem label="Semester">
                  <select style={styles.input} value={sem} onChange={e => { setSem(e.target.value); setPageStudents(1); }}>
                    <option value="All">All Semesters</option>
                    {masterData.semesters.map((s:string) => <option key={s}>{s}</option>)}
                  </select>
                </FilterItem>
                <FilterItem label="Status">
                  <select style={styles.input} value={status} onChange={e => { setStatus(e.target.value); setPageStudents(1); }}>
                    <option value="All">All Statuses</option>
                    <option>Free</option><option>Paid</option><option>Course Completed</option><option>Left Student</option>
                  </select>
                </FilterItem>
                <div style={{marginLeft: 'auto', alignSelf: 'flex-end'}}>
                   <div style={{fontSize: '0.8rem', color: '#64748b'}}>Total Students</div>
                   <div style={{fontSize: '1.2rem', fontWeight: 700, color: '#0f172a'}}>{filtered.length} Records</div>
                </div>
             </FilterBar>

             <div style={styles.card}>
               <table style={styles.table}>
                  <thead>
                      <tr>
                          <th style={styles.th}>S.No</th>
                          <th style={styles.th}>Admission No</th>
                          <th style={styles.th}>Student Name</th>
                          <th style={styles.th}>Father Name</th>
                          <th style={styles.th}>Phone #</th>
                          <th style={styles.th}>Program</th>
                          <th style={styles.th}>Status</th>
                          <th style={styles.th}>Remarks</th>
                      </tr>
                  </thead>
                  <tbody>
                      {paginatedList.map((s:Student,i:number)=>(
                          <tr key={s.admissionNo} style={{backgroundColor: i % 2 === 0 ? 'white' : '#f8fafc'}}>
                              <td style={styles.td}>{(pageStudents - 1) * itemsPerPage + i + 1}</td>
                              <td style={styles.td}>{s.admissionNo}</td>
                              <td style={{...styles.td, fontWeight: 600}}>{s.name}</td>
                              <td style={styles.td}>{s.fatherName}</td>
                              <td style={styles.td}>{s.phone || '-'}</td>
                              <td style={styles.td}>{s.program} ({s.semester})</td>
                              <td style={styles.td}>{s.status}</td>
                              <td style={styles.td}>{s.remarks}</td>
                          </tr>
                      ))}
                  </tbody>
               </table>
               <PaginationControls current={pageStudents} total={totalPages} onPageChange={setPageStudents} />
             </div>
         </div>
      );
   } else if (activeTab === "admission_reg") {
      const newAdmissions = students.filter((s: Student) => s.admissionDate && s.admissionDate >= dateFrom && s.admissionDate <= dateTo);
      const totalPages = Math.ceil(newAdmissions.length / itemsPerPage);
      const paginatedList = newAdmissions.slice((pageAdmissions - 1) * itemsPerPage, pageAdmissions * itemsPerPage);

      content = (
         <div style={styles.card} id="printable-area">
             <ReportHeader title="New Admission Register" subTitle={`${formatDateDisplay(dateFrom)} to ${formatDateDisplay(dateTo)}`} />
             <div className="no-print" style={{display: 'flex', gap: '15px', marginBottom: '20px', background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0'}}>
                <FilterItem label="From">
                    <input type="date" style={styles.input} value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPageAdmissions(1); }} />
                </FilterItem>
                <FilterItem label="To">
                    <input type="date" style={styles.input} value={dateTo} onChange={e => { setDateTo(e.target.value); setPageAdmissions(1); }} />
                </FilterItem>
                <div style={{marginLeft: 'auto', display: 'flex', gap: '20px', alignItems: 'center'}}>
                     <div style={{color: '#166534', fontWeight: 600}}>Total New: {newAdmissions.length}</div>
                </div>
             </div>
             <table style={styles.table}><thead><tr><th style={styles.th}>S.No</th><th style={styles.th}>Date</th><th style={styles.th}>Adm No</th><th style={styles.th}>Name</th><th style={styles.th}>Father Name</th><th style={styles.th}>Program</th><th style={{...styles.th, textAlign: 'right'}}>Adm Fee</th></tr></thead>
             <tbody>
                 {paginatedList.map((s: Student, i: number) => (
                    <tr key={s.admissionNo}>
                        <td style={styles.td}>{(pageAdmissions - 1) * itemsPerPage + i + 1}</td>
                        <td style={styles.td}>{formatDateDisplay(s.admissionDate||'')}</td>
                        <td style={styles.td}>{s.admissionNo}</td>
                        <td style={styles.td}>{s.name}</td>
                        <td style={styles.td}>{s.fatherName}</td>
                        <td style={styles.td}>{s.program} ({s.semester})</td>
                        <td style={{...styles.td, textAlign: 'right', fontWeight: 600}}>{s.admissionFee.toLocaleString()}</td>
                    </tr>
                 ))}
             </tbody>
             </table>
             <PaginationControls current={pageAdmissions} total={totalPages} onPageChange={setPageAdmissions} />
         </div>
      );
   } else if (activeTab === "hospital_report") {
       const hospTxns = transactions.filter((t: Transaction) => {
           if (t.status !== "Posted") return false;
           if (t.details && t.details.hospital > 0) return true;
           const desc = t.description.toLowerCase();
           const hasHospitalName = HOSPITALS.some(h => desc.includes(h.toLowerCase()));
           if (hasHospitalName && (t.type === 'CRV' || t.type === 'BRP' || t.type === 'JV')) return true;
           return false;
       });

       const grouped: Record<string, {total: number, txns: any[]}> = {};
       HOSPITALS.forEach(h => grouped[h] = {total: 0, txns: []});
       grouped["Other Hospital"] = {total: 0, txns: []};

       hospTxns.forEach((t: Transaction) => {
           let hName = "Other Hospital";
           let amount = 0;
           if (t.details && t.details.hospital > 0) {
               hName = t.details.hospitalName || "Other Hospital";
               amount = t.details.hospital;
           } else {
               const found = HOSPITALS.find(h => t.description.toLowerCase().includes(h.toLowerCase()));
               hName = found || "Other Hospital";
               amount = t.amount;
           }
           if(!grouped[hName]) grouped[hName] = {total: 0, txns: []};
           grouped[hName].total += amount;
           grouped[hName].txns.push({ ...t, calculatedAmount: amount });
       });

       const grandTotal = Object.values(grouped).reduce((acc: number, group: any) => acc + group.total, 0);

       content = (
           <div id="printable-area">
               <ReportHeader title="Hospital Fee Report" />
               <div className="no-print" style={{display: 'flex', gap: '20px', marginBottom: '30px', overflowX: 'auto', paddingBottom: '10px'}}>
                   <div style={{minWidth: '200px', background: '#0f172a', padding: '20px', borderRadius: '12px', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}><div style={{fontSize: '0.9rem', opacity: 0.8}}>Grand Total Collection</div><div style={{fontSize: '1.8rem', fontWeight: 700}}>Rs {grandTotal.toLocaleString()}</div></div>
                   {Object.keys(grouped).filter(h => grouped[h].total > 0).map(h => (<div key={h} style={{minWidth: '180px', background: 'white', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'}}><div style={{fontWeight: 600, color: '#334155'}}>{h}</div><div><div style={{fontSize: '1.2rem', fontWeight: 700, color: '#059669'}}>Rs {grouped[h].total.toLocaleString()}</div><div style={{fontSize: '0.75rem', color: '#64748b'}}>{grouped[h].txns.length} Transactions</div></div></div>))}
               </div>
               <div style={{display: 'flex', flexDirection: 'column', gap: '30px'}}>
                   {Object.keys(grouped).map(h => {
                       if (grouped[h].txns.length === 0) return null;
                       return (
                           <div key={h} style={styles.card}>
                               <div style={{display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', marginBottom: '10px'}}><div style={{display: 'flex', alignItems: 'center', gap: '10px'}}><span className="material-symbols-outlined" style={{color: '#0ea5e9'}}>local_hospital</span><h3 style={{margin: 0, color: '#0f172a'}}>{h}</h3></div><div style={{fontWeight: 700, color: '#166534', fontSize: '1.1rem'}}>Total: Rs {grouped[h].total.toLocaleString()}</div></div>
                               <table style={styles.table}><thead><tr><th style={styles.th}>S.No</th><th style={styles.th}>Student Name</th><th style={styles.th}>Father Name</th><th style={styles.th}>Technology</th><th style={styles.th}>Semester</th><th style={styles.th}>Date</th><th style={{...styles.th, textAlign: 'right'}}>Hospital Fee</th></tr></thead><tbody>{grouped[h].txns.map((t: any, i:number) => { const s = students.find((st:Student) => st.admissionNo === t.studentId); return (<tr key={t.id}><td style={styles.td}>{i+1}</td><td style={styles.td}>{s ? s.name : (t.studentId || 'Manual Entry')}</td><td style={styles.td}>{s ? s.fatherName : '-'}</td><td style={styles.td}>{s ? s.program : '-'}</td><td style={styles.td}>{s ? s.semester : '-'}</td><td style={styles.td}>{formatDateDisplay(t.date)}</td><td style={{...styles.td, textAlign: 'right', fontWeight: 600}}>{t.calculatedAmount.toLocaleString()}</td></tr>); })}</tbody></table>
                           </div>
                       )
                   })}
               </div>
           </div>
       );
   } else if (activeTab === "student_attendance") {
       const attendanceHistory = studentAttendance.filter((a: StudentAttendance) => {
           if(viewHistoryMonth && !a.date.startsWith(viewHistoryMonth)) return false;
           if(histCampus !== "All" && a.campus !== histCampus) return false;
           if(histProgram !== "All" && a.program !== histProgram) return false;
           if(histSemester !== "All" && a.semester !== histSemester) return false;
           if(histTeacher !== "All" && a.teacher !== histTeacher) return false;
           return true;
       });

       content = (
           <div>
               <div className="no-print" style={{...styles.card, padding: '20px', marginBottom: '30px'}}>
                   <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                       <h3 style={{margin: 0, color: '#0f172a'}}>Student Attendance Sheet</h3>
                       <div style={{display: 'flex', gap: '10px'}}>
                           <button style={styles.button("secondary")} onClick={() => {
                               if(prog === "All" || sem === "All") return alert("Please select Program and Semester first.");
                               setShowBlankSheet(true);
                           }}>Print Blank Register</button>
                           <button style={styles.button("primary")} onClick={() => setShowAttModal(true)}>
                               <span className="material-symbols-outlined">edit_calendar</span> Mark Attendance
                           </button>
                       </div>
                   </div>
                   
                   <FilterBar>
                       <FilterItem label="Date">
                          <input type="date" style={styles.input} value={attDate} onChange={e => setAttDate(e.target.value)} />
                       </FilterItem>
                       <FilterItem label="Campus">
                          <select style={styles.input} value={camp} onChange={e => setCamp(e.target.value)}><option value="All">All</option>{masterData.campuses.map((c:Campus) => <option key={c.name}>{c.name}</option>)}</select>
                       </FilterItem>
                       <FilterItem label="Program">
                          <select style={styles.input} value={prog} onChange={e => setProg(e.target.value)}><option value="All">All</option>{masterData.programs.map((p:string) => <option key={p}>{p}</option>)}</select>
                       </FilterItem>
                       <FilterItem label="Semester">
                          <select style={styles.input} value={sem} onChange={e => setSem(e.target.value)}><option value="All">All</option>{masterData.semesters.map((s:string) => <option key={s}>{s}</option>)}</select>
                       </FilterItem>
                       <FilterItem label="Teacher">
                          <select style={styles.input} value={selectedTeacher} onChange={e => setSelectedTeacher(e.target.value)}><option value="All">Select Teacher</option>{INITIAL_TEACHERS.map(t => <option key={t}>{t}</option>)}</select>
                       </FilterItem>
                   </FilterBar>

                   <div style={{marginTop: '20px', background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0'}}>
                        <h4 style={{marginTop: 0, color: '#334155'}}>Class List Preview ({filteredStudentsClass.length})</h4>
                        <div style={{maxHeight: '300px', overflowY: 'auto'}}>
                            <table style={styles.table}>
                                <thead>
                                    <tr>
                                        <th style={styles.th}>S.No</th>
                                        <th style={styles.th}>Name</th>
                                        <th style={styles.th}>Father Name</th>
                                        <th style={styles.th}>Admission No</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStudentsClass.length > 0 ? filteredStudentsClass.map((s, idx) => (
                                        <tr key={s.admissionNo}>
                                            <td style={styles.td}>{idx + 1}</td>
                                            <td style={styles.td}>{s.name}</td>
                                            <td style={styles.td}>{s.fatherName}</td>
                                            <td style={styles.td}>{s.admissionNo}</td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={4} style={{textAlign: 'center', padding: '20px', color: '#94a3b8'}}>Select Program and Semester to view students</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                   </div>
               </div>

               <div style={{marginTop: '40px'}} className="no-print">
                   <h3 style={{color: '#0f172a', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px'}}>Attendance History</h3>
                   <div style={{background: '#fef3c7', padding: '20px', borderRadius: '12px', border: '1px solid #fcd34d', marginBottom: '20px'}}>
                       <h4 style={{marginTop: 0, color: '#92400e'}}>Filters</h4>
                       <div style={{display: 'flex', gap: '15px', flexWrap: 'wrap'}}>
                           <select style={{...styles.input, width: 'auto'}} value={histCampus} onChange={e => setHistCampus(e.target.value)}><option value="All">All Campuses</option>{masterData.campuses.map((c:Campus) => <option key={c.name}>{c.name}</option>)}</select>
                           <select style={{...styles.input, width: 'auto'}} value={histProgram} onChange={e => setHistProgram(e.target.value)}><option value="All">All Programs</option>{masterData.programs.map((p:string) => <option key={p}>{p}</option>)}</select>
                           <select style={{...styles.input, width: 'auto'}} value={histSemester} onChange={e => setHistSemester(e.target.value)}><option value="All">All Semesters</option>{masterData.semesters.map((s:string) => <option key={s}>{s}</option>)}</select>
                           <input type="month" style={{...styles.input, width: 'auto'}} value={viewHistoryMonth} onChange={e => setViewHistoryMonth(e.target.value)} />
                       </div>
                   </div>

                   <div>
                       {attendanceHistory.map(h => (
                           <div key={h.id} style={{padding: '15px', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
                               <div>
                                   <div style={{fontWeight: 700, color: '#334155'}}>{formatDateDisplay(h.date)}</div>
                                   <div style={{fontSize: '0.85rem', color: '#64748b'}}>{h.program} ({h.semester}) - {h.campus}</div>
                               </div>
                               <div style={{textAlign: 'right'}}>
                                   <div style={{fontSize: '0.9rem', color: '#166534', fontWeight: 600}}>Present: {h.records.filter(r => r.status === 'Present').length}</div>
                                   <div style={{fontSize: '0.9rem', color: '#b91c1c', fontWeight: 600}}>Absent: {h.records.filter(r => r.status === 'Absent').length}</div>
                               </div>
                           </div>
                       ))}
                   </div>
               </div>

               {showAttModal && (
                   <div style={styles.modalOverlay}>
                       <div style={{...styles.modalContent, width: '900px', height: '80vh', display: 'flex', flexDirection: 'column'}}>
                           <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                               <h3 style={{margin: 0}}>Mark Class Attendance</h3>
                               <button onClick={() => setShowAttModal(false)} style={{background: 'transparent', border: 'none', cursor: 'pointer'}}>✕</button>
                           </div>
                           <div style={{background: '#f0f9ff', padding: '15px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem', color: '#0369a1', border: '1px solid #bae6fd'}}>
                               <strong>Note:</strong> All students are marked <strong>PRESENT</strong> by default. Search and select only those who are Absent/Late/Leave.
                           </div>
                           <div style={{display: 'flex', gap: '20px', flex: 1, minHeight: 0}}>
                               <div style={{flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid #e2e8f0', paddingRight: '20px'}}>
                                   <input style={{...styles.input, marginBottom: '10px'}} placeholder="Search by Name, Father Name or Adm No..." value={attSearch} onChange={e => setAttSearch(e.target.value)} autoFocus />
                                   <div style={{flex: 1, overflowY: 'auto', border: '1px solid #eee', borderRadius: '8px'}}>
                                       {attSearch && filteredAttSearch.map(s => (
                                           <div key={s.admissionNo} onClick={() => handleAttSearchSelect(s.admissionNo)} style={{padding: '10px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', background: attSelectedIds.includes(s.admissionNo) ? '#eff6ff' : 'white', display: 'flex', justifyContent: 'space-between'}}>
                                               <div>
                                                   <div style={{fontWeight: 600}}>{s.name}</div>
                                                   <div style={{fontSize: '0.8rem', color: '#64748b'}}>S/O: {s.fatherName} • {s.admissionNo}</div>
                                               </div>
                                               {attSelectedIds.includes(s.admissionNo) && <span style={{color: '#3b82f6'}}>✓</span>}
                                           </div>
                                       ))}
                                   </div>
                                   <div style={{marginTop: '10px', display: 'flex', gap: '5px'}}>
                                       <button onClick={() => markSelected('Absent')} disabled={attSelectedIds.length === 0} style={{...styles.button("danger"), flex: 1, justifyContent: 'center'}}>Mark Absent</button>
                                       <button onClick={() => markSelected('Leave')} disabled={attSelectedIds.length === 0} style={{...styles.button("secondary"), background: '#3b82f6', color: 'white', flex: 1, justifyContent: 'center'}}>Mark Leave</button>
                                       <button onClick={() => markSelected('Late')} disabled={attSelectedIds.length === 0} style={{...styles.button("secondary"), background: '#f59e0b', color: 'white', flex: 1, justifyContent: 'center'}}>Mark Late</button>
                                   </div>
                               </div>
                               <div style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
                                   <h4 style={{marginTop: 0, color: '#334155'}}>Exceptions ({Object.keys(attExceptions).length})</h4>
                                   <div style={{flex: 1, overflowY: 'auto', background: '#f8fafc', borderRadius: '8px', padding: '10px'}}>
                                       {Object.entries(attExceptions).map(([id, status]) => {
                                           const s = students.find(st => st.admissionNo === id);
                                           return (
                                               <div key={id} style={{background: 'white', padding: '10px', marginBottom: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                                   <div>
                                                       <div style={{fontWeight: 600}}>{s?.name}</div>
                                                       <div style={{fontSize: '0.75rem', color: '#64748b', marginBottom: '2px'}}>S/O: {s?.fatherName}</div>
                                                       <span style={{fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: status === 'Absent' ? '#fee2e2' : status === 'Late' ? '#fef08a' : '#fff7ed', color: status === 'Absent' ? '#b91c1c' : status === 'Late' ? '#a16207' : '#c2410c'}}>{status}</span>
                                                   </div>
                                                   <button onClick={() => removeException(id)} style={{border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8'}}>✕</button>
                                               </div>
                                           )
                                       })}
                                   </div>
                                   <button onClick={saveStudentAttendance} style={{...styles.button("primary"), marginTop: '20px', width: '100%', justifyContent: 'center'}}>Submit Attendance</button>
                               </div>
                           </div>
                       </div>
                   </div>
               )}
           </div>
       );
   }

   return (
      <div>
         <h2 className="no-print" style={{marginBottom: '5px'}}>Reports: <span style={{color: '#64748b', fontSize: '1.2rem', fontWeight: 400}}>{activeTab.replace('_', ' ').toUpperCase()}</span></h2>
         
         <div className="no-print" style={{...styles.card, display: 'flex', gap: '5px', flexWrap: 'wrap', alignItems: 'center', padding: '12px 20px', borderRadius: '8px'}}>
            <div style={{display: 'flex', gap: '5px', marginRight: '15px'}}>
               <button onClick={() => setActiveTab("defaulters")} style={{...styles.tabButton(activeTab === "defaulters")}}>Defaulters</button>
               <button onClick={() => setActiveTab("students_list")} style={{...styles.tabButton(activeTab === "students_list")}}>Students List</button>
               <button onClick={() => setActiveTab("admission_reg")} style={{...styles.tabButton(activeTab === "admission_reg")}}>Admission Reg</button>
               <button onClick={() => setActiveTab("hospital_report")} style={{...styles.tabButton(activeTab === "hospital_report")}}>Hospital Report</button>
               <button onClick={() => setActiveTab("student_attendance")} style={{...styles.tabButton(activeTab === "student_attendance")}}>Student Attendance</button>
            </div>

            <div style={{marginLeft: 'auto', display: 'flex', gap: '10px'}}>
               <button style={{...styles.button("secondary"), padding: '8px 12px'}} onClick={() => window.print()}><span className="material-symbols-outlined" style={{fontSize: '18px'}}>print</span> Print</button>
            </div>
         </div>

         <style>{`
             @media print {
                 .print-header { display: block !important; }
             }
         `}</style>

         {content}
      </div>
   );
};
