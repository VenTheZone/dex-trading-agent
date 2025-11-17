"use node";

import { 
  calculateLiquidationPrice,
  assessLiquidationRisk
} from './liquidation-protection';

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
  leverage?: number;
}

export interface Position {
  symbol: string;
  side: "long" | "short";
  size: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnl: number;
  realizedPnl: number;
  leverage: number;
  collateral: number;
  liquidationPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  trailingStopPercent?: number;
  trailingStopActivationPercent?: number;
  trailingStopActive?: boolean;
  trailingStopPrice?: number;
  highestPrice?: number;
  lowestPrice?: number;
}

export class PaperTradingEngine {
  private orders: Map<string, Order> = new Map();
  private positions: Map<string, Position> = new Map();
  private balance: number;
  private readonly LIQUIDATION_FEE = 0.01; // 1% liquidation fee

  constructor(initialBalance: number = 10000) {
    this.balance = initialBalance;
  }

  placeOrder(
    symbol: string,
    side: "buy" | "sell",
    size: number,
    price: number,
    type: "market" | "limit" = "market",
    leverage: number = 1
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
      leverage,
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
    const leverage = order.leverage || 1;
    const positionValue = order.size * executionPrice;
    const requiredCollateral = positionValue / leverage;
    
    // Check if we have enough balance for collateral
    if (requiredCollateral > this.balance) {
      order.status = "cancelled";
      console.warn(`Insufficient balance: Required ${requiredCollateral}, Available ${this.balance}`);
      return;
    }

    const existingPosition = this.positions.get(order.symbol);
    
    if (existingPosition) {
      // Handle position modification or closure
      if (
        (existingPosition.side === "long" && order.side === "sell") ||
        (existingPosition.side === "short" && order.side === "buy")
      ) {
        // Closing or reducing position
        if (order.size >= existingPosition.size) {
          // Full close or reversal
          const pnl = this.calculatePnl(existingPosition, executionPrice);
          this.balance += existingPosition.collateral + pnl;
          
          existingPosition.realizedPnl += pnl;
          
          if (order.size > existingPosition.size) {
            // Position reversal - close existing and open opposite
            const remainingSize = order.size - existingPosition.size;
            this.positions.delete(order.symbol);
            
            // Open new opposite position
            const newCollateral = (remainingSize * executionPrice) / leverage;
            this.balance -= newCollateral;
            
            const newSide = order.side === "buy" ? "long" : "short";
            this.positions.set(order.symbol, {
              symbol: order.symbol,
              side: newSide,
              size: remainingSize,
              entryPrice: executionPrice,
              currentPrice: executionPrice,
              unrealizedPnl: 0,
              realizedPnl: 0,
              leverage,
              collateral: newCollateral,
              liquidationPrice: this.calculateLiquidationPrice(
                newSide,
                executionPrice,
                leverage,
                remainingSize
              ),
            });
          } else {
            // Full close
            this.positions.delete(order.symbol);
          }
        } else {
          // Partial close
          const closedPnl = this.calculatePnl(
            { ...existingPosition, size: order.size },
            executionPrice
          );
          const releasedCollateral = (existingPosition.collateral * order.size) / existingPosition.size;
          
          this.balance += releasedCollateral + closedPnl;
          existingPosition.size -= order.size;
          existingPosition.collateral -= releasedCollateral;
          existingPosition.realizedPnl += closedPnl;
        }
      } else {
        // Adding to position (same side)
        const additionalCollateral = (order.size * executionPrice) / leverage;
        this.balance -= additionalCollateral;
        
        const totalSize = existingPosition.size + order.size;
        existingPosition.entryPrice =
          (existingPosition.entryPrice * existingPosition.size +
            executionPrice * order.size) /
          totalSize;
        existingPosition.size = totalSize;
        existingPosition.collateral += additionalCollateral;
        existingPosition.liquidationPrice = this.calculateLiquidationPrice(
          existingPosition.side,
          existingPosition.entryPrice,
          leverage,
          existingPosition.size
        );
      }
    } else {
      // New position
      this.balance -= requiredCollateral;
      
      const positionSide = order.side === "buy" ? "long" : "short";
      this.positions.set(order.symbol, {
        symbol: order.symbol,
        side: positionSide,
        size: order.size,
        entryPrice: executionPrice,
        currentPrice: executionPrice,
        unrealizedPnl: 0,
        realizedPnl: 0,
        leverage,
        collateral: requiredCollateral,
        liquidationPrice: this.calculateLiquidationPrice(
          positionSide,
          executionPrice,
          leverage,
          order.size
        ),
      });
    }

    order.filled = order.size;
    order.status = "filled";
  }

  private calculateLiquidationPrice(
    side: "long" | "short",
    entryPrice: number,
    leverage: number,
    positionSize: number
  ): number {
    // Use Hyperliquid's actual liquidation formula with tiered margin rates
    const notionalValue = entryPrice * positionSize;
    const marginAvailable = notionalValue / leverage;
    
    return calculateLiquidationPrice(
      entryPrice,
      positionSize,
      side,
      marginAvailable
    );
  }

