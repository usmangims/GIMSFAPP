import React, { useState, useEffect } from "react";
import { styles } from "./styles";

export const ChartOfAccounts = ({ accounts, onAddAccount }: any) => {
   const [newAcc, setNewAcc] = useState<any>({ name: "", level: 3, parentCode: "", category: "Asset", openingBalance: 0 });
   
   const groups = accounts.filter((a: any) => a.level === 1);
   const controls = accounts.filter((a: any) => a.level === 2);
   
   const getParentOptions = () => {
      if(newAcc.level === 1) return [];
      if(newAcc.level === 2) return groups.map((a:any) => ({ value: a.code, label: `${a.code} - ${a.name}` }));
      return controls.map((a:any) => ({ value: a.code, label: `${a.code} - ${a.name}` }));
   };

   useEffect(() => {
      if(newAcc.parentCode) {
         const siblings = accounts.filter((a:any) => a.parentCode === newAcc.parentCode);
         const lastCode = siblings.length > 0 ? siblings[siblings.length-1].code : `${newAcc.parentCode}-000`;
         const parts = lastCode.split("-");
         const lastNum = parseInt(parts[parts.length-1]);
         const nextNum = (lastNum + 1).toString().padStart(3, '0');
         parts[parts.length-1] = nextNum;
         setNewAcc((prev:any) => ({ ...prev, code: parts.join("-") }));
      }
   }, [newAcc.parentCode, accounts]);

   const handleAdd = () => {
      if(!newAcc.name || !newAcc.code) return;
      onAddAccount(newAcc);
      setNewAcc({ name: "", level: 3, parentCode: "", category: "Asset", openingBalance: 0, code: "" });
   };

   const renderTree = (parentId: string | null = null, padding = 0) => {
      return accounts.filter((a: any) => a.parentCode === parentId).map((acc: any) => (
         <React.Fragment key={acc.code}>
            <div style={{padding: '10px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', paddingLeft: `${padding + 10}px`, background: acc.level === 1 ? '#f8fafc' : 'white'}}>
               <span style={{fontWeight: 600, width: '100px', fontSize: '0.85rem', color: '#64748b'}}>{acc.code}</span>
               <span style={{flex: 1, fontWeight: acc.level < 3 ? 600 : 400}}>{acc.name}</span>
               <span style={styles.badge(acc.category)}>{acc.category}</span>
            </div>
            {renderTree(acc.code, padding + 20)}
         </React.Fragment>
      ));
   };

   return (
      <div style={{display: 'flex', gap: '20px'}}>
         <div style={{flex: 1, ...styles.card}}>
            <h3 style={{marginBottom: '20px'}}>Add Account Head</h3>
            <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
               <div>
                  <label style={styles.label}>Level</label>
                  <select style={styles.input} value={newAcc.level} onChange={e => setNewAcc({...newAcc, level: Number(e.target.value)})}>
                     <option value={1}>Level 1 (Group)</option>
                     <option value={2}>Level 2 (Control)</option>
                     <option value={3}>Level 3 (Ledger)</option>
                  </select>
               </div>
               
               {newAcc.level > 1 && (
                  <div>
                     <label style={styles.label}>Parent Account</label>
                     <select style={styles.input} value={newAcc.parentCode} onChange={e => setNewAcc({...newAcc, parentCode: e.target.value})}>
                        <option value="">Select Parent</option>
                        {getParentOptions().map((o:any) => <option key={o.value} value={o.value}>{o.label}</option>)}
                     </select>
                  </div>
               )}

               <div>
                  <label style={styles.label}>Account Code (Auto)</label>
                  <input style={{...styles.input, background: '#f1f5f9'}} value={newAcc.code || ''} readOnly />
               </div>

               <div>
                  <label style={styles.label}>Account Name</label>
                  <input style={styles.input} value={newAcc.name} onChange={e => setNewAcc({...newAcc, name: e.target.value})} />
               </div>

               <div>
                  <label style={styles.label}>Category</label>
                  <select style={styles.input} value={newAcc.category} onChange={e => setNewAcc({...newAcc, category: e.target.value})}>
                     {["Asset", "Liability", "Equity", "Income", "Expense"].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
               </div>
               
               {newAcc.level === 3 && (
                  <div>
                     <label style={styles.label}>Opening Balance</label>
                     <input type="number" style={styles.input} value={newAcc.openingBalance} onChange={e => setNewAcc({...newAcc, openingBalance: Number(e.target.value)})} />
                  </div>
               )}

               <button style={styles.button("primary")} onClick={handleAdd}>+ Add Head</button>
            </div>
         </div>
         
         <div style={{flex: 2, ...styles.card, padding: 0, overflow: 'hidden'}}>
            <div style={{padding: '15px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: 600}}>Chart of Accounts Tree</div>
            <div style={{maxHeight: '600px', overflowY: 'auto'}}>
               {renderTree(null)}
            </div>
         </div>
      </div>
   );
};