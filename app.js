
const GIMS = {
    user: null,
    students: [],
    transactions: [],
    accounts: [],
    employees: [],
    masterData: {},
    init: function() {
        this.loadData();
        this.checkAuth();
        this.checkTrial();
    },
    loadData: function() {
        const load = (key, fallback) => {
            const saved = localStorage.getItem(`gims_${key}`);
            return saved ? JSON.parse(saved) : fallback;
        };
        this.students = load('students', []);
        this.transactions = load('transactions', []);
        this.accounts = load('accounts', []);
        this.employees = load('employees', []);
        this.user = JSON.parse(localStorage.getItem('gims_current_user'));
    },
    saveData: function(key) {
        localStorage.setItem(`gims_${key}`, JSON.stringify(this[key]));
    },
    checkAuth: function() {
        const user = localStorage.getItem('gims_current_user');
        if (!user && !window.location.pathname.includes('login.html')) {
            console.warn("User not authenticated");
        }
    },
    checkTrial: function() {
        const sysIdKey = 'gims_sys_id';
        if (!localStorage.getItem(sysIdKey)) {
            localStorage.setItem(sysIdKey, Date.now().toString());
        }
    }
};
window.GIMS = GIMS;
document.addEventListener('DOMContentLoaded', () => GIMS.init());
