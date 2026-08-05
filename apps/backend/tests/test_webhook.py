
def register_and_login(client, email: str):
    client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": "Strong@1234",
            "firstName": "Webhook",
            "lastName": "User",
        },
    )
    login = client.post("/api/auth/login", json={"email": email, "password": "Strong@1234"})
    return login.json()["data"]["accessToken"]


def test_webhook_validation_and_enqueue(client, monkeypatch):
    token = register_and_login(client, "hook@example.com")

    workflow_resp = client.post(
        "/api/workflows",
        json={"name": "Webhook Flow"},
        headers={"Authorization": f"Bearer {token}"},
    )
    workflow_key = workflow_resp.json()["data"]["webhookKey"]

    from app.worker.tasks import process_log_task

    monkeypatch.setattr(process_log_task, "delay", lambda log_id: None)

    invalid = client.post(f"/api/webhook/{workflow_key}", json={})
    assert invalid.status_code == 422

    valid = client.post(
        f"/api/webhook/{workflow_key}",
        json={"text": "This is a very long paragraph that should be summarized by the worker."},
    )
    assert valid.status_code == 200
    assert valid.json()["data"]["status"] == "PENDING"


def test_protected_route_requires_token(client):
    response = client.get("/api/workflows")
    assert response.status_code == 401
