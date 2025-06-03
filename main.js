// Main JavaScript file for Cold Case Publishing website
// Handles e-commerce functionality and UI interactions

// Global variables
let cart = [];
let books = [];
let currentUser = {
    id: 1, // Default user ID for demo
    name: 'Guest User'
};

// DOM Ready function
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    initApp();
    
    // Add event listeners
    setupEventListeners();
});

// Initialize the application
function initApp() {
    // Load books from API
    fetchBooks();
    
    // Load cart from API
    fetchCart();
    
    // Check if user is logged in
    checkUserSession();
}

// Setup event listeners
function setupEventListeners() {
    // Navigation menu toggle for mobile
    const menuToggle = document.getElementById('menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleMobileMenu);
    }
    
    // Search form
    const searchForm = document.getElementById('search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', handleSearch);
    }
    
    // Newsletter signup
    const newsletterForm = document.getElementById('newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', handleNewsletterSignup);
    }
}

// Fetch books from API
async function fetchBooks(category = null, featured = false) {
    try {
        let url = '/api/books';
        const params = new URLSearchParams();
        
        if (category) {
            params.append('category', category);
        }
        
        if (featured) {
            params.append('featured', 'true');
        }
        
        if (params.toString()) {
            url += '?' + params.toString();
        }
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
            books = data.books;
            renderBooks(books);
        } else {
            console.error('Failed to fetch books:', data.message);
        }
    } catch (error) {
        console.error('Error fetching books:', error);
    }
}

// Render books to the page
function renderBooks(books, containerId = 'books-container') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    if (books.length === 0) {
        container.innerHTML = '<p class="no-books">No books found.</p>';
        return;
    }
    
    books.forEach(book => {
        const bookElement = createBookElement(book);
        container.appendChild(bookElement);
    });
}

// Create book element
function createBookElement(book) {
    const bookElement = document.createElement('div');
    bookElement.className = 'book-item';
    bookElement.dataset.id = book.id;
    
    const coverImage = book.cover_image || '/static/images/default-cover.jpg';
    
    bookElement.innerHTML = `
        <div class="book-cover">
            <img src="${coverImage}" alt="${book.title}" loading="lazy">
        </div>
        <div class="book-details">
            <h3 class="book-title">${book.title}</h3>
            <p class="book-author">by ${book.author}</p>
            <p class="book-price">$${book.price.toFixed(2)}</p>
            <p class="book-description">${book.description ? book.description.substring(0, 100) + '...' : ''}</p>
            <button class="btn add-to-cart-btn" data-id="${book.id}">Add to Cart</button>
        </div>
    `;
    
    // Add event listener to the Add to Cart button
    const addToCartBtn = bookElement.querySelector('.add-to-cart-btn');
    addToCartBtn.addEventListener('click', () => addToCart(book.id));
    
    return bookElement;
}

// Fetch cart from API
async function fetchCart() {
    try {
        const response = await fetch(`/api/cart?user_id=${currentUser.id}`);
        const data = await response.json();
        
        if (data.success) {
            cart = data.cart_items;
            updateCartUI();
        } else {
            console.error('Failed to fetch cart:', data.message);
        }
    } catch (error) {
        console.error('Error fetching cart:', error);
    }
}

