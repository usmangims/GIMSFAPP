
import React, { useState, useEffect, useRef } from "react";
import { styles } from "./styles";
import { Student, Campus } from "./types";
import { SearchableSelect } from "./SearchableSelect";

export const FaceRecognitionScanner = ({ students, userRole, masterData, onAttend }: { students: Student[], userRole: string, masterData: any, onAttend: (s: Student) => void }) => {
    const [isScanning, setIsScanning] = useState(false);
    const [mode, setMode] = useState<'gate' | 'enrollment'>('gate');
    const [detectedStudent, setDetectedStudent] = useState<Student | null>(null);
    const [status, setStatus] = useState<'neutral' | 'success' | 'danger'>('neutral');
    
    // Enrollment Filters
    const [regCampus, setRegCampus] = useState("All");
    const [regProgram, setRegProgram] = useState("All");
    const [regSemester, setRegSemester] = useState("All");
    const [regStudentId, setRegStudentId] = useState("");
    const [isCapturing, setIsCapturing] = useState(false);

    const intervalRef = useRef<any>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);

    const filteredActiveStudents = students.filter(s => {
        if (s.status === "Left Student") return false;
        if (regCampus !== "All" && s.campus !== regCampus) return false;
        if (regProgram !== "All" && s.program !== regProgram) return false;
        if (regSemester !== "All" && s.semester !== regSemester) return false;
        return true;
    });

    const studentOptions = filteredActiveStudents.map(s => ({ value: s.admissionNo, label: `${s.name} (${s.admissionNo})` }));

    const playAlertSound = (type: 'success' | 'danger') => {
        try {
            if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            const ctx = audioCtxRef.current;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = type === 'danger' ? 'sawtooth' : 'sine';
            osc.frequency.setValueAtTime(type === 'danger' ? 180 : 880, ctx.currentTime);
            
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (type === 'danger' ? 1 : 0.5));
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + (type === 'danger' ? 1 : 0.5));
            
            if(type === 'danger') {
               // Double beep for danger
               setTimeout(() => {
                   const osc2 = ctx.createOscillator();
                   osc2.type = 'sawtooth';
                   osc2.frequency.setValueAtTime(150, ctx.currentTime);
                   const g2 = ctx.createGain();
                   g2.gain.setValueAtTime(0.1, ctx.currentTime);
                   g2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
                   osc2.connect(g2);
                   g2.connect(ctx.destination);
                   osc2.start();
                   osc2.stop(ctx.currentTime + 0.8);
               }, 200);
            }
        } catch (e) { console.error("Audio error", e); }
    };

    const stopMonitoring = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsScanning(false);
        setDetectedStudent(null);
        setStatus('neutral');
    };

    const startMonitoring = () => {
        setIsScanning(true);
        if (intervalRef.current) clearInterval(intervalRef.current);
        
        // Simulate real-time biometric machine polls
        intervalRef.current = setInterval(() => {
            if (Math.random() > 0.8) { 
                const activeWithBio = students.filter(s => s.status !== "Left Student" && s.biometricId);
                if (activeWithBio.length === 0) return;

                const randomStudent = activeWithBio[Math.floor(Math.random() * activeWithBio.length)];
                
                setDetectedStudent(randomStudent);
                const isDefaulter = randomStudent.balance > 0;
                setStatus(isDefaulter ? 'danger' : 'success');
                playAlertSound(isDefaulter ? 'danger' : 'success');

                // Mark Attendance if setting is on
                if(masterData.biometric.autoAttendance) {
                   onAttend(randomStudent);
                }

                setTimeout(() => {
                    setDetectedStudent(null);
                    setStatus('neutral');
                }, 7000);
            }
        }, 8000);
    };

    const handleSaveEnrollment = () => {
        if(!regStudentId) return;
        alert(`Biometric data for student ${regStudentId} has been successfully linked.`);
        setRegStudentId("");
        setMode('gate');
    };

    useEffect(() => {
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, []);

    const toggleSystem = () => {
        if (isScanning) stopMonitoring();
        else startMonitoring();
    };

    return (
        <div style={{height: 'calc(100vh - 150px)', display: 'flex', flexDirection: 'column'}}>
            <div className="no-print" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                <div>
                    <h2 style={{margin: '0 0 5px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px'}}>
                        <span className="material-symbols-outlined" style={{color: '#4f46e5'}}>fingerprint</span> 
                        {mode === 'gate' ? 'Biometrics Monitor' : 'Biometrics Enrollment'}
                    </h2>
                    <p style={{margin: 0, color: '#64748b'}}>
                        {mode === 'gate' ? `Monitoring ${masterData.biometric.machineIP}:${masterData.biometric.port}...` : 'Link student records with Biometric Machine User IDs'}
                    </p>
                </div>
                <div style={{display: 'flex', gap: '10px'}}>
                    {!isScanning && (
                        <div style={{display: 'flex', gap: '5px', background: '#e2e8f0', padding: '4px', borderRadius: '8px'}}>
                            <button onClick={() => setMode('gate')} style={styles.tabButton(mode === 'gate')}>Monitor</button>
                            <button onClick={() => setMode('enrollment')} style={styles.tabButton(mode === 'enrollment')}>Register</button>
                        </div>
                    )}
                    <button 
                        onClick={toggleSystem}
                        style={{...styles.button(isScanning ? "danger" : "primary"), padding: '10px 25px', background: isScanning ? '#b91c1c' : '#166534'}}
                    >
                        <span className="material-symbols-outlined">{isScanning ? "stop_circle" : "play_circle"}</span>
                        {isScanning ? "Stop Monitoring" : "Start Biometrics"}
                    </button>
                </div>
            </div>

            <div style={{flex: 1, display: 'flex', gap: '25px'}}>
                {mode === 'gate' ? (
                    <div style={{
                        flex: 1, 
                        borderRadius: '24px', 
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.5s ease',
                        border: status === 'danger' ? '15px solid #ef4444' : status === 'success' ? '15px solid #22c55e' : '15px solid #1e293b',
                        backgroundColor: status === 'danger' ? '#fef2f2' : status === 'success' ? '#f0fdf4' : '#f8fafc',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        {/* Background Effect */}
                        {status === 'danger' && <div style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#ef4444', animation: 'blink 1s infinite', opacity: 0.1, zIndex: 0}}></div>}

                        {!isScanning ? (
                            <div style={{textAlign: 'center', zIndex: 1}}>
                                <span className="material-symbols-outlined" style={{fontSize: '120px', color: '#cbd5e1', marginBottom: '20px'}}>fingerprint</span>
                                <h1 style={{color: '#94a3b8', margin: 0}}>Biometrics Offline</h1>
                                <p style={{color: '#94a3b8'}}>System is not listening to Biometric events.</p>
                            </div>
                        ) : detectedStudent ? (
                            <div style={{textAlign: 'center', zIndex: 1, animation: 'scaleUp 0.3s ease-out'}}>
                                <div style={{width: '220px', height: '220px', borderRadius: '50%', margin: '0 auto 30px auto', border: `8px solid ${status === 'danger' ? '#ef4444' : '#22c55e'}`, overflow: 'hidden', background: 'white', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'}}>
                                    {detectedStudent.photo ? <img src={detectedStudent.photo} style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : <span className="material-symbols-outlined" style={{fontSize: '120px', color: '#cbd5e1', lineHeight: '210px'}}>person</span>}
                                </div>
                                <h1 style={{fontSize: '4rem', fontWeight: 900, margin: '0 0 10px 0', textTransform: 'uppercase', color: '#0f172a'}}>{detectedStudent.name}</h1>
                                <h3 style={{fontSize: '2rem', color: '#475569', margin: '0 0 40px 0'}}>Adm No: {detectedStudent.admissionNo} • Bio ID: {detectedStudent.biometricId}</h3>

                                <div style={{
                                    padding: '40px 80px', 
                                    borderRadius: '20px', 
                                    background: status === 'danger' ? '#b91c1c' : '#15803d',
                                    color: 'white',
                                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)'
                                }}>
                                    <div style={{fontSize: '1.5rem', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '10px', fontWeight: 700}}>
                                        {status === 'danger' ? '⛔ ACCESS BLOCKED' : '✅ WELCOME TO GIMS'}
                                    </div>
                                    <div style={{fontSize: '3.5rem', fontWeight: 900}}>
                                        {status === 'danger' ? 'FEES PENDING' : 'CLEAR'}
                                    </div>
                                    {status === 'danger' && <div style={{fontSize: '1.2rem', marginTop: '10px'}}>Please contact the Accounts Office immediately.</div>}
                                </div>
                            </div>
                        ) : (
                            <div style={{textAlign: 'center', zIndex: 1}}>
                                <div style={{width: '150px', height: '150px', borderRadius: '50%', border: '4px dashed #94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 30px auto', animation: 'rotate 10s linear infinite'}}>
                                    <span className="material-symbols-outlined" style={{fontSize: '64px', color: '#94a3b8'}}>fingerprint</span>
                                </div>
                                <h1 style={{color: '#475569', margin: 0, letterSpacing: '5px'}}>SCAN THUMB</h1>
                                <p style={{color: '#94a3b8', fontSize: '1.2rem', marginTop: '10px'}}>Biometric System is Live and Monitoring Entry...</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{flex: 1, ...styles.card, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
                         <div style={{maxWidth: '500px', width: '100%', textAlign: 'center'}}>
                            <span className="material-symbols-outlined" style={{fontSize: '64px', color: '#4f46e5', marginBottom: '20px'}}>add_to_home_screen</span>
                            <h2 style={{marginBottom: '30px'}}>Biometrics Enrollment Tool</h2>
                            
                            <div style={{textAlign: 'left', marginBottom: '25px'}}>
                                <label style={styles.label}>Select Student</label>
                                <SearchableSelect options={studentOptions} value={regStudentId} onChange={setRegStudentId} placeholder="Search Name or Admission #..." />
                            </div>

                            <div style={{background: '#f8fafc', padding: '30px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '30px'}}>
                                <p style={{fontSize: '0.9rem', color: '#64748b', marginBottom: '20px'}}>Ask the student to place their thumb on the machine scanner. Ensure the ID matches the Machine User ID.</p>
                                <button 
                                    onClick={() => { setIsCapturing(true); setTimeout(() => { setIsCapturing(false); handleSaveEnrollment(); }, 2000); }}
                                    disabled={!regStudentId || isCapturing}
                                    style={{...styles.button("primary"), width: '100%', padding: '15px', fontSize: '1.1rem'}}
                                >
                                    {isCapturing ? 'Communicating with Machine...' : 'Link Biometric ID'}
                                </button>
                            </div>
                         </div>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes blink { 0%, 100% { opacity: 0.1; } 50% { opacity: 0.4; } }
                @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes scaleUp { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            `}</style>
        </div>
    );
};
