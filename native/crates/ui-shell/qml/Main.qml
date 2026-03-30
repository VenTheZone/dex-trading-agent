import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import QtQuick.Window 2.15

// =============================================================================
// Main.qml - DeX Trading Agent Main Window
// =============================================================================
//
// This is the root QML file for the desktop application.
// It provides:
// - Application window frame
// - Navigation sidebar
// - Main content area (swappable views)
// - Status bar
//
// Views:
// - TradingView: Order book, charts, order entry
// - SettingsView: API keys, preferences
// - WalletView: Balances, transactions
//
// Fail-closed behavior:
// - Missing views → show error placeholder
// - Invalid state → show offline indicator
// - No data → show loading state

ApplicationWindow {
    id: mainWindow
    title: "DeX Trading Agent"
    width: 1200
    height: 800
    minimumWidth: 800
    minimumHeight: 600

    // Dark theme colors (trading app aesthetic)
    color: "#1a1a2e"
    palette {
        window: "#1a1a2e"
        windowText: "#e0e0e0"
        base: "#16213e"
        text: "#e0e0e0"
        button: "#0f3460"
        buttonText: "#e0e0e0"
        highlight: "#e94560"
        highlightedText: "#ffffff"
    }

    // Application state
    property string currentView: "trading"
    property bool isConnected: false
    property string statusMessage: "Connecting..."

    // Main layout
    ColumnLayout {
        anchors.fill: parent
        spacing: 0

        // Top bar with logo and connection status
        Rectangle {
            Layout.fillWidth: true
            height: 48
            color: "#0f3460"

            RowLayout {
                anchors.fill: parent
                anchors.leftMargin: 16
                anchors.rightMargin: 16

                // App title
                Text {
                    text: "DeX Trading Agent"
                    font.pixelSize: 18
                    font.bold: true
                    color: "#e0e0e0"
                }

                Item { Layout.fillWidth: true }

                // Connection indicator
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
                        text: statusMessage
                        color: "#a0a0a0"
                        font.pixelSize: 12
                        anchors.verticalCenter: parent.verticalCenter
                    }
                }
            }
        }

        // Main content area
        RowLayout {
            Layout.fillWidth: true
            Layout.fillHeight: true
            spacing: 0

            // Navigation sidebar
            Rectangle {
                Layout.fillHeight: true
                width: 64
                color: "#16213e"

                ColumnLayout {
                    anchors.fill: parent
                    anchors.topMargin: 8
                    anchors.bottomMargin: 8
                    spacing: 4

                    // Navigation buttons
                    NavButton {
                        icon: "📈"
                        text: "Trade"
                        isActive: currentView === "trading"
                        onClicked: currentView = "trading"
                    }

                    NavButton {
                        icon: "💰"
                        text: "Wallet"
                        isActive: currentView === "wallet"
                        onClicked: currentView = "wallet"
                    }

                    NavButton {
                        icon: "⚙️"
                        text: "Settings"
                        isActive: currentView === "settings"
                        onClicked: currentView = "settings"
                    }

                    Item { Layout.fillHeight: true }
                }
            }

            // Content area
            StackLayout {
                Layout.fillWidth: true
                Layout.fillHeight: true
                currentIndex: {
                    switch(currentView) {
                        case "trading": return 0
                        case "wallet": return 1
                        case "settings": return 2
                        default: return 0
                    }
                }

                // Trading view
                TradingView {
                    id: tradingView
                }

                // Wallet view
                WalletView {
                    id: walletView
                }

                // Settings view
                SettingsView {
                    id: settingsView
                }
            }
        }

        // Status bar
        Rectangle {
            Layout.fillWidth: true
            height: 24
            color: "#0f3460"

            RowLayout {
                anchors.fill: parent
                anchors.leftMargin: 8
                anchors.rightMargin: 8

                Text {
                    text: "Ready"
                    color: "#a0a0a0"
                    font.pixelSize: 11
                }

                Item { Layout.fillWidth: true }

                Text {
                    text: "v2.0.0"
                    color: "#a0a0a0"
                    font.pixelSize: 11
                }
            }
        }
    }

    // Navigation button component
    component NavButton: Rectangle {
        property string icon: ""
        property string text: ""
        property bool isActive: false
        signal clicked()

        Layout.fillWidth: true
        height: 48
        color: isActive ? "#0f3460" : "transparent"
        radius: 4

        MouseArea {
            anchors.fill: parent
            onClicked: parent.clicked()
        }

        Column {
            anchors.centerIn: parent
            spacing: 2

            Text {
                text: parent.parent.icon
                font.pixelSize: 20
                horizontalAlignment: Text.AlignHCenter
                width: parent.width
            }

            Text {
                text: parent.parent.text
                color: parent.parent.isActive ? "#e94560" : "#a0a0a0"
                font.pixelSize: 10
                horizontalAlignment: Text.AlignHCenter
                width: parent.width
            }
        }
    }
}
