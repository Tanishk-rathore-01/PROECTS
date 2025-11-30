require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3002;
const JWT_SECRET = process.env.JWT_SECRET || 'fashion_adda_secret_key_2024';

app.use(helmet());
app.use(cors());
app.use(express.json());

// Static frontend served from ./frontend
const frontEndPath = path.join(__dirname, 'frontend');
if (fs.existsSync(frontEndPath)) {
  app.use(express.static(frontEndPath));
}

// Load products data (fallback to empty array)
const productsPath = path.join(__dirname, 'data', 'product.json');
let products = [];
try {
  if (fs.existsSync(productsPath)) {
    const raw = fs.readFileSync(productsPath, 'utf8');
    products = JSON.parse(raw);
  } else {
    console.warn('products.json not found, starting with empty product list.');
  }
} catch (err) {
  console.error('Failed to parse products:', err.message);
}

const db = require('./database');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = payload; // { userId, email }
    next();
  });
};

// Helper to find user by email
const getUserByEmail = (email) => new Promise((resolve, reject) => {
  db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
    if (err) return reject(err);
    resolve(row);
  });
});

// Register route
app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }
  try {
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);
    const insert = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
    db.run(insert, [name, email, hashedPassword], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create user' });
      }
      res.status(201).json({ message: 'User created' });
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login route
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  try {
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }
    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify token route
app.get('/api/verify', authenticateToken, (req, res) => {
  res.json({ message: 'Token is valid', user: req.user });
});

// Products route
app.get('/api/products', authenticateToken, (req, res) => {
  res.json(products);
});

// Get cart for the user
app.get('/api/cart', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const sql = `
    SELECT cart.id, cart.quantity, products.id as productId, products.name, products.price, products.image 
    FROM cart 
    JOIN products ON cart.product_id = products.id 
    WHERE cart.user_id = ?
  `;
  db.all(sql, [userId], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to fetch cart' });
    }
    // Format the response to match what the frontend expects
    const cartItems = rows.map(row => ({
      id: row.id,
      product: {
        id: row.productId,
        name: row.name,
        price: row.price,
        image: row.image
      },
      quantity: row.quantity
    }));
    res.json(cartItems);
  });
});

// Add to cart
app.post('/api/cart', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const { productId, quantity } = req.body;

  // Check if the product exists
  const product = products.find(p => p.id === productId);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  // Cart routes
app.get('/api/cart', authenticateToken, (req, res) => {
  // Return user's cart (you'll need to implement cart storage)
  res.json([]);
});

app.post('/api/cart', authenticateToken, (req, res) => {
  const { productId, quantity } = req.body;
  // Add product to cart logic here
  res.json({ message: 'Product added to cart' });
});

app.put('/api/cart', authenticateToken, (req, res) => {
  const { productId, quantity } = req.body;
  // Update cart quantity logic here
  res.json({ message: 'Cart updated' });
});

app.delete('/api/cart/:productId', authenticateToken, (req, res) => {
  const { productId } = req.params;
  // Remove product from cart logic here
  res.json({ message: 'Product removed from cart' });
});

  // Check if the item is already in the cart
  const checkSql = `SELECT * FROM cart WHERE user_id = ? AND product_id = ?`;
  db.get(checkSql, [userId, productId], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (row) {
      // Update quantity
      const updateSql = `UPDATE cart SET quantity = quantity + ? WHERE user_id = ? AND product_id = ?`;
      db.run(updateSql, [quantity, userId, productId], function(err) {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Failed to update cart' });
        }
        res.json({ message: 'Cart updated' });
      });
    } else {
      // Insert new item
      const insertSql = `INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)`;
      db.run(insertSql, [userId, productId, quantity], function(err) {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Failed to add to cart' });
        }
        res.status(201).json({ message: 'Added to cart' });
      });
    }
  });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));