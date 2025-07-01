
class DataStore {
    constructor() {
        this.stores = [];
        this.transactions = [];
        this.exchangeRate = 59.50; // Default USD to DOP rate
    }

    initialize() {
        const storedStores = localStorage.getItem('ecom_stores');
        const storedTransactions = localStorage.getItem('ecom_transactions');
        const storedSettings = localStorage.getItem('ecom_settings');

        this.stores = storedStores ? JSON.parse(storedStores) : [];
        this.transactions = storedTransactions ? JSON.parse(storedTransactions) : [];
        
        if (storedSettings) {
            const settings = JSON.parse(storedSettings);
            this.exchangeRate = settings.exchangeRate || 59.50;
        }

        if (this.stores.length === 0) {
            this.seedDemoData();
        }
        
        this.save();
    }
    
    seedDemoData() {
        console.log("Seeding new demo data...");
        this.stores = [
            { id: '10000001', name: 'Gold Store', email: 'gold@example.com', password: 'password123', url: 'https://goldstore.com', currency: 'DOP', createdAt: new Date('2024-01-10T10:00:00Z'), status: 'Verified' },
            { id: '10000002', name: 'Silver Store', email: 'silver@example.com', password: 'password123', url: 'https://silverstore.com', currency: 'DOP', createdAt: new Date('2024-02-15T11:00:00Z'), status: 'Verified' },
            { id: '10000003', name: 'Bronze Store', email: 'bronze@example.com', password: 'password123', url: 'https://bronzestore.com', currency: 'DOP', createdAt: new Date('2024-03-01T12:00:00Z'), status: 'Unverified' },
            { id: '29311384', name: 'Digital Gadgets DR', email: 'contact@digitalgadgetsdr.com', password: 'password123', url: 'https://digitalgadgetsdr.com', currency: 'USD', createdAt: new Date('2024-01-15T10:00:00Z'), status: 'Unverified' },
            { id: '84113922', name: 'Moda Tropical RD', email: 'ventas@modatropical.com', password: 'password123', url: 'https://modatropical.com', currency: 'DOP', createdAt: new Date('2024-02-20T11:00:00Z'), status: 'Unverified' },
            { id: '30248192', name: 'Casa Bonita Hogar', email: 'info@casabonitahogar.do', password: 'password123', url: 'https://casabonitahogar.do', currency: 'DOP', createdAt: new Date('2024-03-10T12:00:00Z'), status: 'Unverified' },
        ];

        this.transactions = [
             // Transactions to set exact revenues for podium winners
            { storeId: '10000001', orderId: 'tx-gold', amount: 10000000, date: new Date().toISOString() },
            { storeId: '10000002', orderId: 'tx-silver', amount: 5000000, date: new Date().toISOString() },
            { storeId: '10000003', orderId: 'tx-bronze', amount: 1000000, date: new Date().toISOString() },
        ];
        
        // Add some random transactions for other stores
        const otherStores = this.stores.slice(3);
        const today = new Date();
        for (let i = 0; i < 50; i++) {
            const store = otherStores[Math.floor(Math.random() * otherStores.length)];
            const date = new Date(today.getTime() - Math.random() * 180 * 24 * 60 * 60 * 1000);
            const amount = Math.random() * (store.currency === 'USD' ? 150 : 8000) + (store.currency === 'USD' ? 10 : 500);
            this.addTransaction({
                storeId: store.id,
                orderId: `demo-${Date.now()}-${i}`,
                amount: parseFloat(amount.toFixed(2)),
                date: date.toISOString(),
            });
        }
    }

    save() {
        localStorage.setItem('ecom_stores', JSON.stringify(this.stores));
        localStorage.setItem('ecom_transactions', JSON.stringify(this.transactions));
        this.saveSettings();
    }
    
    saveSettings() {
        localStorage.setItem('ecom_settings', JSON.stringify({ exchangeRate: this.exchangeRate }));
    }

    resetData() {
        localStorage.removeItem('ecom_stores');
        localStorage.removeItem('ecom_transactions');
        localStorage.removeItem('ecom_settings');
        this.initialize();
    }

