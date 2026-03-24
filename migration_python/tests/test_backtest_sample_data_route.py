import asyncio
import ast
from pathlib import Path


class _LoggerStub:
    def warning(self, *args, **kwargs):
        pass

    def error(self, *args, **kwargs):
        pass


class _RouterStub:
    def get(self, *args, **kwargs):
        def decorator(fn):
            return fn

        return decorator


def load_sample_data_route():
    routes_path = Path(__file__).resolve().parents[1] / "api" / "routes.py"
    module = ast.parse(routes_path.read_text())

    route_fn = next(
        node
        for node in module.body
        if isinstance(node, ast.AsyncFunctionDef)
        and node.name == "get_backtest_sample_data"
    )

    isolated_module = ast.Module(body=[route_fn], type_ignores=[])
    ast.fix_missing_locations(isolated_module)

    namespace = {
        "logger": _LoggerStub(),
        "router": _RouterStub(),
        "success_response": lambda data=None: {"success": True, "data": data},
        "error_response": lambda error, status_code=400: {
            "success": False,
            "status": "error",
            "error": error,
            "status_code": status_code,
        },
    }
    exec(compile(isolated_module, str(routes_path), "exec"), namespace)
    return namespace["get_backtest_sample_data"]


def test_backtest_sample_data_route_reports_unavailable():
    get_backtest_sample_data = load_sample_data_route()

    response = asyncio.run(get_backtest_sample_data("BTC", 30))

    assert response["success"] is False
    assert response["status"] == "unavailable"
    assert "historical data unavailable" in response["error"]
    assert response["symbol"] == "BTC"
    assert response["days"] == 30
