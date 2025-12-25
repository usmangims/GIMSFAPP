
export const styles = {
  appContainer: { fontFamily: "'Inter', sans-serif", backgroundColor: "#f0f2f5", minHeight: "100vh", display: "flex", color: "#000000" },
  sidebar: { width: "260px", backgroundColor: "#0f172a", color: "#f8fafc", display: "flex", flexDirection: "column" as const, flexShrink: 0 },
  brand: { padding: "24px", fontSize: "1.25rem", fontWeight: 700, color: "#34d399", borderBottom: "1px solid #1e293b", display: "flex", alignItems: "center", gap: "10px" },
  nav: { padding: "16px", display: "flex", flexDirection: "column" as const, gap: "4px" },
  navItem: (active: boolean) => ({
    padding: "12px 12px", borderRadius: "8px", cursor: "pointer",
    backgroundColor: active ? "#334155" : "transparent", 
    color: "#ffffff",
    display: "flex", alignItems: "center", gap: "12px", 
    fontSize: "1.05rem",
    fontWeight: active ? 600 : 500
  }),
  navSubItem: (active: boolean) => ({
    padding: "8px 12px 8px 46px", borderRadius: "8px", cursor: "pointer",
    backgroundColor: active ? "rgba(51, 65, 85, 0.5)" : "transparent", 
    color: "#e2e8f0",
    fontSize: "0.95rem", fontWeight: 500
  }),
  main: { flex: 1, padding: "32px", overflowY: "auto" as const },
  card: { backgroundColor: "white", borderRadius: "12px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", marginBottom: "24px", border: "1px solid #e2e8f0" },
  kpiCard: (color: string, bg: string) => ({
    backgroundColor: bg, borderRadius: "12px", padding: "24px", border: `1px solid ${color}20`,
    display: 'flex', flexDirection: 'column' as const, justifyContent: 'space-between', minHeight: '120px'
  }),
  grid4: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px" },
  grid3: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" },
  input: { 
    width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", 
    fontSize: "0.9rem", outline: "none", boxSizing: "border-box" as const, color: "#0f172a",
    backgroundColor: "white", transition: "border-color 0.2s, box-shadow 0.2s",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
  },
  label: { display: "block", marginBottom: "6px", fontWeight: 600, color: "#475569", fontSize: "0.8rem", textTransform: "uppercase" as const, letterSpacing: "0.5px" },
  button: (variant: "primary" | "secondary" | "danger" = "primary") => {
    const base = { padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontSize: "0.9rem", fontWeight: 600, border: "none", display: "flex", alignItems: "center", gap: "8px", justifyContent: "center", transition: "all 0.2s" };
    if (variant === "primary") return { ...base, backgroundColor: "#4f46e5", color: "white", boxShadow: "0 2px 4px rgba(79, 70, 229, 0.2)" };
    if (variant === "danger") return { ...base, backgroundColor: "#ef4444", color: "white" };
    return { ...base, backgroundColor: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0" }; 
  },
  modalOverlay: { position: "fixed" as const, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15, 23, 42, 0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, backdropFilter: "blur(4px)" },
  modalContent: { backgroundColor: "white", padding: "30px", borderRadius: "16px", maxWidth: "90%", maxHeight: "90vh", overflowY: "auto" as const, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" },
  table: { width: "100%", borderCollapse: "collapse" as const, fontSize: "0.9rem" },
  th: { textAlign: "left" as const, padding: "14px 12px", borderBottom: "2px solid #f1f5f9", color: "#64748b", fontWeight: 600, textTransform: "uppercase" as const, fontSize: "0.75rem", letterSpacing: "0.5px" },
  td: { padding: "12px", borderBottom: "1px solid #f1f5f9", color: "#334155" },
  tabButton: (active: boolean) => ({
    padding: "10px 18px", borderRadius: "8px", border: "none", cursor: "pointer",
    backgroundColor: active ? "white" : "transparent",
    color: active ? "#4f46e5" : "#64748b",
    fontWeight: active ? 700 : 500,
    boxShadow: active ? "0 4px 6px -1px rgba(0, 0, 0, 0.1)" : "none",
    display: 'flex', alignItems: 'center', transition: 'all 0.2s', gap: '8px'
  }),
  badge: (type: string) => {
    let bg = "#f3f4f6"; let color = "#374151";
    const t = (type || '').toLowerCase();
    if(t === 'income' || t === 'asset' || t === 'new' || t === 'posted' || t === 'active' || t === 'paid' || t === 'present') { bg = "#dcfce7"; color = "#166534"; }
    else if(t === 'expense' || t === 'liability' || t === 'damaged' || t === 'delete' || t === 'inactive' || t === 'absent') { bg = "#fee2e2"; color = "#991b1b"; }
    else if(t === 'equity' || t === 'pending' || t === 'late' || t === 'leave') { bg = "#ffedd5"; color = "#9a3412"; }
    
    return {
      padding: "4px 10px", borderRadius: "20px", fontSize: "0.7rem", fontWeight: 700,
      backgroundColor: bg, color: color, display: "inline-block", textTransform: "uppercase" as const
    };
  },
  // Added scannerContainer for the FaceRecognitionScanner component
  scannerContainer: {
    width: "100%", height: "450px", backgroundColor: "#0f172a", borderRadius: "16px",
    position: "relative" as const, overflow: "hidden", display: "flex", 
    justifyContent: "center", alignItems: "center", boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
  },
  // Added scannerOverlay function for status-based visual feedback in FaceRecognitionScanner
  scannerOverlay: (status: 'neutral' | 'success' | 'danger') => ({
    position: "absolute" as const, top: "50px", left: "50px", right: "50px", bottom: "50px",
    border: `2px solid ${status === 'danger' ? '#ef4444' : status === 'success' ? '#22c55e' : 'rgba(255,255,255,0.3)'}`,
    borderRadius: "12px", pointerEvents: "none" as const, transition: "all 0.3s ease"
  })
};
