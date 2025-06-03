// Cart Handler for Cold Case Publishing
// Simplified version for direct DOM manipulation without API calls

// Initialize cart from localStorage or create empty cart
let cart = JSON.parse(localStorage.getItem('coldCaseCart')) || [];

// DOM Ready function
document.addEventListener('DOMContentLoaded', function() {
    // Initialize cart UI
    updateCartUI();
    
    // Add event listeners to all "Add to Cart" buttons
    setupAddToCartButtons();
});

// Setup Add to Cart buttons
function setupAddToCartButtons() {
    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
    
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault();
            const bookId = this.getAttribute('data-id');
            addToCart(bookId);
        });
    });
}

// Add item to cart
function addToCart(bookId, quantity = 1) {
    // Get book details from the DOM
    const bookElement = document.querySelector(`.book-item[data-id="${bookId}"]`) || 
                        document.querySelector(`.book-item .add-to-cart-btn[data-id="${bookId}"]`).closest('.book-item');
    
    if (!bookElement) {
        showNotification('Error: Could not find book details.', 'error');
        return;
    }
    
    const title = bookElement.querySelector('.book-title').textContent;
    const author = bookElement.querySelector('.book-author').textContent;
    const priceText = bookElement.querySelector('.book-price').textContent;
    const price = parseFloat(priceText.replace('$', ''));
    const imgSrc = bookElement.querySelector('img').getAttribute('src');
    
    // Check if item already exists in cart
    const existingItemIndex = cart.findIndex(item => item.id === bookId);
    
    if (existingItemIndex !== -1) {
        // Update quantity if item exists
        cart[existingItemIndex].quantity += quantity;
    } else {
        // Add new item if it doesn't exist
        cart.push({
            id: bookId,
            title: title,
            author: author,
            price: price,
            imgSrc: imgSrc,
            quantity: quantity
        });
    }
    
    // Save cart to localStorage
    localStorage.setItem('coldCaseCart', JSON.stringify(cart));
    
    // Update UI
    updateCartUI();
    
    // Show success message
    showNotification('Book added to cart!', 'success');
}

// Update cart quantity
function updateCartQuantity(cartItemId, newQuantity) {
    const itemIndex = cart.findIndex(item => item.id === cartItemId);
    
    if (itemIndex === -1) {
        showNotification('Error: Item not found in cart.', 'error');
        return;
    }
    
    if (newQuantity < 1) {
        // Remove item if quantity is less than 1
        removeFromCart(cartItemId);
        return;
    }
    
    // Update quantity
    cart[itemIndex].quantity = newQuantity;
    
    // Save cart to localStorage
    localStorage.setItem('coldCaseCart', JSON.stringify(cart));
    
    // Update UI
    updateCartUI();
}

// Remove item from cart
function removeFromCart(cartItemId) {
    cart = cart.filter(item => item.id !== cartItemId);
    
    // Save cart to localStorage
    localStorage.setItem('coldCaseCart', JSON.stringify(cart));
    
    // Update UI
    updateCartUI();
    
    // Show success message
    showNotification('Item removed from cart.', 'success');
}

// Update cart UI
function updateCartUI() {
    const cartCount = document.getElementById('cart-count');
    
    if (cartCount) {
        const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
        cartCount.textContent = itemCount;
    }
    
    // Update cart page if we're on it
    const cartItemsContainer = document.querySelector('.cart-items');
    const cartSummary = document.querySelector('.summary-row');
    
    if (cartItemsContainer && cartSummary) {
        updateCartPage();
    }
}

// Update cart page
function updateCartPage() {
    const cartItemsContainer = document.querySelector('.cart-items');
    const emptyCartMessage = document.getElementById('empty-cart-message');
    const subtotalElement = document.querySelector('.summary-row:first-child span:last-child');
    const totalElement = document.querySelector('.summary-total span:last-child');
    
    if (!cartItemsContainer) return;
    
    // Clear current items
    cartItemsContainer.innerHTML = '';
    
    if (cart.length === 0) {
        // Show empty cart message
        if (emptyCartMessage) {
            emptyCartMessage.style.display = 'block';
        }
        
        if (subtotalElement) subtotalElement.textContent = '$0.00';
        if (totalElement) totalElement.textContent = '$0.00';
        return;
    }
    
    // Hide empty cart message
    if (emptyCartMessage) {
        emptyCartMessage.style.display = 'none';
    }
    
    // Calculate totals
    let subtotal = 0;
    
    // Add each item to the cart
    cart.forEach(item => {
        const itemSubtotal = item.price * item.quantity;
        subtotal += itemSubtotal;
        
        const cartItemElement = document.createElement('div');
        cartItemElement.className = 'cart-item';
        cartItemElement.innerHTML = `
            <div class="cart-item-image">
                <img src="${item.imgSrc}" alt="${item.title}">
            </div>
            <div class="cart-item-details">
                <h4>${item.title}</h4>
                <p>${item.author}</p>
                <p>$${item.price.toFixed(2)} each</p>
                <div class="quantity-control">
                    <button class="quantity-btn minus" data-id="${item.id}">-</button>
                    <span class="quantity">${item.quantity}</span>
                    <button class="quantity-btn plus" data-id="${item.id}">+</button>
                </div>
                <p class="subtotal">Subtotal: $${itemSubtotal.toFixed(2)}</p>
                <button class="remove-btn" data-id="${item.id}">Remove</button>
            </div>
        `;
        
        cartItemsContainer.appendChild(cartItemElement);
        
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
    });
    
    // Update summary
    if (subtotalElement) subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
    
    // Calculate shipping and tax
    const shipping = subtotal > 35 ? 0 : 5.99;
    const tax = subtotal * 0.08; // 8% tax rate
    const total = subtotal + shipping + tax;
    
    // Update shipping and tax elements if they exist
    const shippingElement = document.querySelector('.summary-row:nth-child(2) span:last-child');
    const taxElement = document.querySelector('.summary-row:nth-child(3) span:last-child');
    
    if (shippingElement) shippingElement.textContent = shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`;
    if (taxElement) taxElement.textContent = `$${tax.toFixed(2)}`;
    
    // Update total
    if (totalElement) totalElement.textContent = `$${total.toFixed(2)}`;
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element if it doesn't exist
    let notification = document.querySelector('.notification');
    
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'notification';
        document.body.appendChild(notification);
    }
    
    // Set message and type
    notification.textContent = message;
    notification.className = `notification ${type}`;
    
    // Show notification
    notification.classList.add('show');
    
    // Hide notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Process checkout
function processCheckout() {
    // In a real application, this would send the order to the server
    // For this demo, we'll just clear the cart and redirect to confirmation
    
    if (cart.length === 0) {
        showNotification('Your cart is empty.', 'error');
        return;
    }
    
    // Save order to localStorage for confirmation page
    localStorage.setItem('lastOrder', JSON.stringify({
        items: cart,
        date: new Date().toISOString(),
        orderId: 'ORD-' + Math.floor(Math.random() * 1000000)
    }));
    
    // Clear cart
    cart = [];
    localStorage.setItem('coldCaseCart', JSON.stringify(cart));
    
    // Redirect to confirmation page
    window.location.href = '/order-confirmation';
}
