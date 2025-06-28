from flask import Flask, jsonify, request
from flask_cors import CORS
import time
import threading
from collections import defaultdict
import uuid
import random
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from typing import Dict, List, Optional
import json
import os

app = Flask(__name__)
CORS(app)

# Configuration
DATA_FILE = "merchant_data.json"
COMMISSION_RATES = {
    "mobile": 2.5,
    "card": 3.0,
    "bank": 2.0
}

# Data Models
@dataclass
class Merchant:
    id: str
    method: str
    label: str
    provider: Optional[str] = None
    phone_number: Optional[str] = None
    card_number: Optional[str] = None
    expiry: Optional[str] = None
    cvv: Optional[str] = None
    account_number: Optional[str] = None
    bank_name: Optional[str] = None
    branch_code: Optional[str] = None
    commission_rate: float = 2.5
    created_at: float = time.time()
    updated_at: float = time.time()

@dataclass
class Order:
    id: str
    merchant_id: str
    customer_name: str
    product: str
    total: float
    status: str
    timestamp: float
    payment_method: str
    commission: float
    payment_processed_at: Optional[float] = None

@dataclass
class User:
    username: str
    password: str
    role: str
    name: str
    email: str
    merchant_id: Optional[str] = None

# Mock Database
class Database:
    def __init__(self):
        self.merchants: Dict[str, Merchant] = {}
        self.orders: Dict[str, Dict[str, Order]] = defaultdict(dict)
        self.users: Dict[str, User] = {}
        self.payment_methods = {
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
        self.load_data()

    def save_data(self):
        data = {
            "merchants": {k: asdict(v) for k, v in self.merchants.items()},
            "orders": {k: {ik: asdict(iv) for ik, iv in v.items()} for k, v in self.orders.items()},
            "users": {k: asdict(v) for k, v in self.users.items()}
        }
        with open(DATA_FILE, "w") as f:
            json.dump(data, f, indent=2)

    def load_data(self):
        if not os.path.exists(DATA_FILE):
            self.initialize_sample_data()
            return

        with open(DATA_FILE) as f:
            data = json.load(f)
        
        self.merchants = {k: Merchant(**v) for k, v in data.get("merchants", {}).items()}
        
        self.orders = defaultdict(dict)
        for merchant_id, orders in data.get("orders", {}).items():
            for order_id, order_data in orders.items():
                self.orders[merchant_id][order_id] = Order(**order_data)
        
        self.users = {k: User(**v) for k, v in data.get("users", {}).items()}

    def initialize_sample_data(self):
        # Sample merchants
        self.merchants["m1"] = Merchant(
            id="m1",
            method="mobile",
            label="My Mobile Money",
            provider="MTN",
            phone_number="0977123456",
            commission_rate=COMMISSION_RATES["mobile"]
        )
        
        self.merchants["m2"] = Merchant(
            id="m2",
            method="card",
            label="Business Visa Card",
            card_number="4111111111111111",
            expiry="12/25",
            cvv="123",
            commission_rate=COMMISSION_RATES["card"]
        )
        
        # Sample users
        self.users["admin"] = User(
            username="admin",
            password="admin123",
            role="admin",
            name="Admin User",
            email="admin@ghala.com"
        )
        
        self.users["merchant1"] = User(
            username="merchant1",
            password="merchant123",
            role="merchant",
            merchant_id="m1",
            name="Merchant One",
            email="merchant1@business.com"
        )
        
        self.users["merchant2"] = User(
            username="merchant2",
            password="merchant123",
            role="merchant",
            merchant_id="m2",
            name="Merchant Two",
            email="merchant2@business.com"
        )
        
        # Generate historical order data
        for i in range(1, 21):
            merchant_id = f"m{1 if i % 2 else 2}"
            order_date = datetime.now() - timedelta(days=30 - (i % 30))
            order_id = f"order{i}"
            
            total = round(100 * (1 + random.random()), 2)
            status = random.choices(
                ["paid", "pending", "failed"],
                weights=[0.7, 0.2, 0.1]
            )[0]
            
            self.orders[merchant_id][order_id] = Order(
                id=order_id,
                merchant_id=merchant_id,
                customer_name=f"Customer {i}",
                product=f"Product {i}",
                total=total,
                status=status,
                timestamp=order_date.timestamp(),
                payment_method=self.merchants[merchant_id].method,
                commission=round(total * self.merchants[merchant_id].commission_rate / 100, 2),
                payment_processed_at=order_date.timestamp() if status != "pending" else None
            )
        
        self.save_data()

db = Database()

# Helper Functions
def process_payment_async(order_id: str, merchant_id: str):
    """Simulate async payment processing"""
    time.sleep(5)  # Simulate payment processing time
    
    # Determine payment success (80% success rate)
    status = "paid" if random.random() > 0.2 else "failed"
    
    with app.app_context():
        if merchant_id in db.orders and order_id in db.orders[merchant_id]:
            db.orders[merchant_id][order_id].status = status
            db.orders[merchant_id][order_id].payment_processed_at = time.time()
            db.save_data()
            print(f"Order {order_id} payment processed. Status: {status}")

def generate_analytics_data(merchant_id: str, days: int = 30) -> Dict:
    """Generate analytics data for the given merchant"""
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    dates = []
    order_counts = []
    revenue_data = []
    
    for day in range(days):
        current_date = start_date + timedelta(days=day)
        date_key = current_date.strftime("%Y-%m-%d")
        dates.append(date_key)
        
        # Filter orders for this date
        day_orders = [
            o for o in db.orders[merchant_id].values() 
            if datetime.fromtimestamp(o.timestamp).strftime("%Y-%m-%d") == date_key
        ]
        
        order_counts.append(len(day_orders))
        revenue = sum(o.total for o in day_orders if o.status == "paid")
        revenue_data.append(revenue)
    
    return {
        "dates": dates,
        "order_counts": order_counts,
        "revenue_data": revenue_data
    }

def get_payment_method_distribution(merchant_id: str) -> Dict:
    """Get payment method distribution for merchant"""
    merchant_orders = db.orders[merchant_id].values()
    total = len(merchant_orders)
    
    if total == 0:
        return {"mobile": 0, "card": 0, "bank": 0}
    
    counts = {
        "mobile": len([o for o in merchant_orders if o.payment_method == "mobile"]),
        "card": len([o for o in merchant_orders if o.payment_method == "card"]),
        "bank": len([o for o in merchant_orders if o.payment_method == "bank"])
    }
    
    return {k: round(v / total * 100, 1) for k, v in counts.items()}

def get_status_distribution(merchant_id: str) -> Dict:
    """Get order status distribution for merchant"""
    merchant_orders = db.orders[merchant_id].values()
    total = len(merchant_orders)
    
    if total == 0:
        return {"paid": 0, "pending": 0, "failed": 0}
    
    counts = {
        "paid": len([o for o in merchant_orders if o.status == "paid"]),
        "pending": len([o for o in merchant_orders if o.status == "pending"]),
        "failed": len([o for o in merchant_orders if o.status == "failed"])
    }
    
    return {k: round(v / total * 100, 1) for k, v in counts.items()}

# API Routes
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if username in db.users and db.users[username].password == password:
        user = db.users[username]
        return jsonify({
            "success": True,
            "user": {
                "username": username,
                "name": user.name,
                "email": user.email,
                "role": user.role,
                "merchant_id": user.merchant_id
            }
        })
    return jsonify({"success": False, "message": "Invalid credentials"}), 401

@app.route('/payment-methods', methods=['GET'])
def get_payment_methods():
    return jsonify(db.payment_methods)

@app.route('/merchant/<merchant_id>', methods=['GET', 'POST', 'PUT'])
def merchant_config(merchant_id):
    if request.method in ['POST', 'PUT']:
        data = request.get_json()
        
        # Validate required fields
        method = data.get("method")
        if method not in db.payment_methods:
            return jsonify({"success": False, "message": "Invalid payment method"}), 400
            
        required_fields = db.payment_methods[method]["required_fields"]
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            return jsonify({
                "success": False,
                "message": f"Missing required fields: {', '.join(missing_fields)}"
            }), 400
        
        # Set default commission rate if not provided
        if "commission_rate" not in data:
            data["commission_rate"] = COMMISSION_RATES.get(method, 2.5)
        
        # Create or update merchant
        if merchant_id in db.merchants:
            merchant = db.merchants[merchant_id]
            for key, value in data.items():
                setattr(merchant, key, value)
            merchant.updated_at = time.time()
        else:
            data["id"] = merchant_id
            db.merchants[merchant_id] = Merchant(**data)
        
        db.save_data()
        return jsonify({"success": True, "message": "Payment method updated"})
    
    else:  # GET
        merchant = db.merchants.get(merchant_id)
        if merchant:
            return jsonify(asdict(merchant))
        return jsonify({}), 404

@app.route('/order/<merchant_id>', methods=['POST'])
def create_order(merchant_id):
    data = request.get_json()
    
    if merchant_id not in db.merchants:
        return jsonify({"success": False, "message": "Merchant not found"}), 404
    
    merchant = db.merchants[merchant_id]
    order_id = str(uuid.uuid4())
    total = float(data.get("total", 0))
    
    order = Order(
        id=order_id,
        merchant_id=merchant_id,
        customer_name=data.get("customer_name", "Anonymous"),
        product=data.get("product", "Unknown Product"),
        total=total,
        status="pending",
        timestamp=time.time(),
        payment_method=merchant.method,
        commission=round(total * merchant.commission_rate / 100, 2)
    )
    
    db.orders[merchant_id][order_id] = order
    db.save_data()
    
    # Start async payment processing
    threading.Thread(target=process_payment_async, args=(order_id, merchant_id)).start()
    
    return jsonify({"success": True, "order": asdict(order)})

@app.route('/orders/<merchant_id>', methods=['GET'])
def get_orders(merchant_id):
    status_filter = request.args.get('status', 'all')
    merchant_orders = list(db.orders.get(merchant_id, {}).values())
    
    if status_filter != 'all':
        merchant_orders = [o for o in merchant_orders if o.status == status_filter]
    
    # Sort by timestamp (newest first)
    merchant_orders.sort(key=lambda x: x.timestamp, reverse=True)
    
    return jsonify([asdict(o) for o in merchant_orders])

@app.route('/simulate-payment/<merchant_id>/<order_id>', methods=['POST'])
def simulate_payment(merchant_id, order_id):
    if merchant_id in db.orders and order_id in db.orders[merchant_id]:
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

# Additional API Endpoints
@app.route('/merchants', methods=['GET'])
def get_all_merchants():
    """Admin endpoint to get all merchants"""
    return jsonify({k: asdict(v) for k, v in db.merchants.items()})

@app.route('/orders', methods=['GET'])
def get_all_orders():
    """Admin endpoint to get all orders"""
    all_orders = []
    for merchant_orders in db.orders.values():
        all_orders.extend([asdict(o) for o in merchant_orders.values()])
    
    # Sort by timestamp (newest first)
    all_orders.sort(key=lambda x: x["timestamp"], reverse=True)
    
    return jsonify(all_orders)

if __name__ == '__main__':
    app.run(debug=True, port=5000)