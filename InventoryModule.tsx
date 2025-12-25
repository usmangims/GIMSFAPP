
import React, { useState } from "react";
import { styles } from "./styles";
import { InventoryItem, InventoryIssuance, Employee, Campus } from "./types";
import { SearchableSelect } from "./SearchableSelect";

export const InventoryModule = ({ inventory, setInventory, issuances, setIssuances, employees, masterData, currentUser, onUpdateMasterData }: { inventory: InventoryItem[], setInventory: any, issuances: InventoryIssuance[], setIssuances: any, employees: Employee[], masterData: any, currentUser: string, onUpdateMasterData: any }) => {
    const [view, setView] = useState<"list" | "issue" | "return" | "reports">("list");
    const [newItem, setNewItem] = useState<InventoryItem>({ id: "", name: "", category: "Furniture", totalQuantity: 0, availableQuantity: 0, condition: "New", location: masterData?.campuses?.[0]?.name || "Main Campus" });
    const [isAddMode, setIsAddMode] = useState(false);

    // Issue State
    const [selectedEmployee, setSelectedEmployee] = useState("");
    const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
    const [cart, setCart] = useState<{itemId: string, name: string, quantity: number, max: number}[]>([]);
    const [receiverPhoto, setReceiverPhoto] = useState<string | null>(null);
    const [showPrint, setShowPrint] = useState(false);
    const [currentIssuance, setCurrentIssuance] = useState<InventoryIssuance | null>(null);
    const [issueSearch, setIssueSearch] = useState("");

    // Report Filters
    const [reportSubTab, setReportSubTab] = useState<"status" | "campus">("status");
    const [filterCampus, setFilterCampus] = useState("All");
    const [filterCategory, setFilterCategory] = useState("All");
    const [filterCondition, setFilterCondition] = useState("All");
    const [reportSearch, setReportSearch] = useState("");

    const employeeOptions = employees.map(e => ({ value: e.id, label: `${e.name} (${e.designation} - ${e.department})` }));

    // Stats
    const totalItems = inventory.reduce((a,b) => a + b.totalQuantity, 0);
    const totalAvailable = inventory.reduce((a,b) => a + b.availableQuantity, 0);
    const totalIssued = totalItems - totalAvailable;
    const lowStock = inventory.filter(i => i.availableQuantity < 5).length;

    const handleAddItem = () => {
        if (!newItem.name || newItem.totalQuantity <= 0) return alert("Valid name and quantity required");
        const id = newItem.id || `INV-${Date.now()}`;
        const today = new Date().toISOString().slice(0, 10);
        
        const item: InventoryItem = { 
            ...newItem, 
            id, 
            availableQuantity: isAddMode ? newItem.totalQuantity : newItem.availableQuantity,
            addedDate: newItem.addedDate || today,
            addedBy: newItem.addedBy || currentUser
        };
        
        if (!isAddMode) {
            const oldItem = inventory.find(i => i.id === id);
            if(oldItem) {
                const diff = item.totalQuantity - oldItem.totalQuantity;
                item.availableQuantity = oldItem.availableQuantity + diff;
            }
        }

        if (isAddMode && !newItem.id) {
            setInventory([...inventory, item]);
        } else {
            setInventory(inventory.map(i => i.id === id ? item : i));
        }
        
        setNewItem({ id: "", name: "", category: masterData.inventoryCategories[0] || "Furniture", totalQuantity: 0, availableQuantity: 0, condition: "New", location: masterData?.campuses?.[0]?.name || "Main Campus", addedDate: today });
        setIsAddMode(false);
    };

    const handleDeleteItem = (id: string) => {
        if(window.confirm("Are you sure you want to delete this item?")) {
            setInventory(inventory.filter(i => i.id !== id));
        }
    };

    const addToCart = (item: InventoryItem) => {
        const existing = cart.find(c => c.itemId === item.id);
        if (existing) return;
        setCart([...cart, { itemId: item.id, name: item.name, quantity: 1, max: item.availableQuantity }]);
    };

    const updateCartQty = (id: string, qty: number) => {
        setCart(cart.map(c => c.itemId === id ? { ...c, quantity: Math.min(qty, c.max) } : c));
    };

    const removeFromCart = (id: string) => {
        setCart(cart.filter(c => c.itemId !== id));
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setReceiverPhoto(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleIssue = () => {
        if (!selectedEmployee || cart.length === 0) return alert("Select employee and items");
        const emp = employees.find(e => e.id === selectedEmployee);
        
        const issuance: InventoryIssuance = {
            id: `ISS-${Date.now()}`,
            date: issueDate,
            employeeId: selectedEmployee,
            employeeName: emp ? emp.name : "Unknown",
            items: cart.map(c => ({ itemId: c.itemId, name: c.name, quantity: c.quantity })),
            status: "Issued",
            photo: receiverPhoto || undefined
        };

        const newInventory = inventory.map(item => {
            const cartItem = cart.find(c => c.itemId === item.id);
            if (cartItem) {
                return { ...item, availableQuantity: item.availableQuantity - cartItem.quantity };
            }
            return item;
        });

        setInventory(newInventory);
        setIssuances([...issuances, issuance]);
        setCurrentIssuance(issuance);
        setShowPrint(true);
        
        setCart([]);
        setSelectedEmployee("");
        setReceiverPhoto(null);
    };

    const handleReturn = (issuance: InventoryIssuance) => {
        const newInventory = inventory.map(item => ({...item}));
        issuance.items.forEach(i => {
            const itemIndex = newInventory.findIndex(inv => inv.id === i.itemId);
            if (itemIndex > -1) {
                newInventory[itemIndex].availableQuantity += i.quantity;
            }
        });
        setInventory(newInventory);
        const updatedIssuances = issuances.map(iss => 
            iss.id === issuance.id 
                ? { ...iss, status: "Returned" as const, returnDate: new Date().toISOString().slice(0, 10) } 
                : iss
        );
        setIssuances(updatedIssuances);
        alert("Items returned successfully!");
    };

    const getFilteredInventory = () => {
        return inventory.filter(item => {
            if(filterCampus !== "All" && item.location !== filterCampus) return false;
            if(filterCategory !== "All" && item.category !== filterCategory) return false;
            if(filterCondition !== "All" && item.condition !== filterCondition) return false;
            if(reportSearch && !item.name.toLowerCase().includes(reportSearch.toLowerCase()) && !item.id.toLowerCase().includes(reportSearch.toLowerCase())) return false;
            return true;
        });
    };

    const getIssuableItems = () => {
        return inventory.filter(i => 
            i.availableQuantity > 0 && 
            (!issueSearch || i.name.toLowerCase().includes(issueSearch.toLowerCase()) || i.category.toLowerCase().includes(issueSearch.toLowerCase()))
        );
    };

    const PrintGatePass = ({ data }: { data: InventoryIssuance }) => (
        <div style={styles.modalOverlay}>
            <div style={{...styles.modalContent, width: '210mm', height: '90vh', padding: '40px', backgroundColor: 'white'}}>
                <div className="no-print" style={{display: 'flex', justifyContent: 'flex-end', marginBottom: '20px', gap: '10px'}}>
                    <button style={styles.button("primary")} onClick={() => window.print()}>Print Form</button>
                    <button style={styles.button("secondary")} onClick={() => { setShowPrint(false); setCurrentIssuance(null); }}>Close</button>
                </div>
                <div id="printable-area" style={{border: '2px solid #000', padding: '30px', height: '100%', position: 'relative', fontFamily: 'serif'}}>
                    <div style={{textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '15px', marginBottom: '20px'}}>
                        <h1 style={{margin: '0', textTransform: 'uppercase', fontSize: '1.8rem'}}>Ghazali Institute of Medical Sciences</h1>
                        <h3 style={{margin: '10px 0 0', fontWeight: 600, textTransform: 'uppercase', padding: '5px 15px', border: '1px solid #000', display: 'inline-block'}}>
                            {data.status === 'Issued' ? "Asset Handover Form / Gate Pass" : "Asset Return / Clearance Form"}
                        </h3>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '30px'}}>
                        <div style={{flex: 1}}>
                            <table style={{width: '100%', borderCollapse: 'collapse'}}>
                                <tbody>
                                    <tr><td style={{fontWeight: 'bold', padding: '5px'}}>Issuance ID:</td><td>{data.id}</td></tr>
                                    <tr><td style={{fontWeight: 'bold', padding: '5px'}}>Date:</td><td>{data.date}</td></tr>
                                    {data.returnDate && <tr><td style={{fontWeight: 'bold', padding: '5px', color: '#b91c1c'}}>Returned Date:</td><td style={{fontWeight: 'bold'}}>{data.returnDate}</td></tr>}
                                    <tr><td style={{fontWeight: 'bold', padding: '5px'}}>Employee Name:</td><td style={{fontWeight: 'bold', fontSize: '1.1rem'}}>{data.employeeName}</td></tr>
                                    <tr><td style={{fontWeight: 'bold', padding: '5px'}}>Employee ID:</td><td>{data.employeeId}</td></tr>
                                </tbody>
                            </table>
                        </div>
                        <div style={{width: '150px', height: '150px', border: '1px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                            {data.photo ? <img src={data.photo} style={{maxWidth: '100%', maxHeight: '100%'}} /> : "Receiver Photo"}
                        </div>
                    </div>
                    <h4 style={{borderBottom: '1px solid #000', paddingBottom: '5px', marginBottom: '10px'}}>Item Details</h4>
                    <table style={{width: '100%', borderCollapse: 'collapse', border: '1px solid #000', marginBottom: '40px'}}>
                        <thead>
                            <tr style={{background: '#eee'}}>
                                <th style={{border: '1px solid #000', padding: '8px', textAlign: 'left'}}>Item Code</th>
                                <th style={{border: '1px solid #000', padding: '8px', textAlign: 'left'}}>Description / Item Name</th>
                                <th style={{border: '1px solid #000', padding: '8px', textAlign: 'center'}}>Quantity</th>
                                <th style={{border: '1px solid #000', padding: '8px', textAlign: 'center'}}>Condition</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.items.map((item, i) => (
                                <tr key={i}>
                                    <td style={{border: '1px solid #000', padding: '8px'}}>{item.itemId}</td>
                                    <td style={{border: '1px solid #000', padding: '8px'}}>{item.name}</td>
                                    <td style={{border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: 'bold'}}>{item.quantity}</td>
                                    <td style={{border: '1px solid #000', padding: '8px', textAlign: 'center'}}>Good</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 'auto'}}>
                        <div style={{textAlign: 'center', width: '200px'}}>
                            <div style={{borderBottom: '1px solid #000', height: '40px', marginBottom: '5px'}}></div>
                            <div>{data.status === 'Issued' ? "Receiver Signature" : "Returnee Signature"}</div>
                        </div>
                        <div style={{textAlign: 'center', width: '200px'}}>
                            <div style={{borderBottom: '1px solid #000', height: '40px', marginBottom: '5px'}}></div>
                            <div>Admin Officer</div>
                        </div>
                        <div style={{textAlign: 'center', width: '200px'}}>
                            <div style={{borderBottom: '1px solid #000', height: '40px', marginBottom: '5px'}}></div>
                            <div>Director / Principal</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const StatCard = ({ title, val, icon, color }: any) => (
        <div style={{...styles.card, flex: 1, padding: '20px', display: 'flex', alignItems: 'center', gap: '15px', marginBottom: 0, borderBottom: `4px solid ${color}`}}>
            <div style={{padding: '12px', borderRadius: '50%', background: `${color}20`, color: color}}>
                <span className="material-symbols-outlined" style={{fontSize: '28px'}}>{icon}</span>
            </div>
            <div>
                <div style={{fontSize: '0.85rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase'}}>{title}</div>
                <div style={{fontSize: '1.8rem', fontWeight: 800, color: '#1e293b'}}>{val}</div>
            </div>
        </div>
    );

    return (
        <div>
            {showPrint && currentIssuance && <PrintGatePass data={currentIssuance} />}

            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                <div>
                    <h2 style={{margin: '0 0 5px 0', color: '#0f172a'}}>Inventory & Assets</h2>
                    <p style={{margin: 0, color: '#64748b'}}>Track assets, issue to employees, and manage returns</p>
                </div>
                <div className="no-print" style={{display: 'flex', gap: '5px', background: '#e2e8f0', padding: '4px', borderRadius: '8px'}}>
                    <button style={styles.tabButton(view === 'list')} onClick={() => setView('list')}>List</button>
                    <button style={styles.tabButton(view === 'issue')} onClick={() => setView('issue')}>Issue</button>
                    <button style={styles.tabButton(view === 'return')} onClick={() => setView('return')}>Returns</button>
                    <button style={styles.tabButton(view === 'reports')} onClick={() => setView('reports')}>Reports</button>
                </div>
            </div>

            {view === 'list' && (
                <div>
                    <div style={{display: 'flex', gap: '20px', marginBottom: '25px'}}>
                        <StatCard title="Total Assets" val={totalItems} icon="inventory_2" color="#3b82f6" />
                        <StatCard title="In Stock" val={totalAvailable} icon="check_circle" color="#10b981" />
                        <StatCard title="Issued Out" val={totalIssued} icon="outbound" color="#f59e0b" />
                        <StatCard title="Low Stock" val={lowStock} icon="warning" color="#ef4444" />
                    </div>

                    <div style={styles.card}>
                        <div className="no-print" style={{marginBottom: '20px', background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0'}}>
                            <h4 style={{marginTop: 0, marginBottom: '15px', color: '#1e293b'}}>Add / Update Inventory Item</h4>
                            <div style={{...styles.grid3, alignItems: 'end', marginBottom: '15px'}}>
                                <div><label style={styles.label}>Item Name</label><input style={styles.input} value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} placeholder="e.g. Office Chair" /></div>
                                <div>
                                    <label style={styles.label}>Category</label>
                                    <select style={styles.input} value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})}>
                                        {masterData.inventoryCategories.map((c: string) => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div><label style={styles.label}>Total Quantity</label><input type="number" style={styles.input} value={newItem.totalQuantity} onChange={e => setNewItem({...newItem, totalQuantity: Number(e.target.value)})} /></div>
                            </div>
                            <div style={{display: 'flex', gap: '20px', alignItems: 'end'}}>
                                <div style={{flex: 1}}>
                                    <label style={styles.label}>Location / Campus</label>
                                    <select style={styles.input} value={newItem.location} onChange={e => setNewItem({...newItem, location: e.target.value})}>
                                        {masterData.campuses.map((c: Campus) => <option key={c.name} value={c.name}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div style={{flex: 1}}>
                                    <label style={styles.label}>Condition</label>
                                    <select style={styles.input} value={newItem.condition} onChange={e => setNewItem({...newItem, condition: e.target.value as any})}>
                                        <option>New</option><option>Used</option><option>Damaged</option><option>Expired</option>
                                    </select>
                                </div>
                                <div style={{flex: 1}}>
                                    <label style={styles.label}>Date Added</label>
                                    <input type="date" style={styles.input} value={newItem.addedDate} onChange={e => setNewItem({...newItem, addedDate: e.target.value})} />
                                </div>
                                <button style={styles.button("primary")} onClick={() => { setIsAddMode(true); handleAddItem(); }}>Save Item</button>
                            </div>
                        </div>

                        <table style={styles.table}>
                            <thead><tr><th style={styles.th}>ID</th><th style={styles.th}>Name</th><th style={styles.th}>Category</th><th style={styles.th}>Total</th><th style={styles.th}>Available</th><th style={styles.th}>Location</th><th style={styles.th}>Condition</th><th style={styles.th}>Action</th></tr></thead>
                            <tbody>
                                {inventory.map(item => (
                                    <tr key={item.id}>
                                        <td style={styles.td}>{item.id}</td>
                                        <td style={{...styles.td, fontWeight: 600}}>{item.name}</td>
                                        <td style={styles.td}>{item.category}</td>
                                        <td style={styles.td}>{item.totalQuantity}</td>
                                        <td style={{...styles.td, color: item.availableQuantity > 0 ? '#166534' : '#b91c1c', fontWeight: 'bold'}}>{item.availableQuantity}</td>
                                        <td style={styles.td}>{item.location || '-'}</td>
                                        <td style={styles.td}><span style={styles.badge(item.condition === 'New' ? 'Income' : item.condition === 'Damaged' ? 'Liability' : 'Asset')}>{item.condition}</span></td>
                                        <td style={styles.td}>
                                            <div style={{display: 'flex', gap: '5px'}}>
                                                <button onClick={() => { setNewItem(item); setIsAddMode(false); }} style={{border: 'none', background: '#dbeafe', color: '#1e40af', cursor: 'pointer', padding: '4px', borderRadius: '4px'}}><span className="material-symbols-outlined" style={{fontSize: '18px'}}>edit</span></button>
                                                <button onClick={() => handleDeleteItem(item.id)} style={{border: 'none', background: '#fee2e2', color: '#b91c1c', cursor: 'pointer', padding: '4px', borderRadius: '4px'}}><span className="material-symbols-outlined" style={{fontSize: '18px'}}>delete</span></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {view === 'issue' && (
                <div style={{display: 'flex', gap: '20px', alignItems: 'start'}}>
                    <div style={{width: '350px', ...styles.card, borderTop: '4px solid #166534'}}>
                        <h3 style={{marginTop: 0, color: '#166534', display: 'flex', alignItems: 'center', gap: '10px'}}>
                            <span className="material-symbols-outlined">person_pin</span> Select Employee
                        </h3>
                        <div style={{marginBottom: '20px'}}>
                            <label style={styles.label}>Receiver (Employee)</label>
                            <SearchableSelect options={employeeOptions} value={selectedEmployee} onChange={setSelectedEmployee} placeholder="Search & Select Employee..." />
                        </div>
                        <div style={{marginBottom: '20px'}}>
                            <label style={styles.label}>Date</label>
                            <input type="date" style={styles.input} value={issueDate} onChange={e => setIssueDate(e.target.value)} />
                        </div>
                        <div style={{marginBottom: '20px'}}>
                            <label style={styles.label}>Receiver Photo (Optional)</label>
                            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px dashed #cbd5e1', padding: '15px', borderRadius: '8px', background: '#f8fafc'}}>
                                {receiverPhoto ? <img src={receiverPhoto} style={{width: '100px', height: '100px', objectFit: 'cover', borderRadius: '50%', marginBottom: '10px'}} /> : <span className="material-symbols-outlined" style={{fontSize: '48px', color: '#cbd5e1', marginBottom: '10px'}}>add_a_photo</span>}
                                <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{fontSize: '0.8rem', width: '100%'}} />
                            </div>
                        </div>
                    </div>
                    <div style={{flex: 1, ...styles.card, borderTop: '4px solid #0369a1'}}>
                        <h3 style={{marginTop: 0, color: '#0369a1', display: 'flex', alignItems: 'center', gap: '10px'}}>
                            <span className="material-symbols-outlined">shopping_cart</span> Add Items to Cart
                        </h3>
                        <div style={{marginBottom: '10px'}}>
                            <input style={styles.input} placeholder="Search items available in stock..." value={issueSearch} onChange={e => setIssueSearch(e.target.value)} />
                        </div>
                        <div style={{maxHeight: '250px', overflowY: 'auto', border: '1px solid #e2e8f0', marginBottom: '20px', borderRadius: '8px'}}>
                            {getIssuableItems().map(item => (
                                <div key={item.id} style={{display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid #f1f5f9', alignItems: 'center'}}>
                                    <div>
                                        <div style={{fontWeight: 600, color: '#1e293b'}}>{item.name}</div>
                                        <div style={{fontSize: '0.8rem', color: '#64748b'}}>{item.location} • {item.condition} • In Stock: <strong style={{color: '#166534'}}>{item.availableQuantity}</strong></div>
                                    </div>
                                    <button style={{...styles.button("secondary"), padding: '6px 12px', fontSize: '0.8rem', background: '#e0f2fe', color: '#0369a1'}} onClick={() => addToCart(item)}>+ Add</button>
                                </div>
                            ))}
                        </div>
                        <h4 style={{marginBottom: '10px', color: '#475569', borderBottom: '1px solid #eee', paddingBottom: '5px'}}>Cart Items</h4>
                        {cart.length === 0 ? <div style={{padding: '20px', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1'}}>Cart is empty</div> : (
                            <table style={styles.table}>
                                <thead><tr><th style={styles.th}>Item</th><th style={styles.th}>Qty</th><th style={styles.th}>Action</th></tr></thead>
                                <tbody>
                                    {cart.map(c => (
                                        <tr key={c.itemId}>
                                            <td style={styles.td}>{c.name}</td>
                                            <td style={styles.td}>
                                                <input type="number" min="1" max={c.max} value={c.quantity} onChange={e => updateCartQty(c.itemId, Number(e.target.value))} style={{width: '60px', padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e1'}} />
                                            </td>
                                            <td style={styles.td}>
                                                <button onClick={() => removeFromCart(c.itemId)} style={{color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer'}}><span className="material-symbols-outlined">delete</span></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                        <div style={{marginTop: '20px', textAlign: 'right'}}><button style={styles.button("primary")} onClick={handleIssue} disabled={!selectedEmployee || cart.length === 0}>Generate Gate Pass & Print</button></div>
                    </div>
                </div>
            )}

            {view === 'return' && (
                <div style={styles.card}>
                    <h3 style={{marginTop: 0}}>Issuance History & Returns</h3>
                    <table style={styles.table}>
                        <thead><tr><th style={styles.th}>ID</th><th style={styles.th}>Date</th><th style={styles.th}>Employee</th><th style={styles.th}>Items</th><th style={styles.th}>Status</th><th style={styles.th}>Action</th></tr></thead>
                        <tbody>
                            {issuances.map(iss => (
                                <tr key={iss.id}>
                                    <td style={styles.td}>{iss.id}</td>
                                    <td style={styles.td}>{iss.date}</td>
                                    <td style={styles.td}><div style={{fontWeight: 600}}>{iss.employeeName}</div><div style={{fontSize: '0.8rem', color: '#64748b'}}>{iss.employeeId}</div></td>
                                    <td style={styles.td}>{iss.items.map(i => <div key={i.itemId}>{i.name} (x{i.quantity})</div>)}</td>
                                    <td style={styles.td}><span style={styles.badge(iss.status === 'Issued' ? 'Pending' : 'Income')}>{iss.status}</span></td>
                                    <td style={styles.td}>
                                        <div style={{display: 'flex', flexDirection: 'column', gap: '5px'}}>
                                            {iss.status === 'Issued' ? (
                                                <button style={{...styles.button("primary"), fontSize: '0.8rem', padding: '6px 12px', justifyContent: 'center'}} onClick={() => handleReturn(iss)}>Return</button>
                                            ) : (
                                                <span style={{color: '#64748b', fontSize: '0.8rem'}}>Returned on {iss.returnDate}</span>
                                            )}
                                            {(iss.status === 'Returned' || iss.status === 'Issued') && (
                                                <button style={{background: 'transparent', border: '1px solid #cbd5e1', cursor: 'pointer', color: '#1e40af', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem'}} onClick={() => { setCurrentIssuance(iss); setShowPrint(true); }}>
                                                    <span className="material-symbols-outlined" style={{fontSize: '16px', marginRight: '4px'}}>print</span> Print {iss.status === 'Returned' ? 'Clearance' : 'Slip'}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {view === 'reports' && (
                <div style={styles.card}>
                    <div className="no-print">
                        <h3 style={{marginTop: 0}}>Inventory Reports</h3>
                        <div style={{display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px'}}>
                            <button style={styles.tabButton(reportSubTab === 'status')} onClick={() => setReportSubTab('status')}>Status Overview</button>
                            <button style={styles.tabButton(reportSubTab === 'campus')} onClick={() => setReportSubTab('campus')}>Campus Distribution</button>
                        </div>

                        {reportSubTab === 'status' && (
                            <div style={{display: 'flex', gap: '15px', marginBottom: '20px', background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', flexWrap: 'wrap'}}>
                                <div><label style={styles.label}>Search</label><input style={styles.input} placeholder="Item Name / ID" value={reportSearch} onChange={e => setReportSearch(e.target.value)} /></div>
                                <div><label style={styles.label}>Campus</label><select style={styles.input} value={filterCampus} onChange={e => setFilterCampus(e.target.value)}><option value="All">All Campuses</option>{masterData.campuses.map((c: Campus) => <option key={c.name} value={c.name}>{c.name}</option>)}</select></div>
                                <div><label style={styles.label}>Category</label><select style={styles.input} value={filterCategory} onChange={e => setFilterCategory(e.target.value)}><option value="All">All Categories</option>{masterData.inventoryCategories.map((c: string) => <option key={c} value={c}>{c}</option>)}</select></div>
                                <div><label style={styles.label}>Condition</label><select style={styles.input} value={filterCondition} onChange={e => setFilterCondition(e.target.value)}><option value="All">All Conditions</option><option>New</option><option>Used</option><option>Damaged</option><option>Expired</option></select></div>
                                <div style={{marginLeft: 'auto', alignSelf: 'end'}}><button style={styles.button("secondary")} onClick={() => window.print()}>Print List</button></div>
                            </div>
                        )}
                    </div>

                    <div id="printable-area">
                        {reportSubTab === 'status' ? (
                            <>
                                <div style={{textAlign: 'center', marginBottom: '20px'}}>
                                    <h2 style={{textTransform: 'uppercase', marginBottom: '5px'}}>Inventory Status Report</h2>
                                    <div style={{fontSize: '0.9rem', color: '#64748b'}}>Generated on: {new Date().toLocaleDateString()}</div>
                                </div>
                                <table style={styles.table}>
                                    <thead>
                                        <tr><th style={styles.th}>S.No</th><th style={styles.th}>ID</th><th style={styles.th}>Name</th><th style={styles.th}>Category</th><th style={styles.th}>Condition</th><th style={styles.th}>Location</th><th style={{...styles.th, textAlign: 'right'}}>Total Qty</th><th style={{...styles.th, textAlign: 'right'}}>Available</th></tr>
                                    </thead>
                                    <tbody>
                                        {getFilteredInventory().map((item, index) => (
                                            <tr key={item.id}>
                                                <td style={styles.td}>{index + 1}</td>
                                                <td style={styles.td}>{item.id}</td>
                                                <td style={{...styles.td, fontWeight: 600}}>{item.name}</td>
                                                <td style={styles.td}>{item.category}</td>
                                                <td style={styles.td}><span style={{padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 600, background: item.condition === 'New' ? '#dcfce7' : item.condition === 'Damaged' ? '#fee2e2' : '#f3f4f6', color: item.condition === 'New' ? '#166534' : item.condition === 'Damaged' ? '#991b1b' : '#374151'}}>{item.condition}</span></td>
                                                <td style={styles.td}>{item.location}</td>
                                                <td style={{...styles.td, textAlign: 'right'}}>{item.totalQuantity}</td>
                                                <td style={{...styles.td, textAlign: 'right', fontWeight: 'bold'}}>{item.availableQuantity}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </>
                        ) : (
                            <>
                                <div style={{textAlign: 'center', marginBottom: '30px'}}>
                                    <h2 style={{textTransform: 'uppercase', marginBottom: '5px'}}>Campus Wise Asset Distribution</h2>
                                    <div style={{fontSize: '0.9rem', color: '#64748b'}}>Full Detailed Assets Breakdown</div>
                                </div>
                                {masterData.campuses.map((c: Campus) => {
                                    const campusItems = inventory.filter(i => i.location === c.name);
                                    if (campusItems.length === 0) return null;
                                    return (
                                        <div key={c.name} style={{marginBottom: '40px', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden'}}>
                                            <div style={{background: '#f8fafc', padding: '15px 20px', borderBottom: '2px solid #0f172a', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                                <h3 style={{margin: 0}}>{c.name} Assets</h3>
                                                <div style={{fontWeight: 700, fontSize: '0.9rem'}}>Total Items: {campusItems.length}</div>
                                            </div>
                                            <table style={styles.table}>
                                                <thead>
                                                    <tr>
                                                        <th style={styles.th}>Code</th>
                                                        <th style={styles.th}>Item Name</th>
                                                        <th style={styles.th}>Category</th>
                                                        <th style={styles.th}>Condition</th>
                                                        <th style={{...styles.th, textAlign: 'right'}}>In Stock</th>
                                                        <th style={{...styles.th, textAlign: 'right'}}>Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {campusItems.map(item => (
                                                        <tr key={item.id}>
                                                            <td style={styles.td}>{item.id}</td>
                                                            <td style={{...styles.td, fontWeight: 600}}>{item.name}</td>
                                                            <td style={styles.td}>{item.category}</td>
                                                            <td style={styles.td}>{item.condition}</td>
                                                            <td style={{...styles.td, textAlign: 'right', fontWeight: 700, color: '#166534'}}>{item.availableQuantity}</td>
                                                            <td style={{...styles.td, textAlign: 'right'}}>{item.totalQuantity}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )
                                })}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
