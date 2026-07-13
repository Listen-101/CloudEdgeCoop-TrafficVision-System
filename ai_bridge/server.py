"""
AI Bridge Service - HTTP wrapper for traffic_algorithm SDK.

Usage:
  python server.py
  # Or with custom port:
  python server.py --port 5000
"""

import argparse
import io
import json
import os
import sys
import time
import traceback
from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlparse, parse_qs

SDK_DIR = Path(__file__).resolve().parent.parent / "traffic_algorithm_sdk_backend_v2_2026-07-13"
if str(SDK_DIR) not in sys.path:
    sys.path.insert(0, str(SDK_DIR))

_algorithm_service = None
ALGORITHM_AVAILABLE = False

try:
    import numpy as np
    HAS_NUMPY = True
except ImportError:
    HAS_NUMPY = False

try:
    import cv2
    HAS_OPENCV = True
except ImportError:
    HAS_OPENCV = False

try:
    from traffic_algorithms import TrafficAlgorithmService
    from traffic_algorithms.errors import (
        AlgorithmSDKError, InvalidImageError, ModelNotConfiguredError,
        StreamLimitError, TimestampOrderError,
    )
    ALGORITHM_AVAILABLE = True
except ImportError as e:
    TRAFFIC_IMPORT_ERROR = str(e)


def get_service():
    global _algorithm_service
    if _algorithm_service is None and ALGORITHM_AVAILABLE:
        try:
            from traffic_algorithms import VehicleDetectionModule, VehicleTrackingModule, LicensePlateRecognitionModule

            MODEL_PATH = str(Path(__file__).resolve().parent / "yolov8n.pt")

            _algorithm_service = TrafficAlgorithmService(
                vehicle_detection=VehicleDetectionModule(
                    model_path=MODEL_PATH,
                    device="cuda",
                ),
                vehicle_tracking=VehicleTrackingModule(
                    model_path=MODEL_PATH,
                    device="cuda",
                    max_streams=4,
                ),
                license_plate=LicensePlateRecognitionModule(),
            )
            print("TrafficAlgorithmService initialized successfully (CPU mode)")
        except Exception as e:
            print(f"WARNING: Failed to init algorithm service: {e}")
    return _algorithm_service


def json_response(handler, data, status=200):
    body = json.dumps(data, ensure_ascii=False, default=str).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