    addStore(storeData) {
        if (this.getStoreById(storeData.id) || this.getStoreByEmail(storeData.email)) {
            return null; // Store already exists
        }
        const newStore = { ...storeData, createdAt: new Date().toISOString(), status: 'Unverified' };
        this.stores.push(newStore);
        this.save();
        return newStore;
    }
    
    updateStore(storeId, updatedData) {
        const storeIndex = this.stores.findIndex(s => s.id === storeId);
        if (storeIndex !== -1) {
            this.stores[storeIndex] = { ...this.stores[storeIndex], ...updatedData };
            this.save();
        }
    }
    
    deleteStore(storeId) {
        this.stores = this.stores.filter(s => s.id !== storeId);
        this.transactions = this.transactions.filter(t => t.storeId !== storeId);
        this.save();
    }

    addTransaction(txData) {
        const store = this.getStoreById(txData.storeId);
        if (!store) return;
        
        let revenueDOP = txData.amount;
        if (store.currency === 'USD') {
            revenueDOP = txData.amount * this.exchangeRate;
        }

        const newTransaction = { ...txData, revenueDOP };
        this.transactions.push(newTransaction);
        this.save();
    }

    getStoreById(id) {
        return this.stores.find(s => s.id === id);
    }
    getStoreByEmail(email) {
        return this.stores.find(s => s.email.toLowerCase() === email.toLowerCase());
    }
    getAllStores() {
        return this.stores;
    }
    getAllTransactions() {
        return this.transactions;
    }
    getTransactionsByStore(storeId) {
        return this.transactions.filter(t => t.storeId === storeId);
    }
    getStoreStats(storeId) {
        const storeTransactions = this.getTransactionsByStore(storeId);
        const totalOrders = storeTransactions.length;
        const totalRevenueDOP = storeTransactions.reduce((sum, tx) => sum + tx.revenueDOP, 0);
        const avgOrderValueDOP = totalOrders > 0 ? totalRevenueDOP / totalOrders : 0;
        
        return { totalOrders, totalRevenueDOP, avgOrderValueDOP };
    }
}

// --- GLOBAL APP INITIALIZATION ---
let dataStore;
document.addEventListener('DOMContentLoaded', () => {
    window.dataStore = new DataStore();
    window.dataStore.initialize();

    const loggedInStoreId = sessionStorage.getItem('loggedInStoreId');
    const isAdmin = sessionStorage.getItem('isAdmin') === 'true';
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    // --- Redirection and View Logic ---
    if (isAdmin && currentPage !== 'backend.html') {
        window.location.href = 'backend.html';
        return; // Prevent further script execution
    }

    if (!isAdmin && currentPage === 'backend.html') {
        alert('Access Denied: You must be an administrator to view this page.');
        window.location.href = 'index.html';
        return; // Prevent further script execution
    }

    if (loggedInStoreId && !isAdmin) {
        if (document.getElementById('authSection')) showDashboard(loggedInStoreId);
    } else if (!loggedInStoreId) {
        if (document.getElementById('authSection')) showAuth();
    }
    
    updateAdminVisibility();

    // Dispatch event for other scripts to use the initialized dataStore
    const event = new CustomEvent('appReady');
    document.dispatchEvent(event);

    // Hide loader after everything is set up
    hideLoader();
});

// --- LOADER ---
function showLoader() {
    const loader = document.getElementById('loader-overlay');
    if (loader) {
        loader.style.display = 'flex';
        loader.style.opacity = '1';
    }
}
function hideLoader() {
    const loader = document.getElementById('loader-overlay');
    if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => { loader.style.display = 'none'; }, 500);
    }
}


// --- AUTHENTICATION ---
function showLogin() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    document.querySelector('.tab-btn[onclick="showLogin()"]').classList.add('active');
    document.querySelector('.tab-btn[onclick="showRegister()"]').classList.remove('active');
}

