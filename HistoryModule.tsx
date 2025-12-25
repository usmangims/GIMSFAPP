
import React from "react";
import { styles } from "./styles";

export const HistoryModule = ({ logs }: any) => {
   const deleteCount = logs.filter((l: any) => l.action === "Delete").length;
   const editCount = logs.filter((l: any) => l.action === "Edit").length;

   return (
      <div>
         <h2 style={{marginBottom: '5px'}}>History (Audit Log)</h2>
         <p style={{color: '#64748b', marginBottom: '30px'}}>Track deletions and edits</p>
         
         <div style={{display: 'flex', gap: '20px', marginBottom: '30px'}}>
             <div style={{...styles.card, flex: 1, display: 'flex', alignItems: 'center', gap: '20px', marginBottom: 0, padding: '25px', backgroundColor: '#fef2f2', border: '1px solid #fee2e2'}}>
                 <div style={{padding: '12px', background: 'white', borderRadius: '50%', color: '#b91c1c'}}><span className="material-symbols-outlined">delete_forever</span></div>
                 <div>
                     <div style={{fontSize: '0.9rem', color: '#7f1d1d', fontWeight: 600}}>Total Deleted</div>
                     <div style={{fontSize: '2rem', fontWeight: 700, color: '#b91c1c'}}>{deleteCount}</div>
                 </div>
             </div>
             <div style={{...styles.card, flex: 1, display: 'flex', alignItems: 'center', gap: '20px', marginBottom: 0, padding: '25px', backgroundColor: '#eff6ff', border: '1px solid #dbeafe'}}>
                 <div style={{padding: '12px', background: 'white', borderRadius: '50%', color: '#1d4ed8'}}><span className="material-symbols-outlined">edit_note</span></div>
                 <div>
                     <div style={{fontSize: '0.9rem', color: '#1e3a8a', fontWeight: 600}}>Total Edited</div>
                     <div style={{fontSize: '2rem', fontWeight: 700, color: '#1d4ed8'}}>{editCount}</div>
                 </div>
             </div>
         </div>

         <div style={styles.card}>
            <table style={styles.table}>
               <thead><tr><th style={styles.th}>Ref ID</th><th style={styles.th}>Details</th><th style={styles.th}>Action</th><th style={styles.th}>User</th><th style={styles.th}>Date & Time</th></tr></thead>
               <tbody>
                  {logs.slice().reverse().map((l: any) => (
                     <tr key={l.id}>
                        <td style={styles.td}><span style={{fontFamily: 'monospace', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px'}}>{l.refId}</span></td>
                        <td style={styles.td}>
                            {l.extraInfo ? (
                                <span style={{fontWeight: 600, color: '#334155'}}>{l.extraInfo}</span>
                            ) : <span style={{color: '#94a3b8', fontStyle: 'italic'}}>-</span>}
                        </td>
                        <td style={styles.td}><span style={{...styles.badge(l.action === 'Delete' ? 'Liability' : 'Income'), color: l.action === 'Delete' ? '#b91c1c' : '#1e40af'}}>{l.action}</span></td>
                        <td style={styles.td}>{l.user}</td>
                        <td style={styles.td}>{l.date}</td>
                     </tr>
                  ))}
                  {logs.length === 0 && <tr><td colSpan={5} style={{textAlign: 'center', padding: '40px', color: '#94a3b8'}}>No history records found</td></tr>}
               </tbody>
            </table>
         </div>
      </div>
   );
};