class RequestHandler(BaseHTTPRequestHandler):

    def log_message(self, format, *args):
        print(f"[{time.strftime('%H:%M:%S')}] {args[0]}")

    def _read_body(self):
        length = int(self.headers.get("Content-Length", 0))
        return self.rfile.read(length) if length > 0 else b""

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/health":
            self._handle_health()
        else:
            json_response(self, {"error": "Not Found"}, status=404)

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/recognize":
            self._handle_recognize()
        elif parsed.path == "/api/reset-stream":
            self._handle_reset_stream()
        else:
            json_response(self, {"error": "Not Found"}, status=404)

    def _handle_health(self):
        if not ALGORITHM_AVAILABLE:
            json_response(self, {
                "status": "degraded",
                "algorithm_available": False,
                "error": TRAFFIC_IMPORT_ERROR,
            }, status=503)
        else:
            service = get_service()
            json_response(self, {
                "status": "ok",
                "algorithm_available": True,
                "service_ready": service is not None,
            })

    def _handle_recognize(self):
        start = time.perf_counter()
        print(f"[{time.strftime('%H:%M:%S')}] RECEIVED /api/recognize")

        if not ALGORITHM_AVAILABLE:
            json_response(self, {
                "module": "error", "status": "unavailable",
                "error": f"Algorithm SDK not available: {TRAFFIC_IMPORT_ERROR}",
                "latency_ms": round((time.perf_counter() - start) * 1000, 2),
            }, status=503)
            return

        content_type = self.headers.get("Content-Type", "")
        body = self._read_body()

        try:
            if "multipart/form-data" in content_type:
                boundary = content_type.split("boundary=")[1]
                image_bytes = self._parse_multipart(body, boundary)
                modules, stream_id, timestamp, frame_id = self._parse_multipart_meta(body, boundary)
            else:
                payload = json.loads(body)
                image_b64 = payload.get("image")
                if image_b64:
                    import base64
                    image_bytes = base64.b64decode(image_b64)
                else:
                    json_response(self, {"error": "No image provided"}, status=400)
                    return
                modules = tuple(payload.get("modules", ["tracking", "plate"]))
                stream_id = payload.get("stream_id", "default")
                timestamp = payload.get("timestamp", int(time.time() * 1000))
                frame_id = payload.get("frame_id")

            service = get_service()
            if service is None:
                json_response(self, {
                    "module": "error", "status": "uninitialized",
                    "error": "Algorithm service not initialized",
                }, status=503)
                return

            result = service.process_frame(
                image=image_bytes,
                timestamp=timestamp,
                stream_id=stream_id,
                frame_id=frame_id,
                modules=modules,
            )

            elapsed = round((time.perf_counter() - start) * 1000, 2)
            json_response(self, {
                "status": "ok",
                "results": result,
                "total_latency_ms": elapsed,
            })

        except InvalidImageError as e:
            json_response(self, {"error": str(e), "type": "invalid_image"}, status=400)
        except TimestampOrderError as e:
            json_response(self, {"error": str(e), "type": "timestamp_order"}, status=400)
        except StreamLimitError as e:
            json_response(self, {"error": str(e), "type": "stream_limit"}, status=429)
        except ModelNotConfiguredError as e:
            json_response(self, {"error": str(e), "type": "model_not_configured"}, status=503)
        except AlgorithmSDKError as e:
            json_response(self, {"error": str(e), "type": "algorithm_error"}, status=500)
        except Exception as e:
            traceback.print_exc()
            json_response(self, {
                "error": str(e), "type": "internal_error",
                "traceback": traceback.format_exc(),
            }, status=500)

    def _handle_reset_stream(self):
        body = self._read_body()
        try:
            payload = json.loads(body)
            stream_id = payload.get("stream_id", "")
        except json.JSONDecodeError:
            json_response(self, {"error": "Invalid JSON"}, status=400)
            return

        if not ALGORITHM_AVAILABLE:
            json_response(self, {"error": "Algorithm not available"}, status=503)
            return

        service = get_service()
        if service is None:
            json_response(self, {"error": "Service not initialized"}, status=503)
            return

        result = service.reset_stream(stream_id)
        json_response(self, {"status": "ok", "reset": result})

    def _parse_multipart(self, body, boundary):
        """Extract file bytes from multipart body."""
        boundary_bytes = f"--{boundary}".encode("utf-8")
        parts = body.split(boundary_bytes)
        for part in parts:
            if b"Content-Disposition" not in part:
                continue
            if b'name="file"' in part or b'name="image"' in part:
                header_end = part.find(b"\r\n\r\n")
                if header_end < 0:
                    continue
                data = part[header_end + 4:]
                end = data.rfind(b"\r\n--")
                if end > 0:
                    data = data[:end]
                return data
        raise InvalidImageError("No file/image field in multipart body")

    def _parse_multipart_meta(self, body, boundary):
        """Extract metadata fields from multipart body."""
        boundary_bytes = f"--{boundary}".encode("utf-8")
        parts = body.split(boundary_bytes)
        fields = {}
        for part in parts:
            if b"Content-Disposition" not in part:
                continue
            header_end = part.find(b"\r\n\r\n")
            if header_end < 0:
                continue
            header = part[:header_end].decode("utf-8", errors="replace")
            for name_key in ['name="stream_id"', 'name="timestamp"', 'name="frame_id"', 'name="modules"', 'name="deviceId"']:
                field_name = name_key.split('"')[1]
                if name_key in header:
                    data = part[header_end + 4:]
                    end = data.rfind(b"\r\n--")
                    if end > 0:
                        data = data[:end]
                    fields[field_name] = data.decode("utf-8", errors="replace").strip()

        modules = tuple(fields.get("modules", "tracking,plate").split(","))
        stream_id = fields.get("stream_id", fields.get("deviceId", "default"))
        timestamp = int(fields.get("timestamp", int(time.time() * 1000)))
        frame_id = fields.get("frame_id")
        if frame_id:
            frame_id = int(frame_id)
        return modules, stream_id, timestamp, frame_id


def main():
    parser = argparse.ArgumentParser(description="AI Bridge Service")
    parser.add_argument("--port", type=int, default=5000, help="Listen port (default: 5000)")
    parser.add_argument("--host", type=str, default="0.0.0.0", help="Listen host")
    args = parser.parse_args()

    print(f"Algorithm SDK available: {ALGORITHM_AVAILABLE}")
    if not ALGORITHM_AVAILABLE:
        print(f"Import error: {TRAFFIC_IMPORT_ERROR}")

    if ALGORITHM_AVAILABLE:
        get_service()

    server = HTTPServer((args.host, args.port), RequestHandler)
    print(f"AI Bridge listening on http://{args.host}:{args.port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down...")
        if _algorithm_service:
            _algorithm_service.close()
        server.shutdown()


if __name__ == "__main__":
    main()
