
import React, { useState, useEffect, useRef } from "react";
import { styles } from "./styles";
import { Student } from "./types";
import { SearchableSelect } from "./SearchableSelect";

export const FaceRecognitionScanner = ({ students, userRole }: { students: Student[], userRole: string }) => {
    const [isScanning, setIsScanning] = useState(false);
    const [mode, setMode] = useState<'security' | 'registration'>('security');
    const [detectedStudent, setDetectedStudent] = useState<Student | null>(null);
    const [status, setStatus] = useState<'neutral' | 'success' | 'danger'>('neutral');
    const [permissionError, setPermissionError] = useState("");
    
    // Registration Specific State
    const [regStudentId, setRegStudentId] = useState("");
    const [regStep, setRegStep] = useState(0); // 0: Front, 1: Left, 2: Right, 3: Up, 4: Down
    const [isCapturing, setIsCapturing] = useState(false);
    const [capturedAngles, setCapturedAngles] = useState<boolean[]>([false, false, false, false, false]);

    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const intervalRef = useRef<any>(null);

    const activeStudents = students.filter(s => s.status !== "Left Student");
    const studentOptions = activeStudents.map(s => ({ value: s.admissionNo, label: `${s.name} (${s.admissionNo})` }));

    const REG_STEPS = [
        { label: "Front Face", icon: "face", desc: "Look straight into the camera" },
        { label: "Turn Left", icon: "arrow_back", desc: "Show your left profile" },
        { label: "Turn Right", icon: "arrow_forward", desc: "Show your right profile" },
        { label: "Look Up", icon: "arrow_upward", desc: "Tilt your head upwards" },
        { label: "Look Down", icon: "arrow_downward", desc: "Tilt your head downwards" }
    ];

    const startCamera = async () => {
        try {
            setPermissionError("");
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
                setIsScanning(true);
                if (mode === 'security') startDetectionSimulation();
            }
        } catch (err: any) {
            setPermissionError("Camera access denied. Please allow camera permissions in your browser.");
            setIsScanning(false);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsScanning(false);
        setDetectedStudent(null);
        setStatus('neutral');
    };

    const startDetectionSimulation = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
            if (Math.random() > 0.6) { 
                const randomStudent = activeStudents[Math.floor(Math.random() * activeStudents.length)];
                setDetectedStudent(randomStudent);
                setStatus(randomStudent.balance > 0 ? 'danger' : 'success');
                setTimeout(() => {
                    setDetectedStudent(null);
                    setStatus('neutral');
                }, 4000);
            }
        }, 8000);
    };

    const handleCaptureAngle = () => {
        if (!regStudentId) return alert("Please select a student from the list first");
        setIsCapturing(true);
        // Simulate biometric data processing
        setTimeout(() => {
            const updated = [...capturedAngles];
            updated[regStep] = true;
            setCapturedAngles(updated);
            setIsCapturing(false);
            if (regStep < 4) setRegStep(regStep + 1);
        }, 1200);
    };

    const handleSaveEnrollment = () => {
        alert(`Biometric Profile Saved! Face data for ${regStudentId} has been successfully registered from all 5 angles.`);
        setRegStep(0);
        setCapturedAngles([false, false, false, false, false]);
        setRegStudentId("");
        setMode('security');
    };

    useEffect(() => {
        return () => stopCamera();
    }, []);

    const toggleSystem = () => {
        if (isScanning) stopCamera();
        else startCamera();
    };

    if (userRole !== "Admin" && userRole !== "Finance Manager") {
        return (
            <div style={{...styles.card, textAlign: 'center', padding: '50px'}}>
                <span className="material-symbols-outlined" style={{fontSize: '64px', color: '#cbd5e1'}}>lock</span>
                <h3 style={{color: '#94a3b8'}}>Security Restricted</h3>
                <p>Only administrative roles can access the Face Scanner.</p>
            </div>
        );
    }

    return (
        <div>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                <div>
                    <h2 style={{margin: '0 0 5px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px'}}>
                        <span className="material-symbols-outlined" style={{color: '#4f46e5'}}>face</span> 
                        {mode === 'security' ? 'Security Scanner' : 'Add New Face Biometric'}
                    </h2>
                    <p style={{margin: 0, color: '#64748b'}}>{mode === 'security' ? 'Monitoring campus entry points' : 'Enrollment process: Show face from all sides'}</p>
                </div>
                <div style={{display: 'flex', gap: '10px'}}>
                    {!isScanning && (
                        <button 
                            onClick={() => setMode(mode === 'security' ? 'registration' : 'security')}
                            style={{...styles.button("secondary"), background: 'white'}}
                        >
                            <span className="material-symbols-outlined">{mode === 'security' ? 'person_add' : 'security'}</span>
                            {mode === 'security' ? 'Add New Student' : 'Back to Scanner'}
                        </button>
                    )}
                    <button 
                        onClick={toggleSystem}
                        style={{...styles.button(isScanning ? "danger" : "primary"), padding: '10px 25px'}}
                    >
                        <span className="material-symbols-outlined">{isScanning ? "videocam_off" : "videocam"}</span>
                        {isScanning ? "Stop System" : "Activate System"}
                    </button>
                </div>
            </div>

            {permissionError && (
                <div style={{padding: '10px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '20px', fontSize: '0.85rem'}}>
                    {permissionError}
                </div>
            )}

            <div style={{display: 'flex', gap: '20px'}}>
                {/* Camera Viewport */}
                <div style={{flex: 2}}>
                    <div style={styles.scannerContainer}>
                        {isScanning ? (
                            <>
                                <video 
                                    ref={videoRef} 
                                    autoPlay playsInline muted 
                                    style={{width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)'}} 
                                />
                                <div style={styles.scannerOverlay(mode === 'registration' ? 'neutral' : status)}>
                                    <div style={{position: 'absolute', top: 0, left: 0, width: '30px', height: '30px', borderTop: '4px solid white', borderLeft: '4px solid white'}}></div>
                                    <div style={{position: 'absolute', top: 0, right: 0, width: '30px', height: '30px', borderTop: '4px solid white', borderRight: '4px solid white'}}></div>
                                    <div style={{position: 'absolute', bottom: 0, left: 0, width: '30px', height: '30px', borderBottom: '4px solid white', borderLeft: '4px solid white'}}></div>
                                    <div style={{position: 'absolute', bottom: 0, right: 0, width: '30px', height: '30px', borderBottom: '4px solid white', borderRight: '4px solid white'}}></div>
                                    
                                    {mode === 'registration' && (
                                        <div style={{position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.6)', padding: '8px 20px', borderRadius: '20px', color: 'white', fontWeight: 700}}>
                                            ALIGN FACE WITHIN BOX
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div style={{color: '#64748b', textAlign: 'center'}}>
                                <span className="material-symbols-outlined" style={{fontSize: '80px', opacity: 0.3}}>camera_enhance</span>
                                <div style={{marginTop: '10px', fontSize: '1.2rem'}}>System Idle</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Info Panel */}
                <div style={{flex: 1}}>
                    {mode === 'registration' ? (
                        <div style={styles.card}>
                            <h3 style={{marginTop: 0, marginBottom: '20px', color: '#1e293b'}}>Step 2: Biometric Enrollment</h3>
                            
                            <div style={{marginBottom: '20px'}}>
                                <label style={styles.label}>Identify Student</label>
                                <SearchableSelect options={studentOptions} value={regStudentId} onChange={setRegStudentId} placeholder="Search Student..." />
                            </div>

                            <div style={{background: '#f8fafc', padding: '20px', borderRadius: '12px', marginBottom: '25px', border: '1px solid #e2e8f0', textAlign: 'center'}}>
                                <div style={{width: '50px', height: '50px', background: '#4f46e5', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px auto'}}>
                                    <span className="material-symbols-outlined" style={{fontSize: '30px'}}>{REG_STEPS[regStep].icon}</span>
                                </div>
                                <div style={{fontWeight: 800, fontSize: '1.1rem', color: '#0f172a', marginBottom: '4px'}}>{REG_STEPS[regStep].label}</div>
                                <div style={{fontSize: '0.85rem', color: '#64748b'}}>{REG_STEPS[regStep].desc}</div>
                                
                                <div style={{display: 'flex', gap: '6px', marginTop: '20px', justifyContent: 'center'}}>
                                    {capturedAngles.map((done, i) => (
                                        <div key={i} style={{width: '25px', height: '6px', background: done ? '#10b981' : '#e2e8f0', borderRadius: '3px'}}></div>
                                    ))}
                                </div>
                            </div>

                            <button 
                                onClick={handleCaptureAngle}
                                disabled={!isScanning || !regStudentId || isCapturing}
                                style={{...styles.button("primary"), width: '100%', padding: '15px', marginBottom: '12px', fontSize: '1rem'}}
                            >
                                {isCapturing ? "Processing Geometry..." : "Record Current Angle"}
                            </button>
                            
                            {capturedAngles.every(v => v === true) && (
                                <button onClick={handleSaveEnrollment} style={{...styles.button("primary"), width: '100%', background: '#10b981', padding: '15px'}}>
                                    Complete Profile Save
                                </button>
                            )}
                        </div>
                    ) : (
                        <div style={{...styles.card, textAlign: 'center', border: status === 'danger' ? '3px solid #ef4444' : status === 'success' ? '3px solid #22c55e' : '1px solid #e2e8f0', minHeight: '380px', display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
                            {detectedStudent ? (
                                <>
                                    <div style={{width: '140px', height: '140px', borderRadius: '50%', margin: '0 auto 20px auto', border: `4px solid ${status === 'danger' ? '#ef4444' : '#22c55e'}`, overflow: 'hidden', padding: '4px', background: 'white'}}>
                                        {detectedStudent.photo ? <img src={detectedStudent.photo} style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%'}} /> : <span className="material-symbols-outlined" style={{fontSize: '80px', color: '#cbd5e1', lineHeight: '132px'}}>person</span>}
                                    </div>
                                    <h3 style={{margin: '0 0 5px 0', color: '#0f172a', fontSize: '1.4rem'}}>{detectedStudent.name}</h3>
                                    <div style={{fontSize: '0.9rem', color: '#64748b', fontWeight: 600}}>{detectedStudent.admissionNo}</div>
                                    <div style={{marginTop: '25px', padding: '15px', background: status === 'danger' ? '#fee2e2' : '#dcfce7', borderRadius: '12px'}}>
                                        <div style={{fontSize: '0.8rem', fontWeight: 800, color: status === 'danger' ? '#b91c1c' : '#166534', textTransform: 'uppercase'}}>Payment Status</div>
                                        <div style={{fontSize: '1.8rem', fontWeight: 900, color: status === 'danger' ? '#b91c1c' : '#166534'}}>
                                            {detectedStudent.balance > 0 ? `Rs ${detectedStudent.balance.toLocaleString()}` : "CLEARED"}
                                        </div>
                                    </div>
                                    {status === 'danger' && <div style={{color: '#b91c1c', fontWeight: 800, marginTop: '12px', fontSize: '1.1rem'}}>⛔ ACCESS BLOCKED</div>}
                                    {status === 'success' && <div style={{color: '#166534', fontWeight: 800, marginTop: '12px', fontSize: '1.1rem'}}>✅ ACCESS GRANTED</div>}
                                </>
                            ) : (
                                <div style={{padding: '40px 0', color: '#94a3b8'}}>
                                    <div style={{animation: 'pulse 2s infinite', display: 'inline-block', marginBottom: '15px'}}>
                                        <span className="material-symbols-outlined" style={{fontSize: '64px'}}>biometric_setup</span>
                                    </div>
                                    <p style={{fontSize: '1.1rem', fontWeight: 500}}>Scan Ready...</p>
                                    <p style={{fontSize: '0.8rem', marginTop: '5px'}}>Walk up to the camera to identify</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <style>{`
                @keyframes pulse { 0% { opacity: 0.5; transform: scale(0.95); } 50% { opacity: 1; transform: scale(1); } 100% { opacity: 0.5; transform: scale(0.95); } }
            `}</style>
        </div>
    );
};
