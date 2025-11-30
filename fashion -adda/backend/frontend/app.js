class FashionAddaApp {
    constructor() {
        this.products = [];
        this.cart = [];
        this.currentCategory = 'all';
        this.authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        this.apiBaseUrl = window.location.origin;

        this.init();
    }

    async init() {
        if (!this.authToken) return window.location.href = 'login.html';
        if (!await this.verifyToken()) return this.logout();
        await this.loadProducts();
        this.setupEventListeners();
        this.updateUserWelcome();
        await this.loadCart();
        this.animatePageIn();
    }

    parseJwt(token) {
        try { 
            return JSON.parse(atob(token.split('.')[1])); 
        } catch(e) {
            return null;
        }
    }

    async verifyToken() {
        try {
            const res = await fetch(`${this.apiBaseUrl}/api/verify`, { 
                headers: { 'Authorization': `Bearer ${this.authToken}` } 
            });
            return res.ok;
        } catch(e) { 
            return false; 
        }
    }

    async loadProducts() {
        try {
            const res = await fetch(`${this.apiBaseUrl}/api/products`, { 
                headers: { 'Authorization': `Bearer ${this.authToken}` } 
            });
            if (!res.ok) throw new Error('Failed');
            this.products = await res.json();
            this.renderProducts();
        } catch(err) {
            console.error(err);
            this.showNotification('Failed to load products', 'error');
        }
    }

    async loadCart() {
        try {
            const res = await fetch(`${this.apiBaseUrl}/api/cart`, { 
                headers: { 'Authorization': `Bearer ${this.authToken}` } 
            });
            if (res.ok) {
                this.cart = await res.json();
                this.updateCartUI();
            }
        } catch(e) { 
            console.error(e); 
        }
    }

    renderProducts() {
        const grid = document.getElementById('productsGrid');
        if (!grid) {
            console.error('No #productsGrid element found in DOM.');
            return;
        }

        const filtered = this.currentCategory === 'all'
            ? this.products
            : this.products.filter(p => p.category === this.currentCategory);

        grid.innerHTML = filtered.map(p => `
            <div class="product-card fade-up" data-id="${p.id}">
                <div class="product-image">
                    <img src="${p.image}" alt="${(p.name || '').replace(/"/g, '&quot;')}" loading="lazy">
                </div>
                <div class="product-info">
                    <h3 class="product-name">${(p.name || '').replace(/</g, '&lt;')}</h3>
                    <p class="product-description">${(p.description || '').replace(/</g, '&lt;')}</p>
                    <div class="product-footer">
                        <span class="product-price">₹${Number(p.price || 0)}</span>
                        <button class="add-to-cart" data-product-id="${p.id}">Add to Cart</button>
                    </div>
                </div>
            </div>
        `).join('');

        // Event delegation - handle clicks for add-to-cart or opening modal
        grid.onclick = (e) => {
            const addBtn = e.target.closest('.add-to-cart');
            if (addBtn) {
                const id = parseInt(addBtn.dataset.productId, 10);
                if (!Number.isNaN(id)) this.addToCart(id);
                return;
            }
            const card = e.target.closest('.product-card');
            if (card) {
                const id = parseInt(card.dataset.id, 10);
                if (!Number.isNaN(id)) this.showProductModal(id);
            }
        };

        // run entrance animation for newly rendered items
        this.animatePageIn();
    }

    async addToCart(productId) {
        try {
            const res = await fetch(`${this.apiBaseUrl}/api/cart`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify({ productId, quantity: 1 })
            });
            if (res.ok) {
                this.showNotification('Added to cart', 'success');
                await this.loadCart(); // Reload the cart to update the UI
            } else {
                this.showNotification('Failed to add to cart', 'error');
            }
        } catch (err) {
            console.error(err);
            this.showNotification('Failed to add to cart', 'error');
        }
    }

    setupEventListeners() {
        // Category filter buttons
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                filterBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentCategory = e.target.dataset.category;
                this.renderProducts();
            });
        });

        // Cart button
        const cartBtn = document.querySelector('.cart-btn');
        const cartSidebar = document.querySelector('.cart-sidebar');
        const closeCart = document.querySelector('.close-cart');
        const overlay = document.querySelector('.overlay');

        if (cartBtn && cartSidebar) {
            cartBtn.addEventListener('click', () => {
                cartSidebar.classList.add('active');
                if (overlay) overlay.classList.add('active');
            });
        }

        if (closeCart && overlay) {
            closeCart.addEventListener('click', () => {
                cartSidebar.classList.remove('active');
                overlay.classList.remove('active');
            });

            overlay.addEventListener('click', () => {
                cartSidebar.classList.remove('active');
                overlay.classList.remove('active');
            });
        }

        // Logout button
        const logoutBtn = document.querySelector('.logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // Modal close functionality
        const modal = document.querySelector('.modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        }
    }

    updateUserWelcome() {
        const userWelcome = document.querySelector('.user-welcome');
        if (userWelcome && this.authToken) {
            try {
                const payload = this.parseJwt(this.authToken);
                if (payload && payload.email) {
                    userWelcome.textContent = `Welcome, ${payload.email.split('@')[0]}`;
                }
            } catch (e) {
                console.error('Error parsing token:', e);
            }
        }
    }

    animatePageIn() {
        // Simple fade-in animation for elements
        const elements = document.querySelectorAll('.fade-up');
        elements.forEach((el, index) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            setTimeout(() => {
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    showProductModal(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        const modal = document.querySelector('.modal');
        const modalContent = document.querySelector('.modal-content');
        
        if (modal && modalContent) {
            modalContent.innerHTML = `
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
                        <button class="add-to-cart" data-product-id="${product.id}">
                            Add to Cart
                        </button>
                    </div>
                </div>
            `;
            
            modal.classList.add('active');
            
            // Add event listener for the modal add to cart button
            const modalAddBtn = modalContent.querySelector('.add-to-cart');
            if (modalAddBtn) {
                modalAddBtn.addEventListener('click', () => {
                    this.addToCart(product.id);
                    modal.classList.remove('active');
                });
            }
        }
    }

    updateCartUI() {
        const cartCount = document.querySelector('.cart-count');
        const cartItems = document.querySelector('.cart-items');
        const cartTotal = document.querySelector('.cart-total');

        if (cartCount) {
            const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
            cartCount.textContent = totalItems;
        }

        if (cartItems) {
            cartItems.innerHTML = this.cart.map(item => `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <h4>${item.product?.name || 'Unknown Product'}</h4>
                        <div class="cart-item-price">₹${item.product?.price || 0}</div>
                    </div>
                    <div class="cart-item-actions">
                        <button class="quantity-btn minus" data-product-id="${item.product?.id}">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn plus" data-product-id="${item.product?.id}">+</button>
                        <button class="remove-item" data-product-id="${item.product?.id}">×</button>
                    </div>
                </div>
            `).join('');

            // Add event listeners for cart actions
            cartItems.querySelectorAll('.quantity-btn.plus').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const productId = parseInt(e.target.dataset.productId);
                    this.updateCartQuantity(productId, 1);
                });
            });

            cartItems.querySelectorAll('.quantity-btn.minus').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const productId = parseInt(e.target.dataset.productId);
                    this.updateCartQuantity(productId, -1);
                });
            });

            cartItems.querySelectorAll('.remove-item').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const productId = parseInt(e.target.dataset.productId);
                    this.removeFromCart(productId);
                });
            });
        }

        if (cartTotal) {
            const total = this.cart.reduce((sum, item) => sum + ((item.product?.price || 0) * item.quantity), 0);
            cartTotal.textContent = `Total: ₹${total}`;
        }
    }

    async updateCartQuantity(productId, change) {
        try {
            const item = this.cart.find(item => item.product?.id === productId);
            if (item) {
                const newQuantity = item.quantity + change;
                if (newQuantity <= 0) {
                    await this.removeFromCart(productId);
                } else {
                    const res = await fetch(`${this.apiBaseUrl}/api/cart`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${this.authToken}`
                        },
                        body: JSON.stringify({ productId, quantity: newQuantity })
                    });
                    if (res.ok) {
                        await this.loadCart();
                    } else {
                        this.showNotification('Failed to update cart', 'error');
                    }
                }
            }
        } catch (err) {
            console.error(err);
            this.showNotification('Failed to update cart', 'error');
        }
    }

    async removeFromCart(productId) {
        try {
            const res = await fetch(`${this.apiBaseUrl}/api/cart/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });
            if (res.ok) {
                await this.loadCart();
                this.showNotification('Product removed from cart', 'success');
            } else {
                this.showNotification('Failed to remove from cart', 'error');
            }
        } catch (err) {
            console.error(err);
            this.showNotification('Failed to remove from cart', 'error');
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element if it doesn't exist
        let notification = document.querySelector('.notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.className = 'notification';
            document.body.appendChild(notification);
        }

        notification.textContent = message;
        notification.className = `notification ${type} active`;

        setTimeout(() => {
            notification.classList.remove('active');
        }, 3000);
    }

    logout() {
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('authToken');
        window.location.href = 'login.html';
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FashionAddaApp();
});
