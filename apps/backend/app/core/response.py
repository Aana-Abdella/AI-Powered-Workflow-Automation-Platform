from typing import Any


def success_response(data: Any = None, message: str = "OK") -> dict[str, Any]:
    return {
        "success": True,
        "message": message,
        "data": data,
    }


def error_response(message: str, details: Any = None) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "success": False,
        "error": {
            "message": message,
        },
    }
    if details is not None:
        payload["error"]["details"] = details
    return payload
