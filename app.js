// Global variables
let currentUser = null;
let currentMerchantId = null;
let charts = {
    orders: null,
    paymentMethods: null,
    revenue: null,
    statusDistribution: null,
    dailyPerformance: null,
    monthlyTrends: null
};

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const appContainer = document.getElementById('app-container');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const currentUsernameDisplay = document.getElementById('current-username');
const ordersTable = document.getElementById('orders-table');
const recentOrdersTable = document.getElementById('recent-orders-table');
const totalOrdersDisplay = document.getElementById('total-orders');
const paidOrdersDisplay = document.getElementById('paid-orders');
const failedOrdersDisplay = document.getElementById('failed-orders');
const paymentMethodSelect = document.getElementById('payment-method');
const methodConfigFields = document.getElementById('method-config-fields');
const paymentSettingsForm = document.getElementById('payment-settings-form');
const noSettingsMessage = document.getElementById('no-settings-message');
const settingsDisplay = document.getElementById('settings-display');
const settingsData = document.getElementById('settings-data');
const createOrderBtn = document.getElementById('create-order-btn');
const refreshOrdersBtn = document.getElementById('refresh-orders-btn');
const confirmCreateOrderBtn = document.getElementById('confirm-create-order');
const confirmEditOrderBtn = document.getElementById('confirm-edit-order');
const refreshDashboardBtn = document.getElementById('refresh-dashboard-btn');

// Navigation links
const navLinks = document.querySelectorAll('.nav-link[data-section]');

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', function() {
    init();
    updateDateTime();
    setInterval(updateDateTime, 60000);
    
    // Initialize charts with empty data
    initCharts();
    
    // Initialize tooltips
    initTooltips();
    
    // Initialize dark mode toggle
    initDarkMode();
    
    // Initialize sidebar toggle
    document.getElementById('sidebarToggle').addEventListener('click', function() {
        document.getElementById('sidebar').classList.toggle('active');
    });
    
    // Initialize help FAB
    document.getElementById('help-fab').addEventListener('click', function() {
        new bootstrap.Modal(document.getElementById('helpModal')).show();
    });
    
    // Event listeners
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
    createOrderBtn.addEventListener('click', () => new bootstrap.Modal(document.getElementById('createOrderModal')).show());
    confirmCreateOrderBtn.addEventListener('click', createTestOrder);
    refreshOrdersBtn.addEventListener('click', loadOrders);
    refreshDashboardBtn.addEventListener('click', refreshDashboard);
    confirmEditOrderBtn.addEventListener('click', saveEditedOrder);
});

function init() {
    // Check if user is already logged in
    const savedUser = sessionStorage.getItem('ghalaUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        currentMerchantId = currentUser.merchant_id || 'm1';
        showApp();
    }
}

function initTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

function initDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', toggleDarkMode);
        
        // Check for saved user preference
        if (localStorage.getItem('darkMode') === 'enabled') {
            document.body.classList.add('dark-mode');
            darkModeToggle.innerHTML = '<i class="bi bi-sun-fill"></i>';
        }
    }
}

function toggleDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    document.body.classList.toggle('dark-mode');
    
    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('darkMode', 'enabled');
        darkModeToggle.innerHTML = '<i class="bi bi-sun-fill"></i>';
    } else {
        localStorage.setItem('darkMode', 'disabled');
        darkModeToggle.innerHTML = '<i class="bi bi-moon-fill"></i>';
    }
    
    updateChartThemes();
}

function updateChartThemes() {
    const isDarkMode = document.body.classList.contains('dark-mode');
    const textColor = isDarkMode ? '#f8f9fa' : '#212529';
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const bgColor = isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)';
    
    Object.values(charts).forEach(chart => {
        if (chart) {
            chart.options.scales.x.grid.color = gridColor;
            chart.options.scales.y.grid.color = gridColor;
            chart.options.scales.x.ticks.color = textColor;
            chart.options.scales.y.ticks.color = textColor;
            chart.options.plugins.legend.labels.color = textColor;
            chart.update();
        }
    });
}

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

