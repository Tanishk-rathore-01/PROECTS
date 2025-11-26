class FashionAddaApp {
    constructor() {
        this.products = [];
        this.cart = [];
        this.currentCategory = 'all';
        this.authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        this.apiBaseUrl = 'http://localhost:3002';
        
        this.init();
    }

    async init() {
        if (!this.authToken) {
            window.location.href = 'login.html';
            return;
        }

        await this.verifyToken();
        await this.loadProducts();
        this.setupEventListeners();
        this.updateUserWelcome();
        this.loadCart();
    }

    parseJwt (token) {
        try {
            return JSON.parse(atob(token.split('.')[1]));
        } catch (e) {
            return null;
        }
    }

    async verifyToken() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/verify`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            if (!response.ok) {
                throw new Error('Invalid token');
            }
        } catch (error) {
            this.logout();
        }
    }

    async loadProducts() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/products`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load products');
            }

            this.products = await response.json();
            this.renderProducts();
        } catch (error) {
            console.error('Error loading products:', error);
            this.showNotification('Failed to load products', 'error');
        }
    }

    async loadCart() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/cart`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            if (response.ok) {
                this.cart = await response.json();
                this.updateCartUI();
            }
        } catch (error) {
            console.error('Error loading cart:', error);
        }
    }

    renderProducts() {
        const grid = document.getElementById('productsGrid');
        const filteredProducts = this.currentCategory === 'all' 
            ? this.products 
            : this.products.filter(product => product.category === this.currentCategory);

        grid.innerHTML = filteredProducts.map(product => `
            <div class="product-card" data-id="${product.id}">
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}">
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-description">${product.description}</p>
                    <div class="product-footer">
                        <span class="product-price">₹${product.price}</span>
                        <button class="add-to-cart" data-product-id="${product.id}">
                            Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        grid.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.classList.contains('add-to-cart')) {
                    this.addToCart(parseInt(e.target.dataset.productId));
                } else {
                    this.showProductModal(parseInt(card.dataset.id));
                }
            });
        });
    }

    async addToCart(productId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/cart`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify({
                    productId: productId,
                    quantity: 1
                })
            });

            if (response.ok) {
                this.cart = await response.json();
                this.updateCartUI();
                this.showNotification('Added to cart', 'success');
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            this.showNotification('Failed to add item to cart', 'error');
        }
    }

    async removeFromCart(itemId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/cart/${itemId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            if (response.ok) {
                this.cart = await response.json();
                this.updateCartUI();
            }
        } catch (error) {
            console.error('Error removing from cart:', error);
            this.showNotification('Failed to remove item from cart', 'error');
        }
    }

    updateCartUI() {
        const cartCount = document.getElementById('cartCount');
        const cartItems = document.getElementById('cartItems');
        const cartTotal = document.getElementById('cartTotal');

        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;

        if (this.cart.length === 0) {
            cartItems.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Your cart is empty</p>';
        } else {
            cartItems.innerHTML = this.cart.map(item => `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <h4>${item.product.name}</h4>
                        <p class="cart-item-price">₹${item.product.price} x ${item.quantity}</p>
                    </div>
                    <div class="cart-item-actions">
                        <button class="remove-item" data-item-id="${item.id}">
                            Remove
                        </button>
                    </div>
                </div>
            `).join('');
        }
        
        cartItems.querySelectorAll('.remove-item').forEach(button => {
            button.addEventListener('click', (e) => {
                this.removeFromCart(e.target.dataset.itemId);
            });
        });

        const total = this.cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
        cartTotal.textContent = total;
    }

    showProductModal(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        const modalBody = document.getElementById('modalBody');
        modalBody.innerHTML = `
            <div class="modal-product-content">
                <div class="modal-product-image">
                    <img src="${product.image}" alt="${product.name}">
                </div>
                <div class="modal-product-details">
                    <h3>${product.name}</h3>
                    <p>${product.description}</p>
                    <div class="modal-product-price-category">
                        <strong>₹${product.price}</strong>
                        <span>${product.category}</span>
                    </div>
                    <button class="add-to-cart-modal cta-button" data-product-id="${product.id}">
                        Add to Cart
                    </button>
                </div>
            </div>
        `;
        
        modalBody.querySelector('.add-to-cart-modal').addEventListener('click', (e) => {
            this.addToCart(parseInt(e.target.dataset.productId));
            this.hideProductModal();
        });

        this.showModal();
    }

    showModal() {
        document.getElementById('productModal').classList.add('active');
        document.getElementById('overlay').classList.add('active');
    }

    hideProductModal() {
        document.getElementById('productModal').classList.remove('active');
        document.getElementById('overlay').classList.remove('active');
    }

    setupEventListeners() {
        document.getElementById('cartBtn').addEventListener('click', () => this.toggleCart());
        document.getElementById('closeCart').addEventListener('click', () => this.toggleCart());
        
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentCategory = e.target.dataset.category;
                this.renderProducts();
            });
        });

        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());

        document.querySelector('.close-modal').addEventListener('click', () => this.hideProductModal());
        document.getElementById('overlay').addEventListener('click', () => {
            this.hideProductModal();
            if (document.getElementById('cartSidebar').classList.contains('active')) {
                this.toggleCart();
            }
        });

        document.getElementById('checkoutBtn').addEventListener('click', () => this.checkout());
    }

    toggleCart() {
        const cartSidebar = document.getElementById('cartSidebar');
        const overlay = document.getElementById('overlay');
        
        cartSidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    }

    async checkout() {
        if (this.cart.length === 0) {
            this.showNotification('Your cart is empty', 'error');
            return;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/api/orders`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            if (response.ok) {
                const order = await response.json();
                this.showNotification(`Order placed successfully! Order #${order.orderId}`, 'success');
                this.cart = [];
                this.updateCartUI();
                this.toggleCart();
            } else {
                throw new Error('Checkout failed');
            }
        } catch (error) {
            console.error('Checkout error:', error);
            this.showNotification('Failed to place order', 'error');
        }
    }

    updateUserWelcome() {
        const userWelcome = document.getElementById('userWelcome');
        const decodedToken = this.parseJwt(this.authToken);
        if (decodedToken && decodedToken.email) {
            userWelcome.textContent = `Welcome, ${decodedToken.email}`;
        } else {
            userWelcome.textContent = 'Welcome to Fashion Adda!';
        }
    }

    logout() {
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('authToken');
        window.location.href = 'login.html';
    }

    showNotification(message, type) {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = 'notification'; // Reset classes
        notification.classList.add(type);
        notification.classList.add('active'); // Add active class to trigger animation

        setTimeout(() => {
            notification.classList.remove('active'); // Remove active class to hide
        }, 3000);
    }
}

// Initialize app
const app = new FashionAddaApp();