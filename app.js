
    // Global variables
        let currentUser = null;
        let currentMerchantId = null;
        let ordersChart, paymentMethodsChart, revenueChart, statusDistributionChart, dailyPerformanceChart;
        
        // Initialize the app when the page loads
        document.addEventListener('DOMContentLoaded', function() {
            init();
            updateDateTime();
            setInterval(updateDateTime, 60000); // Update time every minute
            
            // Initialize charts with empty data
            initCharts();
        });
        
        function updateDateTime() {
            const now = new Date();
            document.getElementById('dashboard-time').textContent = now.toLocaleString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            document.getElementById('current-date').textContent = now.toLocaleDateString();
        }
        
        function initCharts() {
            const ctx1 = document.getElementById('ordersChart').getContext('2d');
            ordersChart = new Chart(ctx1, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Orders',
                        data: [],
                        backgroundColor: 'rgba(102, 126, 234, 0.2)',
                        borderColor: 'rgba(102, 126, 234, 1)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
            
            const ctx2 = document.getElementById('paymentMethodsChart').getContext('2d');
            paymentMethodsChart = new Chart(ctx2, {
                type: 'doughnut',
                data: {
                    labels: ['Mobile', 'Card', 'Bank'],
                    datasets: [{
                        data: [30, 45, 25],
                        backgroundColor: [
                            'rgba(67, 233, 123, 0.7)',
                            'rgba(102, 126, 234, 0.7)',
                            'rgba(255, 193, 7, 0.7)'
                        ],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
            
            const ctx3 = document.getElementById('revenueChart').getContext('2d');
            revenueChart = new Chart(ctx3, {
                type: 'bar',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Revenue ($)',
                        data: [1200, 1900, 1500, 2000, 1800, 2200],
                        backgroundColor: 'rgba(102, 126, 234, 0.7)'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
            
            const ctx4 = document.getElementById('statusDistributionChart').getContext('2d');
            statusDistributionChart = new Chart(ctx4, {
                type: 'pie',
                data: {
                    labels: ['Paid', 'Pending', 'Failed'],
                    datasets: [{
                        data: [65, 15, 20],
                        backgroundColor: [
                            'rgba(67, 233, 123, 0.7)',
                            'rgba(255, 193, 7, 0.7)',
                            'rgba(255, 117, 140, 0.7)'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
            
            const ctx5 = document.getElementById('dailyPerformanceChart').getContext('2d');
            dailyPerformanceChart = new Chart(ctx5, {
                type: 'line',
                data: {
                    labels: Array.from({length: 30}, (_, i) => `Day ${i+1}`),
                    datasets: [{
                        label: 'Orders',
                        data: Array.from({length: 30}, () => Math.floor(Math.random() * 20) + 5),
                        borderColor: 'rgba(102, 126, 234, 1)',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true
                    }, {
                        label: 'Revenue',
                        data: Array.from({length: 30}, () => Math.floor(Math.random() * 500) + 100),
                        borderColor: 'rgba(67, 233, 123, 1)',
                        backgroundColor: 'rgba(67, 233, 123, 0.1)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
        
// let currentUser = null;
// let currentMerchantId = null;
let paymentMethodsConfig = {
    mobile: {
        required_fields: ["label", "provider", "phone_number"],
        providers: ["MTN", "Airtel", "Zamtel"]
    },
    card: {
        required_fields: ["label", "card_number", "expiry", "cvv"],
        providers: ["Visa", "Mastercard", "American Express"]
    },
    bank: {
        required_fields: ["label", "account_number", "bank_name", "branch_code"],
        providers: ["ZANACO", "Stanbic", "Absa", "FNB"]
    }
};

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const appContainer = document.getElementById('app-container');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const currentUsernameDisplay = document.getElementById('current-username');

// Section elements
const dashboardSection = document.getElementById('dashboard-section');
const paymentSettingsSection = document.getElementById('payment-settings-section');
const ordersSection = document.getElementById('orders-section');

// Navigation links
const navLinks = document.querySelectorAll('.nav-link[data-section]');

// Payment settings elements
const paymentMethodSelect = document.getElementById('payment-method');
const methodConfigFields = document.getElementById('method-config-fields');
const paymentSettingsForm = document.getElementById('payment-settings-form');
const noSettingsMessage = document.getElementById('no-settings-message');
const settingsDisplay = document.getElementById('settings-display');
const settingsData = document.getElementById('settings-data');

// Orders elements
const createOrderBtn = document.getElementById('create-order-btn');
const refreshOrdersBtn = document.getElementById('refresh-orders-btn');
const ordersTable = document.getElementById('orders-table');
const recentOrdersTable = document.getElementById('recent-orders-table');
const totalOrdersDisplay = document.getElementById('total-orders');
const paidOrdersDisplay = document.getElementById('paid-orders');
const failedOrdersDisplay = document.getElementById('failed-orders');

// Modals
const createOrderModal = new bootstrap.Modal(document.getElementById('createOrderModal'));
const confirmCreateOrderBtn = document.getElementById('confirm-create-order');

// Event Listeners
loginBtn.addEventListener('click', handleLogin);
logoutBtn.addEventListener('click', handleLogout);

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = link.getAttribute('data-section');
        showSection(section);
        
        // Update active state
        navLinks.forEach(navLink => navLink.classList.remove('active'));
        link.classList.add('active');
    });
});

paymentMethodSelect.addEventListener('change', updatePaymentMethodFields);
paymentSettingsForm.addEventListener('submit', savePaymentSettings);
createOrderBtn.addEventListener('click', () => createOrderModal.show());
confirmCreateOrderBtn.addEventListener('click', createTestOrder);
refreshOrdersBtn.addEventListener('click', loadOrders);

// Initialize the app
function init() {
    // Check if user is already logged in (from sessionStorage)
    const savedUser = sessionStorage.getItem('ghalaUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        currentMerchantId = currentUser.merchant_id || 'm1'; // Default to m1 if not specified
        showApp();
    }
}

// Handle login
async function handleLogin() {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (!username || !password) {
        alert('Please enter both username and password');
        return;
    }
    
    try {
        const response = await fetch('http://localhost:5000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username,
                password
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentUser = data.user;
            currentMerchantId = currentUser.merchant_id || 'm1'; // Default to m1 if not specified
            sessionStorage.setItem('ghalaUser', JSON.stringify(currentUser));
            showApp();
        } else {
            alert(data.message || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('An error occurred during login');
    }
}

// Handle logout
function handleLogout() {
    currentUser = null;
    currentMerchantId = null;
    sessionStorage.removeItem('ghalaUser');
    hideApp();
}

// Show the main app
function showApp() {
    loginScreen.style.display = 'none';
    appContainer.style.display = 'block';
    currentUsernameDisplay.textContent = currentUser.username;
    
    // Load initial data
    loadPaymentSettings();
    loadOrders();
    showSection('dashboard');
    
    // Update active nav link
    navLinks.forEach(link => link.classList.remove('active'));
    document.querySelector('.nav-link[data-section="dashboard"]').classList.add('active');
}

// Hide the main app
function hideApp() {
    loginScreen.style.display = 'block';
    appContainer.style.display = 'none';
    usernameInput.value = '';
    passwordInput.value = '';
}

// Show a specific section
function showSection(section) {
    dashboardSection.style.display = 'none';
    paymentSettingsSection.style.display = 'none';
    ordersSection.style.display = 'none';
    
    switch (section) {
        case 'dashboard':
            dashboardSection.style.display = 'block';
            break;
        case 'payment-settings':
            paymentSettingsSection.style.display = 'block';
            break;
        case 'orders':
            ordersSection.style.display = 'block';
            break;
    }
}

// Update payment method configuration fields based on selection
function updatePaymentMethodFields() {
    const method = paymentMethodSelect.value;
    methodConfigFields.innerHTML = '';
    
    if (!method) return;
    
    const config = paymentMethodsConfig[method];
    
    // Create label field
    const labelGroup = document.createElement('div');
    labelGroup.className = 'mb-3';
    labelGroup.innerHTML = `
        <label for="payment-label" class="form-label">Label</label>
        <input type="text" class="form-control" id="payment-label" placeholder="e.g., My Mobile Money">
    `;
    methodConfigFields.appendChild(labelGroup);
    
    // Create provider field if applicable
    if (config.providers) {
        const providerGroup = document.createElement('div');
        providerGroup.className = 'mb-3';
        
        let options = '';
        config.providers.forEach(provider => {
            options += `<option value="${provider}">${provider}</option>`;
        });
        
        providerGroup.innerHTML = `
            <label for="payment-provider" class="form-label">Provider</label>
            <select class="form-select" id="payment-provider">
                ${options}
            </select>
        `;
        methodConfigFields.appendChild(providerGroup);
    }
    
    // Create other required fields
    config.required_fields.forEach(field => {
        if (field !== 'label' && field !== 'provider') {
            const fieldGroup = document.createElement('div');
            fieldGroup.className = 'mb-3';
            
            const label = field.replace(/_/g, ' ');
            const inputType = field === 'phone_number' || field === 'account_number' || field === 'card_number' ? 'tel' : 'text';
            
            fieldGroup.innerHTML = `
                <label for="payment-${field}" class="form-label">${label.charAt(0).toUpperCase() + label.slice(1)}</label>
                <input type="${inputType}" class="form-control" id="payment-${field}" placeholder="Enter ${label}">
            `;
            methodConfigFields.appendChild(fieldGroup);
        }
    });
}

// Save payment settings
async function savePaymentSettings(e) {
    e.preventDefault();
    
    const method = paymentMethodSelect.value;
    if (!method) {
        alert('Please select a payment method');
        return;
    }
    
    const config = {
        method: method,
        label: document.getElementById('payment-label').value
    };
    
    // Add provider if applicable
    if (paymentMethodsConfig[method].providers) {
        config.provider = document.getElementById('payment-provider').value;
    }
    
    // Add other fields
    paymentMethodsConfig[method].required_fields.forEach(field => {
        if (field !== 'label' && field !== 'provider') {
            config[field] = document.getElementById(`payment-${field}`).value;
        }
    });
    
    try {
        const response = await fetch(`http://localhost:5000/merchant/${currentMerchantId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(config)
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Payment settings saved successfully');
            loadPaymentSettings();
        } else {
            alert('Failed to save payment settings');
        }
    } catch (error) {
        console.error('Error saving payment settings:', error);
        alert('An error occurred while saving payment settings');
    }
}

// Load payment settings
async function loadPaymentSettings() {
    try {
        const response = await fetch(`http://localhost:5000/merchant/${currentMerchantId}`);
        const data = await response.json();
        
        if (data.method) {
            noSettingsMessage.style.display = 'none';
            settingsDisplay.style.display = 'block';
            settingsData.textContent = JSON.stringify(data, null, 2);
            
            // Pre-fill the form with existing settings
            paymentMethodSelect.value = data.method;
            updatePaymentMethodFields();
            
            // Set values for all fields
            document.getElementById('payment-label').value = data.label || '';
            
            if (data.provider) {
                document.getElementById('payment-provider').value = data.provider;
            }
            
            paymentMethodsConfig[data.method].required_fields.forEach(field => {
                if (field !== 'label' && field !== 'provider' && data[field]) {
                    document.getElementById(`payment-${field}`).value = data[field];
                }
            });
        } else {
            noSettingsMessage.style.display = 'block';
            settingsDisplay.style.display = 'none';
        }
    } catch (error) {
        console.error('Error loading payment settings:', error);
    }
}

// Create test order
async function createTestOrder() {
    const customerName = document.getElementById('customer-name').value.trim();
    const productName = document.getElementById('product-name').value.trim();
    const amount = document.getElementById('order-amount').value.trim();
    
    if (!customerName || !productName || !amount) {
        alert('Please fill all fields');
        return;
    }
    
    try {
        const response = await fetch(`http://localhost:5000/order/${currentMerchantId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                customer_name: customerName,
                product: productName,
                total: parseFloat(amount)
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            createOrderModal.hide();
            loadOrders();
        } else {
            alert('Failed to create order');
        }
    } catch (error) {
        console.error('Error creating order:', error);
        alert('An error occurred while creating order');
    }
}

// Load orders
async function loadOrders() {
    try {
        const response = await fetch(`http://localhost:5000/orders/${currentMerchantId}`);
        const orders = await response.json();
        
        // Update orders table
        ordersTable.innerHTML = '';
        recentOrdersTable.innerHTML = '';
        
        let totalOrders = 0;
        let paidOrders = 0;
        let failedOrders = 0;
        
        // Sort orders by timestamp (newest first)
        orders.sort((a, b) => b.timestamp - a.timestamp);
        
        orders.forEach(order => {
            totalOrders++;
            if (order.status === 'paid') paidOrders++;
            if (order.status === 'failed') failedOrders++;
            
            // Format date
            const date = new Date(order.timestamp * 1000);
            const dateStr = date.toLocaleString();
            
            // Add to main orders table
            const row = document.createElement('tr');
            row.className = 'order-card';
            row.innerHTML = `
                <td>${order.id.substring(0, 8)}...</td>
                <td>${order.customer_name}</td>
                <td>${order.product}</td>
                <td>$${order.total.toFixed(2)}</td>
                <td><span class="status-badge status-${order.status}">${order.status}</span></td>
                <td>${dateStr}</td>
                <td>
                    ${order.status === 'pending' ? 
                        `<button class="btn btn-sm btn-outline-primary simulate-payment" data-order-id="${order.id}">
                            Simulate Payment
                        </button>` : ''}
                </td>
            `;
            ordersTable.appendChild(row);
            
            // Add to recent orders table (only first 5)
            if (recentOrdersTable.children.length < 5) {
                const recentRow = document.createElement('tr');
                recentRow.innerHTML = `
                    <td>${order.id.substring(0, 8)}...</td>
                    <td>${order.product}</td>
                    <td>$${order.total.toFixed(2)}</td>
                    <td><span class="status-badge status-${order.status}">${order.status}</span></td>
                    <td>${dateStr}</td>
                `;
                recentOrdersTable.appendChild(recentRow);
            }
        });
        
        // Update dashboard counters
        totalOrdersDisplay.textContent = totalOrders;
        paidOrdersDisplay.textContent = paidOrders;
        failedOrdersDisplay.textContent = failedOrders;
        
        // Add event listeners to simulate payment buttons
        document.querySelectorAll('.simulate-payment').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const orderId = e.target.getAttribute('data-order-id');
                simulatePayment(orderId);
            });
        });
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

// Simulate payment for an order
async function simulatePayment(orderId) {
    try {
        const response = await fetch(`http://localhost:5000/simulate-payment/${currentMerchantId}/${orderId}`, {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Payment simulation started. Status will update in a few seconds.');
            // Refresh after 6 seconds to see the update
            setTimeout(loadOrders, 6000);
        } else {
            alert(data.message || 'Failed to simulate payment');
        }
    } catch (error) {
        console.error('Error simulating payment:', error);
        alert('An error occurred while simulating payment');
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', init);

//  let currentUser = null;
//         let currentMerchantId = null;
//         let ordersChart, paymentMethodsChart, revenueChart, statusDistributionChart, dailyPerformanceChart;
        
        // Initialize the app when the page loads
        document.addEventListener('DOMContentLoaded', function() {
            init();
            updateDateTime();
            setInterval(updateDateTime, 60000); // Update time every minute
            
            // Initialize charts with empty data
            initCharts();
        });
        
        function updateDateTime() {
            const now = new Date();
            document.getElementById('dashboard-time').textContent = now.toLocaleString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            document.getElementById('current-date').textContent = now.toLocaleDateString();
        }
        
        function initCharts() {
            const ctx1 = document.getElementById('ordersChart').getContext('2d');
            ordersChart = new Chart(ctx1, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Orders',
                        data: [],
                        backgroundColor: 'rgba(102, 126, 234, 0.2)',
                        borderColor: 'rgba(102, 126, 234, 1)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
            
            const ctx2 = document.getElementById('paymentMethodsChart').getContext('2d');
            paymentMethodsChart = new Chart(ctx2, {
                type: 'doughnut',
                data: {
                    labels: ['Mobile', 'Card', 'Bank'],
                    datasets: [{
                        data: [30, 45, 25],
                        backgroundColor: [
                            'rgba(67, 233, 123, 0.7)',
                            'rgba(102, 126, 234, 0.7)',
                            'rgba(255, 193, 7, 0.7)'
                        ],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
            
            const ctx3 = document.getElementById('revenueChart').getContext('2d');
            revenueChart = new Chart(ctx3, {
                type: 'bar',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Revenue ($)',
                        data: [1200, 1900, 1500, 2000, 1800, 2200],
                        backgroundColor: 'rgba(102, 126, 234, 0.7)'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
            
            const ctx4 = document.getElementById('statusDistributionChart').getContext('2d');
            statusDistributionChart = new Chart(ctx4, {
                type: 'pie',
                data: {
                    labels: ['Paid', 'Pending', 'Failed'],
                    datasets: [{
                        data: [65, 15, 20],
                        backgroundColor: [
                            'rgba(67, 233, 123, 0.7)',
                            'rgba(255, 193, 7, 0.7)',
                            'rgba(255, 117, 140, 0.7)'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
            
            const ctx5 = document.getElementById('dailyPerformanceChart').getContext('2d');
            dailyPerformanceChart = new Chart(ctx5, {
                type: 'line',
                data: {
                    labels: Array.from({length: 30}, (_, i) => `Day ${i+1}`),
                    datasets: [{
                        label: 'Orders',
                        data: Array.from({length: 30}, () => Math.floor(Math.random() * 20) + 5),
                        borderColor: 'rgba(102, 126, 234, 1)',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true
                    }, {
                        label: 'Revenue',
                        data: Array.from({length: 30}, () => Math.floor(Math.random() * 500) + 100),
                        borderColor: 'rgba(67, 233, 123, 1)',
                        backgroundColor: 'rgba(67, 233, 123, 0.1)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
          document.getElementById('sidebarToggle').addEventListener('click', function() {
            document.getElementById('sidebar').classList.toggle('active');
        });
        
        // Help FAB
        document.getElementById('help-fab').addEventListener('click', function() {
            new bootstrap.Modal(document.getElementById('helpModal')).show();
        });
        