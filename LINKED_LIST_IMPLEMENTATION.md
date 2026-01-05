# ChefFlow V2 - Doubly Linked List Implementation

## 📋 Overview

ChefFlow V2 uses a **manually implemented doubly linked list** to manage the kitchen order queue efficiently. This implementation provides O(1) time complexity for most operations and enables smart priority-based ordering.

## 🎯 Why Doubly Linked List?

### Advantages:
- **O(1) insertion** at head (VIP orders)
- **O(1) deletion** at head (completing orders)
- **O(n) targeted deletion** for canceling specific orders
- **Memory efficient** - only stores active orders in RAM
- **Bidirectional traversal** - can navigate forward and backward
- **No resizing overhead** unlike arrays
- **Perfect for queue operations** - FIFO with priority overrides

### Real-World Use Case:
In a busy restaurant kitchen, orders need to be:
1. **Prioritized** - VIP customers get served first
2. **Sorted** - Among same priority, shorter prep time orders go first
3. **Flexible** - Orders can be canceled anytime
4. **Fast** - Chefs need instant access to next order

---

## 🏗️ Data Structure

### 1. OrderNode.java

Each order is represented as a node in the doubly linked list:

```java
public class OrderNode {
    int id;                  // Unique order identifier
    String items;            // Order description (e.g., "Burger with Fries")
    boolean isVip;           // VIP priority flag
    boolean isExpress;       // Express priority flag
    int prepTime;            // Preparation time in minutes
    OrderNode next;          // Pointer to next node
    OrderNode prev;          // Pointer to previous node
    
    public OrderNode(int id, String items, boolean isVip, boolean isExpress, int prepTime) {
        this.id = id;
        this.items = items;
        this.isVip = isVip;
        this.isExpress = isExpress;
        this.prepTime = prepTime;
        this.next = null;
        this.prev = null;
    }
}
```

**Key Features:**
- `next` pointer: Links to the next order in queue
- `prev` pointer: Links to the previous order (enables backward traversal)
- Both pointers initialized to `null` by default

---

## 🔗 Doubly Linked List Operations

### 2. KitchenQueue.java

The main queue manager implementing all linked list operations:

#### **Structure:**
```java
public class KitchenQueue {
    private OrderNode head;    // Points to first order (highest priority)
    private OrderNode tail;    // Points to last order (lowest priority)
    
    public KitchenQueue() {
        this.head = null;
        this.tail = null;
    }
}
```

#### **Visual Representation:**
```
Empty Queue:
head -> null
tail -> null

After adding 3 orders:
head -> [VIP Order] <-> [Express Order] <-> [Normal Order] <- tail
        prev=null        prev=VIP           prev=Express
```

---

## 🎯 Core Operations

### Operation 1: Add VIP Order (O(1))

**Algorithm:** Insert at HEAD (highest priority)

```java
public void addVip(int id, String items, int prepTime, boolean isExpress) {
    OrderNode newNode = new OrderNode(id, items, true, isExpress, prepTime);
    
    if (head == null) {
        // Empty queue
        head = tail = newNode;
    } else {
        // Insert at beginning
        newNode.next = head;
        head.prev = newNode;
        head = newNode;
    }
}
```

**Step-by-Step Example:**

```
Initial State:
head -> [Order 101: Pizza, 15min] <-> [Order 102: Salad, 8min] <- tail

Adding VIP Order 103 (Burger, 12min):

Step 1: Create new node
newNode = [Order 103: Burger, 12min, VIP=true]
newNode.next = null
newNode.prev = null

Step 2: Link to current head
newNode.next = head  // Points to Order 101
head.prev = newNode  // Order 101 points back

Step 3: Update head pointer
head = newNode

Final State:
head -> [Order 103: Burger, VIP] <-> [Order 101: Pizza] <-> [Order 102: Salad] <- tail
        prev=null                     prev=103               prev=101
```

**Time Complexity:** **O(1)** - constant time regardless of queue size

---

### Operation 2: Add Normal Order (O(n))

**Algorithm:** Insert AFTER all VIP/Express orders, sorted by prep time

```java
public void addNormal(int id, String items, int prepTime, boolean isExpress) {
    OrderNode newNode = new OrderNode(id, items, false, isExpress, prepTime);
    
    if (head == null) {
        // Empty queue
        head = tail = newNode;
        return;
    }
    
    // Find insertion point after all VIP orders
    OrderNode current = head;
    
    // Skip all VIP orders
    while (current != null && current.isVip) {
        current = current.next;
    }
    
    // Skip all Express orders
    while (current != null && !current.isVip && current.isExpress) {
        current = current.next;
    }
    
    // Insert sorted by prep time among normal orders
    if (isExpress) {
        // Express order: insert after VIPs, before normal orders
        if (current == null) {
            // All orders are VIP, insert at tail
            tail.next = newNode;
            newNode.prev = tail;
            tail = newNode;
        } else {
            // Insert before first normal order
            insertBefore(current, newNode);
        }
    } else {
        // Normal order: sort by prep time
        while (current != null && !current.isVip && 
               current.prepTime <= prepTime) {
            current = current.next;
        }
        
        if (current == null) {
            // Insert at tail
            tail.next = newNode;
            newNode.prev = tail;
            tail = newNode;
        } else {
            // Insert before current
            insertBefore(current, newNode);
        }
    }
}

private void insertBefore(OrderNode node, OrderNode newNode) {
    newNode.next = node;
    newNode.prev = node.prev;
    
    if (node.prev != null) {
        node.prev.next = newNode;
    } else {
        head = newNode;
    }
    
    node.prev = newNode;
}
```

