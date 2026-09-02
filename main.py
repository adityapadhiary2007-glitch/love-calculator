import mimetypes
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).parent


class LoveCalculatorHandler(BaseHTTPRequestHandler):
    """Serve the love calculator UI and a tiny health endpoint."""

    def do_GET(self):
        path = urlparse(self.path).path

        if path == "/api/health":
            self._send_bytes(b'{"status":"ok"}', "application/json; charset=utf-8")
            return

        if path in ("/", "/index.html"):
            self._send_file(ROOT / "index.html")
            return

        self.send_error(404, "Not found")

    def _send_file(self, file_path: Path):
        if not file_path.is_file():
            self.send_error(404, "Not found")
            return
        content_type = mimetypes.guess_type(file_path.name)[0] or "text/plain"
        self._send_bytes(file_path.read_bytes(), f"{content_type}; charset=utf-8")

    def _send_bytes(self, content: bytes, content_type: str):
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(content)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(content)

    def log_message(self, format_string, *args):
        # Keep the workflow output focused on actual application errors.
        return


def main():
    port = int(os.environ.get("PORT", "5000"))
    server = ThreadingHTTPServer(("0.0.0.0", port), LoveCalculatorHandler)
    print(f"Love calculator running on port {port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping love calculator")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()