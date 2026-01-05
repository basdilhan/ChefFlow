# ChefFlow V2 - Hybrid Kitchen Display System

A full-stack Kitchen Display System with a hybrid architecture combining Java backend (high-speed queue management) and Node.js frontend (web server + Firebase integration).

## 🏗️ Architecture

- **Java Backend**: High-speed order queue using manual doubly linked list implementation (RAM-based)
- **Node.js Server**: Express web server with Firebase Firestore integration
- **Frontend**: Modern HTML/CSS/JS with real-time updates

## 📁 Project Structure

```
ChefFlow/
├── backend-java/
│   ├── OrderNode.java       # Node class for doubly linked list
│   ├── KitchenQueue.java    # Manual linked list with add/complete operations
│   └── Main.java            # Command parser listening on stdin
│
└── web-server/
    ├── server.js            # Express server + Firebase + Java process bridge
    ├── package.json         # Node dependencies
    ├── serviceAccount.json  # Firebase credentials (REPLACE THIS!)
    └── public/
        ├── index.html       # Landing page
        ├── billing.html     # Cashier interface
        └── kitchen.html     # Kitchen display dashboard
```

## 🚀 Setup Instructions

### 1. Java Backend Setup

Navigate to the `backend-java` folder and compile the Java files:

```bash
cd backend-java
javac OrderNode.java KitchenQueue.java Main.java
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use an existing one
3. Go to Project Settings → Service Accounts
4. Click "Generate New Private Key"
5. Download the JSON file and replace `web-server/serviceAccount.json` with your credentials

### 3. Node.js Setup

Navigate to the `web-server` folder and install dependencies:

```bash
cd web-server
npm install
```

### 4. Run the Application

From the `web-server` folder:

```bash
npm start
```

The server will start on `http://localhost:3000`

## 🎯 Features

### Java Backend (Manual Linked List)

- **No `java.util.LinkedList` used** - completely manual implementation
- **addNormal(id, items, time)**: Adds order to the tail
- **addVip(id, items, time)**: Adds VIP order to the head (priority)
- **completeOrder()**: Removes the head node
- **printList()**: Outputs queue as JSON array

### Node.js Bridge

- **Rehydration**: On startup, loads all PENDING orders from Firestore and rebuilds the Java queue
- **child_process.spawn**: Runs Java Main class and communicates via stdin/stdout

### API Endpoints

- `POST /add-order` - Add new order (saves to Firestore → sends to Java)
- `POST /complete-order` - Complete current order (updates Firestore → sends COMPLETE to Java)
- `GET /live-queue` - Get current queue state
- `GET /all-orders` - Get all orders from Firestore (debugging)

### Frontend

#### Billing Station (`/billing.html`)
- Order ID input
- Item name input
- Prep time input
- VIP checkbox
- Auto-increments order ID

#### Kitchen Display (`/kitchen.html`)
- Real-time queue polling (every 1 second)
- VIP orders have **red background**
- Active (head) order has **green border**
- Displays prep time prominently
- "Complete Current Order" button
- Statistics: Total orders, VIP count, total time

## 🎨 UI Styling

- **VIP Orders**: Red gradient background
- **Active Order**: Green border with glow effect
- **Cards**: Modern card design with hover effects
- **Responsive**: Works on desktop and tablet

## 📊 Database Schema (Firestore)

Collection: `orders`

```javascript
{
  id: number,
  items: string,
  isVip: boolean,
  prepTime: number,
  status: 'PENDING' | 'COMPLETED',
  timestamp: Timestamp,
  completedAt: Timestamp (optional)
}
```

## 🔄 Workflow

1. **Cashier** enters order in billing.html
2. **Server** saves to Firestore with status='PENDING'
3. **Server** sends command to Java process (stdin)
4. **Java** processes command and updates linked list
5. **Java** prints queue as JSON to stdout
6. **Server** captures output and stores in memory
7. **Kitchen Display** polls `/live-queue` every second
8. **Chef** clicks "Complete Order" button
9. **Server** updates Firestore status to 'COMPLETED'
10. **Server** sends COMPLETE command to Java
11. **Java** removes head node and prints new queue

## 🛠️ Commands (Java stdin format)

- `ADD,1,Burger,10` - Add normal order
- `VIP,2,Pizza,15` - Add VIP order
- `COMPLETE` - Complete current order
- `PRINT` - Print current queue (debugging)

## 📝 Notes

- Java process must be compiled before running Node server
- Replace `serviceAccount.json` with your actual Firebase credentials
- The Java backend runs as a child process of the Node server
- Queue state is kept in RAM (Java) and persisted to Firestore
- On server restart, queue is rehydrated from Firestore

## 🔧 Troubleshooting

**Java process not starting:**
- Make sure Java files are compiled (`javac *.java`)
- Check that Java is in your PATH (`java -version`)

**Firebase errors:**
- Verify `serviceAccount.json` has valid credentials
- Check Firestore rules allow read/write access

**Queue not updating:**
- Check browser console for errors
- Verify Java process is running (check server logs)

## 📦 Dependencies

### Node.js
- `express` - Web server framework
- `firebase-admin` - Firebase SDK for Node.js

### Java
- Java 8 or higher (no external dependencies)

## 🎓 Learning Points

This project demonstrates:
- Manual data structure implementation (doubly linked list)
- Inter-process communication (Node.js ↔ Java)
- Real-time web applications
- Firebase Firestore integration
- Hybrid architecture patterns
- Priority queue algorithms

---

**Built with ❤️ for efficient kitchen operations**
