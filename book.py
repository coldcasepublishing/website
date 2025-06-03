from datetime import datetime
from src.models.user import db

class Book(db.Model):
    """Book model for storing book details"""
    __tablename__ = 'books'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    author = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    price = db.Column(db.Float, nullable=False)
    cover_image = db.Column(db.String(255), nullable=True)
    isbn = db.Column(db.String(20), nullable=True, unique=True)
    publication_date = db.Column(db.Date, nullable=True)
    pages = db.Column(db.Integer, nullable=True)
    stock = db.Column(db.Integer, default=0)
    featured = db.Column(db.Boolean, default=False)
    category = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __init__(self, title, author, price, description=None, cover_image=None, 
                 isbn=None, publication_date=None, pages=None, stock=0, 
                 featured=False, category=None):
        self.title = title
        self.author = author
        self.price = price
        self.description = description
        self.cover_image = cover_image
        self.isbn = isbn
        self.publication_date = publication_date
        self.pages = pages
        self.stock = stock
        self.featured = featured
        self.category = category

    def to_dict(self):
        """Convert book object to dictionary"""
        return {
            'id': self.id,
            'title': self.title,
            'author': self.author,
            'description': self.description,
            'price': self.price,
            'cover_image': self.cover_image,
            'isbn': self.isbn,
            'publication_date': self.publication_date.strftime('%Y-%m-%d') if self.publication_date else None,
            'pages': self.pages,
            'stock': self.stock,
            'featured': self.featured,
            'category': self.category,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'updated_at': self.updated_at.strftime('%Y-%m-%d %H:%M:%S')
        }
