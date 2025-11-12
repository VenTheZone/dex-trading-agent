"use node";

export interface Order {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  type: "market" | "limit";
  price: number;
  size: number;
  filled: number;
  status: "open" | "filled" | "cancelled" | "partial";
  timestamp: number;
}

export interface Position {
  symbol: string;
  side: "long" | "short";
  size: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnl: number;
  realizedPnl: number;
  stopLoss?: number;
  takeProfit?: number;
}

export class PaperTradingEngine {
  private orders: Map<string, Order> = new Map();
  private positions: Map<string, Position> = new Map();
  private balance: number;
  private initialBalance: number;

  constructor(initialBalance: number = 10000) {
    this.balance = initialBalance;
    this.initialBalance = initialBalance;
  }

  placeOrder(
    symbol: string,
    side: "buy" | "sell",
    size: number,
    price: number,
    type: "market" | "limit" = "market"
  ): Order {
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const order: Order = {
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
    } else {
      this.orders.set(orderId, order);
    }

    return order;
  }

  private executeOrder(order: Order, executionPrice: number): void {
    const cost = order.size * executionPrice;
    
    // Check if we have enough balance
    if (order.side === "buy" && cost > this.balance) {
      order.status = "cancelled";
      return;
    }

    // Update balance
    if (order.side === "buy") {
      this.balance -= cost;
    } else {
      this.balance += cost;
    }

    // Update or create position
    const existingPosition = this.positions.get(order.symbol);
    
    if (existingPosition) {
      if (
        (existingPosition.side === "long" && order.side === "sell") ||
        (existingPosition.side === "short" && order.side === "buy")
      ) {
        // Closing position
        const pnl = this.calculatePnl(existingPosition, executionPrice);
        existingPosition.realizedPnl += pnl;
        existingPosition.size -= order.size;
        
        if (existingPosition.size <= 0) {
          this.positions.delete(order.symbol);
        }
      } else {
        // Adding to position
        const totalSize = existingPosition.size + order.size;
        existingPosition.entryPrice =
          (existingPosition.entryPrice * existingPosition.size +
            executionPrice * order.size) /
          totalSize;
        existingPosition.size = totalSize;
      }
    } else {
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

  updateMarketPrice(symbol: string, price: number): void {
    const position = this.positions.get(symbol);
    if (position) {
      position.currentPrice = price;
      position.unrealizedPnl = this.calculatePnl(position, price);

      // Check stop loss and take profit
      if (position.stopLoss && this.shouldTriggerStopLoss(position, price)) {
        this.closePosition(symbol, price, "stop_loss");
      } else if (
        position.takeProfit &&
        this.shouldTriggerTakeProfit(position, price)
      ) {
        this.closePosition(symbol, price, "take_profit");
      }
    }
  }

  private calculatePnl(position: Position, currentPrice: number): number {
    if (position.side === "long") {
      return (currentPrice - position.entryPrice) * position.size;
    } else {
      return (position.entryPrice - currentPrice) * position.size;
    }
  }

  private shouldTriggerStopLoss(position: Position, price: number): boolean {
    if (!position.stopLoss) return false;
    
    if (position.side === "long") {
      return price <= position.stopLoss;
    } else {
      return price >= position.stopLoss;
    }
  }

  private shouldTriggerTakeProfit(position: Position, price: number): boolean {
    if (!position.takeProfit) return false;
    
    if (position.side === "long") {
      return price >= position.takeProfit;
    } else {
      return price <= position.takeProfit;
    }
  }

  closePosition(
    symbol: string,
    price: number,
    reason: string = "manual"
  ): { success: boolean; pnl: number; reason: string } {
    const position = this.positions.get(symbol);
    
    if (!position) {
      return { success: false, pnl: 0, reason: "Position not found" };
    }

    const pnl = this.calculatePnl(position, price);
    this.balance += position.size * price;
    
    this.positions.delete(symbol);

    return { success: true, pnl, reason };
  }

  setStopLoss(symbol: string, stopLoss: number): boolean {
    const position = this.positions.get(symbol);
    if (position) {
      position.stopLoss = stopLoss;
      return true;
    }
    return false;
  }

  setTakeProfit(symbol: string, takeProfit: number): boolean {
    const position = this.positions.get(symbol);
    if (position) {
      position.takeProfit = takeProfit;
      return true;
    }
    return false;
  }

  getBalance(): number {
    return this.balance;
  }

  getPosition(symbol: string): Position | undefined {
    return this.positions.get(symbol);
  }

  getAllPositions(): Position[] {
    return Array.from(this.positions.values());
  }

  getTotalPnl(): number {
    let totalPnl = 0;
    for (const position of this.positions.values()) {
      totalPnl += position.unrealizedPnl + position.realizedPnl;
    }
    return totalPnl;
  }

  getEquity(): number {
    return this.balance + this.getTotalPnl();
  }
}
