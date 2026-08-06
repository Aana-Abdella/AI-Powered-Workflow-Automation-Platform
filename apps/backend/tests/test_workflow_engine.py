from app.worker.tasks import _run_definition


def test_engine_runs_ai_steps_in_order(monkeypatch):
    calls: list[str] = []

    def summarize(_self, value: str) -> str:
        calls.append(value)
        return f"summary({value})"

    monkeypatch.setattr("app.worker.tasks.AIService.summarize", summarize)
    definition = {
        "trigger": {"type": "webhook", "config": {}},
        "steps": [
            {"id": "one", "type": "ai", "operation": "summarize"},
            {"id": "two", "type": "ai", "operation": "summarize"},
        ],
    }

    result = _run_definition(definition, "input")

    assert calls == ["input", "summary(input)"]
    assert result == "summary(summary(input))"