async function initCharts() {
    if (!currentMerchantId) return;
    
    try {
        // Load all analytics data in parallel
        const [ordersData, paymentMethodsData, statusData] = await Promise.all([
            fetch(`http://localhost:5000/analytics/orders/${currentMerchantId}`).then(res => res.json()),
            fetch(`http://localhost:5000/analytics/payment-methods/${currentMerchantId}`).then(res => res.json()),
            fetch(`http://localhost:5000/analytics/status-distribution/${currentMerchantId}`).then(res => res.json())
        ]);
        
        createOrdersChart(ordersData);
        createPaymentMethodsChart(paymentMethodsData);
        createStatusDistributionChart(statusData);
        createRevenueChart(ordersData);
        createDailyPerformanceChart(ordersData);
        createMonthlyTrendsChart();
        
        updateChartThemes();
    } catch (error) {
        console.error('Error initializing charts:', error);
    }
}

function createOrdersChart(data) {
    const ctx = document.getElementById('ordersChart').getContext('2d');
    
    const labels = data.dates;
    const orderData = data.order_counts;
    
    if (charts.orders) {
        charts.orders.data.labels = labels;
        charts.orders.data.datasets[0].data = orderData;
        charts.orders.update();
        return;
    }
    
    charts.orders = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Orders',
                data: orderData,
                backgroundColor: 'rgba(102, 126, 234, 0.2)',
                borderColor: 'rgba(102, 126, 234, 1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: 'rgba(102, 126, 234, 1)',
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        color: '#212529'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        color: '#212529'
                    }
                }
            }
        }
    });
}

function createPaymentMethodsChart(data) {
    const ctx = document.getElementById('paymentMethodsChart').getContext('2d');
    
    const labels = ['Mobile', 'Card', 'Bank'];
    const chartData = [data.mobile || 0, data.card || 0, data.bank || 0];
    
    if (charts.paymentMethods) {
        charts.paymentMethods.data.datasets[0].data = chartData;
        charts.paymentMethods.update();
        return;
    }
    
    charts.paymentMethods = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: chartData,
                backgroundColor: [
                    'rgba(67, 233, 123, 0.7)',
                    'rgba(102, 126, 234, 0.7)',
                    'rgba(255, 193, 7, 0.7)'
                ],
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        color: '#212529'
                    }
                }
            }
        }
    });
}

function createRevenueChart(data) {
    const ctx = document.getElementById('revenueChart').getContext('2d');
    
    const labels = data.dates;
    const revenueData = data.revenue_data;
    
    if (charts.revenue) {
        charts.revenue.data.labels = labels;
        charts.revenue.data.datasets[0].data = revenueData;
        charts.revenue.update();
        return;
    }
    
    charts.revenue = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Revenue ($)',
                data: revenueData,
                backgroundColor: 'rgba(102, 126, 234, 0.7)',
                borderRadius: 4,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        color: '#212529'
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#212529'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `$${context.raw.toFixed(2)}`;
                        }
                    }
                }
            }
        }
    });
}

