
import React, { useState, useEffect } from "react";
import { styles } from "./styles";
import { Student, Campus, SMSLog } from "./types";

export const SMSModule = ({ students, masterData, smsHistory, setSmsHistory }: { students: Student[], masterData: any, smsHistory: SMSLog[], setSmsHistory: any }) => {
    const [view, setView] = useState<"bulk" | "history">("bulk");
    
    // Filters for "Send SMS"
    const [filterCampus, setFilterCampus] = useState("All");
    const [filterProgram, setFilterProgram] = useState("All");
    const [filterSemester, setFilterSemester] = useState("All");
    const [filterStatus, setFilterStatus] = useState("Overall"); // New Filter
    const [searchQuery, setSearchQuery] = useState("");
    
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [message, setMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [progress, setProgress] = useState(0);

    // Filters for "History"
    const [histSearch, setHistSearch] = useState("");

    const TEMPLATES = [
        { name: "Defaulter Reminder", text: "Dear Student/Parent, you have a pending balance of Rs. [BALANCE]. Please deposit it urgently to avoid late fines. Regards GIMS." },
        { name: "Fee Deposit", text: "Dear Parent, Rs. [AMOUNT] has been received in GIMS Account. New Balance: Rs. [BALANCE]. Thank you." },
        { name: "General Announcement", text: "GIMS Alert: Tomorrow the Institute will remain closed. Online classes will be held as per schedule." }
    ];

    // Filter students based on combined search and filters
    const displayStudents = students.filter(s => {
        // Apply text search first if present
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            const matchesSearch = s.name.toLowerCase().includes(q) || s.admissionNo.toLowerCase().includes(q);
            if (!matchesSearch) return false;
        }
        
        // Apply class filters
        if (filterCampus !== "All" && s.campus !== filterCampus) return false;
        if (filterProgram !== "All" && s.program !== filterProgram) return false;
        if (filterSemester !== "All" && s.semester !== filterSemester) return false;

        // Apply financial status filter
        if (filterStatus === "Defaulters" && s.balance <= 0) return false;
        if (filterStatus === "Clear" && s.balance > 0) return false;
        
        return true;
    });

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedIds(e.target.checked ? displayStudents.map(s => s.admissionNo) : []);
    };

    const handleSendBulk = async () => {
        if (!message || selectedIds.length === 0) return alert("Please select students and enter a message.");
        
        setIsSending(true);
        setProgress(0);

        const newLogs: SMSLog[] = [];
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10);
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        for (let i = 0; i < selectedIds.length; i++) {
            const id = selectedIds[i];
            const s = students.find(st => st.admissionNo === id);
            if (s && s.smsNumber) {
                // Replacement logic
                let finalMsg = message
                    .replace("[NAME]", s.name)
                    .replace("[BALANCE]", s.balance.toLocaleString())
                    .replace("[ID]", s.admissionNo);
                
                // Simulate sending delay
                await new Promise(r => setTimeout(r, 200));
                
                // Create log entry
                newLogs.push({
                    id: `SMS-${Date.now()}-${i}`,
                    date: dateStr,
                    time: timeStr,
                    studentName: s.name,
                    admissionNo: s.admissionNo,
                    phone: s.smsNumber,
                    message: finalMsg,
                    status: "Sent Successfully"
                });

                setProgress(Math.round(((i + 1) / selectedIds.length) * 100));
            }
        }

        // Persist to overall history
        setSmsHistory([...newLogs, ...smsHistory]);
        
        setIsSending(false);
        alert(`Finished! ${newLogs.length} messages logged to history.`);
        setSelectedIds([]);
        setMessage("");
    };

    const filteredHistory = smsHistory.filter(h => 
        !histSearch || 
        h.studentName.toLowerCase().includes(histSearch.toLowerCase()) || 
        h.admissionNo.toLowerCase().includes(histSearch.toLowerCase()) ||
        h.phone.includes(histSearch)
    );

    return (
        <div>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                <div>
                    <h2 style={{margin: '0 0 5px 0', color: '#0f172a'}}>SMS Center</h2>
                    <p style={{margin: 0, color: '#64748b'}}>Integrated communication and proof-of-delivery system</p>
                </div>
                <div style={{display: 'flex', gap: '5px', background: '#e2e8f0', padding: '4px', borderRadius: '8px'}}>
                    <button style={styles.tabButton(view === 'bulk')} onClick={() => setView('bulk')}>
                        <span className="material-symbols-outlined" style={{fontSize: '18px'}}>send</span> Send SMS
                    </button>
                    <button style={styles.tabButton(view === 'history')} onClick={() => setView('history')}>
                        <span className="material-symbols-outlined" style={{fontSize: '18px'}}>history</span> History Logs
                    </button>
                </div>
            </div>

            {view === 'bulk' ? (
                <div style={{display: 'flex', gap: '25px', alignItems: 'start'}}>
                    {/* Left: Configuration */}
                    <div style={{flex: 1.5}}>
                        <div style={{...styles.card, borderTop: '4px solid #4f46e5'}}>
                            <div style={{display: 'flex', gap: '15px', marginBottom: '25px'}}>
                                <div style={{flex: 1}}>
                                    <label style={styles.label}>Campus</label>
                                    <select style={styles.input} value={filterCampus} onChange={e => setFilterCampus(e.target.value)}>
                                        <option value="All">All Campuses</option>
                                        {masterData.campuses.map((c: Campus) => <option key={c.name}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div style={{flex: 1}}>
                                    <label style={styles.label}>Program</label>
                                    <select style={styles.input} value={filterProgram} onChange={e => setFilterProgram(e.target.value)}>
                                        <option value="All">All Programs</option>
                                        {masterData.programs.map((p: string) => <option key={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div style={{flex: 1}}>
                                    <label style={styles.label}>Semester</label>
                                    <select style={styles.input} value={filterSemester} onChange={e => setFilterSemester(e.target.value)}>
                                        <option value="All">All Semesters</option>
                                        {masterData.semesters.map((s: string) => <option key={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div style={{flex: 1}}>
                                    <label style={styles.label}>Due Status</label>
                                    <select style={{...styles.input, borderColor: '#4f46e5', fontWeight: 600}} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                                        <option value="Overall">Overall</option>
                                        <option value="Defaulters">Defaulters</option>
                                        <option value="Clear">Clear</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{marginBottom: '25px', padding: '15px', background: '#eef2ff', borderRadius: '12px', border: '1px solid #c7d2fe'}}>
                                <label style={{...styles.label, color: '#4338ca'}}>Search Student (Name or Admission #)</label>
                                <div style={{position: 'relative'}}>
                                    <input 
                                        style={{...styles.input, paddingLeft: '40px'}} 
                                        placeholder="Type to search in filtered list..." 
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                    />
                                    <span className="material-symbols-outlined" style={{position: 'absolute', left: '10px', top: '10px', color: '#4338ca'}}>search</span>
                                </div>
                            </div>

                            <div style={{marginBottom: '25px'}}>
                                <label style={styles.label}>Message Templates</label>
                                <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
                                    {TEMPLATES.map(t => (
                                        <button key={t.name} onClick={() => setMessage(t.text)} style={{padding: '6px 12px', fontSize: '0.75rem', borderRadius: '20px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer'}}>{t.name}</button>
                                    ))}
                                </div>
                            </div>

                            <div style={{marginBottom: '25px'}}>
                                <label style={styles.label}>Message Contents</label>
                                <textarea 
                                    style={{...styles.input, height: '120px', resize: 'none', fontFamily: 'monospace'}} 
                                    value={message} 
                                    onChange={e => setMessage(e.target.value)} 
                                    placeholder="Type your message here... use [NAME] and [BALANCE] as placeholders." 
                                />
                                <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '5px'}}>
                                    <span style={{fontSize: '0.7rem', color: '#64748b'}}>Placeholders: [NAME], [BALANCE], [ID]</span>
                                    <span style={{fontSize: '0.75rem', color: '#94a3b8'}}>{message.length} Characters</span>
                                </div>
                            </div>

                            <div style={{maxHeight: '250px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '20px'}}>
                                <table style={styles.table}>
                                    <thead style={{position: 'sticky', top: 0, zIndex: 1, background: 'white'}}>
                                        <tr>
                                            <th style={{...styles.th, width: '40px'}}><input type="checkbox" onChange={handleSelectAll} checked={selectedIds.length === displayStudents.length && displayStudents.length > 0} /></th>
                                            <th style={styles.th}>Name</th>
                                            <th style={styles.th}>Admission #</th>
                                            <th style={styles.th}>SMS Number</th>
                                            <th style={{...styles.th, textAlign: 'right'}}>Due</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {displayStudents.map(s => (
                                            <tr key={s.admissionNo}>
                                                <td style={styles.td}><input type="checkbox" checked={selectedIds.includes(s.admissionNo)} onChange={() => {
                                                    setSelectedIds(prev => prev.includes(s.admissionNo) ? prev.filter(id => id !== s.admissionNo) : [...prev, s.admissionNo])
                                                }} /></td>
                                                <td style={styles.td}>{s.name}</td>
                                                <td style={styles.td}>{s.admissionNo}</td>
                                                <td style={styles.td}>{s.smsNumber}</td>
                                                <td style={{...styles.td, textAlign: 'right', fontWeight: 600, color: s.balance > 0 ? '#b91c1c' : '#166534'}}>{s.balance.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                        {displayStudents.length === 0 && <tr><td colSpan={5} style={{textAlign: 'center', padding: '20px', color: '#94a3b8', fontStyle: 'italic'}}>No students found matching current filters.</td></tr>}
                                    </tbody>
                                </table>
                            </div>

                            <button 
                                style={{...styles.button("primary"), width: '100%', padding: '15px'}} 
                                onClick={handleSendBulk}
                                disabled={isSending || selectedIds.length === 0}
                            >
                                <span className="material-symbols-outlined">send</span> {isSending ? `Processing (${progress}%)` : `Send SMS to ${selectedIds.length} Recipients`}
                            </button>
                        </div>
                    </div>

                    {/* Right: Phone Preview */}
                    <div style={{flex: 1}}>
                        <div style={{
                            width: '280px', height: '520px', background: '#0f172a', borderRadius: '40px', padding: '15px', border: '8px solid #1e293b',
                            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', margin: '0 auto', position: 'sticky', top: '20px'
                        }}>
                            <div style={{width: '60px', height: '4px', background: '#334155', borderRadius: '10px', margin: '0 auto 20px auto'}}></div>
                            <div style={{background: 'white', height: '450px', borderRadius: '20px', padding: '10px', overflowY: 'auto', display: 'flex', flexDirection: 'column'}}>
                                <div style={{textAlign: 'center', fontSize: '0.7rem', color: '#94a3b8', marginBottom: '15px', borderBottom: '1px solid #f1f5f9', paddingBottom: '5px'}}>GIMS Administrator</div>
                                <div style={{background: '#e2e8f0', padding: '12px', borderRadius: '15px 15px 15px 2px', maxWidth: '85%', fontSize: '0.8rem', position: 'relative', alignSelf: 'flex-start'}}>
                                    {message || "Type a message to see a preview here..."}
                                    <div style={{fontSize: '0.6rem', color: '#64748b', textAlign: 'right', marginTop: '6px'}}>Just Now</div>
                                </div>
                                {isSending && (
                                    <div style={{marginTop: 'auto', padding: '10px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0'}}>
                                        <div style={{fontSize: '0.75rem', fontWeight: 700, marginBottom: '5px'}}>Sending Status</div>
                                        <div style={{width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden'}}>
                                            <div style={{width: `${progress}%`, height: '100%', background: '#4f46e5', transition: 'width 0.3s'}}></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div style={styles.card}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px'}}>
                        <h3 style={{margin: 0, color: '#0f172a'}}>Message Transmission Proof</h3>
                        <div style={{width: '350px'}}>
                            <input 
                                style={styles.input} 
                                placeholder="Search History (Name, Adm No, Phone)..." 
                                value={histSearch}
                                onChange={e => setHistSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Date & Time</th>
                                <th style={styles.th}>Student Name</th>
                                <th style={styles.th}>Admission No</th>
                                <th style={styles.th}>Phone Number</th>
                                <th style={styles.th}>Message Delivered</th>
                                <th style={styles.th}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredHistory.map(h => (
                                <tr key={h.id}>
                                    <td style={styles.td}>
                                        <div style={{fontWeight: 600}}>{h.date}</div>
                                        <div style={{fontSize: '0.75rem', color: '#64748b'}}>{h.time}</div>
                                    </td>
                                    <td style={styles.td}>{h.studentName}</td>
                                    <td style={styles.td}><span style={{fontFamily: 'monospace', color: '#64748b'}}>{h.admissionNo}</span></td>
                                    <td style={styles.td}>{h.phone}</td>
                                    <td style={{...styles.td, maxWidth: '250px'}}>
                                        <div style={{fontSize: '0.8rem', color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}} title={h.message}>
                                            {h.message}
                                        </div>
                                    </td>
                                    <td style={styles.td}>
                                        <span style={{
                                            padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700,
                                            backgroundColor: '#dcfce7', color: '#166534', textTransform: 'uppercase'
                                        }}>
                                            {h.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {filteredHistory.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{textAlign: 'center', padding: '60px', color: '#94a3b8'}}>
                                        <span className="material-symbols-outlined" style={{fontSize: '48px', marginBottom: '10px'}}>history_toggle_off</span>
                                        <p>No SMS history records found matching search.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
