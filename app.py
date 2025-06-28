from flask import Flask, jsonify, request
from flask_cors import CORS
import time
import threading
from collections import defaultdict
import uuid
import random
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

# Mock database with enhanced data structure
merchants = {
    "m1": {
        "method": "mobile",
        "label": "My Mobile Money",
        "provider": "MTN",
        "phone_number": "0977123456",
        "commission_rate": 2.5  # Added commission rate
    },
    "m2": {
        "method": "card",
        "label": "Business Visa Card",
        "card_number": "4111111111111111",
        "expiry": "12/25",
        "cvv": "123",
        "commission_rate": 3.0
    }
}

orders = defaultdict(dict)

# Generate some historical order data for analytics
for i in range(1, 6):
    merchant_id = f"m{1 if i % 2 else 2}"
    order_date = datetime.now() - timedelta(days=30 - i)
    orders[merchant_id][f"order{i}"] = {
        "id": f"order{i}",
        "customer_name": f"Customer {i}",
        "product": f"Product {i}",
        "total": round(100 * (1 + random.random()), 2),
        "status": random.choice(["paid", "paid", "paid", "pending", "failed"]),
        "timestamp": int(order_date.timestamp()),
        "payment_method": merchants[merchant_id]["method"],
        "commission": round(100 * (1 + random.random()) * merchants[merchant_id]["commission_rate"] / 100, 2)
    }

payment_methods = {
    "mobile": {
        "required_fields": ["label", "provider", "phone_number"],
        "providers": ["MTN", "Airtel", "Zamtel"]
    },
    "card": {
        "required_fields": ["label", "card_number", "expiry", "cvv"],
        "providers": ["Visa", "Mastercard", "American Express"]
    },
    "bank": {
        "required_fields": ["label", "account_number", "bank_name", "branch_code"],
        "providers": ["ZANACO", "Stanbic", "Absa", "FNB"]
    }
}

# Enhanced mock authentication
users = {
    "admin": {
        "password": "admin123",
        "role": "admin",
        "name": "Admin User",
        "email": "admin@ghala.com"
    },
    "merchant1": {
        "password": "merchant123",
        "role": "merchant",
        "merchant_id": "m1",
        "name": "Merchant One",
        "email": "merchant1@business.com"
    },
    "merchant2": {
        "password": "merchant123",
        "role": "merchant",
        "merchant_id": "m2",
        "name": "Merchant Two",
        "email": "merchant2@business.com"
    }
}

# Helper function to simulate async payment processing
def process_payment_async(order_id, merchant_id):
    time.sleep(5)  # Simulate payment processing time
    status = "paid" if random.random() > 0.2 else "failed"
    orders[merchant_id][order_id]["status"] = status
    orders[merchant_id][order_id]["payment_processed_at"] = int(time.time())
    print(f"Order {order_id} payment processed. Status: {status}")

# Analytics helper functions
def generate_analytics_data(merchant_id, days=30):
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    dates = []
    order_counts = []
    revenue_data = []
    
    for day in range(days):
        current_date = start_date + timedelta(days=day)
        date_key = current_date.strftime("%Y-%m-%d")
        dates.append(date_key)
        
        # Count orders for this date
        day_orders = [
            o for o in orders[merchant_id].values() 
            if datetime.fromtimestamp(o["timestamp"]).strftime("%Y-%m-%d") == date_key
        ]
        order_counts.append(len(day_orders))
        
        # Calculate revenue for this date
        revenue = sum(o["total"] for o in day_orders if o["status"] == "paid")
        revenue_data.append(revenue)
    
    return {
        "dates": dates,
        "order_counts": order_counts,
        "revenue_data": revenue_data
    }

def get_payment_method_distribution(merchant_id):
    merchant_orders = orders[merchant_id].values()
    total = len(merchant_orders)
    if total == 0:
        return {"mobile": 0, "card": 0, "bank": 0}
    
    mobile = len([o for o in merchant_orders if o.get("payment_method") == "mobile"]) / total * 100
    card = len([o for o in merchant_orders if o.get("payment_method") == "card"]) / total * 100
    bank = len([o for o in merchant_orders if o.get("payment_method") == "bank"]) / total * 100
    
    return {
        "mobile": round(mobile, 1),
        "card": round(card, 1),
        "bank": round(bank, 1)
    }

