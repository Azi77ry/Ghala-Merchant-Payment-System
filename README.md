# Ghala Merchant Payment System

This project is a submission for the **Ghala Technical Intern Challenge – Core Systems Simulation**. It simulates a basic system for managing merchant payment configurations and processing customer orders via WhatsApp commerce.

## 🌐 Overview

Ghala enables WhatsApp commerce for merchants. Each merchant can configure their preferred payment method (mobile, card, or bank). When a customer places an order, the system records it and updates the status based on payment confirmation.

This system demonstrates:

* Merchant payment method setup
* Order creation and status updates
* Simulated payment confirmation

---

## ⚙️ Features

### Backend (Python Flask / Node.js / Django based)

* Merchants can configure payment methods (mobile, card, bank) with relevant details
* Customers can place mocked product orders
* Each order starts as `pending`, and a mock function changes the status to `paid` after 5 seconds
* RESTful API endpoints for merchants and orders

### Frontend (HTML + CSS + JS or Bootstrap/Tailwind)

* **Merchant Settings**: Form to input payment method and configuration
* **Order List**: Display all orders with status
* **Simulate Payment**: Button to manually trigger simulated payment confirmation

---

## 🧠 Architecture & Design Thinking

### 🔄 Multiple Merchant Support

Each merchant's data is stored independently, including their payment method and configuration fields. The system uses unique merchant identifiers to ensure proper isolation and retrieval.

### 💰 Commission Rates (Scalability Extension)

To support different commission rates:

* Add a `commission_rate` field to the merchant model
* During payment processing, apply this rate when calculating the final amount

### ⚡ Scaling to 10,000+ Merchants

To handle scale:

* Use asynchronous job queues (like Celery or Bull) for payment confirmation
* Implement database indexing and caching
* Use a microservices architecture and load balancing for backend services
* Integrate a message queue (RabbitMQ, Kafka) for event-driven processing

---


## 🚀 How to Run
# Python Flask
pip install -r requirements.txt
python app.py


```


## 📽️ Demo

👉 (Optional) \[Loom video link here]

---

## 📁 Project Structure

```
ghala-system/
├── backend/
│   ├── app.py
│   
│ 
├── frontend/
│   ├── index.html
│   
└── README.md
```

---

## 🧑‍💻 Author

**Azizi Iddi**
GitHub: [Azi77ry](https://github.com/Azi77ry)
