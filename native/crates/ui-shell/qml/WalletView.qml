import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15

// =============================================================================
// WalletView.qml - Account Balances and Transactions
// =============================================================================
//
// This view displays:
// - Account balance
// - Open positions
// - Transaction history
//
// Uses context properties:
// - tradingBalance: Account balance
// - tradingConnected: Connection status

Rectangle {
    id: walletView
    color: "#1a1a2e"

    // Account data from context
    property real balance: tradingBalance || 10000.0
    property bool isConnected: tradingConnected || false

    ColumnLayout {
        anchors.fill: parent
        anchors.margins: 16
        spacing: 16

        // Account header
        Rectangle {
            Layout.fillWidth: true
            height: 100
            color: "#16213e"
            radius: 8

            RowLayout {
                anchors.fill: parent
                anchors.margins: 16

                // Account info
                Column {
                    spacing: 8

                    Text {
                        text: "Account Balance"
                        color: "#a0a0a0"
                        font.pixelSize: 14
                    }

                    Text {
                        text: "$" + balance.toFixed(2)
                        color: "#e0e0e0"
                        font.pixelSize: 32
                        font.bold: true
                    }

                    Row {
                        spacing: 8

                        Rectangle {
                            width: 12
                            height: 12
                            radius: 6
                            color: isConnected ? "#4ade80" : "#ef4444"
                            anchors.verticalCenter: parent.verticalCenter
                        }

                        Text {
                            text: isConnected ? "Connected" : "Disconnected"
                            color: isConnected ? "#4ade80" : "#ef4444"
                            font.pixelSize: 12
                        }
                    }
                }

                Item { Layout.fillWidth: true }

                // Quick actions
                Row {
                    spacing: 8

                    Rectangle {
                        width: 100
                        height: 36
                        color: "#0f3460"
                        radius: 4

                        Text {
                            anchors.centerIn: parent
                            text: "Deposit"
                            color: "#e0e0e0"
                            font.pixelSize: 12
                        }

                        MouseArea {
                            anchors.fill: parent
                            onClicked: console.log("Deposit clicked")
                        }
                    }

                    Rectangle {
                        width: 100
                        height: 36
                        color: "#0f3460"
                        radius: 4

                        Text {
                            anchors.centerIn: parent
                            text: "Withdraw"
                            color: "#e0e0e0"
                            font.pixelSize: 12
                        }

                        MouseArea {
                            anchors.fill: parent
                            onClicked: console.log("Withdraw clicked")
                        }
                    }
                }
            }
        }

        // Main content
        RowLayout {
            Layout.fillWidth: true
            Layout.fillHeight: true
            spacing: 16

            // Open positions
            Rectangle {
                Layout.fillWidth: true
                Layout.fillHeight: true
                color: "#16213e"
                radius: 8

                ColumnLayout {
                    anchors.fill: parent
                    anchors.margins: 16

                    Text {
                        text: "Open Positions"
                        color: "#e0e0e0"
                        font.pixelSize: 18
                        font.bold: true
                    }

                    ListView {
                        Layout.fillWidth: true
                        Layout.fillHeight: true
                        model: 3  // Mock positions
                        delegate: Rectangle {
                            width: parent.width
                            height: 60
                            color: index % 2 === 0 ? "#1a1a2e" : "#16213e"
                            radius: 4

                            RowLayout {
                                anchors.fill: parent
                                anchors.margins: 8

                                // Position info
                                Column {
                                    spacing: 2

                                    Text {
                                        text: "ETH/USD"
                                        color: "#e0e0e0"
                                        font.pixelSize: 14
                                        font.bold: true
                                    }

                                    Text {
                                        text: "Long 1.5 ETH @ $3,450.00"
                                        color: "#a0a0a0"
                                        font.pixelSize: 12
                                    }
                                }

                                Item { Layout.fillWidth: true }

                                // PnL
                                Column {
                                    spacing: 2
                                    Layout.alignment: Qt.AlignRight

                                    Text {
                                        text: "+$75.00"
                                        color: "#4ade80"
                                        font.pixelSize: 14
                                        font.bold: true
                                    }

                                    Text {
                                        text: "+1.45%"
                                        color: "#4ade80"
                                        font.pixelSize: 12
                                    }
                                }

                                // Close button
                                Rectangle {
                                    width: 60
                                    height: 28
                                    color: "#ef4444"
                                    radius: 4

                                    Text {
                                        anchors.centerIn: parent
                                        text: "Close"
                                        color: "#ffffff"
                                        font.pixelSize: 11
                                    }

                                    MouseArea {
                                        anchors.fill: parent
                                        onClicked: console.log("Close position")
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Transaction history
            Rectangle {
                Layout.fillWidth: true
                Layout.fillHeight: true
                color: "#16213e"
                radius: 8

                ColumnLayout {
                    anchors.fill: parent
                    anchors.margins: 16

                    Text {
                        text: "Transaction History"
                        color: "#e0e0e0"
                        font.pixelSize: 18
                        font.bold: true
                    }

                    ListView {
                        Layout.fillWidth: true
                        Layout.fillHeight: true
                        model: 10  // Mock transactions
                        delegate: Rectangle {
                            width: parent.width
                            height: 50
                            color: index % 2 === 0 ? "#1a1a2e" : "#16213e"
                            radius: 4

                            RowLayout {
                                anchors.fill: parent
                                anchors.margins: 8

                                // Transaction info
                                Column {
                                    spacing: 2

                                    Text {
                                        text: index % 2 === 0 ? "BUY ETH" : "SELL ETH"
                                        color: index % 2 === 0 ? "#4ade80" : "#ef4444"
                                        font.pixelSize: 14
                                        font.bold: true
                                    }

                                    Text {
                                        text: "2026-03-" + (20 + index) + " 14:" + (30 + index) + ":00"
                                        color: "#a0a0a0"
                                        font.pixelSize: 11
                                    }
                                }

                                Item { Layout.fillWidth: true }

                                // Amount
                                Text {
                                    text: (index % 2 === 0 ? "+" : "-") + (0.5 + index * 0.1).toFixed(2) + " ETH"
                                    color: "#e0e0e0"
                                    font.pixelSize: 14
                                }

                                // Price
                                Text {
                                    text: "$" + (3400 + index * 10).toFixed(2)
                                    color: "#a0a0a0"
                                    font.pixelSize: 12
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