def get_status_distribution(merchant_id):
    merchant_orders = orders[merchant_id].values()
    total = len(merchant_orders)
    if total == 0:
        return {"paid": 0, "pending": 0, "failed": 0}
    
    paid = len([o for o in merchant_orders if o["status"] == "paid"]) / total * 100
    pending = len([o for o in merchant_orders if o["status"] == "pending"]) / total * 100
    failed = len([o for o in merchant_orders if o["status"] == "failed"]) / total * 100
    
    return {
        "paid": round(paid, 1),
        "pending": round(pending, 1),
        "failed": round(failed, 1)
    }

# Routes
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if username in users and users[username]['password'] == password:
        return jsonify({
            "success": True,
            "user": {
                "username": username,
                "name": users[username].get("name"),
                "email": users[username].get("email"),
                "role": users[username]['role'],
                "merchant_id": users[username].get('merchant_id')
            }
        })
    return jsonify({"success": False, "message": "Invalid credentials"}), 401

@app.route('/payment-methods', methods=['GET'])
def get_payment_methods():
    return jsonify(payment_methods)

@app.route('/merchant/<merchant_id>', methods=['GET', 'POST'])
def merchant_config(merchant_id):
    if request.method == 'POST':
        data = request.get_json()
        # Add commission rate if not provided
        if "commission_rate" not in data:
            data["commission_rate"] = 2.5  # Default commission
        merchants[merchant_id] = data
        return jsonify({"success": True, "message": "Payment method updated"})
    else:
        return jsonify(merchants.get(merchant_id, {}))

@app.route('/order/<merchant_id>', methods=['POST'])
def create_order(merchant_id):
    data = request.get_json()
    order_id = str(uuid.uuid4())
    
    # Get merchant's payment method
    merchant_method = merchants.get(merchant_id, {}).get("method", "mobile")
    
    order = {
        "id": order_id,
        "customer_name": data.get("customer_name", "Anonymous"),
        "product": data.get("product", "Unknown Product"),
        "total": float(data.get("total", 0)),
        "status": "pending",
        "timestamp": int(time.time()),
        "payment_method": merchant_method,
        "commission": float(data.get("total", 0)) * merchants.get(merchant_id, {}).get("commission_rate", 2.5) / 100
    }
    
    orders[merchant_id][order_id] = order
    
    # Start async payment processing
    threading.Thread(target=process_payment_async, args=(order_id, merchant_id)).start()
    
    return jsonify({"success": True, "order": order})

@app.route('/orders/<merchant_id>', methods=['GET'])
def get_orders(merchant_id):
    status_filter = request.args.get('status', 'all')
    merchant_orders = list(orders.get(merchant_id, {}).values())
    
    if status_filter != 'all':
        merchant_orders = [o for o in merchant_orders if o["status"] == status_filter]
    
    # Sort by timestamp (newest first)
    merchant_orders.sort(key=lambda x: x["timestamp"], reverse=True)
    
    return jsonify(merchant_orders)

@app.route('/simulate-payment/<merchant_id>/<order_id>', methods=['POST'])
def simulate_payment(merchant_id, order_id):
    if merchant_id in orders and order_id in orders[merchant_id]:
        threading.Thread(target=process_payment_async, args=(order_id, merchant_id)).start()
        return jsonify({"success": True, "message": "Payment simulation started"})
    return jsonify({"success": False, "message": "Order not found"}), 404

# Analytics endpoints
@app.route('/analytics/orders/<merchant_id>', methods=['GET'])
def get_order_analytics(merchant_id):
    days = int(request.args.get('days', 30))
    analytics_data = generate_analytics_data(merchant_id, days)
    return jsonify(analytics_data)

@app.route('/analytics/payment-methods/<merchant_id>', methods=['GET'])
def get_payment_method_analytics(merchant_id):
    distribution = get_payment_method_distribution(merchant_id)
    return jsonify(distribution)

@app.route('/analytics/status-distribution/<merchant_id>', methods=['GET'])
def get_status_distribution_analytics(merchant_id):
    distribution = get_status_distribution(merchant_id)
    return jsonify(distribution)

if __name__ == '__main__':
    app.run(debug=True, port=5000)