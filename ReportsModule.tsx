
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
   const [pageAttHistory, setPageAttHistory] = useState(1);
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

   // History Specific Filters
   const [histCampus, setHistCampus] = useState("All");
   const [histProgram, setHistProgram] = useState("All");
   const [histSemester, setHistSemester] = useState("All");
   const [histPercFilter, setHistPercFilter] = useState("All");
   const [histNameSearch, setHistNameSearch] = useState("");
   const [histFatherSearch, setHistFatherSearch] = useState("");

   const [showBlankSheet, setShowBlankSheet] = useState(false);
   const [selectedHospital, setSelectedHospital] = useState<string | null>(null);

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
       const activeStudentsForClass = students.filter((s: Student) => 
           (s.status !== 'Left Student' && s.status !== 'Course Completed') && 
           (prog === "All" || s.program === prog) &&
           (sem === "All" || s.semester === sem) &&
           (camp === "All" || s.campus === camp)
       );

       if (activeStudentsForClass.length === 0) return alert("No students found for marking.");

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
       setAttSelectedIds([]);
       setAttSearch("");
       alert("Attendance processed successfully!");
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

   const BlankAttendanceSheet = () => {
       const [year, month] = viewHistoryMonth.split('-').map(Number);
       const daysInMonth = 31;
       const dayHeaders = [...Array(daysInMonth)].map((_, i) => {
           const d = new Date(year, month - 1, i + 1);
           const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
           return { date: i + 1, day: dayName };
       });

       return (
           <div style={styles.modalOverlay}>
               <div style={{...styles.modalContent, width: '297mm', backgroundColor: 'white', padding: '0'}}>
                   <div className="no-print" style={{padding: '15px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', background: '#f8fafc'}}>
                       <h3 style={{margin: 0}}>Blank Register Preview</h3>
                       <div style={{display: 'flex', gap: '10px'}}>
                           <button style={styles.button("primary")} onClick={() => window.print()}>Print Register</button>
                           <button style={styles.button("secondary")} onClick={() => setShowBlankSheet(false)}>Close</button>
                       </div>
                   </div>
                   <div id="printable-area" style={{padding: '30px', color: 'black'}}>
                        <div style={{textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '15px', marginBottom: '25px'}}>
                            <h1 style={{margin: 0, fontSize: '1.8rem'}}>GHAZALI INSTITUTE OF MEDICAL SCIENCES</h1>
                            <h3 style={{margin: '8px 0', textDecoration: 'underline'}}>ATTENDANCE REGISTER</h3>
                            <div style={{display: 'flex', justifyContent: 'center', gap: '30px', fontSize: '1rem', fontWeight: 600}}>
                                <span>Program: {prog === 'All' ? '__________________' : prog}</span>
                                <span>Semester: {sem === 'All' ? '__________________' : sem}</span>
                                <span>Month: {new Date(year, month-1).toLocaleString('default', {month:'long'})} {year}</span>
                            </div>
                        </div>
                        <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '0.65rem'}}>
                            <thead>
                                <tr style={{background: '#f1f5f9'}}>
                                    <th style={{border: '1px solid #000', padding: '4px', width: '30px'}} rowSpan={2}>S.No</th>
                                    <th style={{border: '1px solid #000', padding: '4px', width: '70px'}} rowSpan={2}>Adm No</th>
                                    <th style={{border: '1px solid #000', padding: '4px', textAlign: 'left', width: '120px'}} rowSpan={2}>Student Name</th>
                                    <th style={{border: '1px solid #000', padding: '4px', textAlign: 'left', width: '120px'}} rowSpan={2}>Father Name</th>
                                    {dayHeaders.map(h => (
                                        <th key={h.date} style={{border: '1px solid #000', width: '20px', fontSize: '0.5rem'}}>{h.day}</th>
                                    ))}
                                </tr>
                                <tr style={{background: '#f1f5f9'}}>
                                    {dayHeaders.map(h => (
                                        <th key={h.date} style={{border: '1px solid #000', width: '20px'}}>{h.date}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudentsClass.map((s, i) => (
                                    <tr key={s.admissionNo}>
                                        <td style={{border: '1px solid #000', textAlign: 'center', padding: '4px'}}>{i + 1}</td>
                                        <td style={{border: '1px solid #000', textAlign: 'center', fontWeight: 'bold'}}>{s.admissionNo}</td>
                                        <td style={{border: '1px solid #000', padding: '4px', fontWeight: 600, textTransform: 'uppercase'}}>{s.name}</td>
                                        <td style={{border: '1px solid #000', padding: '4px'}}>{s.fatherName}</td>
                                        {[...Array(31)].map((_, j) => (
                                            <td key={j} style={{border: '1px solid #000'}}></td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div style={{marginTop: '40px', display: 'flex', justifyContent: 'space-between', fontWeight: 600}}>
                            <div style={{textAlign: 'center', width: '200px'}}>
                                <div style={{borderBottom: '1.5px solid #000', marginBottom: '5px'}}></div>
                                <span>Class Teacher</span>
                            </div>
                            <div style={{textAlign: 'center', width: '200px'}}>
                                <div style={{borderBottom: '1.5px solid #000', marginBottom: '5px'}}></div>
                                <span>Admin/Principal</span>
                            </div>
                        </div>
                   </div>
               </div>
           </div>
       );
   };

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
                          <th style={styles.th}>Program, Semester, Phone #</th>
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
                              <td style={styles.td}>
                                  <div style={{fontWeight: 500}}>{s.program} ({s.semester})</div>
                                  <div style={{fontSize: '0.75rem', color: '#64748b'}}>{s.phone || '-'}</div>
                              </td>
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

      // Group paginated list by board
      const groupedByBoard: Record<string, Student[]> = {};
      paginatedList.forEach(s => {
          if(!groupedByBoard[s.board]) groupedByBoard[s.board] = [];
          groupedByBoard[s.board].push(s);
      });

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

             {Object.entries(groupedByBoard).map(([board, boardStudents]: any) => (
                 <div key={board} style={{marginBottom: '30px'}}>
                     <h4 style={{background: '#f1f5f9', padding: '10px 15px', borderLeft: '4px solid #0f172a', margin: '0 0 10px 0', textTransform: 'uppercase', color: '#1e293b'}}>{board}</h4>
                     <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>S.No</th>
                                <th style={styles.th}>Date</th>
                                <th style={styles.th}>Adm No</th>
                                <th style={styles.th}>Name</th>
                                <th style={styles.th}>Father Name</th>
                                <th style={styles.th}>Program</th>
                                <th style={{...styles.th, textAlign: 'right'}}>Adm Fee</th>
                            </tr>
                        </thead>
                        <tbody>
                            {boardStudents.map((s: Student, i: number) => (
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
                 </div>
             ))}
             
             <PaginationControls current={pageAdmissions} total={totalPages} onPageChange={setPageAdmissions} />
         </div>
      );
   } else if (activeTab === "hospital_report") {
       // Calculation Rates
       const rates: Record<string, number> = {
           "IKD": 3100,
           "HMC": 2100,
           "Alkhidmat": 3100,
           "City Hospital": 3100
       };

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

       hospTxns.forEach((t: Transaction) => {
           let hName = "";
           let amount = 0;
           if (t.details && t.details.hospital > 0) {
               hName = t.details.hospitalName || "";
               amount = t.details.hospital;
           } else {
               const found = HOSPITALS.find(h => t.description.toLowerCase().includes(h.toLowerCase()));
               hName = found || "";
               amount = t.amount;
           }
           
           if(grouped[hName]) {
               grouped[hName].total += amount;
               grouped[hName].txns.push({ ...t, calculatedAmount: amount });
           }
       });

       const grandTotal = Object.values(grouped).reduce((acc: number, group: any) => acc + group.total, 0);

       content = (
           <div id="printable-area">
               <ReportHeader title="Hospital Fee Report Summary" />
               <div className="no-print" style={{display: 'flex', gap: '20px', marginBottom: '30px'}}>
                   <div style={{...styles.kpiCard("#0f172a", "#f8fafc"), flex: 1.5, border: '2px solid #0f172a'}}>
                       <div style={{fontSize: '0.9rem', color: '#64748b'}}>Overall Hospital Collection</div>
                       <div style={{fontSize: '2.2rem', fontWeight: 800, color: '#0f172a'}}>Rs {grandTotal.toLocaleString()}</div>
                   </div>
                   {HOSPITALS.map(h => (
                       <div 
                        key={h} 
                        onClick={() => setSelectedHospital(h)}
                        style={{
                            ...styles.kpiCard("#0ea5e9", selectedHospital === h ? "#e0f2fe" : "white"), 
                            flex: 1, cursor: 'pointer', 
                            border: selectedHospital === h ? '2px solid #0ea5e9' : '1px solid #e2e8f0',
                            transition: 'all 0.2s'
                        }}
                       >
                           <div style={{fontWeight: 700, color: '#334155'}}>{h}</div>
                           <div style={{fontSize: '1.4rem', fontWeight: 800, color: '#0369a1'}}>Rs {grouped[h].total.toLocaleString()}</div>
                           <div style={{fontSize: '0.75rem', color: '#64748b'}}>{grouped[h].txns.length} Students</div>
                       </div>
                   ))}
               </div>

               {selectedHospital && (
                   <div style={styles.card}>
                       <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px', marginBottom: '20px'}}>
                           <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                               <span className="material-symbols-outlined" style={{color: '#0ea5e9', fontSize: '32px'}}>local_hospital</span>
                               <h3 style={{margin: 0}}>{selectedHospital} Detailed Report</h3>
                           </div>
                           <div style={{display: 'flex', gap: '10px'}}>
                               <div style={{textAlign: 'right', marginRight: '20px'}}>
                                   <div style={{fontSize: '0.8rem', color: '#64748b'}}>Rate: Rs {rates[selectedHospital] || 3100}/Month</div>
                                   <div style={{fontSize: '1.1rem', fontWeight: 700, color: '#166534'}}>Total: Rs {grouped[selectedHospital].total.toLocaleString()}</div>
                               </div>
                               <button style={styles.button("primary")} onClick={() => window.print()}>
                                   <span className="material-symbols-outlined">print</span> Print Summary
                               </button>
                           </div>
                       </div>
                       
                       <table style={styles.table}>
                           <thead>
                               <tr>
                                   <th style={styles.th}>S.No</th>
                                   <th style={styles.th}>Student Name</th>
                                   <th style={styles.th}>Father Name</th>
                                   <th style={styles.th}>Program</th>
                                   <th style={styles.th}>Semester</th>
                                   <th style={{...styles.th, textAlign: 'right'}}>Amount Paid</th>
                                   <th style={{...styles.th, textAlign: 'center'}}>Duration (Months)</th>
                               </tr>
                           </thead>
                           <tbody>
                               {grouped[selectedHospital].txns.map((t, idx) => {
                                   const s = students.find((st: Student) => st.admissionNo === t.studentId);
                                   const duration = Math.round(t.calculatedAmount / (rates[selectedHospital] || 3100));
                                   return (
                                       <tr key={t.id}>
                                           <td style={styles.td}>{idx + 1}</td>
                                           <td style={{...styles.td, fontWeight: 600}}>{s ? s.name : 'Unknown'}</td>
                                           <td style={styles.td}>{s ? s.fatherName : '-'}</td>
                                           <td style={styles.td}>{s ? s.program : '-'}</td>
                                           <td style={styles.td}>{s ? s.semester : '-'}</td>
                                           <td style={{...styles.td, textAlign: 'right', fontWeight: 600}}>Rs {t.calculatedAmount.toLocaleString()}</td>
                                           <td style={{...styles.td, textAlign: 'center'}}>
                                               <span style={{padding: '4px 12px', background: '#f1f5f9', borderRadius: '15px', fontWeight: 700, color: '#1e293b'}}>
                                                   {duration} Month{duration !== 1 ? 's' : ''}
                                               </span>
                                           </td>
                                       </tr>
                                   )
                               })}
                           </tbody>
                       </table>
                   </div>
               )}
           </div>
       );
   } else if (activeTab === "student_attendance") {
       // Filters students for listing based on attendance criteria
       const aggregatedData = students.filter((s: Student) => {
           if(histCampus !== "All" && s.campus !== histCampus) return false;
           if(histProgram !== "All" && s.program !== histProgram) return false;
           if(histSemester !== "All" && s.semester !== histSemester) return false;
           if(histNameSearch && !s.name.toLowerCase().includes(histNameSearch.toLowerCase()) && !s.admissionNo.toLowerCase().includes(histNameSearch.toLowerCase())) return false;
           if(histFatherSearch && !s.fatherName.toLowerCase().includes(histFatherSearch.toLowerCase())) return false;
           if(s.status === "Left Student" || s.status === "Course Completed") return false;
           return true;
       }).map((s: Student) => {
           let present = 0, absent = 0, leave = 0, late = 0;
           studentAttendance.forEach((session: StudentAttendance) => {
               const record = session.records.find(r => r.studentId === s.admissionNo);
               if(record) {
                   if(record.status === "Present") present++;
                   else if(record.status === "Absent") absent++;
                   else if(record.status === "Leave") leave++;
                   else if(record.status === "Late") late++;
               }
           });
           const total = present + absent + leave + late;
           const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
           return { ...s, present, absent, leave, late, total, percentage };
       }).filter(item => {
           if(histPercFilter === "Below 75") return item.percentage < 75;
           if(histPercFilter === "Above 75") return item.percentage >= 75;
           return true;
       });

       const totalPagesHistory = Math.ceil(aggregatedData.length / itemsPerPage);
       const paginatedHistory = aggregatedData.slice((pageAttHistory - 1) * itemsPerPage, pageAttHistory * itemsPerPage);

       content = (
           <div>
               {showBlankSheet && <BlankAttendanceSheet />}
               <div className="no-print" style={{...styles.card, padding: '20px', marginBottom: '30px'}}>
                   <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                       <h3 style={{margin: 0, color: '#0f172a'}}>Class Attendance Management</h3>
                       <div style={{display: 'flex', gap: '10px'}}>
                           <button style={{...styles.button("secondary"), background: '#f8fafc'}} onClick={() => setShowBlankSheet(true)}>
                               <span className="material-symbols-outlined" style={{fontSize: '18px', marginRight: '5px'}}>print</span> Print Blank Register
                           </button>
                           <button style={styles.button("primary")} onClick={() => setShowAttModal(true)}>
                               <span className="material-symbols-outlined">edit_calendar</span> Mark New Attendance
                           </button>
                       </div>
                   </div>
                   
                   <FilterBar>
                       <FilterItem label="Marking Date">
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
                       <FilterItem label="Instructor">
                          <select style={styles.input} value={selectedTeacher} onChange={e => setSelectedTeacher(e.target.value)}><option value="All">Select Teacher</option>{INITIAL_TEACHERS.map(t => <option key={t}>{t}</option>)}</select>
                       </FilterItem>
                   </FilterBar>

                   {/* FIX: Show students by default and filter when selected */}
                   <div style={{marginTop: '20px', background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0'}}>
                        <h4 style={{marginTop: 0, color: '#334155'}}>Class List Preview ({filteredStudentsClass.length})</h4>
                        <div style={{maxHeight: '300px', overflowY: 'auto'}}>
                            <table style={styles.table}>
                                <thead style={{position: 'sticky', top: 0, background: 'white', zIndex: 1}}>
                                    <tr>
                                        <th style={styles.th}>S.No</th>
                                        <th style={styles.th}>Name</th>
                                        <th style={styles.th}>Father Name</th>
                                        <th style={styles.th}>Admission No</th>
                                        <th style={styles.th}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStudentsClass.length > 0 ? filteredStudentsClass.map((s, idx) => (
                                        <tr key={s.admissionNo}>
                                            <td style={styles.td}>{idx + 1}</td>
                                            <td style={{...styles.td, fontWeight: 600}}>{s.name}</td>
                                            <td style={styles.td}>{s.fatherName}</td>
                                            <td style={styles.td}>{s.admissionNo}</td>
                                            <td style={styles.td}><span style={styles.badge('present')}>Active</span></td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={5} style={{textAlign: 'center', padding: '40px', color: '#94a3b8'}}>No students match current filters.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                   </div>
               </div>

               <div style={{marginTop: '40px'}} className="no-print">
                   <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: '15px'}}>
                        <h3 style={{margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px'}}>
                            <span className="material-symbols-outlined" style={{color: '#4f46e5'}}>analytics</span> 
                            Student Attendance Summary (Cumulative)
                        </h3>
                   </div>

                   <FilterBar>
                       <FilterItem label="Campus" width="160px">
                           <select style={styles.input} value={histCampus} onChange={e => { setHistCampus(e.target.value); setPageAttHistory(1); }}><option value="All">All Campuses</option>{masterData.campuses.map((c:Campus) => <option key={c.name}>{c.name}</option>)}</select>
                       </FilterItem>
                       <FilterItem label="Program" width="160px">
                           <select style={styles.input} value={histProgram} onChange={e => { setHistProgram(e.target.value); setPageAttHistory(1); }}><option value="All">All Programs</option>{masterData.programs.map((p:string) => <option key={p}>{p}</option>)}</select>
                       </FilterItem>
                       <FilterItem label="Semester" width="140px">
                           <select style={styles.input} value={histSemester} onChange={e => { setHistSemester(e.target.value); setPageAttHistory(1); }}><option value="All">All Semesters</option>{masterData.semesters.map((s:string) => <option key={s}>{s}</option>)}</select>
                       </FilterItem>
                       <FilterItem label="Perc. Filter" width="140px">
                           <select style={{...styles.input, fontWeight: 'bold'}} value={histPercFilter} onChange={e => { setHistPercFilter(e.target.value); setPageAttHistory(1); }}>
                               <option value="All">All Records</option>
                               <option value="Below 75">Less than 75%</option>
                               <option value="Above 75">Above 75%</option>
                           </select>
                       </FilterItem>
                       <FilterItem label="Student Search" width="220px">
                           <input style={styles.input} placeholder="Name or Admission #" value={histNameSearch} onChange={e => { setHistNameSearch(e.target.value); setPageAttHistory(1); }} />
                       </FilterItem>
                       <FilterItem label="Father Search" width="180px">
                           <input style={styles.input} placeholder="Search Father Name..." value={histFatherSearch} onChange={e => { setHistFatherSearch(e.target.value); setPageAttHistory(1); }} />
                       </FilterItem>
                   </FilterBar>

                   <div style={styles.card}>
                       <table style={styles.table}>
                           <thead>
                               <tr>
                                   <th style={styles.th}>S.No</th>
                                   <th style={styles.th}>Adm No</th>
                                   <th style={styles.th}>Name</th>
                                   <th style={styles.th}>Father Name</th>
                                   <th style={styles.th}>Program</th>
                                   <th style={{...styles.th, textAlign: 'center', color: '#166534'}}>Present</th>
                                   <th style={{...styles.th, textAlign: 'center', color: '#b91c1c'}}>Absent</th>
                                   <th style={{...styles.th, textAlign: 'center', color: '#0369a1'}}>Leave</th>
                                   <th style={{...styles.th, textAlign: 'center', color: '#a16207'}}>Late</th>
                                   <th style={{...styles.th, textAlign: 'center'}}>Days</th>
                                   <th style={{...styles.th, textAlign: 'center'}}>Percentage</th>
                               </tr>
                           </thead>
                           <tbody>
                               {paginatedHistory.map((h, idx) => (
                                   <tr key={h.admissionNo} style={{ background: h.percentage < 75 ? '#fff1f2' : 'transparent', borderLeft: h.percentage < 75 ? '4px solid #ef4444' : 'none' }}>
                                       <td style={styles.td}>{(pageAttHistory - 1) * itemsPerPage + idx + 1}</td>
                                       <td style={{...styles.td, fontWeight: 700}}>{h.admissionNo}</td>
                                       <td style={{...styles.td, fontWeight: 600}}>{h.name}</td>
                                       <td style={styles.td}>{h.fatherName}</td>
                                       <td style={styles.td}>{h.program} ({h.semester})</td>
                                       <td style={{...styles.td, textAlign: 'center', fontWeight: 600, color: '#166534'}}>{h.present}</td>
                                       <td style={{...styles.td, textAlign: 'center', fontWeight: 600, color: '#b91c1c'}}>{h.absent}</td>
                                       <td style={{...styles.td, textAlign: 'center', color: '#0369a1'}}>{h.leave}</td>
                                       <td style={{...styles.td, textAlign: 'center', color: '#a16207'}}>{h.late}</td>
                                       <td style={{...styles.td, textAlign: 'center', fontWeight: 'bold'}}>{h.total}</td>
                                       <td style={{...styles.td, textAlign: 'center'}}>
                                           <div style={{
                                               fontWeight: 900, 
                                               fontSize: '1rem',
                                               color: h.percentage < 75 ? '#b91c1c' : '#15803d'
                                           }}>
                                               {h.percentage}%
                                           </div>
                                       </td>
                                   </tr>
                               ))}
                               {aggregatedData.length === 0 && (
                                   <tr>
                                       <td colSpan={11} style={{textAlign: 'center', padding: '40px', color: '#94a3b8', fontStyle: 'italic'}}>No students matching current filters in attendance records.</td>
                                   </tr>
                               )}
                           </tbody>
                       </table>
                       <PaginationControls current={pageAttHistory} total={totalPagesHistory} onPageChange={setPageAttHistory} />
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
