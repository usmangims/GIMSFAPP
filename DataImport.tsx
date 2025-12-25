
import React, { useState, useRef } from "react";
import { styles } from "./styles";

type ImportStep = "upload" | "processing" | "success";

export const DataImport = ({ onImportStudents, onImportAccounts }: any) => {
   const [step, setStep] = useState<ImportStep>("upload");
   const [fileName, setFileName] = useState("");
   const [importType, setImportType] = useState<"students" | "accounts">("students");
   const [progress, setProgress] = useState(0);
   const [logs, setLogs] = useState<string[]>([]);
   const fileInputRef = useRef<HTMLInputElement>(null);

   const processRows = (rows: any[]) => {
      if (rows.length === 0) return [];

      // Get the XLSX library from window (loaded in index.html)
      const XLSX = (window as any).XLSX;
      if (!XLSX) {
         alert("Excel library failed to load. Please refresh the page.");
         return [];
      }

      // Improved Auto-detection logic
      const firstRow = rows[0];
      const mapping: any = {};
      
      Object.keys(firstRow).forEach(key => {
         const k = key.toLowerCase().trim();
         
         // Smart Mapping for Students
         if ((k.includes("name") || k === "student") && !k.includes("father") && !k.includes("parent")) mapping.name = key;
         if (k.includes("father") || k.includes("s/o") || k.includes("parent") || k.includes("guardian")) mapping.fatherName = key;
         if (k.includes("adm") || k.includes("no") || k.includes("id") || k.includes("roll") || k.includes("reg") || k.includes("enroll")) mapping.admissionNo = key;
         if (k.includes("prog") || k.includes("course") || k.includes("tech") || k.includes("class") || k.includes("department")) mapping.program = key;
         if (k.includes("sem") || k.includes("year") || k.includes("part") || k.includes("term")) mapping.semester = key;
         if (k.includes("camp") || k.includes("branch") || k.includes("center") || k.includes("location")) mapping.campus = key;
         if (k.includes("bal") || k.includes("due") || k.includes("out") || k.includes("arrear") || k.includes("pay")) mapping.balance = key;
         if (k.includes("phone") || k.includes("contact") || k.includes("mobile") || k.includes("cell")) mapping.phone = key;
         if (k.includes("cnic") || k.includes("nic") || k.includes("identity")) mapping.cnic = key;
         if (k.includes("board") || k.includes("council") || k.includes("affil")) mapping.board = key;
      });

      return rows.map((row, index) => {
         if (importType === 'students') {
            return {
               name: row[mapping.name] || "Imported Student",
               fatherName: row[mapping.fatherName] || "-",
               admissionNo: row[mapping.admissionNo] ? String(row[mapping.admissionNo]) : `IMP-${Date.now()}-${index}`,
               program: row[mapping.program] || "General",
               semester: row[mapping.semester] || "1st",
               campus: row[mapping.campus] || "Main Campus",
               balance: Number(row[mapping.balance]) || 0,
               phone: row[mapping.phone] || "-",
               cnic: row[mapping.cnic] || "-",
               board: row[mapping.board] || "Other",
               address: row["Address"] || row["address"] || "Imported Address",
               district: "Peshawar",
               remarks: "Imported from file",
               admissionFee: 0,
               tuitionFee: 0,
               miscCharges: 0,
               affiliationFee: 0,
               totalCourseFee: 0,
               status: "Paid",
               admissionDate: new Date().toISOString().slice(0, 10),
               recordedBy: "Migration Engine"
            };
         } else {
            const rowValues = Object.values(row);
            return {
               code: String(row[mapping.admissionNo] || rowValues[0] || "0-00-000"),
               name: String(row[mapping.name] || rowValues[1] || "Unnamed Account"),
               level: 3,
               parentCode: String(rowValues[0] || "").substring(0, 4) || null,
               category: "Asset"
            };
         }
      });
   };

   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
         setFileName(file.name);
         setStep("processing");
         setLogs(["Reading file content...", "Calling XLSX engine..."]);
         
         const reader = new FileReader();
         
         reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target?.result as ArrayBuffer);
                const XLSX = (window as any).XLSX;
                
                if (!XLSX) throw new Error("XLSX library not found");

                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonRows = XLSX.utils.sheet_to_json(worksheet);
                
                startAutoMigration(jsonRows);
            } catch (err: any) {
                console.error("Import Error:", err);
                setLogs(prev => [...prev, "ERROR: " + err.message]);
                setTimeout(() => setStep("upload"), 3000);
            }
         };
         
         reader.onerror = () => {
             alert("Error reading file");
             setStep("upload");
         };
         
         reader.readAsArrayBuffer(file);
      }
   };

   const startAutoMigration = (parsedRows: any[]) => {
       setProgress(0);
       setLogs(prev => [...prev, `Found ${parsedRows.length} potential records...`, "Running column auto-detection..."]);
       
       let p = 0;
       const interval = setInterval(() => {
           p += 10;
           setProgress(p);
           
           if (p === 30) setLogs(prev => [...prev, "Matching CSV/Excel headers with System fields..."]);
           if (p === 60) setLogs(prev => [...prev, "Formatting data for GIMS Database..."]);
           if (p === 90) setLogs(prev => [...prev, "Saving records to local storage..."]);

           if (p >= 100) {
               clearInterval(interval);
               const finalData = processRows(parsedRows);
               
               // Injects data into App State
               if (importType === 'students') {
                  onImportStudents(finalData);
               } else {
                  onImportAccounts(finalData);
               }

               setLogs(prev => [...prev, `Mubarak! ${finalData.length} records system mein save ho gaye hain.`]);
               setTimeout(() => setStep("success"), 600);
           }
       }, 150);
   };

   return (
      <div style={{maxWidth: '900px', margin: '0 auto'}}>
         <div style={{textAlign: 'center', marginBottom: '30px'}}>
            <h2 style={{marginBottom: '5px'}}>System Data Migration</h2>
            <p style={{color: '#64748b'}}>Excel ya CSV file upload karein, data fauran Biodata list mein show hoga.</p>
         </div>

         <div style={{...styles.card, padding: '0', overflow: 'hidden', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'}}>
            <div style={{display: 'flex', background: '#f8fafc', borderBottom: '1px solid #e2e8f0'}}>
                {[
                    { id: 'upload', label: '1. Select File', icon: 'upload_file' },
                    { id: 'processing', label: '2. Auto Migrating', icon: 'sync' },
                    { id: 'success', label: '3. Import Finished', icon: 'task_alt' }
                ].map((s, i) => (
                    <div key={s.id} style={{
                        flex: 1, padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                        color: step === s.id ? '#4f46e5' : '#94a3b8',
                        background: step === s.id ? 'white' : 'transparent',
                        fontWeight: step === s.id ? 700 : 500,
                        borderBottom: step === s.id ? '4px solid #4f46e5' : '4px solid transparent',
                        transition: 'all 0.3s'
                    }}>
                        <span className="material-symbols-outlined" style={{fontSize: '22px'}}>{s.icon}</span>
                        {s.label}
                    </div>
                ))}
            </div>

            <div style={{padding: '50px'}}>
                {step === 'upload' && (
                    <div style={{textAlign: 'center'}}>
                        <div style={{marginBottom: '35px'}}>
                            <p style={{fontWeight: 600, color: '#334155', marginBottom: '20px', fontSize: '1.1rem'}}>Kya cheez import karni hai?</p>
                            <div style={{display: 'flex', justifyContent: 'center', gap: '20px'}}>
                                <button onClick={() => setImportType('students')} style={{
                                    padding: '15px 30px', borderRadius: '12px', cursor: 'pointer', border: '2px solid',
                                    borderColor: importType === 'students' ? '#4f46e5' : '#e2e8f0',
                                    backgroundColor: importType === 'students' ? '#eef2ff' : 'white',
                                    color: importType === 'students' ? '#4f46e5' : '#64748b',
                                    fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px'
                                }}>
                                    <span className="material-symbols-outlined">school</span> Student Records
                                </button>
                                <button onClick={() => setImportType('accounts')} style={{
                                    padding: '15px 30px', borderRadius: '12px', cursor: 'pointer', border: '2px solid',
                                    borderColor: importType === 'accounts' ? '#4f46e5' : '#e2e8f0',
                                    backgroundColor: importType === 'accounts' ? '#eef2ff' : 'white',
                                    color: importType === 'accounts' ? '#4f46e5' : '#64748b',
                                    fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px'
                                }}>
                                    <span className="material-symbols-outlined">account_tree</span> Chart of Accounts
                                </button>
                            </div>
                        </div>

                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                padding: '80px 40px', border: '3px dashed #cbd5e1', borderRadius: '24px', 
                                background: '#f8fafc', cursor: 'pointer', transition: 'all 0.3s ease',
                                display: 'flex', flexDirection: 'column', alignItems: 'center'
                            }}
                            onMouseOver={e => e.currentTarget.style.borderColor = '#4f46e5'}
                            onMouseOut={e => e.currentTarget.style.borderColor = '#cbd5e1'}
                        >
                            <div style={{
                                width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#e2e8f0',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px'
                            }}>
                                <span className="material-symbols-outlined" style={{fontSize: '48px', color: '#4f46e5'}}>cloud_upload</span>
                            </div>
                            <h3 style={{margin: '0 0 10px 0', color: '#1e293b'}}>Excel (.xlsx) ya CSV file select karein</h3>
                            <p style={{color: '#64748b', fontSize: '0.95rem'}}>System columns ko "Smart Match" kar ke data save kar lega</p>
                            <input type="file" ref={fileInputRef} style={{display: 'none'}} onChange={handleFileChange} accept=".csv,.xlsx,.xls" />
                        </div>
                    </div>
                )}

                {step === 'processing' && (
                    <div style={{textAlign: 'center'}}>
                        <div style={{marginBottom: '30px'}}>
                            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontWeight: 600, color: '#4f46e5'}}>
                                <span>File: {fileName}</span>
                                <span>{progress}%</span>
                            </div>
                            <div style={{width: '100%', height: '14px', background: '#e2e8f0', borderRadius: '10px', overflow: 'hidden'}}>
                                <div style={{width: `${progress}%`, height: '100%', background: 'linear-gradient(to right, #4f46e5, #10b981)', transition: 'width 0.3s ease'}}></div>
                            </div>
                        </div>
                        <div style={{
                            background: '#0f172a', color: '#34d399', padding: '25px', borderRadius: '16px', 
                            textAlign: 'left', fontFamily: 'monospace', fontSize: '0.9rem', height: '220px', 
                            overflowY: 'auto', border: '1px solid #1e293b'
                        }}>
                            {logs.map((log, i) => (
                                <div key={i} style={{marginBottom: '6px'}}>> {log}</div>
                            ))}
                            <div style={{animation: 'blink 1s infinite'}}>_</div>
                        </div>
                    </div>
                )}

                {step === 'success' && (
                    <div style={{textAlign: 'center', padding: '20px 0'}}>
                        <div style={{
                            width: '100px', height: '100px', background: '#dcfce7', color: '#166534', 
                            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 25px auto'
                        }}>
                            <span className="material-symbols-outlined" style={{fontSize: '56px'}}>check_circle</span>
                        </div>
                        <h2 style={{color: '#166534'}}>Migration Mukammal!</h2>
                        <p style={{color: '#64748b', marginBottom: '35px'}}>Data system ke database mein save ho chuka hai. Ab aap Biodata list check karein.</p>
                        <button style={{...styles.button("primary"), padding: '15px 40px'}} onClick={() => { setStep("upload"); setFileName(""); setLogs([]); }}>
                            Aik aur file import karein
                        </button>
                    </div>
                )}
            </div>
         </div>
         
         <style>{`
            @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
         `}</style>
      </div>
   );
};
