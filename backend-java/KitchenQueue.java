public class KitchenQueue {
    private OrderNode head;
    private OrderNode tail;

    public KitchenQueue() {
        this.head = null;
        this.tail = null;
    }

    /**
     * Add a normal order sorted by preparation time (shortest first)
     * Inserts after VIP orders but before other normal orders with longer prep time
     */
    public void addNormal(int id, String items, int time, boolean isExpress) {
        OrderNode newNode = new OrderNode(id, items, false, isExpress, time);
        
        if (head == null) {
            // Empty list
            head = newNode;
            tail = newNode;
            return;
        }
        
        // Priority order: VIP > Express > Normal (sorted by prepTime within each group)
        OrderNode current = head;
        
        // Skip all VIP orders first
        while (current != null && current.isVip) {
            current = current.next;
        }
        
        // If this is an express order, skip other express orders
        if (isExpress) {
            while (current != null && current.isExpress && !current.isVip) {
                current = current.next;
            }
        } else {
            // For normal orders, skip all express orders first
            while (current != null && current.isExpress && !current.isVip) {
                current = current.next;
            }
            
            // Then find position among normal orders based on prepTime
            while (current != null && !current.isVip && !current.isExpress && current.prepTime <= time) {
                current = current.next;
            }
        }
        
        // If we reached the end, insert at tail
        if (current == null) {
            tail.next = newNode;
            newNode.prev = tail;
            tail = newNode;
            return;
        }
        
        if (current == null) {
            // Insert at tail
            tail.next = newNode;
            newNode.prev = tail;
            tail = newNode;
        } else {
            // Insert before current
            newNode.next = current;
            newNode.prev = current.prev;
            
            if (current.prev != null) {
                current.prev.next = newNode;
            } else {
                head = newNode;
            }
            
            current.prev = newNode;
        }
    }

    /**
     * Add a VIP order to the head of the list (Priority Insertion)
     */
    public void addVip(int id, String items, int time, boolean isExpress) {
        OrderNode newNode = new OrderNode(id, items, true, isExpress, time);
        
        if (head == null) {
            // Empty list
            head = newNode;
            tail = newNode;
        } else {
            // Add to head
            newNode.next = head;
            head.prev = newNode;
            head = newNode;
        }
    }

    /**
     * Complete the current order (remove head)
     */
    public void completeOrder() {
        if (head == null) {
            System.out.println("ERROR:NO_ORDERS");
            return;
        }

        if (head == tail) {
            // Only one node
            head = null;
            tail = null;
        } else {
            // Move head to next
            head = head.next;
            head.prev = null;
        }
    }

    /**
     * Print the entire list as a JSON array string
     */
    public void printList() {
        if (head == null) {
            System.out.println("[]");
            return;
        }

        StringBuilder json = new StringBuilder("[");
        OrderNode current = head;
        
        while (current != null) {
            json.append(current.toString());
            if (current.next != null) {
                json.append(",");
            }
            current = current.next;
        }
        
        json.append("]");
        System.out.println(json.toString());
    }

    /**
     * Cancel a specific order by ID
     */
    public boolean cancelOrder(int orderId) {
        if (head == null) {
            System.out.println("ERROR:NO_ORDERS");
            return false;
        }
        
        OrderNode current = head;
        
        // Search for the order with matching ID
        while (current != null) {
            if (current.id == orderId) {
                // Found the order, remove it
                if (current == head && current == tail) {
                    // Only one node
                    head = null;
                    tail = null;
                } else if (current == head) {
                    // Remove head
                    head = head.next;
                    head.prev = null;
                } else if (current == tail) {
                    // Remove tail
                    tail = tail.prev;
                    tail.next = null;
                } else {
                    // Remove middle node
                    current.prev.next = current.next;
                    current.next.prev = current.prev;
                }
                return true;
            }
            current = current.next;
        }
        
        System.out.println("ERROR:ORDER_NOT_FOUND");
        return false;
    }
    
    /**
     * Get the current head order (for debugging)
     */
    public OrderNode getHead() {
        return head;
    }
}