// Add item to cart
async function addToCart(bookId, quantity = 1) {
    try {
        const response = await fetch('/api/cart/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: currentUser.id,
                book_id: bookId,
                quantity: quantity
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Refresh cart
            fetchCart();
            
            // Show success message
            showNotification('Book added to cart!', 'success');
        } else {
            console.error('Failed to add to cart:', data.message);
            showNotification('Failed to add book to cart.', 'error');
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        showNotification('Error adding book to cart.', 'error');
    }
}

// Update cart quantity
async function updateCartQuantity(cartItemId, quantity) {
    try {
        const response = await fetch('/api/cart/update', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                cart_item_id: cartItemId,
                quantity: quantity
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Refresh cart
            fetchCart();
        } else {
            console.error('Failed to update cart:', data.message);
            showNotification('Failed to update cart.', 'error');
        }
    } catch (error) {
        console.error('Error updating cart:', error);
        showNotification('Error updating cart.', 'error');
    }
}

// Remove item from cart
async function removeFromCart(cartItemId) {
    try {
        const response = await fetch(`/api/cart/remove/${cartItemId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Refresh cart
            fetchCart();
            
            // Show success message
            showNotification('Item removed from cart.', 'success');
        } else {
            console.error('Failed to remove from cart:', data.message);
            showNotification('Failed to remove item from cart.', 'error');
        }
    } catch (error) {
        console.error('Error removing from cart:', error);
        showNotification('Error removing item from cart.', 'error');
    }
}

// Update cart UI
function updateCartUI() {
    const cartCount = document.getElementById('cart-count');
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    
    if (cartCount) {
        const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
        cartCount.textContent = itemCount;
    }
    
    if (cartItems && cartTotal) {
        cartItems.innerHTML = '';
        
        if (cart.length === 0) {
            cartItems.innerHTML = '<p class="empty-cart">Your cart is empty.</p>';
            cartTotal.textContent = '$0.00';
            return;
        }
        
        let total = 0;
        
        cart.forEach(item => {
            if (!item.book) return;
            
            const book = item.book;
            const subtotal = book.price * item.quantity;
            total += subtotal;
            
            const cartItemElement = document.createElement('div');
            cartItemElement.className = 'cart-item';
            cartItemElement.innerHTML = `
                <div class="cart-item-image">
                    <img src="${book.cover_image || '/static/images/default-cover.jpg'}" alt="${book.title}">
                </div>
                <div class="cart-item-details">
                    <h4>${book.title}</h4>
                    <p>by ${book.author}</p>
                    <p>$${book.price.toFixed(2)} each</p>
                    <div class="quantity-control">
                        <button class="quantity-btn minus" data-id="${item.id}">-</button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="quantity-btn plus" data-id="${item.id}">+</button>
                    </div>
                    <p class="subtotal">Subtotal: $${subtotal.toFixed(2)}</p>
                    <button class="remove-btn" data-id="${item.id}">Remove</button>
                </div>
            `;
            
            // Add event listeners
            const minusBtn = cartItemElement.querySelector('.minus');
            const plusBtn = cartItemElement.querySelector('.plus');
            const removeBtn = cartItemElement.querySelector('.remove-btn');
            
            minusBtn.addEventListener('click', () => {
                if (item.quantity > 1) {
                    updateCartQuantity(item.id, item.quantity - 1);
                }
            });
            
            plusBtn.addEventListener('click', () => {
                updateCartQuantity(item.id, item.quantity + 1);
            });
            
            removeBtn.addEventListener('click', () => {
                removeFromCart(item.id);
            });
            
            cartItems.appendChild(cartItemElement);
        });
        
        cartTotal.textContent = `$${total.toFixed(2)}`;
    }
}

// Process checkout
async function processCheckout() {
    // Get form data
    const shippingAddress = document.getElementById('shipping-address').value;
    const billingAddress = document.getElementById('billing-address').value;
    
    if (!shippingAddress || !billingAddress) {
        showNotification('Please fill in all required fields.', 'error');
        return;
    }
    
    try {
        // Create order
        const orderResponse = await fetch('/api/checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: currentUser.id,
                shipping_address: shippingAddress,
                billing_address: billingAddress
            })
        });
        
        const orderData = await orderResponse.json();
        
        if (!orderData.success) {
            showNotification('Failed to create order: ' + orderData.message, 'error');
            return;
        }
        
        const order = orderData.order;
        
        // Create payment intent
        const paymentResponse = await fetch('/api/payment/create-intent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                order_id: order.id
            })
        });
        
        const paymentData = await paymentResponse.json();
        
        if (!paymentData.success) {
            showNotification('Failed to process payment: ' + paymentData.message, 'error');
            return;
        }
        
        // In a real application, we would use Stripe.js to handle payment
        // For this demo, we'll simulate a successful payment
        
        // Confirm payment
        const confirmResponse = await fetch('/api/payment/confirm', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                order_id: order.id,
                payment_id: 'demo_payment_' + Date.now()
            })
        });
        
        const confirmData = await confirmResponse.json();
        
        if (confirmData.success) {
            // Redirect to order confirmation page
            window.location.href = `/order-confirmation?order_id=${order.id}`;
        } else {
            showNotification('Failed to confirm payment: ' + confirmData.message, 'error');
        }
    } catch (error) {
        console.error('Error processing checkout:', error);
        showNotification('Error processing checkout.', 'error');
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Hide and remove notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Toggle mobile menu
function toggleMobileMenu() {
    const nav = document.querySelector('nav ul');
    nav.classList.toggle('show');
}

// Handle search form submission
function handleSearch(event) {
    event.preventDefault();
    
    const searchInput = document.getElementById('search-input');
    const query = searchInput.value.trim();
    
    if (!query) return;
    
    // Redirect to search results page
    window.location.href = `/search?q=${encodeURIComponent(query)}`;
}

// Handle newsletter signup
function handleNewsletterSignup(event) {
    event.preventDefault();
    
    const emailInput = document.getElementById('newsletter-email');
    const email = emailInput.value.trim();
    
    if (!email) {
        showNotification('Please enter your email address.', 'error');
        return;
    }
    
    // In a real application, we would send this to the server
    // For this demo, we'll just show a success message
    
    showNotification('Thank you for subscribing to our newsletter!', 'success');
    emailInput.value = '';
}

// Check user session
function checkUserSession() {
    // In a real application, we would check if the user is logged in
    // For this demo, we'll use the default user
    
    const userInfo = document.getElementById('user-info');
    if (userInfo) {
        userInfo.textContent = currentUser.name;
    }
}
