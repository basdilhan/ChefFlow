public class OrderNode {
    int id;
    String items;
    boolean isVip;
    boolean isExpress;
    int prepTime;
    OrderNode next;
    OrderNode prev;

    public OrderNode(int id, String items, boolean isVip, boolean isExpress, int prepTime) {
        this.id = id;
        this.items = items;
        this.isVip = isVip;
        this.isExpress = isExpress;
        this.prepTime = prepTime;
        this.next = null;
        this.prev = null;
    }

    @Override
    public String toString() {
        return String.format("{\"id\":%d,\"items\":\"%s\",\"isVip\":%b,\"isExpress\":%b,\"prepTime\":%d}",
                id, items, isVip, isExpress, prepTime);
    }
}
