
import React, { useState } from "react";
import { styles } from "./styles";
import { Transaction, Student, Account } from "./types";
import { SearchableSelect } from "./SearchableSelect";

export const Approvals = ({ transactions, onApprove, onDelete, onUpdate, students, accounts }: any) => {
   const [filterType, setFilterType] = useState<"Pending" | "Rejected" | "DeletePending">("Pending");
   const [editingTxn, setEditingTxn] = useState<Transaction | null>(null);

   const pending = transactions.filter((t: any) => t.status === "Pending");
   const rejected = transactions.filter((t: any) => t.status === "Rejected");
   const deleteRequests = transactions.filter((t: any) => t.status === "DeletePending");

   const level3 = accounts.filter((a: Account) => a.level === 3).map((a: Account) => ({ value: a.code, label: `${a.code} - ${a.name}` }));

   const handleSaveEdit = () => {
      if(editingTxn) {
         onUpdate(editingTxn, editingTxn);
         setEditingTxn(null);
      }
   }

   const displayed = filterType === "Pending" ? pending : filterType === "Rejected" ? rejected : deleteRequests;

   const Box = ({ label, count, color, bg, active, onClick, icon }: any) => (
      <div 
         onClick={onClick}
         style={{
            flex: 1, padding: '24px', borderRadius: '16px', cursor: 'pointer',
            backgroundColor: active ? bg : 'white', 
            border: `2px solid ${active ? color : '#f1f5f9'}`,
            boxShadow: active ? `0 10px 15px -3px ${color}20` : '0 4px 6px -1px rgba(0,0,0,0.05)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
            display: 'flex', alignItems: 'center', gap: '20px',
            transform: active ? 'translateY(-2px)' : 'none'
         }}
      >
         <div style={{
            padding: '14px', background: active ? 'white' : '#f8fafc', 
            borderRadius: '14px', color: color, 
            boxShadow: active ? '0 4px 6px rgba(0,0,0,0.05)' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
         }}>
            <span className="material-symbols-outlined" style={{fontSize: '32px'}}>{icon}</span>
         </div>
         <div>
            <div style={{fontSize: '0.8rem', color: '#64748b', fontWeight: 700, marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px'}}>{label}</div>
            <div style={{fontSize: '2.2rem', fontWeight: 900, color: '#0f172a', lineHeight: 1}}>{count}</div>
         </div>
      </div>
   );

   return (
      <div>
         <h2 style={{marginBottom: '5px', fontWeight: 800}}>Approvals Center</h2>
         <p style={{color: '#64748b', marginBottom: '30px', fontSize: '1rem'}}>Manage and authorize pending financial entries</p>

         <div style={{display: 'flex', gap: '25px', marginBottom: '40px'}}>
             <Box label="Awaiting Approval" count={pending.length} color="#4f46e5" bg="#e0e7ff" active={filterType === "Pending"} onClick={() => setFilterType("Pending")} icon="pending_actions" />
             <Box label="Rejected Items" count={rejected.length} color="#ef4444" bg="#fee2e2" active={filterType === "Rejected"} onClick={() => setFilterType("Rejected")} icon="cancel" />
             <Box label="Delete Requests" count={deleteRequests.length} color="#1e293b" bg="#f1f5f9" active={filterType === "DeletePending"} onClick={() => setFilterType("DeletePending")} icon="delete_sweep" />
         </div>

         {editingTxn && (
            <div style={styles.modalOverlay}>
               <div style={{...styles.modalContent, width: '550px', borderRadius: '20px'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                     <h3 style={{margin: 0}}>Refine Transaction</h3>
                     <button style={{border: 'none', background: 'transparent', cursor: 'pointer'}} onClick={() => setEditingTxn(null)}><span className="material-symbols-outlined">close</span></button>
                  </div>
                  <div style={{marginBottom: '15px'}}>
                     <label style={styles.label}>Description / Narration</label>
                     <input style={styles.input} value={editingTxn.description} onChange={e => setEditingTxn({...editingTxn, description: e.target.value})} />
                  </div>
                  <div style={{marginBottom: '15px'}}>
                     <label style={styles.label}>Debit Account (Head)</label>
                     <SearchableSelect options={level3} value={editingTxn.debitAccount} onChange={(val: string) => setEditingTxn({...editingTxn, debitAccount: val})} placeholder="Change Debit Head..." />
                  </div>
                  <div style={{marginBottom: '15px'}}>
                     <label style={styles.label}>Credit Account (Head)</label>
                     <SearchableSelect options={level3} value={editingTxn.creditAccount} onChange={(val: string) => setEditingTxn({...editingTxn, creditAccount: val})} placeholder="Change Credit Head..." />
                  </div>
                  <div style={{marginBottom: '25px'}}>
                     <label style={styles.label}>Amount (Rs)</label>
                     <input type="number" style={{...styles.input, fontSize: '1.1rem', fontWeight: 700}} value={editingTxn.amount} onChange={e => setEditingTxn({...editingTxn, amount: Number(e.target.value)})} />
                  </div>
                  <div style={{display:'flex', gap: '10px', justifyContent: 'flex-end'}}>
                     <button style={styles.button("secondary")} onClick={() => setEditingTxn(null)}>Discard</button>
                     <button style={styles.button("primary")} onClick={handleSaveEdit}>Update & Keep Pending</button>
                  </div>
               </div>
            </div>
         )}

         <div style={{...styles.card, padding: '0', overflow: 'hidden', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)'}}>
            <div style={{padding: '20px 25px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
               <h3 style={{margin: 0, color: '#1e293b', fontSize: '1.1rem'}}>{filterType === 'Pending' ? 'Action Required' : filterType === 'Rejected' ? 'Archived Rejections' : 'Confirmation Needed'}</h3>
               <div style={{fontSize: '0.85rem', color: '#64748b'}}>{displayed.length} Items Listed</div>
            </div>
            
            {displayed.length === 0 ? (
               <div style={{textAlign: 'center', padding: '100px 60px', color: '#94a3b8'}}>
                  <span className="material-symbols-outlined" style={{fontSize: '64px', marginBottom: '15px', opacity: 0.3}}>task_alt</span>
                  <p style={{fontSize: '1.1rem', margin: 0}}>Everything is up to date!</p>
                  <p style={{fontSize: '0.85rem'}}>No transactions found in this category.</p>
               </div>
            ) : (
               <div style={{overflowX: 'auto'}}>
                  <table style={styles.table}>
                     <thead>
                        <tr style={{background: '#fafafa'}}>
                           <th style={{...styles.th, paddingLeft: '25px'}}>Date</th>
                           <th style={styles.th}>Ref / Voucher</th>
                           <th style={styles.th}>Student Name</th>
                           <th style={styles.th}>Father Name</th>
                           <th style={{...styles.th, textAlign: 'right'}}>Amount</th>
                           <th style={styles.th}>Initiated By</th>
                           <th style={{...styles.th, paddingRight: '25px', textAlign: 'center'}}>Actions</th>
                        </tr>
                     </thead>
                     <tbody>
                        {displayed.map((t: any) => {
                           const student = students.find((s:Student) => s.admissionNo === t.studentId);
                           return (
                              <tr key={t.id} style={{borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s'}}>
                                 <td style={{...styles.td, paddingLeft: '25px'}}>
                                    <div style={{fontWeight: 700, color: '#334155'}}>{t.date}</div>
                                 </td>
                                 <td style={styles.td}>
                                    <div style={{fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace', fontWeight: 600}}>{t.voucherNo}</div>
                                    <div style={{fontSize: '0.7rem', color: '#94a3b8'}}>{t.description}</div>
                                 </td>
                                 <td style={styles.td}>
                                    <div style={{fontWeight: 600, color: '#0f172a'}}>{student ? student.name : '-'}</div>
                                    <div style={{fontSize: '0.7rem', color: '#64748b'}}>{t.studentId}</div>
                                 </td>
                                 <td style={styles.td}>
                                    <div style={{color: '#475569'}}>{student ? student.fatherName : '-'}</div>
                                 </td>
                                 <td style={{...styles.td, textAlign: 'right'}}>
                                    <div style={{fontSize: '1.05rem', fontWeight: 800, color: '#166534'}}>Rs {t.amount.toLocaleString()}</div>
                                 </td>
                                 <td style={styles.td}>
                                    <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                       <div style={{width: '24px', height: '24px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700}}>{t.recordedBy?.charAt(0).toUpperCase()}</div>
                                       <span style={{fontWeight: 500, fontSize: '0.85rem'}}>{t.recordedBy}</span>
                                    </div>
                                 </td>
                                 <td style={{...styles.td, paddingRight: '25px', textAlign: 'center'}}>
                                    <div style={{display: 'flex', gap: '8px', justifyContent: 'center'}}>
                                       {t.status === 'DeletePending' ? (
                                          <button style={{...styles.button("danger"), padding: '8px 16px'}} onClick={() => onDelete(t, false)}>
                                             <span className="material-symbols-outlined" style={{fontSize: '18px'}}>delete_forever</span> Confirm Delete
                                          </button>
                                       ) : filterType === 'Rejected' ? (
                                          <button style={{...styles.button("primary"), background: '#4f46e5', padding: '8px 16px'}} onClick={() => onApprove(t.id)}>
                                             <span className="material-symbols-outlined" style={{fontSize: '18px'}}>refresh</span> Restore & Approve
                                          </button>
                                       ) : (
                                          <>
                                             <button style={{...styles.button("primary"), background: '#10b981', padding: '8px 12px'}} onClick={() => onApprove(t.id)} title="Approve">
                                                <span className="material-symbols-outlined" style={{fontSize: '20px'}}>check_circle</span>
                                             </button>
                                             <button style={{...styles.button("secondary"), padding: '8px 12px', background: 'white'}} onClick={() => setEditingTxn(t)} title="Edit">
                                                <span className="material-symbols-outlined" style={{fontSize: '20px', color: '#4f46e5'}}>edit</span>
                                             </button>
                                             <button style={{...styles.button("danger"), padding: '8px 12px', background: '#fee2e2', color: '#b91c1c'}} onClick={() => onDelete(t, false)} title="Reject">
                                                <span className="material-symbols-outlined" style={{fontSize: '20px'}}>cancel</span>
                                             </button>
                                          </>
                                       )}
                                    </div>
                                 </td>
                              </tr>
                           );
                        })}
                     </tbody>
                  </table>
               </div>
            )}
         </div>
      </div>
   );
};