  updateMarketPrice(symbol: string, price: number): void {
    const position = this.positions.get(symbol);
    if (!position) return;

    position.currentPrice = price;
    position.unrealizedPnl = this.calculatePnl(position, price);

    // Track highest/lowest prices for trailing stop
    if (!position.highestPrice || price > position.highestPrice) {
      position.highestPrice = price;
    }
    if (!position.lowestPrice || price < position.lowestPrice) {
      position.lowestPrice = price;
    }

    // Use Hyperliquid's liquidation risk assessment
    const riskData = assessLiquidationRisk(
      {
        symbol: position.symbol,
        side: position.side,
        size: position.size,
        entryPrice: position.entryPrice,
        leverage: position.leverage,
      },
      price,
      this.balance
    );

    // Check liquidation using Hyperliquid's formula
    if (this.shouldLiquidate(position, price)) {
      console.warn(`Position ${symbol} liquidated at ${price} (Hyperliquid formula)`);
      this.liquidatePosition(symbol);
      return;
    }

    // Warn if approaching liquidation (critical risk level)
    if (riskData.riskLevel === 'critical' || riskData.riskLevel === 'danger') {
      console.warn(`⚠️ ${symbol} liquidation risk: ${riskData.riskLevel.toUpperCase()} - ${riskData.distanceToLiquidation.toFixed(1)}% away`);
    }

    // Check trailing stop
    if (position.trailingStopActive && position.trailingStopPrice) {
      if (this.shouldTriggerTrailingStop(position, price)) {
        console.log(`Trailing stop triggered for ${symbol} at ${price}`);
        this.closePosition(symbol, price, "trailing_stop");
        return;
      }
      
      // Update trailing stop price if price moved favorably
      this.updateTrailingStop(position, price);
    } else if (
      position.trailingStopPercent &&
      position.trailingStopActivationPercent &&
      !position.trailingStopActive
    ) {
      // Check if we should activate trailing stop
      const profitPercent = (position.unrealizedPnl / position.collateral) * 100;
      if (profitPercent >= position.trailingStopActivationPercent) {
        position.trailingStopActive = true;
        this.updateTrailingStop(position, price);
        console.log(`Trailing stop activated for ${symbol} at ${price}`);
      }
    }

    // Check stop loss and take profit
    if (position.stopLoss && this.shouldTriggerStopLoss(position, price)) {
      console.log(`Stop loss triggered for ${symbol} at ${price}`);
      this.closePosition(symbol, price, "stop_loss");
    } else if (
      position.takeProfit &&
      this.shouldTriggerTakeProfit(position, price)
    ) {
      console.log(`Take profit triggered for ${symbol} at ${price}`);
      this.closePosition(symbol, price, "take_profit");
    }
  }

  private shouldLiquidate(position: Position, price: number): boolean {
    if (position.side === "long") {
      return price <= position.liquidationPrice;
    } else {
      return price >= position.liquidationPrice;
    }
  }

  private liquidatePosition(symbol: string): void {
    const position = this.positions.get(symbol);
    if (!position) return;

    // In liquidation, trader loses collateral minus liquidation fee
    const liquidationFee = position.collateral * this.LIQUIDATION_FEE;
    const remainingCollateral = position.collateral - liquidationFee;
    
    // Return remaining collateral (if any) to balance
    if (remainingCollateral > 0) {
      this.balance += remainingCollateral;
    }

    this.positions.delete(symbol);
  }

  private calculatePnl(position: Position, currentPrice: number): number {
    const priceDiff = currentPrice - position.entryPrice;
    
    if (position.side === "long") {
      return priceDiff * position.size;
    } else {
      return -priceDiff * position.size;
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

  private shouldTriggerTrailingStop(position: Position, price: number): boolean {
    if (!position.trailingStopPrice) return false;
    
    if (position.side === "long") {
      return price <= position.trailingStopPrice;
    } else {
      return price >= position.trailingStopPrice;
    }
  }

  private updateTrailingStop(position: Position, price: number): void {
    if (!position.trailingStopPercent) return;
    
    const trailingDistance = price * (position.trailingStopPercent / 100);
    
    if (position.side === "long") {
      const newTrailingStop = price - trailingDistance;
      if (!position.trailingStopPrice || newTrailingStop > position.trailingStopPrice) {
        position.trailingStopPrice = newTrailingStop;
      }
    } else {
      const newTrailingStop = price + trailingDistance;
      if (!position.trailingStopPrice || newTrailingStop < position.trailingStopPrice) {
        position.trailingStopPrice = newTrailingStop;
      }
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
    this.balance += position.collateral + pnl;
    
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

  setTrailingStop(
    symbol: string,
    trailingStopPercent: number,
    activationPercent: number
  ): boolean {
    const position = this.positions.get(symbol);
    if (position) {
      position.trailingStopPercent = trailingStopPercent;
      position.trailingStopActivationPercent = activationPercent;
      position.trailingStopActive = false;
      position.trailingStopPrice = undefined;
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

  getTotalMarginUsed(): number {
    let totalMargin = 0;
    for (const position of this.positions.values()) {
      totalMargin += position.collateral;
    }
    return totalMargin;
  }

  getEquity(): number {
    return this.balance + this.getTotalPnl();
  }

  getMarginUsagePercent(): number {
    const totalMargin = this.getTotalMarginUsed();
    const equity = this.getEquity();
    return equity > 0 ? (totalMargin / equity) * 100 : 0;
  }
}