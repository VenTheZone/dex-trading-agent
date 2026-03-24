import sys
import os
import json
import subprocess
import webbrowser
from PySide6.QtWidgets import QApplication, QMainWindow, QVBoxLayout, QWidget, QMessageBox, QFileDialog
from PySide6.QtWebEngineWidgets import QWebEngineView
from PySide6.QtWebChannel import QWebChannel
from PySide6.QtCore import QObject, Slot, QUrl, QSettings
from cryptography.fernet import Fernet
import keyring

class Bridge(QObject):
    def __init__(self, parent=None):
        super().__init__(parent)
        self._parent = parent
        self._app_name = "DeXTradingAgent"
        self._settings = QSettings(self._app_name, "DeXAgent")
        self._encryption_key_key = "app_encryption_key"
        self._load_key()

    def _load_key(self):
        """Retrieve or generate an encryption key from the system keyring"""
        try:
            key = keyring.get_password(self._app_name, self._encryption_key_key)
            if not key:
                key = Fernet.generate_key().decode()
                keyring.set_password(self._app_name, self._encryption_key_key, key)
            self._fernet = Fernet(key.encode())
        except Exception as e:
            print(f"Error loading encryption key from keyring: {e}")
            # Fallback to a non-persistent key for the session if keyring fails
            # This is not ideal but allows the app to function in environments without keyrings
            self._fernet = Fernet(Fernet.generate_key())

    @Slot(str, str, result=str)
    def invoke(self, cmd, args_json):
        try:
            args = json.loads(args_json)
        except:
            args = {}

        print(f"Qt Bridge Invoke: {cmd}")

        try:
            if cmd == "get_api_keys":
                encrypted_keys = self._settings.value("secure_keys")
                if encrypted_keys:
                    try:
                        decrypted = self._fernet.decrypt(encrypted_keys.encode()).decode()
                        return decrypted
                    except Exception as e:
                        print(f"Decryption error: {e}")
                        return "{}"
                return "{}"

            elif cmd == "set_api_keys":
                keys = args.get("keys")
                if keys:
                    encrypted = self._fernet.encrypt(json.dumps(keys).encode()).decode()
                    self._settings.setValue("secure_keys", encrypted)
                    return json.dumps({"success": True})
                return json.dumps({"error": "No keys provided"})

            elif cmd == "clear_api_keys":
                self._settings.remove("secure_keys")
                return json.dumps({"success": True})

            elif cmd == "store_get":
                key = args.get("key")
                val = self._settings.value(f"store_{key}")
                return json.dumps(val) if val is not None else "null"

            elif cmd == "store_set":
                key = args.get("key")
                val = args.get("value")
                self._settings.setValue(f"store_{key}", val)
                return json.dumps({"success": True})

            elif cmd == "open_url":
                url = args.get("url")
                if url:
                    webbrowser.open(url)
                    return json.dumps({"success": True})
                return json.dumps({"error": "No URL provided"})

            elif cmd == "confirm_dialog":
                title = args.get("title", "Confirm")
                message = args.get("message", "")
                res = QMessageBox.question(self._parent, title, message, QMessageBox.Yes | QMessageBox.No)
                return "yes" if res == QMessageBox.Yes else "no"

            elif cmd == "save_file_dialog":
                title = args.get("title", "Save File")
                default_name = args.get("defaultName", "")
                file_path, _ = QFileDialog.getSaveFileName(self._parent, title, default_name)
                return file_path

            return json.dumps({"error": f"Command {cmd} not implemented"})
        except Exception as e:
            print(f"Error in bridge invoke {cmd}: {e}")
            return json.dumps({"error": str(e)})

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("DeX Trading Agent (Qt6 Edition)")
        self.resize(1200, 800)

        self.browser = QWebEngineView()
        self.channel = QWebChannel()
        self.bridge = Bridge(self)
        self.channel.registerObject("qtBridge", self.bridge)
        self.browser.page().setWebChannel(self.channel)

        # Load the frontend
        # In production, this would be a file path
        self.browser.load(QUrl("http://localhost:3000"))

        self.setCentralWidget(self.browser)

class BackendManager:
    def __init__(self):
        self.process = None

    def start(self):
        backend_path = os.path.join(os.getcwd(), "migration_python", "main.py")
        if os.path.exists(backend_path):
            print(f"Starting FastAPI backend at {backend_path}")
            self.process = subprocess.Popen([sys.executable, backend_path])
        else:
            print(f"Backend not found at {backend_path}")

    def stop(self):
        if self.process:
            self.process.terminate()

if __name__ == "__main__":
    app = QApplication(sys.argv)

    backend = BackendManager()
    backend.start()
    app.aboutToQuit.connect(backend.stop)

    window = MainWindow()
    window.show()
    sys.exit(app.exec())