function showRegister() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    document.querySelector('.tab-btn[onclick="showLogin()"]').classList.remove('active');
    document.querySelector('.tab-btn[onclick="showRegister()"]').classList.add('active');
}

async function handleLogin(event) {
    event.preventDefault();
    showLoader();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    if (email.toLowerCase() === 'bebell.digitalsolutions@gmail.com' && password === 'Bebell/25') {
        sessionStorage.setItem('isAdmin', 'true');
        sessionStorage.setItem('loggedInStoreId', 'admin_user');
        window.location.href = 'backend.html';
        return;
    }

    const store = dataStore.getStoreByEmail(email);
    if (store && store.password === password) {
        sessionStorage.setItem('loggedInStoreId', store.id);
        sessionStorage.removeItem('isAdmin'); // Ensure not an admin
        window.location.reload();
    } else {
        alert('Invalid email or password.');
        hideLoader();
    }
}

function handleRegister(event) {
    event.preventDefault();
    const storeData = {
        name: document.getElementById('storeName').value,
        id: document.getElementById('storeId').value,
        email: document.getElementById('registerEmail').value,
        password: document.getElementById('registerPassword').value,
        url: document.getElementById('storeUrl').value,
        currency: document.getElementById('currency').value
    };
    
    if (!storeData.id || !storeData.email || !storeData.password || !storeData.name || !storeData.url) {
        alert('Please fill out all fields.');
        return;
    }

    const newStore = dataStore.addStore(storeData);
    if (newStore) {
        alert('Registration successful! Please log in.');
        sendNewAccountEmail(storeData);
        showLogin();
        document.getElementById('registerForm').reset();
    } else {
        alert('A store with this ID or Email already exists.');
    }
}

function logout() {
    sessionStorage.removeItem('loggedInStoreId');
    sessionStorage.removeItem('isAdmin');
    window.location.href = 'index.html';
}

// --- UI & DASHBOARD ---
function showDashboard(storeId) {
    const authSection = document.getElementById('authSection');
    const dashboardSection = document.getElementById('dashboardSection');
    if (!authSection || !dashboardSection) return;

    authSection.style.display = 'none';
    dashboardSection.style.display = 'block';
    
    const store = dataStore.getStoreById(storeId);
    if (!store) {
        logout();
        return;
    }
    
    document.getElementById('userStoreName').textContent = store.name;
    updateDashboardStats(storeId);
    generateTrackingCode(storeId);
    updateRecentActivity(storeId);
}

function showAuth() {
    const authSection = document.getElementById('authSection');
    const dashboardSection = document.getElementById('dashboardSection');
     if (!authSection || !dashboardSection) return;
    authSection.style.display = 'flex';
    dashboardSection.style.display = 'none';
}

function updateDashboardStats(storeId) {
    const store = dataStore.getStoreById(storeId);
    const stats = dataStore.getStoreStats(storeId);

    const allStoresRanked = dataStore.getAllStores()
        .map(s => ({...s, ...dataStore.getStoreStats(s.id)}))
        .sort((a, b) => b.totalRevenueDOP - a.totalRevenueDOP);
    const rank = allStoresRanked.findIndex(s => s.id === storeId) + 1;

    document.getElementById('totalRevenue').textContent = formatCurrency(stats.totalRevenueDOP, 'DOP');
    document.getElementById('totalOrders').textContent = stats.totalOrders.toLocaleString();
    document.getElementById('leaderboardRank').textContent = rank > 0 ? `#${rank}` : '-';
    document.getElementById('avgOrderValue').textContent = formatCurrency(stats.avgOrderValueDOP, 'DOP');
}

function generateTrackingCode(storeId) {
    const code = `
<!-- eCOMLeaderboard Tracking -->
<script src="${window.location.origin}/tracking.js" defer><\/script>
<script>
  window.eCOMLeaderboard = window.eCOMLeaderboard || [];
  window.eCOMLeaderboard.apiKey = '${storeId}';
  
  // Example: Track a purchase on page load for testing
  // On a real site, this would be triggered by a purchase event.
  // window.eCOMLeaderboard.ecommerce.trackPurchase('ORDER_ID_12345', 99.99, []);
<\/script>
    `.trim();
    document.getElementById('trackingCode').textContent = code;
}

