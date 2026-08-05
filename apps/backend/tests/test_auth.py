
def register_payload(email: str) -> dict:
    return {
        "email": email,
        "password": "Strong@1234",
        "firstName": "Test",
        "lastName": "User",
    }


def test_register_login_refresh_and_me(client):
    register_response = client.post("/api/auth/register", json=register_payload("user1@example.com"))
    assert register_response.status_code == 200
    register_json = register_response.json()
    assert register_json["success"] is True
    assert register_json["data"]["accessToken"]

    login_response = client.post(
        "/api/auth/login",
        json={"email": "user1@example.com", "password": "Strong@1234"},
    )
    assert login_response.status_code == 200
    login_json = login_response.json()
    access_token = login_json["data"]["accessToken"]

    me_response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert me_response.status_code == 200
    assert me_response.json()["data"]["user"]["email"] == "user1@example.com"

    refresh_response = client.post("/api/auth/refresh")
    assert refresh_response.status_code == 200
    assert refresh_response.json()["data"]["accessToken"]


def test_password_strength_validation(client):
    response = client.post(
        "/api/auth/register",
        json={
            "email": "weak@example.com",
            "password": "weakpass",
            "firstName": "Weak",
            "lastName": "Pass",
        },
    )
    assert response.status_code == 422
