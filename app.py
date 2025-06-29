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
        try:
            if not os.path.exists(DATA_FILE):
                self.initialize_sample_data()
                return

            if os.path.getsize(DATA_FILE) == 0:
                self.initialize_sample_data()
                return

            with open(DATA_FILE) as f:
                data = json.load(f)
            
            if not isinstance(data, dict):
                raise ValueError("Invalid data format")
            
            self.merchants = {}
            for k, v in data.get("merchants", {}).items():
                try:
                    self.merchants[k] = Merchant(**v)
                except TypeError as e:
                    print(f"Warning: Couldn't load merchant {k}: {str(e)}")
            
            self.orders = defaultdict(dict)
            for merchant_id, orders in data.get("orders", {}).items():
                for order_id, order_data in orders.items():
                    try:
                        self.orders[merchant_id][order_id] = Order(**order_data)
                    except TypeError as e:
                        print(f"Warning: Couldn't load order {order_id} for merchant {merchant_id}: {str(e)}")
            
            self.users = {}
            for k, v in data.get("users", {}).items():
                try:
                    self.users[k] = User(**v)
                except TypeError as e:
                    print(f"Warning: Couldn't load user {k}: {str(e)}")
                    
        except json.JSONDecodeError as e:
            print(f"Error loading data file: {str(e)}. Initializing fresh database.")
            self.initialize_sample_data()
        except Exception as e:
            print(f"Unexpected error loading data: {str(e)}")
            self.initialize_sample_data()

    def initialize_sample_data(self):
        print("Initializing sample data...")
        
        self.merchants = {}
        self.orders = defaultdict(dict)
        self.users = {}
        
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

# Initialize database
try:
    db = Database()
except Exception as e:
    print(f"Fatal error initializing database: {str(e)}")
    raise

# API Endpoints
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    user = db.users.get(username)
    
    if user and user.password == password:
        return jsonify({
            "success": True,
            "message": "Login successful",
            "user": {
                "username": user.username,
                "name": user.name,
                "email": user.email,
                "role": user.role,
                "merchant_id": user.merchant_id
            }
        })
    else:
        return jsonify({
            "success": False,
            "message": "Invalid username or password"
        }), 401

@app.route('/merchant/<merchant_id>', methods=['GET', 'POST'])
def merchant_settings(merchant_id):
    if request.method == 'GET':
        merchant = db.merchants.get(merchant_id)
        if merchant:
            return jsonify(asdict(merchant))
        return jsonify({"method": None})
    
    elif request.method == 'POST':
        data = request.get_json()
        
        # Validate required fields based on payment method
        method = data.get('method')
        if not method:
            return jsonify({"success": False, "message": "Payment method is required"}), 400
            
        required_fields = {
            'mobile': ['label', 'provider', 'phone_number'],
            'card': ['label', 'card_number', 'expiry', 'cvv'],
            'bank': ['label', 'account_number', 'bank_name', 'branch_code']
        }.get(method, [])
        
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({
                "success": False,
                "message": f"Missing required fields: {', '.join(missing_fields)}"
            }), 400
        
        # Update or create merchant
        if merchant_id in db.merchants:
            merchant = db.merchants[merchant_id]
            for key, value in data.items():
                setattr(merchant, key, value)
            merchant.updated_at = time.time()
        else:
            data['id'] = merchant_id
            data['commission_rate'] = COMMISSION_RATES.get(method, 2.5)
            merchant = Merchant(**data)
            db.merchants[merchant_id] = merchant
        
        db.save_data()
        return jsonify({
            "success": True,
            "message": "Settings saved",
            "merchant": asdict(merchant)
        })

@app.route('/orders/<merchant_id>', methods=['GET'])
def get_orders(merchant_id):
    orders = list(db.orders.get(merchant_id, {}).values())
    return jsonify(orders)

