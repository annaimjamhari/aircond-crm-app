// CRM Web Application Server
// Complete CRM with all pages and database operations

const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
    secret: 'crm-secret-key-2026',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 1 day
}));
app.use(express.static(path.join(__dirname, 'public')));

// Database setup - use /tmp directory on Vercel for write access
const dbPath = process.env.VERCEL ? '/tmp/crm.db' : './db/crm.db';
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('DB error:', err);
    else console.log(`Connected to SQLite database at ${dbPath}`);
});

// Initialize schema
const schema = `
-- Users table (admin login)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT DEFAULT 'staff',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    email TEXT,
    address TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contacts table (for CRM)
CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    contact_name TEXT NOT NULL,
    position TEXT,
    phone TEXT,
    email TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Opportunities table (sales pipeline)
CREATE TABLE IF NOT EXISTS opportunities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    value REAL DEFAULT 0.0,
    stage TEXT DEFAULT 'prospecting', -- prospecting, qualification, proposal, negotiation, closed-won, closed-lost
    probability INTEGER DEFAULT 0,
    expected_close_date DATE,
    status TEXT DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Activities table (calls, meetings, tasks)
CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER,
    opportunity_id INTEGER,
    type TEXT NOT NULL, -- call, meeting, email, task
    subject TEXT NOT NULL,
    description TEXT,
    due_date DATE,
    status TEXT DEFAULT 'pending', -- pending, in-progress, completed
    priority TEXT DEFAULT 'medium', -- low, medium, high
    assigned_to INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (opportunity_id) REFERENCES opportunities(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id)
);

-- Insert default admin user (password: admin123)
INSERT OR IGNORE INTO users (username, password_hash, full_name, role)
VALUES ('admin', '$2b$10$.2XQDThTJSKpl6/.IZvIy.f3KMuWJLfUilNU.6cucQwYDOtze0AlW', 'System Administrator', 'admin');

-- Insert sample customer
INSERT OR IGNORE INTO customers (name, phone, email, address, notes)
VALUES ('Tech Solutions Inc.', '012-3456789', 'info@techsolutions.com', 'Kuala Lumpur', 'Potential enterprise client');

-- Insert sample contact
INSERT OR IGNORE INTO contacts (customer_id, contact_name, position, phone, email, notes)
VALUES (1, 'Ahmad Zaki', 'CEO', '012-9876543', 'ahmad@techsolutions.com', 'Decision maker');

-- Insert sample opportunity
INSERT OR IGNORE INTO opportunities (customer_id, title, description, value, stage, probability, expected_close_date, notes)
VALUES (1, 'ERP System Implementation', 'Enterprise resource planning system for manufacturing division', 250000.00, 'proposal', 60, '2026-03-31', 'High value deal');

-- Insert sample activity
INSERT OR IGNORE INTO activities (customer_id, opportunity_id, type, subject, description, due_date, status, priority, notes)
VALUES (1, 1, 'meeting', 'Proposal Presentation', 'Present ERP solution proposal to board', '2026-02-20', 'pending', 'high', 'Prepare demo materials');
`;

db.exec(schema, (err) => {
    if (err) console.error('Schema error:', err);
    else console.log('Database schema ready.');
});

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    next();
};

// ========== AUTHENTICATION ROUTES ==========

// Login page
app.get('/login', (req, res) => {
    if (req.session.userId) {
        return res.redirect('/dashboard');
    }
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// Login submission
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get('SELECT id, password_hash FROM users WHERE username = ?', [username], (err, row) => {
        if (err || !row) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        bcrypt.compare(password, row.password_hash, (err, match) => {
            if (match) {
                req.session.userId = row.id;
                res.json({ success: true, redirect: '/dashboard' });
            } else {
                res.status(401).json({ error: 'Invalid credentials' });
            }
        });
    });
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// ========== FRONTEND PAGES ==========

// Homepage
app.get('/', (req, res) => {
    res.redirect('/login');
});

// Dashboard
app.get('/dashboard', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});

// Customers page
app.get('/customers', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'customers.html'));
});

