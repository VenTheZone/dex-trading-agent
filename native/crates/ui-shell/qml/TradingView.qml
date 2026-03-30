import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15

// =============================================================================
// TradingView.qml - Order Book and Trading Interface
// =============================================================================
//
// This view displays:
// - Market price and 24h change
// - Order book (bids/asks)
// - Position entry form
// - Current positions
//
// Uses context properties:
// - marketSymbol: Current trading pair
// - marketPrice: Current price
// - tradingBalance: Account balance
// - tradingConnected: Connection status

Rectangle {
    id: tradingView
    color: "#1a1a2e"

    // Market data from context
    property string symbol: marketSymbol || "ETH"
    property real price: marketPrice || 3500.0
    property real priceChange: 2.5  // 24h change percentage
    property real balance: tradingBalance || 10000.0

    ColumnLayout {
        anchors.fill: parent
        anchors.margins: 16
        spacing: 16

        // Market header
        Rectangle {
            Layout.fillWidth: true
            height: 80
            color: "#16213e"
            radius: 8

            RowLayout {
                anchors.fill: parent
                anchors.margins: 16

                // Symbol and price
                Column {
                    spacing: 4

                    Text {
                        text: symbol + "/USD"
                        color: "#e0e0e0"
                        font.pixelSize: 24
                        font.bold: true
                    }

                    Row {
                        spacing: 8

                        Text {
                            text: "$" + price.toFixed(2)
                            color: "#e0e0e0"
                            font.pixelSize: 20
                        }

                        Text {
                            text: (priceChange >= 0 ? "+" : "") + priceChange.toFixed(2) + "%"
                            color: priceChange >= 0 ? "#4ade80" : "#ef4444"
                            font.pixelSize: 16
                        }
                    }
                }

                Item { Layout.fillWidth: true }

                // Balance display
                Column {
                    spacing: 4
                    Layout.alignment: Qt.AlignRight

                    Text {
                        text: "Balance"
                        color: "#a0a0a0"
                        font.pixelSize: 12
                    }

                    Text {
                        text: "$" + balance.toFixed(2)
                        color: "#e0e0e0"
                        font.pixelSize: 20
                        font.bold: true
                    }
                }
            }
        }

        // Main content area
        RowLayout {
            Layout.fillWidth: true
            Layout.fillHeight: true
            spacing: 16

            // Order book
            Rectangle {
                Layout.fillWidth: true
                Layout.fillHeight: true
                Layout.minimumWidth: 300
                color: "#16213e"
                radius: 8

                ColumnLayout {
                    anchors.fill: parent
                    anchors.margins: 16

                    Text {
                        text: "Order Book"
                        color: "#e0e0e0"
                        font.pixelSize: 18
                        font.bold: true
                    }

                    // Asks (sell orders)
                    ListView {
                        Layout.fillWidth: true
                        Layout.fillHeight: true
                        model: 10
                        delegate: Rectangle {
                            width: parent.width
                            height: 32
                            color: "transparent"

                            Row {
                                anchors.fill: parent
                                anchors.leftMargin: 8
                                anchors.rightMargin: 8

                                Text {
                                    text: (price + (index + 1) * 10).toFixed(2)
                                    color: "#ef4444"
                                    font.pixelSize: 12
                                    width: parent.width / 3
                                    anchors.verticalCenter: parent.verticalCenter
                                }

                                Text {
                                    text: (Math.random() * 5).toFixed(4)
                                    color: "#a0a0a0"
                                    font.pixelSize: 12
                                    width: parent.width / 3
                                    horizontalAlignment: Text.AlignHCenter
                                    anchors.verticalCenter: parent.verticalCenter
                                }

                                Text {
                                    text: "$" + ((price + (index + 1) * 10) * Math.random() * 5).toFixed(2)
                                    color: "#a0a0a0"
                                    font.pixelSize: 12
                                    width: parent.width / 3
                                    horizontalAlignment: Text.AlignRight
                                    anchors.verticalCenter: parent.verticalCenter
                                }
                            }
                        }
                    }

                    // Spread
                    Rectangle {
                        Layout.fillWidth: true
                        height: 24
                        color: "#0f3460"
                        radius: 4

                        Text {
                            anchors.centerIn: parent
                            text: "Spread: $5.00 (0.14%)"
                            color: "#a0a0a0"
                            font.pixelSize: 12
                        }
                    }

                    // Bids (buy orders)
                    ListView {
                        Layout.fillWidth: true
                        Layout.fillHeight: true
                        model: 10
                        delegate: Rectangle {
                            width: parent.width
                            height: 32
                            color: "transparent"

                            Row {
                                anchors.fill: parent
                                anchors.leftMargin: 8
                                anchors.rightMargin: 8

                                Text {
                                    text: (price - (index + 1) * 10).toFixed(2)
                                    color: "#4ade80"
                                    font.pixelSize: 12
                                    width: parent.width / 3
                                    anchors.verticalCenter: parent.verticalCenter
                                }

                                Text {
                                    text: (Math.random() * 5).toFixed(4)
                                    color: "#a0a0a0"
                                    font.pixelSize: 12
                                    width: parent.width / 3
                                    horizontalAlignment: Text.AlignHCenter
                                    anchors.verticalCenter: parent.verticalCenter
                                }

                                Text {
                                    text: "$" + ((price - (index + 1) * 10) * Math.random() * 5).toFixed(2)
                                    color: "#a0a0a0"
                                    font.pixelSize: 12
                                    width: parent.width / 3
                                    horizontalAlignment: Text.AlignRight
                                    anchors.verticalCenter: parent.verticalCenter
                                }
                            }
                        }
                    }
                }
            }

            // Order entry form
            Rectangle {
                Layout.preferredWidth: 300
                Layout.fillHeight: true
                color: "#16213e"
                radius: 8

                ColumnLayout {
                    anchors.fill: parent
                    anchors.margins: 16
                    spacing: 12

                    Text {
                        text: "Place Order"
                        color: "#e0e0e0"
                        font.pixelSize: 18
                        font.bold: true
                    }

                    // Buy/Sell toggle
                    Row {
                        Layout.fillWidth: true
                        spacing: 8

                        Rectangle {
                            width: (parent.width - 8) / 2
                            height: 40
                            color: orderType === "buy" ? "#4ade80" : "#0f3460"
                            radius: 4

                            property string orderType: "buy"

                            Text {
                                anchors.centerIn: parent
                                text: "BUY"
                                color: parent.parent.orderType === "buy" ? "#000000" : "#e0e0e0"
                                font.pixelSize: 14
                                font.bold: true
                            }

                            MouseArea {
                                anchors.fill: parent
                                onClicked: parent.parent.orderType = "buy"
                            }
                        }

                        Rectangle {
                            width: (parent.width - 8) / 2
                            height: 40
                            color: orderType === "sell" ? "#ef4444" : "#0f3460"
                            radius: 4

                            property string orderType: "sell"

                            Text {
                                anchors.centerIn: parent
                                text: "SELL"
                                color: parent.parent.orderType === "sell" ? "#000000" : "#e0e0e0"
                                font.pixelSize: 14
                                font.bold: true
                            }

                            MouseArea {
                                anchors.fill: parent
                                onClicked: parent.parent.orderType = "sell"
                            }
                        }
                    }

                    // Amount input
                    Column {
                        Layout.fillWidth: true
                        spacing: 4

                        Text {
                            text: "Amount (" + symbol + ")"
                            color: "#a0a0a0"
                            font.pixelSize: 12
                        }

                        TextField {
                            id: amountField
                            width: parent.width
                            height: 40
                            placeholderText: "0.00"
                            color: "#e0e0e0"
                            background: Rectangle {
                                color: "#0f3460"
                                radius: 4
                            }
                        }
                    }

                    // Price input (limit order)
                    Column {
                        Layout.fillWidth: true
                        spacing: 4

                        Text {
                            text: "Limit Price (USD)"
                            color: "#a0a0a0"
                            font.pixelSize: 12
                        }

                        TextField {
                            id: priceField
                            width: parent.width
                            height: 40
                            placeholderText: price.toFixed(2)
                            color: "#e0e0e0"
                            background: Rectangle {
                                color: "#0f3460"
                                radius: 4
                            }
                        }
                    }

                    // Total display
                    Column {
                        Layout.fillWidth: true
                        spacing: 4

                        Text {
                            text: "Total (USD)"
                            color: "#a0a0a0"
                            font.pixelSize: 12
                        }

                        Text {
                            text: "$0.00"
                            color: "#e0e0e0"
                            font.pixelSize: 20
                            font.bold: true
                        }
                    }

                    Item { Layout.fillHeight: true }

                    // Submit button
                    Rectangle {
                        Layout.fillWidth: true
                        height: 48
                        color: "#4ade80"
                        radius: 4

                        Text {
                            anchors.centerIn: parent
                            text: "PLACE BUY ORDER"
                            color: "#000000"
                            font.pixelSize: 16
                            font.bold: true
                        }

                        MouseArea {
                            anchors.fill: parent
                            onClicked: console.log("Order placed")
                        }
                    }
                }
            }
        }
    }
}