@app.route('/order/<merchant_id>', methods=['POST'])
def create_order(merchant_id):
    data = request.get_json()
    order_id = str(uuid.uuid4())
    
    order = Order(
        id=order_id,
        merchant_id=merchant_id,
        customer_name=data['customer_name'],
        product=data['product'],
        total=data['total'],
        status="pending",
        timestamp=time.time(),
        payment_method=db.merchants[merchant_id].method,
        commission=round(data['total'] * db.merchants[merchant_id].commission_rate / 100, 2)
    )
    
    db.orders[merchant_id][order_id] = order
    db.save_data()
    
    return jsonify({
        "success": True,
        "order_id": order_id
    })

@app.route('/simulate-payment/<merchant_id>/<order_id>', methods=['POST'])
def simulate_payment(merchant_id, order_id):
    if merchant_id not in db.orders or order_id not in db.orders[merchant_id]:
        return jsonify({"success": False, "message": "Order not found"}), 404
    
    order = db.orders[merchant_id][order_id]
    
    def process_payment():
        time.sleep(3)  # Simulate processing delay
        
        # Randomly determine success (80%) or failure (20%)
        if random.random() < 0.8:
            order.status = "paid"
            order.payment_processed_at = time.time()
        else:
            order.status = "failed"
        
        db.save_data()
    
    # Process payment in background
    threading.Thread(target=process_payment).start()
    
    return jsonify({
        "success": True,
        "message": "Payment processing started"
    })

# Analytics Endpoints
@app.route('/analytics/orders/<merchant_id>')
def get_order_analytics(merchant_id):
    orders = db.orders.get(merchant_id, {})
    
    dates = []
    order_counts = []
    revenue_data = []
    
    for i in range(30):
        date = (datetime.now() - timedelta(days=29 - i)).strftime('%Y-%m-%d')
        dates.append(date)
        
        day_orders = [o for o in orders.values() 
                     if datetime.fromtimestamp(o.timestamp).strftime('%Y-%m-%d') == date]
        
        order_counts.append(len(day_orders))
        revenue_data.append(round(sum(o.total for o in day_orders if o.status == 'paid'), 2))
    
    return jsonify({
        'dates': dates,
        'order_counts': order_counts,
        'revenue_data': revenue_data
    })

@app.route('/analytics/payment-methods/<merchant_id>')
def get_payment_methods_analytics(merchant_id):
    orders = db.orders.get(merchant_id, {})
    
    methods = {'mobile': 0, 'card': 0, 'bank': 0}
    for order in orders.values():
        methods[order.payment_method] += 1
    
    return jsonify(methods)

@app.route('/analytics/status-distribution/<merchant_id>')
def get_status_distribution(merchant_id):
    orders = db.orders.get(merchant_id, {})
    
    statuses = {'paid': 0, 'pending': 0, 'failed': 0}
    for order in orders.values():
        statuses[order.status] += 1
    
    total = sum(statuses.values())
    if total > 0:
        for key in statuses:
            statuses[key] = round((statuses[key] / total) * 100, 1)
    
    return jsonify(statuses)
# Add to your existing endpoints in app.py

@app.route('/order/<merchant_id>/<order_id>', methods=['GET', 'PUT', 'DELETE'])
def order_detail(merchant_id, order_id):
    if merchant_id not in db.orders or order_id not in db.orders[merchant_id]:
        return jsonify({"success": False, "message": "Order not found"}), 404
    
    order = db.orders[merchant_id][order_id]
    
    if request.method == 'GET':
        return jsonify(asdict(order))
    
    elif request.method == 'PUT':
        data = request.get_json()
        
        # Update order fields
        if 'customer_name' in data:
            order.customer_name = data['customer_name']
        if 'product' in data:
            order.product = data['product']
        if 'total' in data:
            order.total = float(data['total'])
        if 'status' in data:
            order.status = data['status']
            if data['status'] == 'paid' and order.status != 'paid':
                order.payment_processed_at = time.time()
        
        db.save_data()
        return jsonify({
            "success": True,
            "message": "Order updated",
            "order": asdict(order)
        })
    
    elif request.method == 'DELETE':
        del db.orders[merchant_id][order_id]
        db.save_data()
        return jsonify({
            "success": True,
            "message": "Order deleted"
        })

if __name__ == '__main__':
    app.run(debug=True, port=5000)