
import React, { useState } from "react";
import { styles } from "./styles";
import { INITIAL_USERS, User } from "./types";

export const Login = ({ onLogin, users }: any) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e?: React.FormEvent) => {
    if(e) e.preventDefault();
    
    // Check against active users list, or fallback to initial (though updated app should always pass users)
    const userList: User[] = users && users.length > 0 ? users : INITIAL_USERS;
    
    const user = userList.find((u: User) => u.username.toLowerCase() === username.toLowerCase());
    
    if (user && user.password === password) {
        onLogin(user.role, user.username);
    } else {
        setError("Invalid username or password.");
    }
  };

  return (
    <div style={{
        height: '100vh', 
        width: '100vw', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        fontFamily: "'Inter', sans-serif"
    }}>
        <div style={{
            backgroundColor: 'white', 
            padding: '40px 50px', 
            borderRadius: '24px', 
            width: '100%', 
            maxWidth: '420px', 
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            textAlign: 'center'
        }}>
            <div style={{marginBottom: '30px'}}>
                <div style={{
                    width: '60px', height: '60px', backgroundColor: '#dcfce7', borderRadius: '16px', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto'
                }}>
                    <span className="material-symbols-outlined" style={{fontSize: '32px', color: '#166534'}}>account_balance</span>
                </div>
                <h1 style={{margin: '0 0 10px 0', color: '#0f172a', fontSize: '1.8rem', fontWeight: 800}}>Welcome Back</h1>
                <p style={{margin: 0, color: '#64748b'}}>GIMS Finance Management System</p>
            </div>

            <form onSubmit={handleLogin}>
                <div style={{textAlign: 'left', marginBottom: '20px'}}>
                    <label style={{...styles.label, marginBottom: '8px', color: '#334155'}}>Username</label>
                    <div style={{position: 'relative'}}>
                        <input 
                            style={{...styles.input, paddingLeft: '40px', height: '48px', fontSize: '1rem'}} 
                            value={username} 
                            onChange={e => setUsername(e.target.value)} 
                            placeholder="Enter username" 
                            autoFocus
                        />
                        <span className="material-symbols-outlined" style={{position: 'absolute', left: '12px', top: '12px', color: '#94a3b8'}}>person</span>
                    </div>
                </div>

                <div style={{textAlign: 'left', marginBottom: '25px'}}>
                    <label style={{...styles.label, marginBottom: '8px', color: '#334155'}}>Password</label>
                    <div style={{position: 'relative'}}>
                        <input 
                            type="password" 
                            style={{...styles.input, paddingLeft: '40px', height: '48px', fontSize: '1rem'}} 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            placeholder="Enter password" 
                        />
                        <span className="material-symbols-outlined" style={{position: 'absolute', left: '12px', top: '12px', color: '#94a3b8'}}>lock</span>
                    </div>
                </div>

                {error && (
                    <div style={{
                        marginBottom: '20px', padding: '10px', borderRadius: '8px', 
                        backgroundColor: '#fef2f2', color: '#b91c1c', fontSize: '0.85rem', 
                        display: 'flex', alignItems: 'center', gap: '8px'
                    }}>
                        <span className="material-symbols-outlined" style={{fontSize: '18px'}}>error</span>
                        {error}
                    </div>
                )}

                <button type="submit" style={{
                    ...styles.button("primary"), 
                    width: '100%', justifyContent: 'center', height: '48px', fontSize: '1rem',
                    backgroundColor: '#166534', marginBottom: '20px'
                }}>
                    Sign In
                </button>
            </form>

            <div style={{borderTop: '1px solid #e2e8f0', paddingTop: '20px', color: '#94a3b8', fontSize: '0.8rem'}}>
                Protected System • Authorized Access Only
            </div>
        </div>
    </div>
  );
};
