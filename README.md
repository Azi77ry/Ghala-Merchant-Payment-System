
# Ghala Core Systems Simulation

This is a simplified simulation of how Ghala handles merchant payment configurations and order processing.

## 🌐 System Overview

This system allows:
- Merchants to configure and store their preferred payment methods (mobile, card, or bank).
- Customers to place orders (mock product + total).
- The system to record and manage order status: `pending`, `paid`, or `failed`.
- Simulation of payment confirmation using background async tasks.

## 🛠️ Tech Stack

- **Backend**: Python (FastAPI)
- **Frontend**: HTML, CSS, Bootstrap, JavaScript
- **Data Storage**: In-memory (dictionaries)

---

## ⚙️ System Functionality

### Merchants
- Add new merchants and payment configuration via `merchant.html`
- Payment Method includes:
  - `label`: A user-defined label
  - `provider`: Payment service (e.g., M-Pesa, Stripe)
  - `config_fields`: Additional settings (JSON format)

<!-- ### Orders
- Place new orders using `create_order.html`
- Orders automatically start in `pending` state
- Status updated to `paid` after 5 seconds using async simulation
- Manually trigger payment update using `orders.html` -->

---

## 🧠 Architecture + Thinking

### 1. Multi-Merchant Support
- Each merchant is uniquely identified by `merchant.id`
- All payment configurations are stored per merchant in memory
- Orders reference merchant by ID for clarity and scalability

### 2. Supporting Commission Rates (Extensibility)
To support per-merchant commission rates:
- Add a new field `commission_rate` to the `Merchant` model
- Compute commissions during order processing
- This allows tracking revenue for Ghala




