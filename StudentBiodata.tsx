
import React, { useState, useEffect } from "react";
import { styles } from "./styles";
import { Student, BOARD_PROGRAM_MAP, Campus, KPK_DISTRICTS, KPK_LOCATIONS, FeeStructure } from "./types";

export const StudentBiodata = ({ students, onAddStudent, onDeleteStudent, onUpdateStudent, masterData, currentUser, feeStructures }: any) => {
  const [view, setView] = useState<"list" | "form">("list");
  const [editMode, setEditMode] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const [searchName, setSearchName] = useState("");
  const [searchFather, setSearchFather] = useState("");
  const [searchAdm, setSearchAdm] = useState("");

  const [formData, setFormData] = useState<Student>({
     admissionNo: "", name: "", fatherName: "", program: "", semester: "1st", campus: "Main Campus", 
     balance: 0, address: "", district: "Peshawar", phone: "", smsNumber: "", cnic: "", board: "", remarks: "", photo: "",
     admissionFee: 0, tuitionFee: 0, miscCharges: 0, affiliationFee: 0, totalCourseFee: 0,
     dob: "", gender: "Male", nationality: "Pakistani", status: "Paid", admissionDate: new Date().toISOString().slice(0, 10),
     recordedBy: ""
  });

  const [errors, setErrors] = useState<any>({});
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  // Address suggestions state
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // EXPANDED LOCATIONS
  const EXPANDED_LOCATIONS = [
      ...KPK_LOCATIONS,
      "Mohallah Jattan", "Mohallah Awan", "Colony No 1", "Colony No 2", "Civil Quarters", "Police Colony", "Labor Colony",
      "Sector A, Hayatabad", "Sector B, Hayatabad", "Phase 6, Hayatabad", "Phase 7, Hayatabad", "DHA Peshawar",
      "Regi Model Town", "Bahria Town", "Gulberg", "Nothia", "Landi Arbab", "Tehkal", "University Town", "Board Bazar",
      "Karkhano Market", "Jamrud Road", "Ring Road", "Charsadda Road", "Kohat Road", "Dalazak Road", "GT Road",
      "Chamkani", "Jhagra", "Tarnab Farm", "Pabbi Station", "Akora Khattak", "Jehangira", "Khairabad", "Nizampur",
      "Sheikh Maltoon Sector A", "Sheikh Maltoon Sector B", "Par Hoti", "Baghdada", "Gujar Garhi", "Takht Bhai", "Sher Garh"
  ];

  const COMMON_TYPOS: Record<string, string> = {
      "peshwar": "Peshawar", "peshawar city": "Peshawar City", "mardan city": "Mardan", "sawabi": "Swabi",
      "chrsadda": "Charsadda", "noshera": "Nowshera", "abbottabad": "Abbottabad", "abotabad": "Abbottabad",
      "hayatabd": "Hayatabad", "hayat abad": "Hayatabad", "universty": "University", "colny": "Colony",
      "mohalla": "Mohallah", "mohala": "Mohallah", "street": "St", "road": "Rd"
  };

  const [availablePrograms, setAvailablePrograms] = useState<string[]>([]);
  const [availableSemesters, setAvailableSemesters] = useState<string[]>([]);
  const [availableCampuses, setAvailableCampuses] = useState<Campus[]>([]);
  const [staticFee, setStaticFee] = useState<FeeStructure | null>(null);

  useEffect(() => {
    if(!formData.board) setAvailableCampuses(masterData.campuses);
  }, [masterData.campuses]);

  useEffect(() => {
     if (formData.board) {
        let progs: string[] = [];
        if (formData.board === "KPK Medical Faculty") {
           progs = masterData.programs.filter((p: string) => p.startsWith("Diploma"));
        } else if (formData.board === "KMU") {
           progs = masterData.programs.filter((p: string) => (p.startsWith("BS") || p === "DPT") && p !== "BS Nursing");
        } else if (formData.board === "PNC") {
           progs = masterData.programs.filter((p: string) => p === "BS Nursing" || p === "LHV" || p === "CNA");
        } else if (formData.board === "Pharmacy Council") {
           progs = masterData.programs.filter((p: string) => p === "Pharmacy-B");
        } else {
           progs = masterData.programs;
        }
        setAvailablePrograms(progs);
        
        let allowedCampuses = masterData.campuses;
        let allowedSems: string[] = [];
        
        if(formData.board === "KPK Medical Faculty") {
           allowedSems = ["Jan-2026", "1st", "2nd", "3rd", "4th"];
           allowedCampuses = masterData.campuses.filter((c:Campus) => c.name === "Main Campus" || c.name === "Girl Campus");
        } else if (formData.board === "Pharmacy Council") {
           allowedSems = ["Jan-2024", "1st Year", "2nd Year"];
           allowedCampuses = masterData.campuses.filter((c:Campus) => c.name === "Main Campus");
        } else if (formData.board === "KMU") {
           allowedSems = ["Sept-2025", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"];
           allowedCampuses = masterData.campuses.filter((c:Campus) => c.name === "Phase 3 Campus");
        } else if (formData.board === "PNC") {
           allowedSems = ["Sept-2023", "Sept-2024", "Sept-2025", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];
        } else {
           allowedSems = masterData.semesters;
        }

        setAvailableSemesters(allowedSems);
        setAvailableCampuses(allowedCampuses);
        
        setFormData(prev => ({
            ...prev,
            program: progs.includes(prev.program) ? prev.program : "",
            semester: allowedSems.includes(prev.semester) ? prev.semester : "",
            campus: allowedCampuses.some((c:Campus) => c.name === prev.campus) ? prev.campus : (allowedCampuses[0]?.name || prev.campus)
        }));

     } else {
        setAvailablePrograms(masterData.programs);
        setAvailableSemesters(masterData.semesters);
        setAvailableCampuses(masterData.campuses);
     }
  }, [formData.board, masterData]);

  useEffect(() => {
      // Look up dynamic static fees from props
      if(formData.board && formData.program) {
          const fees = feeStructures.find((f:FeeStructure) => f.board === formData.board && f.program === formData.program);
          setStaticFee(fees || null);
          if (fees && !editMode) {
              setFormData(prev => ({
                  ...prev,
                  admissionFee: fees.admission,
                  tuitionFee: fees.tuition,
                  miscCharges: fees.misc || 0,
                  affiliationFee: fees.affiliation || 0
              }));
          }
      } else {
          setStaticFee(null);
      }
  }, [formData.board, formData.program, editMode, feeStructures]);

  const monthlyFee = formData.tuitionFee ? Math.round(formData.tuitionFee / 6) : 0;
  
  useEffect(() => {
     if (view === "form") {
        const adm = Number(formData.admissionFee) || 0;
        const tuit = Number(formData.tuitionFee) || 0;
        const misc = Number(formData.miscCharges) || 0;
        const aff = Number(formData.affiliationFee) || 0;
        
        let calculatedTotal = 0;

        if (formData.board === "KPK Medical Faculty" || formData.board === "Pharmacy Council") {
            calculatedTotal = adm + (tuit * 4) + misc + aff;
        } 
        else if (formData.board === "PNC" || formData.board === "KMU") {
            const isBSOrDPT = formData.program.startsWith("BS") || formData.program === "DPT";
            if (isBSOrDPT) {
                // 10% annual increase logic for BS/DPT
                const y1 = tuit * 2;
                const y2 = (tuit * 1.1) * 2;
                const y3 = (tuit * 1.21) * 2;
                const y4 = (tuit * 1.331) * 2;
                calculatedTotal = y1 + y2 + y3 + y4 + misc + aff + adm;
            } else {
                // 2 year diplomas
                calculatedTotal = adm + (tuit * 4) + misc + aff;
            }
        } else {
            let duration = 8;
            if(formData.program === "CNA" || formData.program === "LHV" || formData.program.includes("Diploma")) duration = 4;
            calculatedTotal = adm + (tuit * duration) + misc + aff;
        }
        
        calculatedTotal = Math.round(calculatedTotal);
        if(formData.totalCourseFee !== calculatedTotal) {
            setFormData(prev => ({...prev, totalCourseFee: calculatedTotal}));
        }
     }
  }, [formData.admissionFee, formData.tuitionFee, formData.miscCharges, formData.affiliationFee, formData.program, formData.board]);

  const staticTotal = staticFee ? staticFee.total : 0;
  const totalConcession = staticTotal > 0 ? Math.max(0, staticTotal - formData.totalCourseFee) : 0;

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

  const handleAddressChange = (val: string) => {
      setFormData({...formData, address: val});
      setErrors({...errors, address: !val});

      if(val.length > 2) {
          const term = val.toLowerCase();
          let correction = null;
          Object.keys(COMMON_TYPOS).forEach(typo => {
              if (term.includes(typo)) {
                  correction = val.toLowerCase().replace(typo, COMMON_TYPOS[typo]);
                  correction = correction.replace(/\b\w/g, l => l.toUpperCase());
              }
          });

          const suggestions = EXPANDED_LOCATIONS.filter(loc => {
              const lowerLoc = loc.toLowerCase();
              if(lowerLoc.includes(term)) return true;
              let matchCount = 0;
              let lastIndex = -1;
              for(const char of term) {
                  const idx = lowerLoc.indexOf(char, lastIndex + 1);
                  if(idx > -1) {
                      matchCount++;
                      lastIndex = idx;
                  }
              }
              return (matchCount / Math.max(term.length, lowerLoc.length)) > 0.5; 
          }).sort();

          const finalSuggestions = correction && !suggestions.includes(correction) ? [correction, ...suggestions] : suggestions;
          setAddressSuggestions(finalSuggestions.slice(0, 5));
          setShowSuggestions(true);
      } else {
          setShowSuggestions(false);
      }
  };

  const selectAddress = (addr: string) => {
      setFormData({...formData, address: addr});
      setShowSuggestions(false);
      setErrors({...errors, address: false});
  };

  const validateForm = () => {
      const newErrors: any = {};
      const requiredFields = ['admissionNo', 'name', 'fatherName', 'program', 'semester', 'campus', 'board', 'phone', 'smsNumber', 'cnic', 'district', 'address', 'dob', 'gender', 'nationality', 'status'];
      let isValid = true;
      requiredFields.forEach(field => {
          if(!(formData as any)[field]) {
              newErrors[field] = true;
              isValid = false;
          }
      });
      setErrors(newErrors);
      return isValid;
  };

  const handleSave = () => {
      if(!validateForm()) return alert("Please fill all required fields highlighted in red.");
      if(editMode) onUpdateStudent(formData);
      else onAddStudent(formData);
      setView("list");
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = (s: Student) => {
    setFormData(s);
    setEditMode(true);
    setView("form");
    setErrors({});
  };

  const handleDelete = () => {
     if(window.confirm(`Are you sure you want to delete ${formData.name}?`)) {
        onDeleteStudent(formData.admissionNo);
        setView("list");
     }
  };

  const filteredStudents = students.filter((s: Student) => {
     const matchName = !searchName || s.name.toLowerCase().includes(searchName.toLowerCase());
     const matchFather = !searchFather || s.fatherName.toLowerCase().includes(searchFather.toLowerCase());
     const matchAdm = !searchAdm || s.admissionNo.toLowerCase().includes(searchAdm.toLowerCase());
     return matchName && matchFather && matchAdm;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

  const hoverCardStyle = {
    flex: 1, padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', cursor: 'pointer',
    backgroundColor: 'white', transition: 'all 0.3s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
  };

  const getInputStyle = (field: string) => ({
      ...styles.input,
      borderColor: errors[field] ? '#ef4444' : '#cbd5e1',
      backgroundColor: errors[field] ? '#fef2f2' : 'white'
  });

  const BiodataPrintPreview = () => (
      <div style={styles.modalOverlay}>
          <div style={{...styles.modalContent, width: '210mm', backgroundColor: 'white', padding: '0'}}>
              <div className="no-print" style={{padding: '15px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px'}}>
                  <button style={styles.button("primary")} onClick={() => window.print()}>Print Form</button>
                  <button style={styles.button("secondary")} onClick={() => setShowPrintPreview(false)}>Close</button>
              </div>
              <div id="printable-area" style={{padding: '40px', boxSizing: 'border-box'}}>
                  <div style={{textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid #0f172a', paddingBottom: '15px'}}>
                      <h1 style={{margin: '0', textTransform: 'uppercase', fontSize: '1.8rem', color: '#0f172a'}}>Ghazali Institute of Medical Sciences</h1>
                      <h3 style={{margin: '10px 0 0', fontWeight: 600, textTransform: 'uppercase', padding: '5px 15px', border: '1px solid #0f172a', display: 'inline-block'}}>Student Admission Form</h3>
                  </div>
                  <div style={{display: 'flex', gap: '30px', marginBottom: '30px'}}>
                      <div style={{width: '150px', height: '180px', border: '1px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                          {formData.photo ? <img src={formData.photo} style={{maxWidth: '100%', maxHeight: '100%'}} /> : "Student Photo"}
                      </div>
                      <div style={{flex: 1}}>
                          <table style={{width: '100%', borderCollapse: 'collapse'}}>
                              <tbody>
                                  <tr><td style={{padding: '8px', borderBottom: '1px solid #eee', fontWeight: 'bold'}}>Admission No:</td><td style={{padding: '8px', borderBottom: '1px solid #eee', fontWeight: 'bold', fontSize: '1.1rem'}}>{formData.admissionNo}</td></tr>
                                  <tr><td style={{padding: '8px', borderBottom: '1px solid #eee', fontWeight: 'bold'}}>Student Name:</td><td style={{padding: '8px', borderBottom: '1px solid #eee', textTransform: 'uppercase'}}>{formData.name}</td></tr>
                                  <tr><td style={{padding: '8px', borderBottom: '1px solid #eee', fontWeight: 'bold'}}>Father Name:</td><td style={{padding: '8px', borderBottom: '1px solid #eee', textTransform: 'uppercase'}}>{formData.fatherName}</td></tr>
                                  <tr><td style={{padding: '8px', borderBottom: '1px solid #eee', fontWeight: 'bold'}}>CNIC:</td><td style={{padding: '8px', borderBottom: '1px solid #eee'}}>{formData.cnic}</td></tr>
                                  <tr><td style={{padding: '8px', borderBottom: '1px solid #eee', fontWeight: 'bold'}}>Date of Birth:</td><td style={{padding: '8px', borderBottom: '1px solid #eee'}}>{formData.dob}</td></tr>
                              </tbody>
                          </table>
                      </div>
                  </div>
                  <h4 style={{background: '#eee', padding: '8px', borderLeft: '4px solid #000', textTransform: 'uppercase'}}>Academic & Contact Details</h4>
                  <table style={{width: '100%', borderCollapse: 'collapse', marginBottom: '30px'}}>
                      <tbody>
                          <tr><td style={{padding: '8px', width: '20%', fontWeight: 'bold'}}>Program:</td><td style={{padding: '8px', width: '30%', borderBottom: '1px solid #eee'}}>{formData.program}</td><td style={{padding: '8px', width: '20%', fontWeight: 'bold'}}>Semester:</td><td style={{padding: '8px', width: '30%', borderBottom: '1px solid #eee'}}>{formData.semester}</td></tr>
                          <tr><td style={{padding: '8px', fontWeight: 'bold'}}>Board:</td><td style={{padding: '8px', borderBottom: '1px solid #eee'}}>{formData.board}</td><td style={{padding: '8px', fontWeight: 'bold'}}>Campus:</td><td style={{padding: '8px', borderBottom: '1px solid #eee'}}>{formData.campus}</td></tr>
                          <tr><td style={{padding: '8px', fontWeight: 'bold'}}>Phone:</td><td style={{padding: '8px', borderBottom: '1px solid #eee'}}>{formData.phone}</td><td style={{padding: '8px', fontWeight: 'bold'}}>District:</td><td style={{padding: '8px', borderBottom: '1px solid #eee'}}>{formData.district}</td></tr>
                          <tr><td style={{padding: '8px', fontWeight: 'bold'}}>Address:</td><td colSpan={3} style={{padding: '8px', borderBottom: '1px solid #eee'}}>{formData.address}</td></tr>
                      </tbody>
                  </table>
                  <h4 style={{background: '#eee', padding: '8px', borderLeft: '4px solid #000', textTransform: 'uppercase'}}>Fee Structure</h4>
                  <table style={{width: '100%', borderCollapse: 'collapse', marginBottom: '30px'}}>
                      <tbody>
                          <tr><td style={{padding: '8px', width: '20%', fontWeight: 'bold'}}>Admission Fee:</td><td style={{padding: '8px', width: '30%', borderBottom: '1px solid #eee'}}>{formData.admissionFee.toLocaleString()}</td><td style={{padding: '8px', width: '20%', fontWeight: 'bold'}}>Semester Fee:</td><td style={{padding: '8px', width: '30%', borderBottom: '1px solid #eee'}}>{formData.tuitionFee.toLocaleString()}</td></tr>
                          <tr><td style={{padding: '8px', fontWeight: 'bold'}}>Misc Charges:</td><td style={{padding: '8px', borderBottom: '1px solid #eee'}}>{formData.miscCharges.toLocaleString()}</td><td style={{padding: '8px', fontWeight: 'bold'}}>Affiliation Fee:</td><td style={{padding: '8px', borderBottom: '1px solid #eee'}}>{formData.affiliationFee.toLocaleString()}</td></tr>
                          <tr><td style={{padding: '8px', fontWeight: 'bold'}}>Total Course Fee:</td><td style={{padding: '8px', fontWeight: 'bold', fontSize: '1.1rem'}}>{formData.totalCourseFee.toLocaleString()}</td><td style={{padding: '8px', fontWeight: 'bold'}}>Status:</td><td style={{padding: '8px'}}>{formData.status}</td></tr>
                      </tbody>
                  </table>
                  <div style={{marginTop: '60px', display: 'flex', justifyContent: 'space-between'}}>
                      <div style={{textAlign: 'center', width: '200px'}}><div style={{borderBottom: '1px solid #000', marginBottom: '5px', height: '1px'}}></div><div>Student Signature</div></div>
                      <div style={{textAlign: 'center', width: '200px'}}><div style={{borderBottom: '1px solid #000', marginBottom: '5px', height: '1px'}}></div><div>Principal Signature</div></div>
                  </div>
              </div>
          </div>
      </div>
  );

  return (
    <div>
      {showPrintPreview && <BiodataPrintPreview />}
      <h2 style={{marginBottom: '5px'}}>Student Biodata</h2>
      <p style={{color: '#64748b', marginBottom: '24px'}}>Manage student registrations and details</p>
      
      {view === "list" ? (
        <>
            <div style={{display: 'flex', gap: '20px', marginBottom: '25px'}}>
               <div style={{...hoverCardStyle, borderBottom: '4px solid #3b82f6'}}>
                   <div><div style={{fontSize: '0.9rem', color: '#64748b', fontWeight: 600}}>Total Students</div><div style={{fontSize: '2rem', fontWeight: 800, color: '#1e3a8a'}}>{students.length}</div></div>
                   <div style={{padding: '10px', background: '#eff6ff', borderRadius: '50%', color: '#3b82f6'}}><span className="material-symbols-outlined">group</span></div>
               </div>
               <div style={{...hoverCardStyle, borderBottom: '4px solid #10b981'}}>
                   <div><div style={{fontSize: '0.9rem', color: '#000', fontWeight: 600}}>Active Students</div><div style={{fontSize: '2rem', fontWeight: 800, color: '#065f46'}}>{students.filter((s:any) => s.status !== "Left Student").length}</div></div>
                   <div style={{padding: '10px', background: '#ecfdf5', borderRadius: '50%', color: '#10b981'}}><span className="material-symbols-outlined">how_to_reg</span></div>
               </div>
               <div style={{...hoverCardStyle, borderBottom: '4px solid #f59e0b'}}>
                   <div><div style={{fontSize: '0.9rem', color: '#64748b', fontWeight: 600}}>Free Students</div><div style={{fontSize: '2rem', fontWeight: 800, color: '#78350f'}}>{students.filter((s:any) => s.status === "Free").length}</div></div>
                   <div style={{padding: '10px', background: '#fffbeb', borderRadius: '50%', color: '#f59e0b'}}><span className="material-symbols-outlined">money_off</span></div>
               </div>
               <div style={{...hoverCardStyle, borderBottom: '4px solid #8b5cf6'}}>
                   <div><div style={{fontSize: '0.9rem', color: '#64748b', fontWeight: 600}}>Paid Students</div><div style={{fontSize: '2rem', fontWeight: 800, color: '#5b21b6'}}>{students.filter((s:any) => s.status === "Paid").length}</div></div>
                   <div style={{padding: '10px', background: '#f5f3ff', borderRadius: '50%', color: '#8b5cf6'}}><span className="material-symbols-outlined">paid</span></div>
               </div>
            </div>

            <div style={styles.card}>
                <div style={{display: 'flex', gap: '15px', marginBottom: '20px'}}>
                    <div style={{flex: 1}}><input style={styles.input} placeholder="Search by Name" value={searchName} onChange={e => setSearchName(e.target.value)} /></div>
                    <div style={{flex: 1}}><input style={styles.input} placeholder="Search by Father Name" value={searchFather} onChange={e => setSearchFather(e.target.value)} /></div>
                    <div style={{flex: 1}}><input style={styles.input} placeholder="Search by Adm No" value={searchAdm} onChange={e => setSearchAdm(e.target.value)} /></div>
                    <button style={styles.button("primary")} onClick={() => { 
                        setFormData({ admissionNo: "", name: "", fatherName: "", program: "", semester: "1st", campus: "Main Campus", balance: 0, address: "", district: "Peshawar", phone: "", smsNumber: "", cnic: "", board: "", remarks: "", photo: "", admissionFee: 0, tuitionFee: 0, miscCharges: 0, affiliationFee: 0, totalCourseFee: 0, dob: "", gender: "Male", nationality: "Pakistani", status: "Paid", admissionDate: new Date().toISOString().slice(0, 10), recordedBy: currentUser || "Admin" });
                        setEditMode(false); setErrors({}); setView("form"); 
                    }}>+ Add New Student</button>
                </div>
                
                <table style={styles.table}>
                    <thead>
                        <tr><th style={styles.th}>Adm No</th><th style={styles.th}>Name</th><th style={styles.th}>Father Name</th><th style={styles.th}>Program</th><th style={styles.th}>Sem</th><th style={styles.th}>Phone</th><th style={styles.th}>Recorded By</th><th style={styles.th}>Action</th></tr>
                    </thead>
                    <tbody>
                        {currentItems.map((s: Student) => (
                            <tr key={s.admissionNo}>
                            <td style={styles.td}>{s.admissionNo}</td>
                            <td style={styles.td}><div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>{s.photo && <img src={s.photo} style={{width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover'}} />}{s.name}</div></td>
                            <td style={styles.td}>{s.fatherName}</td>
                            <td style={styles.td}>{s.program}</td>
                            <td style={styles.td}>{s.semester}</td>
                            <td style={styles.td}>{s.phone}</td>
                            <td style={styles.td}><span style={{fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic'}}>{s.recordedBy || '-'}</span></td>
                            <td style={styles.td}><button onClick={() => handleEdit(s)} style={{border: 'none', background: '#dbeafe', color: '#1e40af', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem'}}>View/Edit</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                
                <div style={{marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <div style={{fontSize: '0.9rem', color: '#64748b'}}>Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredStudents.length)} of {filteredStudents.length}</div>
                    <div style={{display: 'flex', gap: '5px'}}>
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} style={{padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', background: currentPage === 1 ? '#f1f5f9' : 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer'}}>Prev</button>
                        <div style={{padding: '8px 12px', background: '#e2e8f0', borderRadius: '6px'}}>{currentPage} / {totalPages}</div>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={{padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', background: currentPage === totalPages ? '#f1f5f9' : 'white', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'}}>Next</button>
                    </div>
                </div>
            </div>
        </>
      ) : (
        <div style={styles.card} id="printable-area">
           <div className="no-print" style={{display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '15px'}}>
              <h3 style={{margin: 0}}>{editMode ? "Edit Student" : "New Student Registration"}</h3>
              <button onClick={() => setView("list")} style={{background: 'transparent', border: 'none', cursor: 'pointer'}}>Close</button>
           </div>

           <div style={{display: 'flex', gap: '20px', marginBottom: '20px'}}>
              <div style={{width: '150px', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                 <div style={{width: '120px', height: '120px', background: '#f1f5f9', borderRadius: '50%', marginBottom: '10px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                    {formData.photo ? <img src={formData.photo} style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : <span className="material-symbols-outlined" style={{fontSize: '48px', color: '#cbd5e1'}}>person</span>}
                 </div>
                 <input className="no-print" type="file" accept="image/*" onChange={handlePhotoUpload} style={{fontSize: '0.8rem', width: '100%'}} />
              </div>
              
              <div style={{flex: 1}}>
                 <div style={{...styles.grid3, marginBottom: '20px'}}>
                    <div><label style={styles.label}>Admission No *</label><input style={getInputStyle('admissionNo')} value={formData.admissionNo} onChange={e => {setFormData({...formData, admissionNo: e.target.value}); setErrors({...errors, admissionNo: false});}} disabled={editMode} /></div>
                    <div><label style={styles.label}>Student Name *</label><input style={getInputStyle('name')} value={formData.name} onChange={e => {setFormData({...formData, name: e.target.value}); setErrors({...errors, name: false});}} /></div>
                    <div><label style={styles.label}>Father Name *</label><input style={getInputStyle('fatherName')} value={formData.fatherName} onChange={e => {setFormData({...formData, fatherName: e.target.value}); setErrors({...errors, fatherName: false});}} /></div>
                    
                    <div>
                        <label style={styles.label}>Board *</label>
                        <select style={getInputStyle('board')} value={formData.board} onChange={e => {setFormData({...formData, board: e.target.value, program: "", semester: ""}); setErrors({...errors, board: false});}}>
                           <option value="">Select Board</option>
                           {masterData.boards.map((b: string) => <option key={b}>{b}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={styles.label}>Program *</label>
                        <select style={getInputStyle('program')} value={formData.program} onChange={e => {setFormData({...formData, program: e.target.value}); setErrors({...errors, program: false});}}>
                           <option value="">Select Program</option>
                           {availablePrograms.map((p: string) => <option key={p}>{p}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={styles.label}>Semester/Year *</label>
                        <select style={getInputStyle('semester')} value={formData.semester} onChange={e => {setFormData({...formData, semester: e.target.value}); setErrors({...errors, semester: false});}}>
                             <option value="">Select</option>
                             {availableSemesters.map((s: string) => <option key={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={styles.label}>Campus *</label>
                        <select style={getInputStyle('campus')} value={formData.campus} onChange={e => {setFormData({...formData, campus: e.target.value}); setErrors({...errors, campus: false});}}>
                             {availableCampuses.map((c: Campus) => <option key={c.name} value={c.name}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={styles.label}>Phone No *</label>
                        <input style={getInputStyle('phone')} value={formData.phone} onChange={e => {setFormData({...formData, phone: formatPhone(e.target.value)}); setErrors({...errors, phone: false});}} placeholder="03XX-XXXXXXX" />
                    </div>
                    <div>
                        <label style={styles.label}>SMS Number *</label>
                        <input style={getInputStyle('smsNumber')} value={formData.smsNumber} onChange={e => {setFormData({...formData, smsNumber: formatPhone(e.target.value)}); setErrors({...errors, smsNumber: false});}} placeholder="923XXXXXXXXX" />
                    </div>
                    <div>
                        <label style={styles.label}>CNIC *</label>
                        <input style={getInputStyle('cnic')} value={formData.cnic || ''} onChange={e => {setFormData({...formData, cnic: formatCNIC(e.target.value)}); setErrors({...errors, cnic: false});}} placeholder="12345-1234567-1" />
                    </div>
                    <div>
                        <label style={styles.label}>District *</label>
                        <select style={getInputStyle('district')} value={formData.district || ""} onChange={e => {setFormData({...formData, district: e.target.value}); setErrors({...errors, district: false});}}>
                           <option value="">Select District</option>
                           {KPK_DISTRICTS.map((d) => <option key={d}>{d}</option>)}
                        </select>
                    </div>
                    <div style={{position: 'relative'}}>
                        <label style={styles.label}>Address *</label>
                        <input style={getInputStyle('address')} value={formData.address} onChange={e => handleAddressChange(e.target.value)} placeholder="Type address..." onFocus={() => { if(formData.address) handleAddressChange(formData.address) }} />
                        {showSuggestions && addressSuggestions.length > 0 && (
                            <ul style={{position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, background: 'white', border: '1px solid #cbd5e1', borderRadius: '6px', listStyle: 'none', padding: 0, margin: 0, boxShadow: '0 4px 6px rgba(0,0,0,0.1)', maxHeight: '200px', overflowY: 'auto'}}>
                                {addressSuggestions.map((addr, idx) => (<li key={addr} onClick={() => selectAddress(addr)} style={{padding: '8px 12px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', fontSize: '0.85rem', color: '#0f172a'}}>{addr}</li>))}
                            </ul>
                        )}
                    </div>
                    <div><label style={styles.label}>Date of Birth *</label><input type="date" style={getInputStyle('dob')} value={formData.dob} onChange={e => {setFormData({...formData, dob: e.target.value}); setErrors({...errors, dob: false});}} /></div>
                    <div>
                        <label style={styles.label}>Gender *</label>
                        <select style={getInputStyle('gender')} value={formData.gender} onChange={e => {setFormData({...formData, gender: e.target.value}); setErrors({...errors, gender: false});}}><option>Male</option><option>Female</option></select>
                    </div>
                    <div>
                        <label style={styles.label}>Nationality *</label>
                        <select style={getInputStyle('nationality')} value={formData.nationality} onChange={e => {setFormData({...formData, nationality: e.target.value}); setErrors({...errors, nationality: false});}}><option>Pakistani</option><option>Afghan</option><option>Other</option></select>
                    </div>
                    <div>
                        <label style={styles.label}>Status *</label>
                        <select style={getInputStyle('status')} value={formData.status} onChange={e => {setFormData({...formData, status: e.target.value}); setErrors({...errors, status: false});}}><option>Free</option><option>Paid</option><option>Course Completed</option><option>Left Student</option></select>
                    </div>
                    <div><label style={styles.label}>Admission Date</label><input type="date" style={{...styles.input, backgroundColor: '#f1f5f9'}} value={formData.admissionDate} readOnly /></div>
                    <div><label style={styles.label}>Recorded By</label><input style={{...styles.input, backgroundColor: '#f1f5f9'}} value={formData.recordedBy} readOnly /></div>
                 </div>
              </div>
           </div>
           
           <h4 style={{color: '#334155', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '15px'}}>Fee Structure & Calculations</h4>
           <div style={{display: 'flex', gap: '20px'}}>
               <div style={{flex: 1, backgroundColor: '#f0f9ff', padding: '15px', borderRadius: '8px', border: '1px solid #bae6fd'}}>
                   <h5 style={{margin: '0 0 10px 0', color: '#0369a1'}}>Static Fee (Standard)</h5>
                   {staticFee ? (<div style={{fontSize: '0.85rem'}}><div style={{marginBottom: '5px'}}>Admission: <strong>{staticFee.admission.toLocaleString()}</strong></div><div style={{marginBottom: '5px'}}>Semester: <strong>{staticFee.tuition.toLocaleString()}</strong></div>{staticFee.misc > 0 && <div style={{marginBottom: '5px'}}>Misc: <strong>{staticFee.misc.toLocaleString()}</strong></div>}{staticFee.affiliation > 0 && <div>Affiliation: <strong>{staticFee.affiliation.toLocaleString()}</strong></div>}<div style={{marginTop: '10px', fontWeight: 700}}>Total Course Fee: Rs {staticTotal.toLocaleString()}</div></div>) : (<div style={{color: '#64748b', fontSize: '0.85rem'}}>No static fee defined for this program</div>)}
               </div>
               <div style={{flex: 1, backgroundColor: '#f0fdf4', padding: '15px', borderRadius: '8px', border: '1px solid #bbf7d0'}}>
                   <h5 style={{margin: '0 0 10px 0', color: '#000'}}>Total Concession</h5>
                   <div style={{fontSize: '1.5rem', fontWeight: 700, color: '#000'}}>Rs {totalConcession.toLocaleString()}</div>
                   <div style={{fontSize: '0.75rem', color: '#64748b', marginTop: '5px'}}>(Static Total - Calculated Total)</div>
               </div>
           </div>

           <div style={{...styles.grid3, marginTop: '20px', marginBottom: '20px'}}>
              <div><label style={styles.label}>Admission Fee</label><input type="number" style={styles.input} value={formData.admissionFee} onChange={e => setFormData({...formData, admissionFee: Number(e.target.value)})} /></div>
              <div><label style={styles.label}>Semester Fee</label><input type="number" style={styles.input} value={formData.tuitionFee} onChange={e => setFormData({...formData, tuitionFee: Number(e.target.value)})} /></div>
              <div><label style={styles.label}>Monthly Fee (Auto)</label><input type="text" style={{...styles.input, backgroundColor: '#f1f5f9'}} value={monthlyFee.toLocaleString()} readOnly /></div>
              <div><label style={styles.label}>Misc Charges</label><input type="number" style={styles.input} value={formData.miscCharges} onChange={e => setFormData({...formData, miscCharges: Number(e.target.value)})} /></div>
              <div><label style={styles.label}>Affiliation Fee</label><input type="number" style={styles.input} value={formData.affiliationFee} onChange={e => setFormData({...formData, affiliationFee: Number(e.target.value)})} /></div>
              <div><label style={styles.label}>Total Course Fee (Auto-Calc)</label><input type="number" style={{...styles.input, fontWeight: 700, color: '#0f172a'}} value={formData.totalCourseFee} readOnly /></div>
           </div>

           <div style={{marginBottom: '20px'}}><label style={styles.label}>Remarks</label><textarea style={styles.input} value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} /></div>

           <div className="no-print" style={{display: 'flex', gap: '10px'}}>
              {editMode ? (<><button style={styles.button("primary")} onClick={handleSave}>Update Student</button><button style={styles.button("secondary")} onClick={() => setShowPrintPreview(true)}>Print Biodata</button><button style={styles.button("danger")} onClick={handleDelete}>Delete</button></>) : (<button style={styles.button("primary")} onClick={handleSave}>Save Record</button>)}
           </div>
        </div>
      )}
    </div>
  );
};
