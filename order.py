from datetime import datetime
from src.models.user import db

class Order(db.Model):
    """Order model for storing customer orders"""
    __tablename__ = 'orders'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False)
    total_amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(50), default='pending')  # pending, paid, shipped, delivered, cancelled
    shipping_address = db.Column(db.Text, nullable=True)
    billing_address = db.Column(db.Text, nullable=True)
    payment_id = db.Column(db.String(255), nullable=True)  # Reference to payment gateway transaction
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship with order items defined in OrderItem model

    def __init__(self, user_id, total_amount, shipping_address=None, billing_address=None):
        self.user_id = user_id
        self.total_amount = total_amount
        self.shipping_address = shipping_address
        self.billing_address = billing_address

    def to_dict(self):
        """Convert order object to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'total_amount': self.total_amount,
            'status': self.status,
            'shipping_address': self.shipping_address,
            'billing_address': self.billing_address,
            'payment_id': self.payment_id,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'updated_at': self.updated_at.strftime('%Y-%m-%d %H:%M:%S'),
            'items': [item.to_dict() for item in self.items] if hasattr(self, 'items') else []
        }


class OrderItem(db.Model):
    """Order item model for storing items in an order"""
    __tablename__ = 'order_items'

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    book_id = db.Column(db.Integer, db.ForeignKey('books.id'), nullable=False)
    quantity = db.Column(db.Integer, default=1)
    price = db.Column(db.Float, nullable=False)  # Price at time of purchase
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    order = db.relationship('Order', backref=db.backref('items', lazy=True))
    book = db.relationship('Book', backref=db.backref('order_items', lazy=True))

    def __init__(self, order_id, book_id, quantity, price):
        self.order_id = order_id
        self.book_id = book_id
        self.quantity = quantity
        self.price = price

    def to_dict(self):
        """Convert order item object to dictionary"""
        return {
            'id': self.id,
            'order_id': self.order_id,
            'book_id': self.book_id,
            'book_title': self.book.title if self.book else None,
            'quantity': self.quantity,
            'price': self.price,
            'subtotal': self.price * self.quantity,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }
