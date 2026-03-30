import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15

// =============================================================================
// SettingsView.qml - Application Settings and Preferences
// =============================================================================
//
// This view displays:
// - API key configuration
// - Trading preferences
// - Display settings
// - About information
//
// Uses context properties:
// - darkMode: Dark mode enabled
// - tradingConnected: Connection status

Rectangle {
    id: settingsView
    color: "#1a1a2e"

    // Settings from context
    property bool darkMode: darkMode !== undefined ? darkMode : true
    property bool isConnected: tradingConnected || false

    ColumnLayout {
        anchors.fill: parent
        anchors.margins: 16
        spacing: 16

        // Settings header
        Rectangle {
            Layout.fillWidth: true
            height: 60
            color: "#16213e"
            radius: 8

            RowLayout {
                anchors.fill: parent
                anchors.margins: 16

                Text {
                    text: "Settings"
                    color: "#e0e0e0"
                    font.pixelSize: 24
                    font.bold: true
                }

                Item { Layout.fillWidth: true }

                // Save button
                Rectangle {
                    width: 100
                    height: 36
                    color: "#4ade80"
                    radius: 4

                    Text {
                        anchors.centerIn: parent
                        text: "Save All"
                        color: "#000000"
                        font.pixelSize: 14
                        font.bold: true
                    }

                    MouseArea {
                        anchors.fill: parent
                        onClicked: console.log("Settings saved")
                    }
                }
            }
        }

        // Settings content
        RowLayout {
            Layout.fillWidth: true
            Layout.fillHeight: true
            spacing: 16

            // Left column - API and Trading
            ColumnLayout {
                Layout.fillWidth: true
                Layout.fillHeight: true
                spacing: 16

                // API Configuration
                Rectangle {
                    Layout.fillWidth: true
                    Layout.preferredHeight: 200
                    color: "#16213e"
                    radius: 8

                    ColumnLayout {
                        anchors.fill: parent
                        anchors.margins: 16
                        spacing: 12

                        Text {
                            text: "API Configuration"
                            color: "#e0e0e0"
                            font.pixelSize: 18
                            font.bold: true
                        }

                        // API Key
                        Column {
                            Layout.fillWidth: true
                            spacing: 4

                            Text {
                                text: "Hyperliquid API Key"
                                color: "#a0a0a0"
                                font.pixelSize: 12
                            }

                            TextField {
                                width: parent.width
                                height: 40
                                placeholderText: "Enter API key..."
                                echoMode: TextInput.Password
                                color: "#e0e0e0"
                                background: Rectangle {
                                    color: "#0f3460"
                                    radius: 4
                                }
                            }
                        }

                        // API Secret
                        Column {
                            Layout.fillWidth: true
                            spacing: 4

                            Text {
                                text: "API Secret"
                                color: "#a0a0a0"
                                font.pixelSize: 12
                            }

                            TextField {
                                width: parent.width
                                height: 40
                                placeholderText: "Enter API secret..."
                                echoMode: TextInput.Password
                                color: "#e0e0e0"
                                background: Rectangle {
                                    color: "#0f3460"
                                    radius: 4
                                }
                            }
                        }

                        // Connection status
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
                                text: isConnected ? "Connected to Hyperliquid" : "Not connected"
                                color: isConnected ? "#4ade80" : "#ef4444"
                                font.pixelSize: 12
                            }
                        }
                    }
                }

                // Trading Preferences
                Rectangle {
                    Layout.fillWidth: true
                    Layout.preferredHeight: 200
                    color: "#16213e"
                    radius: 8

                    ColumnLayout {
                        anchors.fill: parent
                        anchors.margins: 16
                        spacing: 12

                        Text {
                            text: "Trading Preferences"
                            color: "#e0e0e0"
                            font.pixelSize: 18
                            font.bold: true
                        }

                        // Max position size
                        Column {
                            Layout.fillWidth: true
                            spacing: 4

                            Text {
                                text: "Maximum Position Size (USD)"
                                color: "#a0a0a0"
                                font.pixelSize: 12
                            }

                            TextField {
                                width: parent.width
                                height: 40
                                placeholderText: "10000"
                                color: "#e0e0e0"
                                background: Rectangle {
                                    color: "#0f3460"
                                    radius: 4
                                }
                            }
                        }

                        // Slippage tolerance
                        Column {
                            Layout.fillWidth: true
                            spacing: 4

                            Text {
                                text: "Slippage Tolerance (%)"
                                color: "#a0a0a0"
                                font.pixelSize: 12
                            }

                            TextField {
                                width: parent.width
                                height: 40
                                placeholderText: "0.5"
                                color: "#e0e0e0"
                                background: Rectangle {
                                    color: "#0f3460"
                                    radius: 4
                                }
                            }
                        }
                    }
                }
            }

            // Right column - Display and About
            ColumnLayout {
                Layout.fillWidth: true
                Layout.fillHeight: true
                spacing: 16

                // Display Settings
                Rectangle {
                    Layout.fillWidth: true
                    Layout.preferredHeight: 150
                    color: "#16213e"
                    radius: 8

                    ColumnLayout {
                        anchors.fill: parent
                        anchors.margins: 16
                        spacing: 12

                        Text {
                            text: "Display Settings"
                            color: "#e0e0e0"
                            font.pixelSize: 18
                            font.bold: true
                        }

                        // Dark mode toggle
                        Row {
                            Layout.fillWidth: true
                            spacing: 12

                            Text {
                                text: "Dark Mode"
                                color: "#e0e0e0"
                                font.pixelSize: 14
                                anchors.verticalCenter: parent.verticalCenter
                            }

                            Item { Layout.fillWidth: true }

                            Switch {
                                checked: darkMode
                                onCheckedChanged: {
                                    console.log("Dark mode:", checked)
                                }
                            }
                        }

                        // Show PnL in header
                        Row {
                            Layout.fillWidth: true
                            spacing: 12

                            Text {
                                text: "Show PnL in Header"
                                color: "#e0e0e0"
                                font.pixelSize: 14
                                anchors.verticalCenter: parent.verticalCenter
                            }

                            Item { Layout.fillWidth: true }

                            Switch {
                                checked: true
                            }
                        }
                    }
                }

                // About
                Rectangle {
                    Layout.fillWidth: true
                    Layout.fillHeight: true
                    color: "#16213e"
                    radius: 8

                    ColumnLayout {
                        anchors.fill: parent
                        anchors.margins: 16
                        spacing: 12

                        Text {
                            text: "About"
                            color: "#e0e0e0"
                            font.pixelSize: 18
                            font.bold: true
                        }

                        Text {
                            text: "DeX Trading Agent"
                            color: "#e0e0e0"
                            font.pixelSize: 16
                        }

                        Text {
                            text: "Version 2.0.0 (Qt6 Edition)"
                            color: "#a0a0a0"
                            font.pixelSize: 12
                        }

                        Text {
                            text: "Native desktop trading application for Hyperliquid"
                            color: "#a0a0a0"
                            font.pixelSize: 12
                            wrapMode: Text.WordWrap
                            Layout.fillWidth: true
                        }

                        Item { Layout.fillHeight: true }

                        Text {
                            text: "Built with Rust + Qt6"
                            color: "#a0a0a0"
                            font.pixelSize: 11
                        }
                    }
                }
            }
        }
    }
}