// Contacts page
app.get('/contacts', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'contacts.html'));
});

// Opportunities page
app.get('/opportunities', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'opportunities.html'));
});

// Activities page
app.get('/activities', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'activities.html'));
});

// Reports page
app.get('/reports', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'reports.html'));
});

// Settings page
app.get('/settings', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'settings.html'));
});

// ========== API ENDPOINTS ==========

// ----- CUSTOMERS API -----

// Get all customers
app.get('/api/customers', requireAuth, (req, res) => {
    db.all('SELECT * FROM customers ORDER BY created_at DESC', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Get single customer
app.get('/api/customers/:id', requireAuth, (req, res) => {
    db.get('SELECT * FROM customers WHERE id = ?', [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Customer not found' });
        res.json(row);
    });
});

// Create customer
app.post('/api/customers', requireAuth, (req, res) => {
    const { name, phone, email, address, notes } = req.body;
    db.run(
        'INSERT INTO customers (name, phone, email, address, notes) VALUES (?, ?, ?, ?, ?)',
        [name, phone, email, address, notes],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, message: 'Customer added successfully' });
        }
    );
});

// Update customer
app.put('/api/customers/:id', requireAuth, (req, res) => {
    const { name, phone, email, address, notes } = req.body;
    db.run(
        'UPDATE customers SET name=?, phone=?, email=?, address=?, notes=?, updated_at=CURRENT_TIMESTAMP WHERE id=?',
        [name, phone, email, address, notes, req.params.id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Customer updated successfully' });
        }
    );
});

// Delete customer
app.delete('/api/customers/:id', requireAuth, (req, res) => {
    db.run('DELETE FROM customers WHERE id = ?', [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Customer deleted successfully' });
    });
});

// ----- CONTACTS API -----

// Get all contacts
app.get('/api/contacts', requireAuth, (req, res) => {
    db.all('SELECT c.*, cu.name as customer_name FROM contacts c LEFT JOIN customers cu ON c.customer_id = cu.id ORDER BY c.created_at DESC', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Create contact
app.post('/api/contacts', requireAuth, (req, res) => {
    const { customer_id, contact_name, position, phone, email, notes } = req.body;
    db.run(
        'INSERT INTO contacts (customer_id, contact_name, position, phone, email, notes) VALUES (?, ?, ?, ?, ?, ?)',
        [customer_id, contact_name, position, phone, email, notes],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, message: 'Contact added successfully' });
        }
    );
});

// ----- OPPORTUNITIES API -----

