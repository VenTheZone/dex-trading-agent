"use node";
export class PaperTradingEngine {
    orders = new Map();
    positions = new Map();
    balance;
    constructor(initialBalance = 10000) {
        this.balance = initialBalance;
    }
    placeOrder(symbol, side, size, price, type = "market") {
        const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const order = {
            id: orderId,
            symbol,
            side,
            type,
            price,
            size,
            filled: 0,
            status: "open",
            timestamp: Date.now(),
        };
        // For market orders, execute immediately
        if (type === "market") {
            this.executeOrder(order, price);
        }
        else {
            this.orders.set(orderId, order);
        }
        return order;
    }
    executeOrder(order, executionPrice) {
        const cost = order.size * executionPrice;
        // Check if we have enough balance
        if (order.side === "buy" && cost > this.balance) {
            order.status = "cancelled";
            return;
        }
        // Update balance
        if (order.side === "buy") {
            this.balance -= cost;
        }
        else {
            this.balance += cost;
        }
        // Update or create position
        const existingPosition = this.positions.get(order.symbol);
        if (existingPosition) {
            if ((existingPosition.side === "long" && order.side === "sell") ||
                (existingPosition.side === "short" && order.side === "buy")) {
                // Closing position
                const pnl = this.calculatePnl(existingPosition, executionPrice);
                existingPosition.realizedPnl += pnl;
                existingPosition.size -= order.size;
                if (existingPosition.size <= 0) {
                    this.positions.delete(order.symbol);
                }
            }
            else {
                // Adding to position
                const totalSize = existingPosition.size + order.size;
                existingPosition.entryPrice =
                    (existingPosition.entryPrice * existingPosition.size +
                        executionPrice * order.size) /
                        totalSize;
                existingPosition.size = totalSize;
            }
        }
        else {
            // New position
            this.positions.set(order.symbol, {
                symbol: order.symbol,
                side: order.side === "buy" ? "long" : "short",
                size: order.size,
                entryPrice: executionPrice,
                currentPrice: executionPrice,
                unrealizedPnl: 0,
                realizedPnl: 0,
            });
        }
        order.filled = order.size;
        order.status = "filled";
    }
    updateMarketPrice(symbol, price) {
        const position = this.positions.get(symbol);
        if (position) {
            position.currentPrice = price;
            position.unrealizedPnl = this.calculatePnl(position, price);
            // Check stop loss and take profit
            if (position.stopLoss && this.shouldTriggerStopLoss(position, price)) {
                this.closePosition(symbol, price, "stop_loss");
            }
            else if (position.takeProfit &&
                this.shouldTriggerTakeProfit(position, price)) {
                this.closePosition(symbol, price, "take_profit");
            }
        }
    }
    calculatePnl(position, currentPrice) {
        if (position.side === "long") {
            return (currentPrice - position.entryPrice) * position.size;
        }
        else {
            return (position.entryPrice - currentPrice) * position.size;
        }
    }
    shouldTriggerStopLoss(position, price) {
        if (!position.stopLoss)
            return false;
        if (position.side === "long") {
            return price <= position.stopLoss;
        }
        else {
            return price >= position.stopLoss;
        }
    }
    shouldTriggerTakeProfit(position, price) {
        if (!position.takeProfit)
            return false;
        if (position.side === "long") {
            return price >= position.takeProfit;
        }
        else {
            return price <= position.takeProfit;
        }
    }
    closePosition(symbol, price, reason = "manual") {
        const position = this.positions.get(symbol);
        if (!position) {
            return { success: false, pnl: 0, reason: "Position not found" };
        }
        const pnl = this.calculatePnl(position, price);
        this.balance += position.size * price;
        this.positions.delete(symbol);
        return { success: true, pnl, reason };
    }
    setStopLoss(symbol, stopLoss) {
        const position = this.positions.get(symbol);
        if (position) {
            position.stopLoss = stopLoss;
            return true;
        }
        return false;
    }
    setTakeProfit(symbol, takeProfit) {
        const position = this.positions.get(symbol);
        if (position) {
            position.takeProfit = takeProfit;
            return true;
        }
        return false;
    }
    getBalance() {
        return this.balance;
    }
    getPosition(symbol) {
        return this.positions.get(symbol);
    }
    getAllPositions() {
        return Array.from(this.positions.values());
    }
    getTotalPnl() {
        let totalPnl = 0;
        for (const position of this.positions.values()) {
            totalPnl += position.unrealizedPnl + position.realizedPnl;
        }
        return totalPnl;
    }
    getEquity() {
        return this.balance + this.getTotalPnl();
    }
}
