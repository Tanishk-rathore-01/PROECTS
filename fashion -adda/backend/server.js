const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3002;
const JWT_SECRET = 'fashion_adda_secret_key_2024';

app.use(cors());
app.use(express.json());

// Serve front-end static files
const frontEndPath = path.join(__dirname, '..', 'frontend');
console.log('Serving front-end from:', frontEndPath);
if (fs.existsSync(frontEndPath)) {
  app.use(express.static(frontEndPath));
  app.get('/', (req, res) => res.sendFile(path.join(frontEndPath, 'index.html')));
  app.get('/login', (req, res) => res.sendFile(path.join(frontEndPath, 'login.html')));
}

// Load products from data file
const productsPath = path.join(__dirname, '..', 'data', 'product.json');
let products = [];
try {
  const raw = fs.readFileSync(productsPath, 'utf8');
  products = JSON.parse(raw);
} catch (err) {
  console.error(`Error: Could not load products from ${productsPath}. Please check if the file exists and is valid JSON.`, err.message);
  // exit gracefully
  process.exit(1);
}

let db;
try {
  db = require('./database.js');
} catch (e) {
  console.error("Failed to load database:", e.message);
  process.exit(1);
}

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// API: User login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ "error": "Email and password are required" });
    }
    const sql = "SELECT * FROM users WHERE email = ?";
    db.get(sql, [email], (err, user) => {
        if (err) {
            res.status(500).json({ "error": err.message });
            return;
        }
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const passwordMatch = bcrypt.compareSync(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: "Login successful",
            token,
            user: { id: user.id, name: user.name, email: user.email }
        });
    });
});

// API: User registration
app.post('/api/register', (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ "error": "Name, email and password are required" });
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const checkUserSql = 'SELECT * FROM users WHERE email = ?';
    db.get(checkUserSql, [email], (err, row) => {
        if (err) {
            res.status(500).json({ "error": err.message });
            return;
        }

        if (row) {
            res.status(409).json({ "error": "User with this email already exists." });
            return;
        }

        const insertSql = 'INSERT INTO users (name, email, password) VALUES (?,?,?)';
        db.run(insertSql, [name, email, hashedPassword], function(err) {
            if (err) {
                res.status(400).json({ "error": err.message });
                return;
            }
            res.json({
                "message": "User registered successfully",
                "userId": this.lastID
            });
        });
    });
});

// API: Verify token
app.get('/api/verify', authenticateToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

// Protected API: list products
app.get('/api/products', authenticateToken, (req, res) => {
  res.json(products);
});

// Protected API: get product details
app.get('/api/products/:id', authenticateToken, (req, res) => {
  const id = parseInt(req.params.id);
  const product = products.find(p => p.id === id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json(product);
});

// In-memory cart for demo
let userCarts = {};

// Protected API: get user cart
app.get('/api/cart', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const cart = userCarts[userId] || [];
  res.json(cart);
});

// Protected API: add to cart
app.post('/api/cart', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const { productId, quantity = 1 } = req.body;
  
  const product = products.find(p => p.id === parseInt(productId));
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  if (!userCarts[userId]) {
    userCarts[userId] = [];
  }

  const existingItem = userCarts[userId].find(item => item.product.id === parseInt(productId));
  if (existingItem) {
    existingItem.quantity += parseInt(quantity);
  } else {
    userCarts[userId].push({
      id: Date.now().toString(),
      product: product,
      quantity: parseInt(quantity)
    });
  }

  res.json(userCarts[userId]);
});

// Protected API: remove from cart
app.delete('/api/cart/:itemId', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const itemId = req.params.itemId;

  if (!userCarts[userId]) {
    userCarts[userId] = [];
  }

  userCarts[userId] = userCarts[userId].filter(item => item.id !== itemId);
  res.json(userCarts[userId]);
});

// Protected API: checkout
app.post('/api/orders', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const cart = userCarts[userId] || [];

  if (cart.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  const total = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const order = {
    orderId: Date.now(),
    items: cart,
    total: total,
    placedAt: new Date().toISOString()
  };

  // Clear cart after order
  userCarts[userId] = [];
  
  res.json(order);
});

const server = app.listen(PORT, () => {
  console.log(`Fashion Adda server running on http://localhost:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Error: Port ${PORT} is already in use. Please check if another process is running on this port and stop it if necessary.`);
  } else {
    console.error('An error occurred while starting the server:', err);
  }
  process.exit(1);
});
