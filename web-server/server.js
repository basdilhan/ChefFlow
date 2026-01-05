const express = require('express');
const admin = require('firebase-admin');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Initialize Firebase Admin
const serviceAccount = require('./serviceAccount.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const ordersCollection = db.collection('orders');

// Java Process Management
let javaProcess = null;
let currentQueue = [];

/**
 * Start the Java backend process
 */
function startJavaProcess() {
    const javaPath = path.join(__dirname, '..', 'backend-java');
    
    javaProcess = spawn('java', ['-cp', javaPath, 'Main']);
    
    javaProcess.stdout.on('data', (data) => {
        const output = data.toString().trim();
        console.log('Java Output:', output);
        
        // Check if it's a JSON array (the queue state)
        if (output.startsWith('[')) {
            try {
                currentQueue = JSON.parse(output);
            } catch (e) {
                console.error('Failed to parse Java output:', e);
            }
        }
    });
    
    javaProcess.stderr.on('data', (data) => {
        console.error('Java Error:', data.toString());
    });
    
    javaProcess.on('close', (code) => {
        console.log(`Java process exited with code ${code}`);
    });
    
    // Wait for READY signal
    return new Promise((resolve) => {
        javaProcess.stdout.once('data', (data) => {
            if (data.toString().includes('READY')) {
                console.log('Java backend is ready');
                resolve();
            }
        });
    });
}

/**
 * Send command to Java process
 */
function sendToJava(command) {
    if (javaProcess && javaProcess.stdin.writable) {
        javaProcess.stdin.write(command + '\n');
    } else {
        console.error('Java process is not running or not writable');
    }
}

/**
 * Rehydrate the queue from Firestore on startup
 */
async function rehydrateQueue() {
    try {
        const snapshot = await ordersCollection
            .where('status', '==', 'PENDING')
            .orderBy('timestamp', 'asc')
            .get();
        
        console.log(`Rehydrating ${snapshot.size} pending orders...`);
        
        snapshot.forEach((doc) => {
            const order = doc.data();
            const command = order.isVip 
                ? `VIP,${order.id},${order.items},${order.prepTime},${order.isExpress || false}`
                : `ADD,${order.id},${order.items},${order.prepTime},${order.isExpress || false}`;
            
            sendToJava(command);
        });
        
        console.log('Queue rehydration complete');
    } catch (error) {
        console.error('Error rehydrating queue:', error);
    }
}

/**
 * API: Add a new order
 */
app.post('/add-order', async (req, res) => {
    try {
        const { id, items, isVip, isExpress, prepTime } = req.body;
        
        // Validate input
        if (!id || !items || prepTime === undefined) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // Save to Firestore
        await ordersCollection.doc(id.toString()).set({
            id: parseInt(id),
            items: items,
            isVip: isVip || false,
            isExpress: isExpress || false,
            prepTime: parseInt(prepTime),
            status: 'PENDING',
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Send to Java
        const command = isVip 
            ? `VIP,${id},${items},${prepTime},${isExpress || false}`
            : `ADD,${id},${items},${prepTime},${isExpress || false}`;
        
        sendToJava(command);
        
        res.json({ success: true, message: 'Order added successfully' });
    } catch (error) {
        console.error('Error adding order:', error);
        res.status(500).json({ error: 'Failed to add order' });
    }
});

/**
 * API: Cancel a specific order by ID
 */
app.post('/cancel-order', async (req, res) => {
    try {
        const { id } = req.body;
        
        if (!id) {
            return res.status(400).json({ error: 'Order ID is required' });
        }
        
        // Update Firestore
        await ordersCollection.doc(id.toString()).update({
            status: 'CANCELLED',
            cancelledAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Send to Java
        sendToJava(`CANCEL,${id}`);
        
        res.json({ success: true, message: 'Order cancelled', orderId: id });
    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).json({ error: 'Failed to cancel order' });
    }
});

/**
 * API: Complete a selected order by ID
 */
app.post('/complete-selected-order', async (req, res) => {
    try {
        const { id } = req.body;
        
        if (!id) {
            return res.status(400).json({ error: 'Order ID is required' });
        }
        
        // Update Firestore
        await ordersCollection.doc(id.toString()).update({
            status: 'COMPLETED',
            completedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Send to Java (CANCEL removes it from the list)
        sendToJava(`CANCEL,${id}`);
        
        res.json({ success: true, message: 'Order completed', orderId: id });
    } catch (error) {
        console.error('Error completing order:', error);
        res.status(500).json({ error: 'Failed to complete order' });
    }
});

/**
 * API: Complete the current order (head of queue)
 */
app.post('/complete-order', async (req, res) => {
    try {
        if (currentQueue.length === 0) {
            return res.status(400).json({ error: 'No orders in queue' });
        }
        
        const headOrder = currentQueue[0];
        
        // Update Firestore
        await ordersCollection.doc(headOrder.id.toString()).update({
            status: 'COMPLETED',
            completedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Send to Java
        sendToJava('COMPLETE');
        
        res.json({ success: true, message: 'Order completed', orderId: headOrder.id });
    } catch (error) {
        console.error('Error completing order:', error);
        res.status(500).json({ error: 'Failed to complete order' });
    }
});

/**
 * API: Get the current live queue
 */
app.get('/live-queue', (req, res) => {
    res.json({ queue: currentQueue });
});

/**
 * API: Get order history and analytics
 */
app.get('/api/analytics', async (req, res) => {
    try {
        const { period = 'today' } = req.query;
        
        let startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        
        if (period === 'week') {
            startDate.setDate(startDate.getDate() - 7);
        } else if (period === 'month') {
            startDate.setMonth(startDate.getMonth() - 1);
        }
        
        const snapshot = await ordersCollection
            .where('timestamp', '>=', startDate)
            .orderBy('timestamp', 'desc')
            .get();
        
        const orders = [];
        let totalOrders = 0;
        let completedOrders = 0;
        let cancelledOrders = 0;
        let vipOrders = 0;
        let expressOrders = 0;
        let totalPrepTime = 0;
        
        snapshot.forEach((doc) => {
            const order = { id: doc.id, ...doc.data() };
            orders.push(order);
            totalOrders++;
            
            if (order.status === 'COMPLETED') completedOrders++;
            if (order.status === 'CANCELLED') cancelledOrders++;
            if (order.isVip) vipOrders++;
            if (order.isExpress) expressOrders++;
            totalPrepTime += order.prepTime || 0;
        });
        
        const avgPrepTime = totalOrders > 0 ? Math.round(totalPrepTime / totalOrders) : 0;
        
        res.json({
            orders,
            stats: {
                totalOrders,
                completedOrders,
                cancelledOrders,
                pendingOrders: totalOrders - completedOrders - cancelledOrders,
                vipOrders,
                expressOrders,
                avgPrepTime,
                completionRate: totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0
            }
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});

/**
 * API: Get all orders from Firestore (for debugging)
 */
app.get('/all-orders', async (req, res) => {
    try {
        const snapshot = await ordersCollection
            .orderBy('timestamp', 'desc')
            .limit(100)
            .get();
        
        const orders = [];
        snapshot.forEach((doc) => {
            orders.push({ id: doc.id, ...doc.data() });
        });
        
        res.json({ orders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

/**
 * Start the server
 */
async function startServer() {
    try {
        console.log('Starting Java backend...');
        await startJavaProcess();
        
        console.log('Rehydrating queue from Firestore...');
        await rehydrateQueue();
        
        app.listen(PORT, () => {
            console.log(`ChefFlow V2 server running on http://localhost:${PORT}`);
            console.log('Billing: http://localhost:3000/billing.html');
            console.log('Kitchen: http://localhost:3000/kitchen.html');
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down...');
    if (javaProcess) {
        javaProcess.kill();
    }
    process.exit(0);
});

// Start the server
startServer();
