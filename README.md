# 📦 Ghala Merchant Payment System – Core Simulation

This is a simulation system built for the **Ghala Technical Intern Challenge**. It demonstrates how merchants configure payment methods and handle customer orders with payment tracking and real-time analytics.

## 🚀 Features

- Merchant login system
- Configurable payment methods:
- Order creation and payment simulation
- Analytics dashboard with charts:
  - Orders over time
  - Revenue tracking
  - Payment method distribution
  - Order status distribution
- Light/Dark mode toggle
- Responsive UI using Bootstrap + Chart.js

## 🛠️ Tech Stack

| Frontend              | Backend     | Data Storage |
|-----------------------|-------------|--------------|
| HTML, CSS, Bootstrap  | Flask (Python) | JSON file (mock DB) |
| JavaScript (Chart.js) |                 | `merchant_data.json` |

## 📁 Folder Structure

```
ghala-merchant-system/
├──
│   └── app.py
│   └── merchant_data.json
├── 
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── README.md
```

## ✅ Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Azi77ry/Ghala-Merchant-Payment-System
cd ghala-merchant-system
```

### 2. Start the Backend
pip install flask flask-cors
python app.py
```

> 🟢 Flask server will run at: `http://localhost:5000`

### 3. Start the Frontend

Open `index.html` directly in your browser:

```

## 👤 Sample Users

| Username    | Password     | Role     |
|-------------|--------------|----------|
| admin       | admin123     | admin    |
| merchant2   | merchant123  | Merchant(m2)|


## 📊 Analytics Preview

- Bar chart: Total revenue
- Line chart: Orders vs Revenue
- Doughnut chart: Payment method usage
- Pie chart: Paid vs Pending vs Failed

## 🧪 Test Scenario

1. Login as `merchant1`
2. Configure a payment method under "Payment Settings"
3. Go to "Orders" and create a test order
4. Simulate payment on the order
5. Return to "Dashboard" to view updated analytics

## 📌 Notes

- All data is stored in `merchant_data.json` (no external DB needed).
- Payments are simulated asynchronously (status changes after ~3 seconds).
- This is a demo system, not connected to actual payment gateways.

## 📧 Contact

Created by **Azizi Iddi** for the Ghala Technical Intern Challenge.
Phone contact **0692350076** , **0616650076**
