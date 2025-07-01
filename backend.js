
// This function must be globally accessible for the onclick handler in backend.html
function resetLeaderboardData() {
    if (confirm('ARE YOU SURE? This will delete all current data and restore the initial demo data. This action cannot be undone.')) {
        if (backendManager && backendManager.dataStore) {
            backendManager.dataStore.resetData();
            alert('All data has been reset to the initial demo state.');
            // Re-render the admin table to show the new demo data
            backendManager.renderTable();
            backendManager.loadSettings(); // Also reload settings display
        } else {
            console.error('BackendManager or DataStore not initialized.');
            alert('An error occurred. Please refresh the page and try again.');
        }
    }
}

// Security check: Redirect non-admins immediately.
if (sessionStorage.getItem('isAdmin') !== 'true') {
    alert('Access Denied: You must be an administrator to view this page.');
    window.location.href = 'index.html';
}

// Admin Panel Logic
class BackendManager {
    constructor() {
        this.dataStore = null; 
        this.tableContent = document.getElementById('adminTableContent');
        this.modal = document.getElementById('editStoreModal');
        this.editForm = document.getElementById('editStoreForm');
        this.settingsForm = document.getElementById('settingsForm');
    }

    initialize() {
        this.dataStore = window.dataStore;
        if (!this.dataStore) {
            console.error("DataStore not found.");
            return;
        }

        this.renderTable();
        this.setupEventListeners();
        this.loadSettings();
    }
    
    setupEventListeners() {
        this.editForm.addEventListener('submit', (e) => this.handleSave(e));
        this.settingsForm.addEventListener('submit', (e) => this.handleSaveSettings(e));
    }

    loadSettings() {
        document.getElementById('exchangeRate').value = this.dataStore.exchangeRate;
    }

    handleSaveSettings(event) {
        event.preventDefault();
        const newRate = parseFloat(document.getElementById('exchangeRate').value);
        if (isNaN(newRate) || newRate <= 0) {
            alert('Please enter a valid, positive exchange rate.');
            return;
        }
        this.dataStore.exchangeRate = newRate;
        this.dataStore.saveSettings();
        alert('Global settings saved successfully!');
        this.renderTable(); // Re-render table to reflect new rate
    }

    formatUrl(url) {
        if (!url) return '';
        return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    }

    renderTable() {
        if (!this.dataStore || !this.tableContent) {
            return;
        }
        const stores = this.dataStore.getAllStores();
        this.tableContent.innerHTML = ''; 

        if (stores.length === 0) {
            this.tableContent.innerHTML = '<div class="admin-table-row wide" style="text-align: center; grid-column: 1 / -1;">No stores found.</div>';
            return;
        }

        stores.forEach(store => {
            const stats = this.dataStore.getStoreStats(store.id);
            const row = document.createElement('div');
            row.className = 'admin-table-row wide';
            row.innerHTML = `
                <div>${store.email}</div>
                <div>${store.id}</div>
                <div><a href="${store.url}" title="${store.url}" target="_blank" rel="noopener noreferrer">${this.formatUrl(store.url)}</a></div>
                <div>${store.currency}</div>
                <div><span class="status-tag ${store.status ? store.status.toLowerCase() : 'unverified'}">${store.status || 'Unverified'}</span></div>
                <div>${stats.totalOrders.toLocaleString()}</div>
                <div>${formatCurrency(stats.totalRevenueDOP, 'DOP')}</div>
                <div class="admin-actions">
                    <button class="btn-icon btn-edit" onclick="backendManager.handleEdit('${store.id}')">
                        <i data-lucide="edit"></i> Edit
                    </button>
                    <button class="btn-icon btn-delete" onclick="backendManager.handleDelete('${store.id}')">
                        <i data-lucide="trash-2"></i> Delete
                    </button>
                </div>
            `;
            this.tableContent.appendChild(row);
        });
        
        lucide.createIcons();
    }

    handleEdit(storeId) {
        const store = this.dataStore.getStoreById(storeId);
        if (store) {
            document.getElementById('editStoreId').value = store.id;
            document.getElementById('editModalStoreId').value = store.id;
            document.getElementById('editStoreName').value = store.name;
            document.getElementById('editStoreUrl').value = store.url;
            document.getElementById('editStoreEmail').value = store.email;
            document.getElementById('editCurrency').value = store.currency;
            document.getElementById('editStatus').value = store.status || 'Unverified';
            this.modal.style.display = 'flex';
        }
    }

    handleSave(event) {
        event.preventDefault();
        const storeId = document.getElementById('editStoreId').value;
        const updatedData = {
            name: document.getElementById('editStoreName').value,
            url: document.getElementById('editStoreUrl').value,
            email: document.getElementById('editStoreEmail').value,
            currency: document.getElementById('editCurrency').value,
            status: document.getElementById('editStatus').value,
        };
        this.dataStore.updateStore(storeId, updatedData);
        this.closeEditModal();
        this.renderTable();
    }
    
    handleDelete(storeId) {
        const store = this.dataStore.getStoreById(storeId);
        if (!store) return;

        const confirmation = confirm(`Are you sure you want to delete the store "${store.name}"? This action cannot be undone.`);
        if (confirmation) {
            this.dataStore.deleteStore(storeId);
            this.renderTable();
        }
    }

    closeEditModal() {
        this.modal.style.display = 'none';
        this.editForm.reset();
    }

    downloadCsv() {
        if (!this.dataStore) {
            console.error('DataStore not available for CSV export.');
            alert('Could not generate CSV. Data not loaded.');
            return;
        }

        const stores = this.dataStore.getAllStores();
        if (stores.length === 0) {
            alert('No stores to export.');
            return;
        }

        const headers = [
            'Store ID', 'Store Name', 'Email', 'Store URL', 'Currency', 
            'Status', 'Total Orders', 'Total Revenue (DOP)'
        ];

        let csvContent = headers.join(',') + '\n';

        stores.forEach(store => {
            const stats = this.dataStore.getStoreStats(store.id);
            const row = [
                store.id,
                `"${(store.name || '').replace(/"/g, '""')}"`, // Handle quotes in names
                store.email,
                store.url,
                store.currency,
                store.status || 'Unverified',
                stats.totalOrders,
                stats.totalRevenueDOP
            ];
            csvContent += row.join(',') + '\n';
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            const date = new Date().toISOString().slice(0, 10);
            link.setAttribute('href', url);
            link.setAttribute('download', `ecom-leaderboard-stores-${date}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            alert('CSV download is not supported by your browser.');
        }
    }
}

let backendManager;

function closeEditModal() {
    if (backendManager) backendManager.closeEditModal();
}

document.addEventListener('appReady', () => {
    backendManager = new BackendManager();
    backendManager.initialize();
});