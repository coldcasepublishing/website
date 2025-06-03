from flask import Blueprint, jsonify, request
from src.models.ecommerce.cart import CartItem
from src.models.ecommerce.book import Book
from src.models.user import db

cart_bp = Blueprint('cart', __name__)

@cart_bp.route('/cart', methods=['GET'])
def get_cart():
    """Get user's shopping cart"""
    # In a real app, get user_id from session/token
    user_id = request.args.get('user_id', 1)  # Default to 1 for demo
    
    cart_items = CartItem.query.filter_by(user_id=user_id).all()
    
    total = sum(item.book.price * item.quantity for item in cart_items if item.book)
    
    return jsonify({
        'success': True,
        'cart_items': [item.to_dict() for item in cart_items],
        'total': total,
        'item_count': len(cart_items)
    }), 200

@cart_bp.route('/cart/add', methods=['POST'])
def add_to_cart():
    """Add item to shopping cart"""
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['book_id', 'quantity']
    for field in required_fields:
        if field not in data:
            return jsonify({
                'success': False,
                'message': f'Missing required field: {field}'
            }), 400
    
    # In a real app, get user_id from session/token
    user_id = data.get('user_id', 1)  # Default to 1 for demo
    book_id = data['book_id']
    quantity = int(data['quantity'])
    
    # Check if book exists
    book = Book.query.get(book_id)
    if not book:
        return jsonify({
            'success': False,
            'message': 'Book not found'
        }), 404
    
    # Check if item already in cart
    cart_item = CartItem.query.filter_by(user_id=user_id, book_id=book_id).first()
    
    if cart_item:
        # Update quantity if already in cart
        cart_item.quantity += quantity
    else:
        # Add new item to cart
        cart_item = CartItem(user_id=user_id, book_id=book_id, quantity=quantity)
        db.session.add(cart_item)
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Item added to cart',
        'cart_item': cart_item.to_dict()
    }), 200

@cart_bp.route('/cart/update', methods=['PUT'])
def update_cart_item():
    """Update cart item quantity"""
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['cart_item_id', 'quantity']
    for field in required_fields:
        if field not in data:
            return jsonify({
                'success': False,
                'message': f'Missing required field: {field}'
            }), 400
    
    cart_item_id = data['cart_item_id']
    quantity = int(data['quantity'])
    
    # Find cart item
    cart_item = CartItem.query.get(cart_item_id)
    
    if not cart_item:
        return jsonify({
            'success': False,
            'message': 'Cart item not found'
        }), 404
    
    if quantity <= 0:
        # Remove item if quantity is 0 or negative
        db.session.delete(cart_item)
    else:
        # Update quantity
        cart_item.quantity = quantity
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Cart updated successfully'
    }), 200

@cart_bp.route('/cart/remove/<int:cart_item_id>', methods=['DELETE'])
def remove_from_cart(cart_item_id):
    """Remove item from shopping cart"""
    cart_item = CartItem.query.get(cart_item_id)
    
    if not cart_item:
        return jsonify({
            'success': False,
            'message': 'Cart item not found'
        }), 404
    
    db.session.delete(cart_item)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Item removed from cart'
    }), 200

@cart_bp.route('/cart/clear', methods=['DELETE'])
def clear_cart():
    """Clear all items from shopping cart"""
    # In a real app, get user_id from session/token
    user_id = request.args.get('user_id', 1)  # Default to 1 for demo
    
    CartItem.query.filter_by(user_id=user_id).delete()
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Cart cleared successfully'
    }), 200
