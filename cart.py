from datetime import datetime
from src.models.user import db

class CartItem(db.Model):
    """Cart item model for storing shopping cart items"""
    __tablename__ = 'cart_items'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False)
    book_id = db.Column(db.Integer, db.ForeignKey('books.id'), nullable=False)
    quantity = db.Column(db.Integer, default=1)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    book = db.relationship('Book', backref=db.backref('cart_items', lazy=True))

    def __init__(self, user_id, book_id, quantity=1):
        self.user_id = user_id
        self.book_id = book_id
        self.quantity = quantity

    def to_dict(self):
        """Convert cart item object to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'book_id': self.book_id,
            'book': self.book.to_dict() if self.book else None,
            'quantity': self.quantity,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'updated_at': self.updated_at.strftime('%Y-%m-%d %H:%M:%S')
        }
