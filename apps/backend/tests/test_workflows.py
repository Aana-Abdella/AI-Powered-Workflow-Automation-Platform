
def register_and_login(client, email: str):
    client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": "Strong@1234",
            "firstName": "First",
            "lastName": "Last",
        },
    )
    login = client.post("/api/auth/login", json={"email": email, "password": "Strong@1234"})
    return login.json()["data"]["accessToken"]


def test_workflow_crud_and_isolation(client):
    token_user1 = register_and_login(client, "tenant1@example.com")
    token_user2 = register_and_login(client, "tenant2@example.com")

    create = client.post(
        "/api/workflows",
        json={"name": "Summarize Leads"},
        headers={"Authorization": f"Bearer {token_user1}"},
    )
    assert create.status_code == 200
    workflow_id = create.json()["data"]["id"]

    list_user1 = client.get("/api/workflows", headers={"Authorization": f"Bearer {token_user1}"})
    assert list_user1.status_code == 200
    assert len(list_user1.json()["data"]) == 1

    get_user2 = client.get(
        f"/api/workflows/{workflow_id}",
        headers={"Authorization": f"Bearer {token_user2}"},
    )
    assert get_user2.status_code == 404

    disable = client.post(
        f"/api/workflows/{workflow_id}/disable",
        headers={"Authorization": f"Bearer {token_user1}"},
    )
    assert disable.status_code == 200
    assert disable.json()["data"]["isActive"] is False

    delete = client.delete(
        f"/api/workflows/{workflow_id}",
        headers={"Authorization": f"Bearer {token_user1}"},
    )
    assert delete.status_code == 200