function createStatusDistributionChart(data) {
    const ctx = document.getElementById('statusDistributionChart').getContext('2d');
    
    const labels = ['Paid', 'Pending', 'Failed'];
    const chartData = [data.paid || 0, data.pending || 0, data.failed || 0];
    
    if (charts.statusDistribution) {
        charts.statusDistribution.data.datasets[0].data = chartData;
        charts.statusDistribution.update();
        return;
    }
    
    charts.statusDistribution = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: chartData,
                backgroundColor: [
                    'rgba(67, 233, 123, 0.7)',
                    'rgba(255, 193, 7, 0.7)',
                    'rgba(255, 117, 140, 0.7)'
                ],
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        color: '#212529'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.raw}%`;
                        }
                    }
                }
            }
        }
    });
}

function createDailyPerformanceChart(data) {
    const ctx = document.getElementById('dailyPerformanceChart').getContext('2d');
    
    const labels = data.dates;
    const orderData = data.order_counts;
    const revenueData = data.revenue_data;
    
    if (charts.dailyPerformance) {
        charts.dailyPerformance.data.labels = labels;
        charts.dailyPerformance.data.datasets[0].data = orderData;
        charts.dailyPerformance.data.datasets[1].data = revenueData;
        charts.dailyPerformance.update();
        return;
    }
    
    charts.dailyPerformance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Orders',
                data: orderData,
                borderColor: 'rgba(102, 126, 234, 1)',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                yAxisID: 'y'
            }, {
                label: 'Revenue ($)',
                data: revenueData,
                borderColor: 'rgba(67, 233, 123, 1)',
                backgroundColor: 'rgba(67, 233, 123, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                yAxisID: 'y1'
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
                    type: 'linear',
                    display: true,
                    position: 'left',
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        color: '#212529'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    beginAtZero: true,
                    grid: {
                        drawOnChartArea: false,
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        color: '#212529'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        color: '#212529'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.datasetIndex === 1) {
                                label += `$${context.raw.toFixed(2)}`;
                            } else {
                                label += context.raw;
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

function createMonthlyTrendsChart() {
    const ctx = document.getElementById('monthlyTrendsChart').getContext('2d');
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const revenueData = months.map(() => Math.floor(Math.random() * 5000) + 1000);
    const growthData = months.map((_, i) => {
        if (i === 0) return 0;
        return ((revenueData[i] - revenueData[i-1]) / revenueData[i-1] * 100).toFixed(1);
    });
    
    if (charts.monthlyTrends) {
        charts.monthlyTrends.data.datasets[0].data = revenueData;
        charts.monthlyTrends.data.datasets[1].data = growthData;
        charts.monthlyTrends.update();
        return;
    }
    
    charts.monthlyTrends = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [{
                label: 'Revenue ($)',
                data: revenueData,
                backgroundColor: 'rgba(102, 126, 234, 0.7)',
                borderRadius: 4,
                borderSkipped: false,
                yAxisID: 'y'
            }, {
                label: 'Growth Rate (%)',
                data: growthData,
                type: 'line',
                borderColor: 'rgba(67, 233, 123, 1)',
                backgroundColor: 'rgba(67, 233, 123, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: false,
                yAxisID: 'y1'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        color: '#212529'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    beginAtZero: true,
                    grid: {
                        drawOnChartArea: false,
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        color: '#212529'
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#212529'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.datasetIndex === 0) {
                                label += `$${context.raw.toFixed(2)}`;
                            } else {
                                label += `${context.raw}%`;
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

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
            currentMerchantId = currentUser.merchant_id || 'm1';
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

function handleLogout() {
    currentUser = null;
    currentMerchantId = null;
    sessionStorage.removeItem('ghalaUser');
    hideApp();
}

function showApp() {
    loginScreen.style.display = 'none';
    appContainer.style.display = 'block';
    currentUsernameDisplay.textContent = currentUser.username;
    
    loadPaymentSettings();
    loadOrders();
    showSection('dashboard');
    
    navLinks.forEach(link => link.classList.remove('active'));
    document.querySelector('.nav-link[data-section="dashboard"]').classList.add('active');
}

function hideApp() {
    loginScreen.style.display = 'block';
    appContainer.style.display = 'none';
    usernameInput.value = '';
    passwordInput.value = '';
}

function showSection(section) {
    document.querySelectorAll('.main-content > div').forEach(div => {
        div.style.display = 'none';
    });
    
    document.getElementById(`${section}-section`).style.display = 'block';
}

function updatePaymentMethodFields() {
    const method = paymentMethodSelect.value;
    methodConfigFields.innerHTML = '';
    
    if (!method) return;
    
    const paymentMethodsConfig = {
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
    
    const config = paymentMethodsConfig[method];
    
    const labelGroup = document.createElement('div');
    labelGroup.className = 'mb-3';
    labelGroup.innerHTML = `
        <label for="payment-label" class="form-label">Label</label>
        <input type="text" class="form-control" id="payment-label" placeholder="e.g., My Mobile Money">
    `;
    methodConfigFields.appendChild(labelGroup);
    
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

async function savePaymentSettings(e) {
    e.preventDefault();
    
    const method = paymentMethodSelect.value;
    if (!method) {
        alert('Please select a payment method');
        return;
    }
    
    // Get all configuration values
    const config = {
        method: method,
        label: document.getElementById('payment-label').value
    };
    
    // Add provider if applicable
    const providerSelect = document.getElementById('payment-provider');
    if (providerSelect) {
        config.provider = providerSelect.value;
    }
    
    // Add other fields based on payment method
    if (method === 'mobile') {
        config.phone_number = document.getElementById('payment-phone_number').value;
    } else if (method === 'card') {
        config.card_number = document.getElementById('payment-card_number').value;
        config.expiry = document.getElementById('payment-expiry').value;
        config.cvv = document.getElementById('payment-cvv').value;
    } else if (method === 'bank') {
        config.account_number = document.getElementById('payment-account_number').value;
        config.bank_name = document.getElementById('payment-bank_name').value;
        config.branch_code = document.getElementById('payment-branch_code').value;
    }
    
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
            await loadPaymentSettings();
            initCharts();
        } else {
            alert('Failed to save payment settings: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error saving payment settings:', error);
        alert('An error occurred while saving payment settings. Check console for details.');
    }
}

async function loadPaymentSettings() {
    try {
        const response = await fetch(`http://localhost:5000/merchant/${currentMerchantId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.method) {
            noSettingsMessage.style.display = 'none';
            settingsDisplay.style.display = 'block';
            
            // Format the settings for display
            const displayData = {...data};
            // Hide sensitive information
            if (displayData.card_number) {
                displayData.card_number = '•••• •••• •••• ' + displayData.card_number.slice(-4);
            }
            if (displayData.cvv) {
                displayData.cvv = '•••';
            }
            
            settingsData.textContent = JSON.stringify(displayData, null, 2);
            
            // Update form fields
            paymentMethodSelect.value = data.method;
            updatePaymentMethodFields();
            
            // Small delay to ensure fields are rendered
            setTimeout(() => {
                document.getElementById('payment-label').value = data.label || '';
                
                if (data.provider) {
                    const providerSelect = document.getElementById('payment-provider');
                    if (providerSelect) {
                        providerSelect.value = data.provider;
                    }
                }
                
                // Set other field values based on payment method
                if (data.method === 'mobile' && data.phone_number) {
                    document.getElementById('payment-phone_number').value = data.phone_number;
                } else if (data.method === 'card') {
                    if (data.card_number) document.getElementById('payment-card_number').value = data.card_number;
                    if (data.expiry) document.getElementById('payment-expiry').value = data.expiry;
                    if (data.cvv) document.getElementById('payment-cvv').value = data.cvv;
                } else if (data.method === 'bank') {
                    if (data.account_number) document.getElementById('payment-account_number').value = data.account_number;
                    if (data.bank_name) document.getElementById('payment-bank_name').value = data.bank_name;
                    if (data.branch_code) document.getElementById('payment-branch_code').value = data.branch_code;
                }
            }, 100);
        } else {
            noSettingsMessage.style.display = 'block';
            settingsDisplay.style.display = 'none';
        }
    } catch (error) {
        console.error('Error loading payment settings:', error);
        alert('Failed to load payment settings. Check console for details.');
    }
}

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
            document.getElementById('createOrderModal').querySelector('.btn-close').click();
            loadOrders();
        } else {
            alert('Failed to create order');
        }
    } catch (error) {
        console.error('Error creating order:', error);
        alert('An error occurred while creating order');
    }
}