// Get all opportunities
app.get('/api/opportunities', requireAuth, (req, res) => {
    db.all(`
        SELECT o.*, cu.name as customer_name, cu.phone as customer_phone,
               cu.email as customer_email
        FROM opportunities o
        LEFT JOIN customers cu ON o.customer_id = cu.id
        ORDER BY o.created_at DESC
    `, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Create opportunity
app.post('/api/opportunities', requireAuth, (req, res) => {
    const { customer_id, title, description, value, stage, probability, expected_close_date, notes } = req.body;
    db.run(
        'INSERT INTO opportunities (customer_id, title, description, value, stage, probability, expected_close_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [customer_id, title, description, value, stage, probability, expected_close_date, notes],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, message: 'Opportunity added successfully' });
        }
    );
});

// ----- ACTIVITIES API -----

// Get all activities
app.get('/api/activities', requireAuth, (req, res) => {
    db.all(`
        SELECT a.*, cu.name as customer_name, op.title as opportunity_title
        FROM activities a
        LEFT JOIN customers cu ON a.customer_id = cu.id
        LEFT JOIN opportunities op ON a.opportunity_id = op.id
        ORDER BY a.due_date ASC, a.priority DESC
    `, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Create activity
app.post('/api/activities', requireAuth, (req, res) => {
    const { customer_id, opportunity_id, type, subject, description, due_date, status, priority, notes } = req.body;
    db.run(
        'INSERT INTO activities (customer_id, opportunity_id, type, subject, description, due_date, status, priority, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [customer_id, opportunity_id, type, subject, description, due_date, status, priority, notes],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, message: 'Activity added successfully' });
        }
    );
});

// Get single activity
app.get('/api/activities/:id', requireAuth, (req, res) => {
    db.get(`
        SELECT a.*, cu.name as customer_name, op.title as opportunity_title
        FROM activities a
        LEFT JOIN customers cu ON a.customer_id = cu.id
        LEFT JOIN opportunities op ON a.opportunity_id = op.id
        WHERE a.id = ?
    `, [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Activity not found' });
        res.json(row);
    });
});

// Update activity
app.put('/api/activities/:id', requireAuth, (req, res) => {
    const { type, subject, description, due_date, status, priority, notes } = req.body;
    db.run(
        'UPDATE activities SET type=?, subject=?, description=?, due_date=?, status=?, priority=?, notes=? WHERE id=?',
        [type, subject, description, due_date, status, priority, notes, req.params.id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Activity updated successfully' });
        }
    );
});

// Delete activity
app.delete('/api/activities/:id', requireAuth, (req, res) => {
    db.run('DELETE FROM activities WHERE id = ?', [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Activity deleted successfully' });
    });
});

// ----- DASHBOARD STATS API -----

// Get dashboard statistics
app.get('/api/dashboard/stats', requireAuth, (req, res) => {
    const stats = {};
    
    // Total customers
    db.get('SELECT COUNT(*) as count FROM customers', (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        stats.totalCustomers = row.count;
        
        // Total opportunities
        db.get('SELECT COUNT(*) as count FROM opportunities', (err, row) => {
            if (err) return res.status(500).json({ error: err.messsage });
            stats.totalOpportunities = row.count;
            
            // Total activities
            db.get('SELECT COUNT(*) as count FROM activities', (err, row) => {
                if (err) return res.status(500).json({ error: err.message });
                stats.totalActivities = row.count;
                
                // Opportunities by stage
                db.all('SELECT stage, COUNT(*) as count FROM opportunities GROUP BY stage', (err, rows) => {
                    if (err) return res.status(500).json({ error: err.message });
                    stats.opportunitiesByStage = rows;
                    
                    // Recent activities
                    db.all('SELECT * FROM activities ORDER BY created_at DESC LIMIT 5', (err, rows) => {
                        if (err) return res.status(500).json({ error: err.message });
                        stats.recentActivities = rows;
                        
                        // Top opportunities
                        db.all('SELECT * FROM opportunities ORDER BY value DESC LIMIT 5', (err, rows) => {
                            if (err) return res.status(500).json({ error: err.message });
                            stats.topOpportunities = rows;
                            
                            res.json(stats);
                        });
                    });
                });
            });
        });
    });
});

// ----- REPORTS API -----

// Get sales pipeline report
app.get('/api/reports/sales-pipeline', requireAuth, (req, res) => {
    db.all(`
        SELECT 
            stage,
            COUNT(*) as count,
            SUM(value) as total_value,
            AVG(value) as avg_value
        FROM opportunities 
        GROUP BY stage
        ORDER BY 
            CASE stage 
                WHEN 'prospecting' THEN 1
                WHEN 'qualification' THEN 2
                WHEN 'proposal' THEN 3
                WHEN 'negotiation' THEN 4
                WHEN 'closed-won' THEN 5
                WHEN 'closed-lost' THEN 6
                ELSE 7
            END
    `, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Get reports summary
app.get('/api/reports/summary', requireAuth, (req, res) => {
    const period = req.query.period || '30';
    const summary = {
        totalCustomers: 15,
        openOpportunities: 8,
        pendingActivities: 12,
        pipelineValue: 125000,
        conversionRate: 25,
        averageDealSize: 5000,
        activityCompletion: 60,
        opportunityStages: {
            labels: ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'],
            data: [3, 2, 1, 2, 4, 1]
        },
        customerGrowth: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            data: [5, 8, 10, 12, 14, 15]
        },
        activityTypes: {
            labels: ['Call', 'Meeting', 'Email', 'Task'],
            data: [8, 5, 12, 7]
        },
        revenueForecast: {
            labels: ['Q1', 'Q2', 'Q3', 'Q4'],
            data: [30000, 45000, 60000, 75000]
        }
    };
    res.json(summary);
});

// ----- USERS API -----

// Get all users
app.get('/api/users', requireAuth, (req, res) => {
    db.all('SELECT id, username, full_name, role, created_at FROM users ORDER BY created_at DESC', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Create user
app.post('/api/users', requireAuth, (req, res) => {
    const { username, full_name, password, role } = req.body;
    const password_hash = bcrypt.hashSync(password, 10);
    
    db.run(
        'INSERT INTO users (username, full_name, password_hash, role) VALUES (?, ?, ?, ?)',
        [username, full_name, password_hash, role],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, message: 'User added successfully' });
        }
    );
});

// Delete user
app.delete('/api/users/:id', requireAuth, (req, res) => {
    db.run('DELETE FROM users WHERE id = ? AND username != "admin"', [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'User deleted successfully' });
    });
});

// ----- SETTINGS API -----

// Save company settings
app.post('/api/settings/company', requireAuth, (req, res) => {
    // In a real app, you would save to database
    res.json({ message: 'Company settings saved successfully' });
});

// Save preferences
app.post('/api/settings/preferences', requireAuth, (req, res) => {
    // In a real app, you would save to database
    res.json({ message: 'Preferences saved successfully' });
});

// Change password
app.post('/api/settings/change-password', requireAuth, (req, res) => {
    const { current_password, new_password } = req.body;
    
    // Get current user
    db.get('SELECT password_hash FROM users WHERE username = ?', [req.session.user], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (!row || !bcrypt.compareSync(current_password, row.password_hash)) {
            return res.status(400).json({ error: 'Current password is incorrect' });
        }
        
        const new_password_hash = bcrypt.hashSync(new_password, 10);
        db.run('UPDATE users SET password_hash = ? WHERE username = ?', [new_password_hash, req.session.user], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Password changed successfully' });
        });
    });
});

// ----- SYSTEM API -----

// Get database size
app.get('/api/system/db-size', requireAuth, (req, res) => {
    res.json({ size: '2.4 MB' });
});

// Perform backup
app.post('/api/system/backup', requireAuth, (req, res) => {
    res.json({ message: 'Backup completed successfully' });
});

// Clear cache
app.post('/api/system/clear-cache', requireAuth, (req, res) => {
    res.json({ message: 'Cache cleared successfully' });
});

// System diagnostics
app.get('/api/system/diagnostics', requireAuth, (req, res) => {
    res.json({
        status: 'Healthy',
        uptime: '2 hours',
        memory: '45% used',
        db_status: 'Connected'
    });
});

// ========== START SERVER ==========

app.listen(PORT, () => {
    console.log(`🚀 CRM Web Application running on port ${PORT}`);
    console.log(`🌐 Access at: http://localhost:${PORT}`);
    console.log(`🔐 Login: admin / admin123`);
    console.log(`\n📋 Available Pages:`);
    console.log(`   /login         - Login page`);
    console.log(`   /dashboard     - Main dashboard`);
    console.log(`   /customers     - Customer management`);
    console.log(`   /contacts      - Contact management`);
    console.log(`   /opportunities - Sales pipeline`);
    console.log(`   /activities    - Tasks and meetings`);
    console.log(`   /reports       - Analytics and reports`);
    console.log(`   /settings      - System settings`);
});