function copyTrackingCode() {
    const code = document.getElementById('trackingCode').textContent;
    navigator.clipboard.writeText(code).then(() => {
        alert('Tracking code copied to clipboard!');
    }, () => {
        alert('Failed to copy code.');
    });
}

function testConnection() {
    const statusIndicator = document.getElementById('connectionStatus');
    const statusDot = statusIndicator.querySelector('.status-dot');
    const statusText = document.getElementById('connectionStatusText');

    statusIndicator.style.display = 'flex';
    statusDot.classList.remove('connected');
    statusText.textContent = 'Awaiting test order...';
    
    alert("Place a test order on your site with the tracking script installed. This panel will update automatically when a connection is detected.");

    // Poll localStorage for changes from tracking.js
    let checkCount = 0;
    const interval = setInterval(() => {
        const trackingData = JSON.parse(localStorage.getItem('ecomLeaderboardTracking') || '[]');
        const loggedInStoreId = sessionStorage.getItem('loggedInStoreId');
        const connectionMade = trackingData.some(d => d.apiKey === loggedInStoreId);

        if (connectionMade) {
            clearInterval(interval);
            statusDot.classList.add('connected');
            statusText.textContent = 'Connection Successful!';
            updateRecentActivity(loggedInStoreId);
        }
        checkCount++;
        if(checkCount > 60) { // Stop checking after 2 minutes
             clearInterval(interval);
             statusText.textContent = 'Test timed out.';
        }
    }, 2000);
}

function updateRecentActivity(storeId) {
    const activityContainer = document.getElementById('recentActivity');
    const transactions = dataStore.getTransactionsByStore(storeId).slice(-5).reverse();
    if(transactions.length === 0) {
        activityContainer.innerHTML = `
            <div class="activity-item">
                <i data-lucide="link" class="lucide-icon"></i>
                <span>Awaiting first connection...</span>
            </div>`;
    } else {
        activityContainer.innerHTML = transactions.map(tx => `
            <div class="activity-item">
                <i data-lucide="check-circle-2" class="lucide-icon" style="color:var(--success-color);"></i>
                <span>New order received: ${formatCurrency(tx.revenueDOP, 'DOP')}</span>
                <span class="activity-time">${new Date(tx.date).toLocaleTimeString()}</span>
            </div>
        `).join('');
    }
    lucide.createIcons();
}

// --- HELPERS ---
function formatCurrency(amount, currency) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        currencyDisplay: 'symbol'
    }).format(amount);
}

function updateAdminVisibility() {
    const isAdmin = sessionStorage.getItem('isAdmin') === 'true';
    document.querySelectorAll('.admin-only').forEach(el => {
        el.style.display = isAdmin ? 'inline-block' : 'none';
    });
}

function sendNewAccountEmail(templateParams) {
    // IMPORTANT: Replace with your own EmailJS credentials from your account dashboard
    const serviceID = 'El_Negocio_Digital'; // e.g., 'service_abc123'
    const templateID = 'bebell_notifications'; // e.g., 'template_xyz456'
    const publicKey = 'pzi6GkEVpxFMX_PUe'; // e.g., 'AbCdEfGhIjKlMnOpQ'

    if (serviceID === 'El_Negocio_Digital' || templateID === 'bebell_notifications' || publicKey === 'pzi6GkEVpxFMX_PUe') {
        console.warn('EmailJS not configured. Please add your credentials in app.js. Skipping email notification.');
        return;
    }
    
    const finalParams = {
        ...templateParams,
        subject: "NEW ACCOUNT ADDED IN ECOM LEADERBOARD"
    };

    emailjs.send(serviceID, templateID, finalParams, publicKey)
        .then(response => {
            console.log('New account notification sent!', response.status, response.text);
        }, error => {
            console.error('Failed to send notification email:', error);
        });
}
