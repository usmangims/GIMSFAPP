
import React, { useState, useEffect } from "react";
import { styles } from "./styles";
import { Student, Campus, INITIAL_SEMESTERS } from "./types";

export const PromotionModule = ({ students, onUpdateStudents, masterData }: { students: Student[], onUpdateStudents: (students: Student[]) => void, masterData: any }) => {
    // Filters
    const [filterCampus, setFilterCampus] = useState("All");
    const [filterProgram, setFilterProgram] = useState("All");
    const [filterCurrentSem, setFilterCurrentSem] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [filterFinancialStatus, setFilterFinancialStatus] = useState("All");

    // Selection & Action
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [targetSemester, setTargetSemester] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    // Filter Logic
    const filteredStudents = students.filter(s => {
        if (s.status === "Left Student" || s.status === "Course Completed") return false; // Only active students
        if (filterCampus !== "All" && s.campus !== filterCampus) return false;
        if (filterProgram !== "All" && s.program !== filterProgram) return false;
        if (filterCurrentSem !== "All" && s.semester !== filterCurrentSem) return false;
        
        // Financial Status Filter
        if (filterFinancialStatus === "Clear" && s.balance > 0) return false;
        if (filterFinancialStatus === "Due" && s.balance <= 0) return false;

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            return s.name.toLowerCase().includes(q) || s.admissionNo.toLowerCase().includes(q) || s.fatherName.toLowerCase().includes(q);
        }
        return true;
    });

    // Auto-set target semester based on current semester filter
    useEffect(() => {
        if(filterCurrentSem !== "All") {
            const idx = INITIAL_SEMESTERS.indexOf(filterCurrentSem);
            if(idx >= 0 && idx < INITIAL_SEMESTERS.length - 1) {
                setTargetSemester(INITIAL_SEMESTERS[idx + 1]);
            } else {
                setTargetSemester("");
            }
        } else {
            setTargetSemester("");
        }
    }, [filterCurrentSem]);

    // Selection Handlers
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(filteredStudents.map(s => s.admissionNo));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(sid => sid !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    // Promotion Action
    const handlePromote = () => {
        if (selectedIds.length === 0) return alert("Please select at least one student.");
        if (!targetSemester) return alert("Please select a Target Semester.");

        // Direct promotion without confirmation dialog as requested
        const updatedList = students.map(s => {
            if (selectedIds.includes(s.admissionNo)) {
                if (targetSemester === "Left Student") {
                    return { ...s, status: "Left Student" };
                } else if (targetSemester === "Course Completed") {
                    return { ...s, status: "Course Completed" };
                } else {
                    return { ...s, semester: targetSemester };
                }
            }
            return s;
        });

        onUpdateStudents(updatedList);
        
        // Show success feedback
        setSuccessMsg(`Successfully promoted ${selectedIds.length} students to ${targetSemester}`);
        setSelectedIds([]);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMsg(""), 3000);
    };

    return (
        <div>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                <div>
                    <h2 style={{margin: '0 0 5px 0', color: '#0f172a'}}>Student Promotion</h2>
                    <p style={{margin: 0, color: '#64748b'}}>Promote students to the next semester in bulk</p>
                </div>
            </div>

            {/* Filter Card */}
            <div className="no-print" style={{...styles.card, padding: '20px', borderTop: '4px solid #6366f1', background: '#f8fafc'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', color: '#4338ca', fontWeight: 600}}>
                    <span className="material-symbols-outlined">filter_list</span> Filter Source Class
                </div>
                <div style={styles.grid4}>
                    <div>
                        <label style={styles.label}>Campus</label>
                        <select style={styles.input} value={filterCampus} onChange={e => setFilterCampus(e.target.value)}>
                            <option value="All">All Campuses</option>
                            {masterData.campuses.map((c: Campus) => <option key={c.name} value={c.name}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={styles.label}>Program</label>
                        <select style={styles.input} value={filterProgram} onChange={e => setFilterProgram(e.target.value)}>
                            <option value="All">All Programs</option>
                            {masterData.programs.map((p: string) => <option key={p}>{p}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={styles.label}>Current Semester</label>
                        <select style={{...styles.input, borderColor: '#6366f1', backgroundColor: '#eef2ff'}} value={filterCurrentSem} onChange={e => setFilterCurrentSem(e.target.value)}>
                            <option value="All">Select Current Sem...</option>
                            {masterData.semesters.map((s: string) => <option key={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={styles.label}>Search Student</label>
                        <input style={styles.input} placeholder="Name or Adm No..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    </div>
                </div>
            </div>

            {/* Action Bar */}
            <div style={{
                position: 'sticky', top: 10, zIndex: 100,
                backgroundColor: 'white', padding: '15px 25px', borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)', marginBottom: '25px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                border: '1px solid #e2e8f0'
            }}>
                <div style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
                    <div style={{padding: '10px', background: '#f1f5f9', borderRadius: '8px', fontWeight: 600, color: '#334155'}}>
                        Selected: <span style={{color: '#6366f1', fontSize: '1.2rem'}}>{selectedIds.length}</span> / {filteredStudents.length}
                    </div>
                    
                    <div style={{display: 'flex', alignItems: 'center', gap: '10px', padding: '5px 10px', borderLeft: '1px solid #e2e8f0'}}>
                        <label style={{fontWeight: 600, color: '#64748b', fontSize: '0.9rem'}}>Financial Status:</label>
                        <select 
                            style={{padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', minWidth: '120px'}}
                            value={filterFinancialStatus} 
                            onChange={e => setFilterFinancialStatus(e.target.value)}
                        >
                            <option value="All">Show All</option>
                            <option value="Clear">Clear Only</option>
                            <option value="Due">Due Only</option>
                        </select>
                    </div>
                </div>

                <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                        <label style={{fontWeight: 600, color: '#0f172a'}}>Promote To:</label>
                        <select 
                            style={{...styles.input, width: '180px', borderColor: '#22c55e', borderWidth: '2px', fontWeight: 'bold', color: '#15803d'}} 
                            value={targetSemester} 
                            onChange={e => setTargetSemester(e.target.value)}
                        >
                            <option value="">Select Target...</option>
                            {masterData.semesters.map((s: string) => <option key={s}>{s}</option>)}
                            <option value="Course Completed">Course Completed</option>
                            <option value="Left Student">Left Student</option>
                        </select>
                    </div>
                    <button 
                        onClick={handlePromote}
                        disabled={selectedIds.length === 0 || !targetSemester}
                        style={{
                            ...styles.button("primary"), 
                            backgroundColor: selectedIds.length > 0 ? '#4f46e5' : '#94a3b8',
                            padding: '12px 30px', fontSize: '1rem',
                            boxShadow: selectedIds.length > 0 ? '0 4px 12px rgba(79, 70, 229, 0.3)' : 'none',
                            transition: 'all 0.2s'
                        }}
                    >
                        <span className="material-symbols-outlined">upgrade</span> Promote Selected
                    </button>
                </div>
            </div>

            {successMsg && (
                <div style={{
                    marginBottom: '20px', padding: '15px', borderRadius: '8px', 
                    backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0',
                    display: 'flex', alignItems: 'center', gap: '10px', animation: 'fadeIn 0.5s'
                }}>
                    <span className="material-symbols-outlined">check_circle</span>
                    {successMsg}
                </div>
            )}

            {/* Students Table */}
            <div style={styles.card}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={{...styles.th, width: '50px', textAlign: 'center'}}>
                                <input 
                                    type="checkbox" 
                                    onChange={handleSelectAll} 
                                    checked={filteredStudents.length > 0 && selectedIds.length === filteredStudents.length}
                                    style={{width: '18px', height: '18px', cursor: 'pointer'}}
                                />
                            </th>
                            <th style={styles.th}>S.No</th>
                            <th style={styles.th}>Admission No</th>
                            <th style={styles.th}>Student Name</th>
                            <th style={styles.th}>Father Name</th>
                            <th style={styles.th}>Program</th>
                            <th style={styles.th}>Current Semester</th>
                            <th style={styles.th}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStudents.length === 0 ? (
                            <tr><td colSpan={8} style={{textAlign: 'center', padding: '40px', color: '#94a3b8', fontStyle: 'italic'}}>No students found matching criteria.</td></tr>
                        ) : (
                            filteredStudents.map((s, idx) => {
                                const isSelected = selectedIds.includes(s.admissionNo);
                                return (
                                    <tr 
                                        key={s.admissionNo} 
                                        onClick={() => handleSelectOne(s.admissionNo)}
                                        style={{
                                            cursor: 'pointer', 
                                            backgroundColor: isSelected ? '#eef2ff' : idx % 2 === 0 ? 'white' : '#f8fafc',
                                            transition: 'background 0.2s'
                                        }}
                                    >
                                        <td style={{...styles.td, textAlign: 'center'}}>
                                            <input 
                                                type="checkbox" 
                                                checked={isSelected} 
                                                onChange={() => {}} // Handled by row click
                                                style={{width: '18px', height: '18px', cursor: 'pointer'}}
                                            />
                                        </td>
                                        <td style={styles.td}>{idx + 1}</td>
                                        <td style={styles.td}><span style={{fontFamily: 'monospace', color: '#64748b'}}>{s.admissionNo}</span></td>
                                        <td style={{...styles.td, fontWeight: 600, color: '#1e293b'}}>{s.name}</td>
                                        <td style={styles.td}>{s.fatherName}</td>
                                        <td style={styles.td}>{s.program}</td>
                                        <td style={styles.td}>
                                            <span style={{
                                                padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600,
                                                backgroundColor: '#fff7ed', color: '#c2410c', border: '1px solid #ffedd5'
                                            }}>
                                                {s.semester}
                                            </span>
                                        </td>
                                        <td style={styles.td}>
                                            <span style={{fontSize: '0.8rem', color: s.balance > 0 ? '#ef4444' : '#166534', fontWeight: s.balance > 0 ? 600 : 400}}>
                                                {s.balance > 0 ? `Due: ${s.balance.toLocaleString()}` : 'Clear'}
                                            </span>
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};