async function editOrder(orderId) {
    try {
        const response = await fetch(`http://localhost:5000/order/${currentMerchantId}/${orderId}`);
        const order = await response.json();
        
        document.getElementById('edit-order-id').value = order.id;
        document.getElementById('edit-customer-name').value = order.customer_name;
        document.getElementById('edit-product-name').value = order.product;
        document.getElementById('edit-order-amount').value = order.total;
        document.getElementById('edit-order-status').value = order.status;
        
        const editModal = new bootstrap.Modal(document.getElementById('editOrderModal'));
        editModal.show();
    } catch (error) {
        console.error('Error loading order for edit:', error);
        alert('Failed to load order details for editing');
    }
}

async function saveEditedOrder() {
    const orderId = document.getElementById('edit-order-id').value;
    const customerName = document.getElementById('edit-customer-name').value.trim();
    const productName = document.getElementById('edit-product-name').value.trim();
    const amount = document.getElementById('edit-order-amount').value.trim();
    const status = document.getElementById('edit-order-status').value;
    
    if (!customerName || !productName || !amount) {
        alert('Please fill all required fields');
        return;
    }
    
    try {
        const response = await fetch(`http://localhost:5000/order/${currentMerchantId}/${orderId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                customer_name: customerName,
                product: productName,
                total: parseFloat(amount),
                status: status
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            bootstrap.Modal.getInstance(document.getElementById('editOrderModal')).hide();
            await loadOrders();
        } else {
            alert('Failed to update order: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error updating order:', error);
        alert('An error occurred while updating the order');
    }
}

async function deleteOrder(orderId) {
    if (!confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(`http://localhost:5000/order/${currentMerchantId}/${orderId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            await loadOrders();
        } else {
            alert('Failed to delete order: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error deleting order:', error);
        alert('An error occurred while deleting the order');
    }
}

async function simulatePayment(orderId) {
    try {
        const response = await fetch(`http://localhost:5000/simulate-payment/${currentMerchantId}/${orderId}`, {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Payment simulation started. Status will update in a few seconds.');
            setTimeout(loadOrders, 6000);
        } else {
            alert(data.message || 'Failed to simulate payment');
        }
    } catch (error) {
        console.error('Error simulating payment:', error);
        alert('An error occurred while simulating payment');
    }
}

async function loadOrders() {
    try {
        const response = await fetch(`http://localhost:5000/orders/${currentMerchantId}`);
        const orders = await response.json();
        
        ordersTable.innerHTML = '';
        recentOrdersTable.innerHTML = '';
        
        let totalOrders = 0;
        let paidOrders = 0;
        let failedOrders = 0;
        let totalRevenue = 0;
        
        orders.sort((a, b) => b.timestamp - a.timestamp);
        
        orders.forEach(order => {
            totalOrders++;
            if (order.status === 'paid') {
                paidOrders++;
                totalRevenue += order.total;
            }
            if (order.status === 'failed') failedOrders++;
            
            const date = new Date(order.timestamp * 1000);
            const dateStr = date.toLocaleString();
            
            const row = document.createElement('tr');
            row.className = 'order-card';
            row.innerHTML = `
                <td>${order.id.substring(0, 8)}...</td>
                <td>${order.customer_name}</td>
                <td>${order.product}</td>
                <td>$${order.total.toFixed(2)}</td>
                <td><span class="status-badge status-${order.status}">${order.status}</span></td>
                <td>${dateStr}</td>
                <td class="text-nowrap">
                    <div class="d-flex gap-2">
                        <button class="btn btn-sm btn-outline-primary edit-order" data-order-id="${order.id}" data-bs-toggle="tooltip" title="Edit order">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger delete-order" data-order-id="${order.id}" data-bs-toggle="tooltip" title="Delete order">
                            <i class="bi bi-trash"></i>
                        </button>
                        ${order.status === 'pending' ? 
                            `<button class="btn btn-sm btn-outline-success simulate-payment" data-order-id="${order.id}" data-bs-toggle="tooltip" title="Simulate payment">
                                <i class="bi bi-credit-card"></i>
                            </button>` : ''}
                    </div>
                </td>
            `;
            ordersTable.appendChild(row);
            
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
        
        totalOrdersDisplay.textContent = totalOrders;
        paidOrdersDisplay.textContent = paidOrders;
        failedOrdersDisplay.textContent = failedOrders;
        
        document.getElementById('total-revenue').textContent = `$${totalRevenue.toFixed(2)}`;
        
        // Add event listeners to action buttons
        document.querySelectorAll('.edit-order').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const orderId = e.target.closest('button').getAttribute('data-order-id');
                editOrder(orderId);
            });
        });
        
        document.querySelectorAll('.delete-order').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const orderId = e.target.closest('button').getAttribute('data-order-id');
                deleteOrder(orderId);
            });
        });
        
        document.querySelectorAll('.simulate-payment').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const orderId = e.target.closest('button').getAttribute('data-order-id');
                simulatePayment(orderId);
            });
        });
        
        // Initialize tooltips for the new buttons
        initTooltips();
        
    } catch (error) {
        console.error('Error loading orders:', error);
        alert('Failed to load orders. Check console for details.');
    }
}

function refreshDashboard() {
    loadOrders();
    initCharts();
}


function initFooter() {
  // Update copyright year
  document.getElementById('current-year').textContent = new Date().getFullYear();
  
  // Add footer button effects
  document.querySelectorAll('.footer-btn').forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      btn.classList.add('animate__animated', 'animate__pulse');
    });
    btn.addEventListener('mouseleave', () => {
      btn.classList.remove('animate__animated', 'animate__pulse');
    });
  });
}

// Call this in your DOMContentLoaded event
document.addEventListener('DOMContentLoaded', initFooter);