**Detailed Example:**

```
Initial Queue:
head -> [#101: Pizza, VIP, 18min] <-> [#102: Burger, Express, 12min] <-> 
        [#103: Salad, Normal, 8min] <-> [#104: Pasta, Normal, 15min] <- tail

Adding Normal Order #105 (Steak, 10min):

Step 1: Skip VIP orders
current = #101 (VIP) -> Skip
current = #102 (Express) -> Skip
current = #103 (Normal, 8min)

Step 2: Find position by prep time
current.prepTime (8) <= newNode.prepTime (10)? YES -> Continue
current = #104 (Normal, 15min)
current.prepTime (15) <= newNode.prepTime (10)? NO -> Stop

Step 3: Insert before #104
newNode.next = #104
newNode.prev = #103
#103.next = newNode
#104.prev = newNode

Final Queue:
head -> [#101: VIP, 18min] <-> [#102: Express, 12min] <-> 
        [#103: Normal, 8min] <-> [#105: Normal, 10min] <-> [#104: Normal, 15min] <- tail
```

**Time Complexity:** **O(n)** - worst case traverse entire list

---

### Operation 3: Complete Order (O(1))

**Algorithm:** Remove HEAD node

```java
public void completeOrder() {
    if (head == null) {
        System.out.println("ERROR: No orders to complete");
        return;
    }
    
    System.out.println("COMPLETED: Order #" + head.id);
    
    if (head == tail) {
        // Only one order in queue
        head = tail = null;
    } else {
        // Move head to next order
        head = head.next;
        head.prev = null;
    }
    
    printList();
}
```

**Example:**

```
Before Completion:
head -> [#101: Pizza] <-> [#102: Burger] <-> [#103: Salad] <- tail
        prev=null         prev=101          prev=102

Complete Order (removes head):

Step 1: Save reference to next order
temp = head.next  // #102

Step 2: Update head pointer
head = temp

Step 3: Remove backward link
head.prev = null

After Completion:
head -> [#102: Burger] <-> [#103: Salad] <- tail
        prev=null          prev=102

Output: "COMPLETED: Order #101"
```

**Time Complexity:** **O(1)** - constant time

---

### Operation 4: Cancel Order (O(n))

**Algorithm:** Find and remove specific order by ID

```java
public void cancelOrder(int id) {
    if (head == null) {
        System.out.println("ERROR: Queue is empty");
        return;
    }
    
    OrderNode current = head;
    
    // Find order by ID
    while (current != null && current.id != id) {
        current = current.next;
    }
    
    if (current == null) {
        System.out.println("ERROR: Order #" + id + " not found");
        return;
    }
    
    // Remove node from list
    if (current == head) {
        // Removing head
        head = head.next;
        if (head != null) {
            head.prev = null;
        } else {
            tail = null;
        }
    } else if (current == tail) {
        // Removing tail
        tail = tail.prev;
        tail.next = null;
    } else {
        // Removing middle node
        current.prev.next = current.next;
        current.next.prev = current.prev;
    }
    
    System.out.println("CANCELLED: Order #" + id);
    printList();
}
```

**Example - Cancel Middle Order:**

```
Initial Queue:
head -> [#101] <-> [#102] <-> [#103] <-> [#104] <- tail

Cancel Order #102:

Step 1: Find order
current = #101 (id != 102) -> Continue
current = #102 (id == 102) -> Found!

Step 2: Relink neighbors
#101.next = #103  (bypass #102)
#103.prev = #101  (bypass #102)

Step 3: Node #102 is now unreachable

Final Queue:
head -> [#101] <-> [#103] <-> [#104] <- tail
```

**Time Complexity:** **O(n)** - must search for order

---

## 🎯 Priority System

### Order Processing Priority:

```
Priority Level 1: VIP Orders (isVip = true)
    └─> Processed FIRST, in order of arrival

Priority Level 2: Express Orders (isExpress = true, isVip = false)  
    └─> Processed AFTER VIPs, in order of arrival

Priority Level 3: Normal Orders (isVip = false, isExpress = false)
    └─> Processed LAST, sorted by PREP TIME (shortest first)
```

### Example Queue Order:

```
Position 1: [#105: VIP, 25min]        ← Added 2nd, but VIP so goes first
Position 2: [#103: VIP, 15min]        ← Added 1st, VIP
Position 3: [#108: Express, 20min]    ← Added 4th, Express
Position 4: [#106: Normal, 8min]      ← Added 3rd, shortest prep time
Position 5: [#107: Normal, 12min]     ← Added 5th, longer prep time
Position 6: [#109: Normal, 20min]     ← Added 6th, longest prep time
```

