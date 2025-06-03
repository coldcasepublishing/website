from flask import Blueprint, jsonify, request
from src.models.ecommerce.order import Order, OrderItem
from src.models.ecommerce.cart import CartItem
from src.models.ecommerce.book import Book
from src.models.user import db
import stripe
import os

order_bp = Blueprint('order', __name__)

# Configure Stripe - in production, this would use environment variables
stripe.api_key = os.getenv('STRIPE_SECRET_KEY', 'sk_test_example')

@order_bp.route('/orders', methods=['GET'])
def get_orders():
    """Get user's orders"""
    # In a real app, get user_id from session/token
    user_id = request.args.get('user_id', 1)  # Default to 1 for demo
    
    orders = Order.query.filter_by(user_id=user_id).all()
    
    return jsonify({
        'success': True,
        'orders': [order.to_dict() for order in orders]
    }), 200

@order_bp.route('/orders/<int:order_id>', methods=['GET'])
def get_order(order_id):
    """Get a specific order by ID"""
    order = Order.query.get(order_id)
    
    if not order:
        return jsonify({
            'success': False,
            'message': 'Order not found'
        }), 404
    
    return jsonify({
        'success': True,
        'order': order.to_dict()
    }), 200

@order_bp.route('/checkout', methods=['POST'])
def checkout():
    """Process checkout and create order"""
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['shipping_address', 'billing_address']
    for field in required_fields:
        if field not in data:
            return jsonify({
                'success': False,
                'message': f'Missing required field: {field}'
            }), 400
    
    # In a real app, get user_id from session/token
    user_id = data.get('user_id', 1)  # Default to 1 for demo
    
    # Get cart items
    cart_items = CartItem.query.filter_by(user_id=user_id).all()
    
    if not cart_items:
        return jsonify({
            'success': False,
            'message': 'Cart is empty'
        }), 400
    
    # Calculate total amount
    total_amount = sum(item.book.price * item.quantity for item in cart_items if item.book)
    
    # Create order
    order = Order(
        user_id=user_id,
        total_amount=total_amount,
        shipping_address=data['shipping_address'],
        billing_address=data['billing_address']
    )
    
    db.session.add(order)
    db.session.flush()  # Get order ID without committing
    
    # Create order items
    for cart_item in cart_items:
        if cart_item.book:
            order_item = OrderItem(
                order_id=order.id,
                book_id=cart_item.book_id,
                quantity=cart_item.quantity,
                price=cart_item.book.price
            )
            db.session.add(order_item)
    
    # Clear cart
    CartItem.query.filter_by(user_id=user_id).delete()
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Order created successfully',
        'order': order.to_dict()
    }), 201

@order_bp.route('/payment/create-intent', methods=['POST'])
def create_payment_intent():
    """Create a payment intent with Stripe"""
    data = request.get_json()
    
    # Validate required fields
    if 'order_id' not in data:
        return jsonify({
            'success': False,
            'message': 'Missing order_id'
        }), 400
    
    order = Order.query.get(data['order_id'])
    
    if not order:
        return jsonify({
            'success': False,
            'message': 'Order not found'
        }), 404
    
    try:
        # Create a PaymentIntent with the order amount and currency
        intent = stripe.PaymentIntent.create(
            amount=int(order.total_amount * 100),  # Convert to cents
            currency='usd',
            metadata={
                'order_id': order.id
            }
        )
        
        return jsonify({
            'success': True,
            'clientSecret': intent.client_secret
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 400

@order_bp.route('/payment/confirm', methods=['POST'])
def confirm_payment():
    """Confirm payment and update order status"""
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['order_id', 'payment_id']
    for field in required_fields:
        if field not in data:
            return jsonify({
                'success': False,
                'message': f'Missing required field: {field}'
            }), 400
    
    order = Order.query.get(data['order_id'])
    
    if not order:
        return jsonify({
            'success': False,
            'message': 'Order not found'
        }), 404
    
    # Update order with payment information
    order.payment_id = data['payment_id']
    order.status = 'paid'
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Payment confirmed',
        'order': order.to_dict()
    }), 200
