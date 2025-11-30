class LoginManager {
    constructor() {
        this.loginForm = document.getElementById('loginForm');
        this.registerForm = document.getElementById('registerForm');
        this.loginCard = document.getElementById('loginCard');
        this.registerCard = document.getElementById('registerCard');
        this.signupLink = document.getElementById('signupLink');
        this.footerText = document.getElementById('footer-text');

        this.emailInput = document.getElementById('email');
        this.passwordInput = document.getElementById('password');
        this.togglePassword = document.getElementById('togglePassword');
        this.errorMessage = document.getElementById('errorMessage');
        this.loginBtn = document.getElementById('loginBtn');

        this.registerNameInput = document.getElementById('registerName');
        this.registerEmailInput = document.getElementById('registerEmail');
        this.registerPasswordInput = document.getElementById('registerPassword');
        this.registerErrorMessage = document.getElementById('registerErrorMessage');
        this.registerBtn = document.getElementById('registerBtn');
        
        this.apiBaseUrl = 'http://localhost:3002';
        
        this.initEventListeners();
    }

    initEventListeners() {
        this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        this.registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        this.togglePassword.addEventListener('click', () => this.togglePasswordVisibility());
        this.signupLink.addEventListener('click', (e) => this.toggleForms(e));
        
        // Remove any existing tokens when loading login page
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('authToken');
    }

    toggleForms(e) {
        e.preventDefault();
        const signupLink = document.getElementById('signupLink'); // Get the current signup link

        if (this.loginCard.classList.contains('active-card')) {
            // Currently showing login, switch to register
            this.loginCard.classList.remove('active-card');
            this.registerCard.classList.add('active-card');
            this.footerText.innerHTML = 'Already have an account? <a href="#" id="signupLink">Sign In</a>';
        } else {
            // Currently showing register, switch to login
            this.registerCard.classList.remove('active-card');
            this.loginCard.classList.add('active-card');
            this.footerText.innerHTML = 'New to Fashion Adda? <a href="#" id="signupLink">Create an account</a>';
        }
        // Re-initialize event listener for the new link
        document.getElementById('signupLink').addEventListener('click', (e) => this.toggleForms(e));
    }

    togglePasswordVisibility() {
        const type = this.passwordInput.type === 'password' ? 'text' : 'password';
        this.passwordInput.type = type;
        this.togglePassword.textContent = type === 'password' ? '👁️' : '🔒';
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = this.emailInput.value.trim();
        const password = this.passwordInput.value;

        this.setLoading(true, 'login');

        try {
            const response = await fetch(`${this.apiBaseUrl}/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                const rememberMe = document.getElementById('rememberMe').checked;
                if (rememberMe) {
                    localStorage.setItem('authToken', data.token);
                } else {
                    sessionStorage.setItem('authToken', data.token);
                }
                
                this.showSuccess('Login successful! Redirecting...', 'login');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            } else {
                this.showError(data.error || 'Login failed', 'login');
            }
        } catch (error) {
            this.showError('Network error. Please make sure the server is running.', 'login');
            console.error('Login error:', error);
        } finally {
            this.setLoading(false, 'login');
        }
    }

    async handleRegister(e) {
        e.preventDefault();

        const name = this.registerNameInput.value.trim();
        const email = this.registerEmailInput.value.trim();
        const password = this.registerPasswordInput.value;

        if (password.length < 6) {
            this.showError('Password must be at least 6 characters long', 'register');
            return;
        }

        this.setLoading(true, 'register');

        try {
            const response = await fetch(`${this.apiBaseUrl}/api/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                this.showSuccess('Registration successful! Please login.', 'register');
                setTimeout(() => {
                    this.toggleForms(e);
                }, 2000);
            } else {
                this.showError(data.error || 'Registration failed', 'register');
            }
        } catch (error) {
            this.showError('Network error. Please make sure the server is running.', 'register');
            console.error('Registration error:', error);
        } finally {
            this.setLoading(false, 'register');
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showError(message, form) {
        const errorElement = form === 'login' ? this.errorMessage : this.registerErrorMessage;
        errorElement.textContent = message;
        errorElement.classList.remove('success'); // Ensure success styling is removed
        errorElement.classList.add('error', 'active'); // Add error and active classes
        
        setTimeout(() => {
            errorElement.classList.remove('active'); // Hide after timeout
        }, 5000);
    }

    showSuccess(message, form) {
        const successElement = form === 'login' ? this.errorMessage : this.registerErrorMessage;
        successElement.textContent = message;
        successElement.classList.remove('error'); // Ensure error styling is removed
        successElement.classList.add('success', 'active'); // Add success and active classes
        
        setTimeout(() => {
            successElement.classList.remove('active'); // Hide after timeout
        }, 5000);
    }

    setLoading(loading, form) {
        const btn = form === 'login' ? this.loginBtn : this.registerBtn;
        if (loading) {
            btn.disabled = true;
            btn.innerHTML = `<span>${form === 'login' ? 'Signing In...' : 'Creating Account...'}</span>`;
        } else {
            btn.disabled = false;
            btn.innerHTML = `<span>${form === 'login' ? 'Sign In' : 'Create Account'}</span>`;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new LoginManager();
});