**Kitchen Display Shows This Order!**

---

## 🔄 Integration with System

### Command Flow:

```
1. Frontend (billing.html)
   ↓
   POST /add-order
   ↓
2. Node.js Server (server.js)
   ↓ Save to Firebase
   ↓ Send command to Java
   ↓
3. Java Process (Main.java)
   ↓ Parse command
   ↓ ADD,id,items,prepTime,isVip,isExpress
   ↓
4. KitchenQueue (Java)
   ↓ addVip() or addNormal()
   ↓ Insert in correct position
   ↓ printList() (output JSON)
   ↓
5. Node.js Server reads stdout
   ↓ Updates currentQueue variable
   ↓
6. Frontend (kitchen.html)
   ↓ GET /live-queue (polls every 1 second)
   ↓ Displays updated queue
```

---

## 📊 Performance Analysis

| Operation | Time Complexity | Space Complexity | Description |
|-----------|----------------|------------------|-------------|
| Add VIP | O(1) | O(1) | Insert at head |
| Add Normal | O(n) | O(1) | Find position, insert |
| Complete | O(1) | O(1) | Remove head |
| Cancel | O(n) | O(1) | Search and remove |
| Display | O(n) | O(n) | Traverse and serialize to JSON |

**Where:**
- n = number of orders in queue
- Typical queue size: 5-20 orders
- Acceptable performance for real-time kitchen operations

---

## 🧪 Test Scenarios

### Scenario 1: Basic VIP Priority

```java
Input Commands:
ADD,101,Burger,12,false,false      // Normal
VIP,102,Pizza,15,false             // VIP
ADD,103,Salad,8,false,false        // Normal

Resulting Queue:
[#102: Pizza, VIP] -> [#103: Salad, Normal, 8min] -> [#101: Burger, Normal, 12min]

Why? VIP goes first, then normal orders sorted by prep time (8min < 12min)
```

### Scenario 2: Express Priority

```java
Input Commands:
ADD,101,Burger,12,false,false      // Normal
ADD,102,Pizza,15,false,true        // Express
VIP,103,Steak,20,false             // VIP
ADD,104,Salad,8,false,false        // Normal

Resulting Queue:
[#103: Steak, VIP] -> [#102: Pizza, Express] -> [#104: Salad, 8min] -> [#101: Burger, 12min]

Priority: VIP > Express > Normal (sorted by prep time)
```

### Scenario 3: Cancel and Complete

```java
Initial Queue:
[#101: VIP] -> [#102: Express] -> [#103: Normal]

Command: COMPLETE
Result: [#102: Express] -> [#103: Normal]

Command: CANCEL,103
Result: [#102: Express]

Command: COMPLETE
Result: [] (Empty queue)
```

---

## 🎓 Key Learnings

### 1. **Manual Implementation Benefits:**
- Full control over insertion logic
- Custom sorting without external libraries
- Better understanding of data structure internals
- Optimized for specific use case (restaurant orders)

### 2. **Real-World Application:**
- Kitchen order management
- Print job queues
- Task scheduling
- Any priority-based FIFO system

### 3. **Trade-offs:**
- **O(n) insertion** for normal orders vs **O(log n)** with heap
- **Simpler implementation** vs more complex balanced tree
- **Sequential search** for cancel vs hash table lookup
- **Good enough for small n** (typical kitchen has < 50 active orders)

---

## 🚀 Future Optimizations

### Possible Improvements:

1. **Hash Map Index:**
   ```java
   Map<Integer, OrderNode> orderIndex;
   // O(1) lookup for cancel operation
   ```

2. **Separate Priority Queues:**
   ```java
   LinkedList<OrderNode> vipQueue;
   LinkedList<OrderNode> expressQueue;
   LinkedList<OrderNode> normalQueue;
   // Faster insertion, more memory
   ```

3. **Skip List:**
   ```java
   // O(log n) search and insertion
   // More complex but faster for large n
   ```

4. **Time-Based Priority Boost:**
   ```java
   // Orders waiting > 30 min auto-promoted
   // Prevents starvation
   ```

---

## 📝 Summary

ChefFlow V2's doubly linked list implementation demonstrates:

✅ **Manual data structure creation** (no `java.util.LinkedList`)  
✅ **Smart priority ordering** (VIP > Express > Normal)  
✅ **Prep-time based sorting** for fair normal order processing  
✅ **O(1) operations** for critical paths (VIP add, complete)  
✅ **Bidirectional traversal** with prev/next pointers  
✅ **Real-world application** in restaurant kitchen management  
✅ **Scalable architecture** with Java RAM + Firebase persistence  

This implementation balances **simplicity, performance, and maintainability** for a production-ready kitchen display system.

---

**Created for:** ChefFlow V2 - Full-Stack Kitchen Display System  
**Technology Stack:** Java (Backend Queue) + Node.js (Server) + Firebase (Database)  
**Last Updated:** January 5, 2026
