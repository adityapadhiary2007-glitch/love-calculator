import mimetypes
import os
from pathlib import Path
from wsgiref.simple_server import make_server


ROOT = Path(__file__).parent


def _read_page(file_name: str) -> bytes:
    content = (ROOT / file_name).read_bytes()
    if file_name == "index.html":
        loader = b"<scr" + b'ipt src="/app.js"></scr' + b"ipt>"
        content = content.replace(b"</body>", loader + b"</body>")
    return content


def _send_response(start_response, status: str, content: bytes, content_type: str):
    start_response(
        status,
        [
            ("Content-Type", f"{content_type}; charset=utf-8"),
            ("Content-Length", str(len(content))),
            ("Cache-Control", "no-store"),
        ],
    )
    return [content]


def app(environ, start_response):
    """WSGI entrypoint for Vercel and the local Replit preview."""
    path = environ.get("PATH_INFO", "/")
    method = environ.get("REQUEST_METHOD", "GET").upper()

    if path == "/api/health":
        content = b'{"status":"ok"}'
        response = _send_response(start_response, "200 OK", content, "application/json")
    elif path in ("/", "/index.html"):
        response = _send_response(start_response, "200 OK", _read_page("index.html"), "text/html")
    elif path == "/app.js":
        response = _send_response(start_response, "200 OK", _read_page("app.js"), "text/javascript")
    else:
        response = _send_response(start_response, "404 Not Found", b"Not found", "text/plain")

    return [b""] if method == "HEAD" else response


# Explicit aliases help deployment scanners identify this WSGI app.
application = app
handler = app


def main():
    port = int(os.environ.get("PORT", "5000"))
    with make_server("0.0.0.0", port, app) as server:
        print(f"Love calculator running on port {port}")
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print("\nStopping love calculator")


if __name__ == "__main__":
    main()