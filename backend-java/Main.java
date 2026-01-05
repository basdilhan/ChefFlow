import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        KitchenQueue queue = new KitchenQueue();
        Scanner scanner = new Scanner(System.in);
        
        System.out.println("READY");
        
        while (scanner.hasNextLine()) {
            String line = scanner.nextLine().trim();
            
            if (line.isEmpty()) {
                continue;
            }
            
            String[] parts = line.split(",");
            String command = parts[0].toUpperCase();
            
            try {
                switch (command) {
                    case "ADD":
                        // Format: ADD,id,items,prepTime,isExpress
                        if (parts.length >= 4) {
                            int id = Integer.parseInt(parts[1]);
                            String items = parts[2];
                            int prepTime = Integer.parseInt(parts[3]);
                            boolean isExpress = parts.length >= 5 && parts[4].equalsIgnoreCase("true");
                            queue.addNormal(id, items, prepTime, isExpress);
                            queue.printList();
                        } else {
                            System.out.println("ERROR:INVALID_ADD_FORMAT");
                        }
                        break;
                        
                    case "VIP":
                        // Format: VIP,id,items,prepTime,isExpress
                        if (parts.length >= 4) {
                            int id = Integer.parseInt(parts[1]);
                            String items = parts[2];
                            int prepTime = Integer.parseInt(parts[3]);
                            boolean isExpress = parts.length >= 5 && parts[4].equalsIgnoreCase("true");
                            queue.addVip(id, items, prepTime, isExpress);
                            queue.printList();
                        } else {
                            System.out.println("ERROR:INVALID_VIP_FORMAT");
                        }
                        break;
                        
                    case "COMPLETE":
                        // Format: COMPLETE
                        queue.completeOrder();
                        queue.printList();
                        break;
                        
                    case "CANCEL":
                        // Format: CANCEL,id
                        if (parts.length >= 2) {
                            int id = Integer.parseInt(parts[1]);
                            boolean success = queue.cancelOrder(id);
                            if (success) {
                                queue.printList();
                            }
                        } else {
                            System.out.println("ERROR:INVALID_CANCEL_FORMAT");
                        }
                        break;
                        
                    case "PRINT":
                        // Format: PRINT (for debugging)
                        queue.printList();
                        break;
                        
                    default:
                        System.out.println("ERROR:UNKNOWN_COMMAND");
                        break;
                }
            } catch (NumberFormatException e) {
                System.out.println("ERROR:INVALID_NUMBER_FORMAT");
            } catch (Exception e) {
                System.out.println("ERROR:" + e.getMessage());
            }
        }
        
        scanner.close();
    }
}
