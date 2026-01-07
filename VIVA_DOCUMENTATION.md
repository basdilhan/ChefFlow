# ChefFlow V2 - Complete Project Documentation for Viva

## Table of Contents
1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Doubly Linked List Implementation](#doubly-linked-list-implementation)
4. [Priority Queue System](#priority-queue-system)
5. [Data Structures & Algorithms](#data-structures--algorithms)
6. [Technology Stack](#technology-stack)
7. [Key Features](#key-features)
8. [System Flow](#system-flow)
9. [Firebase Integration](#firebase-integration)
10. [Multi-Device Synchronization](#multi-device-synchronization)

---

## Project Overview

**ChefFlow V2** is a real-time Kitchen Display System (KDS) designed for restaurant order management. The system efficiently handles order processing using a custom-built doubly linked list data structure to maintain a priority queue of orders.

### Problem Statement
Restaurants need an efficient way to manage incoming orders with different priority levels (VIP, Express, Normal) while maintaining optimal preparation time scheduling.

### Solution
A hybrid architecture combining:
- **Java Backend**: Manual doubly linked list for in-memory order queue management
- **Node.js Server**: Web interface and Firebase database integration
- **Firebase Firestore**: Persistent storage and multi-device synchronization
- **Web Frontend**: Real-time display for cashier, kitchen, and analytics

---

## System Architecture

### Three-Tier Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                       │
│  (HTML/CSS/JavaScript - billing.html, kitchen.html,         │
│   analytics.html, index.html)                               │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP Requests
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                         │
│  Node.js + Express Server (Port 3000)                       │
│  - REST API Endpoints                                        │
│  - Firebase Integration                                      │
│  - Java Process Management                                   │
└──────────────────────┬──────────────────────────────────────┘
                       │ child_process.spawn()
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                      DATA LAYER                              │
│  Java Backend (OrderNode.java, KitchenQueue.java)          │
│  - Doubly Linked List Implementation                        │
│  - Priority Queue Logic                                      │
│  + Firebase Firestore (Persistent Storage)                  │
└─────────────────────────────────────────────────────────────┘
```

### Why Hybrid Architecture?

1. **Java**: Excellent for data structure implementation, strong typing
2. **Node.js**: Superior for web servers, async operations, real-time communication
3. **Firebase**: Cloud-based persistence, multi-device sync, no server maintenance

---

## Doubly Linked List Implementation

### What is a Doubly Linked List?

A doubly linked list is a linear data structure where each node contains:
- **Data**: The actual information (order details)
- **Next Pointer**: Reference to the next node
- **Previous Pointer**: Reference to the previous node

```
NULL ← [Prev|Data|Next] ⟷ [Prev|Data|Next] ⟷ [Prev|Data|Next] → NULL
         HEAD                                      TAIL
```

### OrderNode.java Structure

```java
public class OrderNode {
    // Order Data
    String orderId;          // Unique identifier
    String customerName;     // Customer name
    String items;            // Order items
    double totalAmount;      // Bill amount
    int prepTime;           // Preparation time in minutes
    String priority;        // "VIP", "Express", or "Normal"
    long timestamp;         // Order creation time
    
    // Pointers
    OrderNode next;         // Points to next node
    OrderNode prev;         // Points to previous node
}
```

### Why Doubly Linked List?

**Advantages:**
1. **Bidirectional Traversal**: Can move forward and backward
2. **Efficient Deletion**: O(1) time if node reference is known
3. **Easy Insertion**: Can insert before or after any node in O(1)
4. **No Shifting Required**: Unlike arrays, no element shifting needed

**Comparison with Arrays:**
| Operation | Array | Doubly Linked List |
|-----------|-------|-------------------|
| Insert at Start | O(n) | O(1) |
| Insert at End | O(1) | O(1) |
| Insert at Position | O(n) | O(1) with reference |
| Delete | O(n) | O(1) with reference |
| Search | O(n) | O(n) |
| Random Access | O(1) | O(n) |

---

## Priority Queue System

### Three Priority Levels

1. **VIP Orders** (Highest Priority)
   - Inserted at the front within VIP section
   - Always processed before Express and Normal orders
   - Example: Special customers, large orders

2. **Express Orders** (Medium Priority)
   - Sorted by preparation time (shortest first)
   - Processed after VIP but before Normal orders
   - Example: Quick meals, takeaway orders

3. **Normal Orders** (Standard Priority)
   - Sorted by preparation time
   - FIFO (First In, First Out) within same prep time
   - Example: Regular dine-in orders

### Insertion Algorithm

**VIP Insertion (O(1) - Constant Time):**
```java
public void addOrder(OrderNode newOrder) {
    if (priority.equals("VIP")) {
        // Insert at head (front of queue)
        if (head == null) {
            head = tail = newOrder;
        } else {
            newOrder.next = head;
            head.prev = newOrder;
            head = newOrder;
        }
        size++;
    }
}
```

**Express/Normal Insertion (O(n) - Linear Time):**
```java
else {
    // Find correct position based on prep time
    OrderNode current = head;
    
    // Skip all VIP orders
    while (current != null && current.priority.equals("VIP")) {
        current = current.next;
    }
    
    // Skip orders with smaller prep time
    while (current != null && 
           current.prepTime <= newOrder.prepTime) {
        current = current.next;
    }
    
    // Insert at found position
    if (current == null) {
        // Insert at end
        insertAtEnd(newOrder);
    } else {
        // Insert before current
        insertBefore(current, newOrder);
    }
}
```

### Time Complexity Analysis

| Operation | Time Complexity | Explanation |
|-----------|----------------|-------------|
| Add VIP Order | O(1) | Always insert at head |
| Add Express Order | O(n) | Must find position by prep time |
| Add Normal Order | O(n) | Must find position by prep time |
| Complete Order | O(1) | Remove head node |
| Get Next Order | O(1) | Return head node |
| Display Queue | O(n) | Traverse all nodes |

---

## Data Structures & Algorithms

### 1. Doubly Linked List (Primary Data Structure)

**Implementation Location:** `KitchenQueue.java`

**Key Operations:**
- `addOrder(OrderNode order)`: Insert with priority logic
- `completeOrder(String orderId)`: Remove completed order
- `getNextOrder()`: Peek at head
- `displayQueue()`: Traverse and print all nodes

### 2. Priority Queue Pattern

**Not using Java's PriorityQueue class** - Custom implementation using doubly linked list with three priority zones.

**Priority Zones:**
```
[VIP Zone] → [Express Zone (sorted by time)] → [Normal Zone (sorted by time)]
```

### 3. Sorting Algorithm

**In-place Insertion Sort** during node insertion:
- Compare preparation times
- Maintain sorted order within each priority zone
- No additional sorting step required

### 4. Search Algorithm

**Linear Search** for order completion:
```java
public void completeOrder(String orderId) {
    OrderNode current = head;
    while (current != null) {
        if (current.orderId.equals(orderId)) {
            removeNode(current);
            return;
        }
        current = current.next;
    }
}
```

---

## Technology Stack

### Backend Technologies

**1. Java (JDK 8+)**
- **Purpose**: Data structure implementation, queue management
- **Files**: `OrderNode.java`, `KitchenQueue.java`, `Main.java`
- **Why**: Strong typing, excellent for algorithm implementation

**2. Node.js (v14+) + Express.js**
- **Purpose**: Web server, REST API, Firebase integration
- **File**: `server.js`
- **Why**: Async I/O, easy web development, npm ecosystem

**3. Firebase Firestore**
- **Purpose**: Cloud database, persistent storage
- **Collection**: `orders`
- **Why**: Real-time sync, no server setup, scalable

### Frontend Technologies

**1. HTML5**
- Semantic markup
- Forms for order input
- Tables for kitchen display

**2. CSS3**
- Gradient backgrounds (`linear-gradient`)
- Flexbox and Grid layouts
- Animations (`@keyframes`)
- Custom scrollbars

**3. Vanilla JavaScript**
- Fetch API for HTTP requests
- DOM manipulation
- Real-time polling (1s for kitchen, 5s for multi-device)
- Web Audio API for sound notifications

---

## Key Features

### 1. Order Management
- **Add Orders**: Three priority levels with automatic positioning
- **Complete Orders**: Mark as completed, remove from queue
- **View Queue**: Real-time kitchen display with color coding

### 2. Priority System
```
Priority Hierarchy:
🔴 VIP (Red) → Always First
🟡 Express (Yellow) → By Prep Time
🟢 Normal (Green) → By Prep Time
```

### 3. Kitchen Display System
- **Real-time Updates**: Polling every 1 second
- **Sound Notifications**: Audio alerts for new orders
- **Visual Indicators**: Color-coded priority badges
- **Preparation Time**: Countdown display

### 4. Analytics Dashboard
- **Time Periods**: Today, Week, Month, All Time
- **Metrics**:
  - Total orders
  - Total revenue
  - Average order value
  - Orders by priority (pie chart)
  - Revenue trend (line chart)

### 5. Quick Actions Menu (18 Dishes)
Two-column grid layout with pre-configured menu items:
- **Kottu**: Chicken, Beef, Mixed
- **Biryani**: Chicken, Beef, Vegetable
- **Fried Rice**: Chicken, Beef, Mixed
- **Pizza**: Cheese, Chicken
- **Burgers**: Beef, Chicken
- **Pasta**: Chicken, Beef
- **Salads**: Caesar, Grilled Chicken
- **Mixed Grill Platter**

### 6. Multi-Device Synchronization
- **Polling Interval**: 5 seconds
- **Sync Mechanism**: Compare local queue with Firebase
- **Conflict Resolution**: Firebase as source of truth
- **Use Case**: Multiple cashier stations

---

## System Flow

### 1. Order Creation Flow

```
Cashier enters order → billing.html
         ↓
POST /api/orders → Node.js server
         ↓
Write to Java stdin → KitchenQueue.addOrder()
         ↓
Insert into doubly linked list (priority-based)
         ↓
Save to Firebase Firestore → orders collection
         ↓
Return success → Update UI
```

### 2. Kitchen Display Flow

```
kitchen.html loads
         ↓
Poll GET /api/orders/queue every 1 second
         ↓
Node.js reads from Java stdout
         ↓
Java traverses doubly linked list
         ↓
Return JSON array of orders
         ↓
Update kitchen display with color coding
         ↓
Play sound if new orders detected
```

### 3. Order Completion Flow

```
Chef clicks "Complete" → kitchen.html
         ↓
POST /api/orders/complete/:id → Node.js
         ↓
Write to Java stdin → KitchenQueue.completeOrder()
         ↓
Search for order in linked list (linear search)
         ↓
Remove node (update prev.next and next.prev)
         ↓
Update Firebase: status = "completed"
         ↓
Return success → Refresh kitchen display
```

---

## Firebase Integration

### Database Structure

**Collection: `orders`**
```javascript
{
  orderId: "ORD001",           // String
  customerName: "John Doe",    // String
  items: "Kottu Chicken",      // String
  totalAmount: 850,            // Number
  prepTime: 18,                // Number (minutes)
  priority: "Normal",          // String (VIP/Express/Normal)
  timestamp: 1704672000000,    // Number (Unix timestamp)
  status: "pending"            // String (pending/completed)
}
```

### Operations

**1. Create Order:**
```javascript
await db.collection('orders').add(orderData);
```

**2. Fetch Orders:**
```javascript
const snapshot = await db.collection('orders')
  .where('status', '==', 'pending')
  .get();
```

**3. Complete Order:**
```javascript
await db.collection('orders').doc(orderId)
  .update({ status: 'completed' });
```

**4. Analytics Query:**
```javascript
const snapshot = await db.collection('orders')
  .where('timestamp', '>=', startDate)
  .where('timestamp', '<=', endDate)
  .get();
```

### Why Firebase?

1. **No Server Maintenance**: Managed cloud service
2. **Real-time Sync**: Automatic updates across devices
3. **Scalability**: Handles growing data automatically
4. **Security**: Built-in authentication and rules
5. **Offline Support**: Works offline, syncs when online

---

## Multi-Device Synchronization

### Problem
Multiple cashier stations need to see the same order queue in real-time.

### Solution
**Polling + Firebase as Source of Truth**

### Implementation

**1. Periodic Sync (Every 5 seconds):**
```javascript
setInterval(syncWithDatabase, 5000);
```

**2. Sync Logic:**
```javascript
async function syncWithDatabase() {
    // Fetch pending orders from Firebase
    const snapshot = await db.collection('orders')
        .where('status', '==', 'pending')
        .get();
    
    // Get current queue from Java
    const currentQueue = await fetch('/api/orders/queue');
    
    // Find orders in Firebase but not in queue
    const ordersToAdd = firebaseOrders.filter(fbOrder => 
        !currentQueue.some(qOrder => qOrder.orderId === fbOrder.orderId)
    );
    
    // Rehydrate missing orders to Java queue
    for (const order of ordersToAdd) {
        await fetch('/api/orders', {
            method: 'POST',
            body: JSON.stringify(order)
        });
    }
}
```

**3. Rehydration on Server Restart:**
When Node.js server starts, it loads all pending orders from Firebase back into the Java queue.

### Benefits
- ✅ Consistency across devices
- ✅ Survives server restarts
- ✅ No data loss
- ✅ Simple implementation (no WebSockets needed)

---

## Code Examples for Viva

### Example 1: VIP Order Insertion (O(1))

**Question:** How does VIP insertion achieve O(1) time complexity?

**Answer:** VIP orders are always inserted at the head of the list, requiring only pointer updates:

```java
if (priority.equals("VIP")) {
    if (head == null) {
        // Empty list: new node becomes head and tail
        head = tail = newOrder;
    } else {
        // Insert at head
        newOrder.next = head;   // New node points to old head
        head.prev = newOrder;   // Old head points back to new node
        head = newOrder;        // Update head reference
    }
    size++;
}
```

**Steps:**
1. Set new node's `next` to current `head`
2. Set current `head`'s `prev` to new node
3. Update `head` to new node
4. Total: 3 operations regardless of list size → **O(1)**

---

### Example 2: Express Order Insertion (O(n))

**Question:** Why is Express order insertion O(n)?

**Answer:** Must traverse the list to find the correct position based on preparation time:

```java
OrderNode current = head;

// Phase 1: Skip VIP section (could be k nodes)
while (current != null && current.priority.equals("VIP")) {
    current = current.next;
}

// Phase 2: Skip Express orders with smaller prep time
while (current != null && 
       current.priority.equals("Express") &&
       current.prepTime <= newOrder.prepTime) {
    current = current.next;
}

// Phase 3: Insert before current position
insertBefore(current, newOrder);
```

**Worst Case:** Must traverse entire list to find position → **O(n)**

---

### Example 3: Node Removal (O(1) with reference)

**Question:** How do you remove a node from a doubly linked list?

**Answer:** Update the previous and next pointers:

```java
private void removeNode(OrderNode node) {
    // Update previous node's next pointer
    if (node.prev != null) {
        node.prev.next = node.next;
    } else {
        // Removing head
        head = node.next;
    }
    
    // Update next node's prev pointer
    if (node.next != null) {
        node.next.prev = node.prev;
    } else {
        // Removing tail
        tail = node.prev;
    }
    
    size--;
}
```

**Time Complexity:** Only pointer updates → **O(1)** when node reference is known

---

## Viva Questions & Answers

### Data Structures

**Q1: Why did you choose a doubly linked list over an array?**

**A:** 
- **Efficient Insertion**: O(1) for VIP orders at head, no shifting required
- **Dynamic Size**: No fixed capacity, grows as needed
- **Easy Deletion**: O(1) removal with node reference
- **Bidirectional Traversal**: Can move forward and backward
- **No Resizing Overhead**: Unlike ArrayList, no array copying

**Q2: What is the space complexity of your implementation?**

**A:** O(n) where n is the number of orders. Each node requires:
- Order data (fixed size)
- 2 pointers (next and prev)
- No additional space needed

**Q3: How do you handle memory leaks?**

**A:** Java's garbage collector automatically reclaims memory when nodes are removed and no references remain.

---

### Algorithms

**Q4: What sorting algorithm does your priority queue use?**

**A:** Insertion sort during node insertion. As each order is added, it's placed in the correct position based on:
1. Priority level (VIP > Express > Normal)
2. Preparation time (shorter first within same priority)

**Q5: What is the time complexity of displaying all orders?**

**A:** O(n) - Must traverse entire linked list from head to tail.

**Q6: Can you optimize the search operation?**

**A:** 
- **Current**: Linear search O(n)
- **Optimization**: Add a HashMap<OrderId, OrderNode> for O(1) lookup
- **Trade-off**: Extra O(n) space complexity

---

### System Design

**Q7: Why use both Java and Node.js?**

**A:**
- **Java**: Better for implementing data structures, strong typing, academic focus on algorithms
- **Node.js**: Superior for web servers, async operations, easy Firebase integration
- **Hybrid Approach**: Leverage strengths of both languages

**Q8: How does the system handle concurrent requests?**

**A:**
- **Node.js**: Single-threaded event loop handles async operations
- **Java Communication**: Sequential stdin/stdout communication
- **Firebase**: Handles concurrent writes with transactions

**Q9: What happens if the server crashes?**

**A:**
- **Firebase Persistence**: All orders stored in cloud database
- **Rehydration**: On restart, server loads pending orders from Firebase
- **Recovery Time**: < 5 seconds (sync interval)

---

### Real-World Applications

**Q10: How would you scale this system for 100 restaurants?**

**A:**
- **Database**: Shard by restaurant ID
- **Queue**: Separate Java process per restaurant
- **Load Balancer**: Distribute requests across servers
- **Caching**: Redis for frequently accessed data

**Q11: How would you implement order cancellation?**

**A:**
1. Add "Cancel" button in kitchen.html
2. Create DELETE endpoint in server.js
3. Implement `cancelOrder(orderId)` in KitchenQueue.java
4. Search and remove node (same as complete)
5. Update Firebase: status = "cancelled"

---

## Performance Metrics

### Time Complexities

| Operation | Best Case | Average Case | Worst Case |
|-----------|-----------|--------------|------------|
| Add VIP Order | O(1) | O(1) | O(1) |
| Add Express Order | O(1) | O(n/2) | O(n) |
| Add Normal Order | O(1) | O(n/2) | O(n) |
| Complete Order | O(1) | O(n/2) | O(n) |
| View Next Order | O(1) | O(1) | O(1) |
| Display All | O(n) | O(n) | O(n) |

### Space Complexity

- **Java Queue**: O(n) for n orders
- **Firebase**: O(n) for persistent storage
- **Frontend**: O(n) for displaying orders
- **Total**: O(n)

---

## Advantages of Our Implementation

1. **O(1) VIP Insertion**: Fastest possible for high-priority orders
2. **Automatic Sorting**: No separate sorting step needed
3. **Persistent Storage**: Orders survive server restarts
4. **Multi-Device Support**: Works across multiple stations
5. **Real-Time Updates**: Kitchen sees orders within 1 second
6. **Scalable**: Can handle hundreds of orders efficiently
7. **User-Friendly**: Intuitive UI for cashiers and kitchen staff
8. **Sound Notifications**: Audio alerts prevent missed orders

---

## Limitations & Future Improvements

### Current Limitations

1. **Linear Search**: O(n) for order completion
2. **Polling**: Not true real-time (5-second delay for sync)
3. **No Authentication**: Anyone can access any page
4. **Single Restaurant**: Designed for one restaurant

### Proposed Improvements

1. **HashMap Addition**: O(1) order lookup
   ```java
   HashMap<String, OrderNode> orderMap = new HashMap<>();
   ```

2. **WebSocket Communication**: True real-time updates
   ```javascript
   const io = require('socket.io')(server);
   ```

3. **User Authentication**: Firebase Auth integration
   ```javascript
   firebase.auth().signInWithEmailAndPassword(email, password);
   ```

4. **Multi-Restaurant Support**: Restaurant ID in data model
   ```javascript
   {
     restaurantId: "REST001",
     orderId: "ORD001",
     // ... other fields
   }
   ```

5. **Order Modification**: Edit order before completion
6. **Customer Display**: Show order number on screen
7. **Printer Integration**: Auto-print kitchen receipts
8. **Mobile App**: React Native for tablets

---

## Conclusion

ChefFlow V2 demonstrates practical application of data structures and algorithms in a real-world restaurant management system. The custom doubly linked list implementation provides efficient order management with priority-based insertion, achieving O(1) time complexity for VIP orders while maintaining sorted order for Express and Normal orders. The hybrid architecture combines Java's strengths in algorithm implementation with Node.js's web capabilities and Firebase's cloud infrastructure, creating a scalable, persistent, and user-friendly solution for kitchen order management.

---

## Key Takeaways for Viva

1. ✅ **Doubly Linked List**: Chosen for efficient insertion and deletion
2. ✅ **Priority Queue**: Three-level system with custom sorting logic
3. ✅ **O(1) VIP Insertion**: Always insert at head for maximum efficiency
4. ✅ **Hybrid Architecture**: Java + Node.js + Firebase for best of all worlds
5. ✅ **Persistent Storage**: Firebase ensures no data loss
6. ✅ **Multi-Device Sync**: Polling mechanism for consistency
7. ✅ **Real-Time Display**: Kitchen sees orders within 1 second
8. ✅ **Scalable Design**: Can handle growing order volumes

---

**Total Lines of Code:** ~2000+ lines
**Languages Used:** Java, JavaScript, HTML, CSS
**Data Structures:** Doubly Linked List, Priority Queue
**Algorithms:** Insertion Sort, Linear Search
**Databases:** Firebase Firestore
**Architecture:** Three-Tier (Presentation, Application, Data)

---

*This documentation covers all aspects of the ChefFlow V2 system for viva examination purposes.*
