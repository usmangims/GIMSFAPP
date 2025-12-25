
import React from "react";
import { styles } from "./styles";

export const AccessControl = ({ permissions, onUpdate, roles }: any) => {
   // Mapping internal keys to display names used in Sidebar
   const moduleLabels: Record<string, string> = {
       "dashboard": "Dashboard",
       "students": "Student Biodata",
       "promotion": "Student Promotion",
       "cashbook": "Cash Book",
       "vouchers": "Vouchers",
       "fees": "Fee Collection",
       "ledger": "Student Ledger",
       "bulk": "Fee Generation",
       "reports": "Reports",
       "financial": "Financial Statements",
       "accounts": "Chart of Accounts",
       "approvals": "Approvals",
       "master": "Master Data",
       "access": "Access Control",
       "import": "Data Import",
       "history": "History",
       "hr": "HR Section",
       "budget": "Budgeting",
       "inventory": "Inventory",
       "scanner": "Security Scanner",
       "settings": "Settings"
   };

   const modules = Object.keys(moduleLabels);

   const toggle = (role: string, mod: string) => {
      const newPerms = { ...permissions };
      if(!newPerms[role]) newPerms[role] = {};
      newPerms[role][mod] = !newPerms[role][mod];
      onUpdate(newPerms);
   };

   return (
      <div>
         <h2 style={{marginBottom: '5px'}}>Access Control</h2>
         <p style={{color: '#64748b', marginBottom: '24px'}}>Configure module visibility per role</p>

         <div style={{...styles.card, padding: '30px', overflowX: 'auto', borderRadius: '16px'}}>
            <table style={{...styles.table, borderSpacing: '0 10px', borderCollapse: 'separate'}}>
               <thead>
                  <tr>
                     <th style={{...styles.th, borderBottom: 'none', fontSize: '0.9rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px'}}>Module</th>
                     {roles.map((r:string) => (
                        <th key={r} style={{...styles.th, textAlign: 'center', borderBottom: 'none', fontSize: '0.9rem', color: '#1e293b'}}>
                           <div style={{padding: '8px 16px', background: '#f1f5f9', borderRadius: '8px', display: 'inline-block'}}>{r}</div>
                        </th>
                     ))}
                  </tr>
               </thead>
               <tbody>
                  {modules.map(mod => (
                     <tr key={mod} style={{backgroundColor: 'white'}}>
                        <td style={{padding: '16px', borderBottom: '1px solid #f1f5f9', fontWeight: 600, color: '#475569'}}>
                           {moduleLabels[mod]}
                        </td>
                        {roles.map((role:string) => (
                           <td key={role} style={{padding: '16px', borderBottom: '1px solid #f1f5f9', textAlign: 'center'}}>
                              <div 
                                 onClick={() => toggle(role, mod)}
                                 style={{
                                    width: '44px', height: '24px', borderRadius: '12px', 
                                    backgroundColor: permissions[role]?.[mod] ? '#10b981' : '#e2e8f0',
                                    position: 'relative', cursor: 'pointer', margin: '0 auto',
                                    transition: 'background-color 0.2s'
                                 }}
                              >
                                 <div style={{
                                    width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'white',
                                    position: 'absolute', top: '2px', left: permissions[role]?.[mod] ? '22px' : '2px',
                                    transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                 }} />
                              </div>
                           </td>
                        ))}
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
   );
};
