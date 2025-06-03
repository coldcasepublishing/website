from flask import Blueprint, jsonify, request
from src.models.ecommerce.book import Book
from src.models.user import db

book_bp = Blueprint('book', __name__)

@book_bp.route('/books', methods=['GET'])
def get_books():
    """Get all books or filter by category"""
    category = request.args.get('category')
    featured = request.args.get('featured')
    
    query = Book.query
    
    if category:
        query = query.filter_by(category=category)
    
    if featured and featured.lower() == 'true':
        query = query.filter_by(featured=True)
    
    books = query.all()
    return jsonify({
        'success': True,
        'books': [book.to_dict() for book in books]
    }), 200

@book_bp.route('/books/<int:book_id>', methods=['GET'])
def get_book(book_id):
    """Get a specific book by ID"""
    book = Book.query.get(book_id)
    
    if not book:
        return jsonify({
            'success': False,
            'message': 'Book not found'
        }), 404
    
    return jsonify({
        'success': True,
        'book': book.to_dict()
    }), 200

@book_bp.route('/books/featured', methods=['GET'])
def get_featured_books():
    """Get featured books"""
    books = Book.query.filter_by(featured=True).all()
    return jsonify({
        'success': True,
        'books': [book.to_dict() for book in books]
    }), 200

@book_bp.route('/books/search', methods=['GET'])
def search_books():
    """Search books by title or author"""
    query = request.args.get('q', '')
    
    if not query:
        return jsonify({
            'success': False,
            'message': 'Search query is required'
        }), 400
    
    books = Book.query.filter(
        (Book.title.ilike(f'%{query}%')) | 
        (Book.author.ilike(f'%{query}%'))
    ).all()
    
    return jsonify({
        'success': True,
        'books': [book.to_dict() for book in books]
    }), 200

# Admin routes for book management
@book_bp.route('/admin/books', methods=['POST'])
def create_book():
    """Create a new book (admin only)"""
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['title', 'author', 'price']
    for field in required_fields:
        if field not in data:
            return jsonify({
                'success': False,
                'message': f'Missing required field: {field}'
            }), 400
    
    # Create new book
    book = Book(
        title=data['title'],
        author=data['author'],
        price=data['price'],
        description=data.get('description'),
        cover_image=data.get('cover_image'),
        isbn=data.get('isbn'),
        publication_date=data.get('publication_date'),
        pages=data.get('pages'),
        stock=data.get('stock', 0),
        featured=data.get('featured', False),
        category=data.get('category')
    )
    
    db.session.add(book)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Book created successfully',
        'book': book.to_dict()
    }), 201

@book_bp.route('/admin/books/<int:book_id>', methods=['PUT'])
def update_book(book_id):
    """Update a book (admin only)"""
    book = Book.query.get(book_id)
    
    if not book:
        return jsonify({
            'success': False,
            'message': 'Book not found'
        }), 404
    
    data = request.get_json()
    
    # Update book fields
    if 'title' in data:
        book.title = data['title']
    if 'author' in data:
        book.author = data['author']
    if 'price' in data:
        book.price = data['price']
    if 'description' in data:
        book.description = data['description']
    if 'cover_image' in data:
        book.cover_image = data['cover_image']
    if 'isbn' in data:
        book.isbn = data['isbn']
    if 'publication_date' in data:
        book.publication_date = data['publication_date']
    if 'pages' in data:
        book.pages = data['pages']
    if 'stock' in data:
        book.stock = data['stock']
    if 'featured' in data:
        book.featured = data['featured']
    if 'category' in data:
        book.category = data['category']
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Book updated successfully',
        'book': book.to_dict()
    }), 200

@book_bp.route('/admin/books/<int:book_id>', methods=['DELETE'])
def delete_book(book_id):
    """Delete a book (admin only)"""
    book = Book.query.get(book_id)
    
    if not book:
        return jsonify({
            'success': False,
            'message': 'Book not found'
        }), 404
    
    db.session.delete(book)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Book deleted successfully'
    }), 200
