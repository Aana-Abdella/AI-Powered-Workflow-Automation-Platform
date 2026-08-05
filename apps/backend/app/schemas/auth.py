from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, field_validator


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    firstName: str = Field(min_length=1, max_length=80)
    lastName: str = Field(min_length=1, max_length=80)
    organizationName: str | None = Field(default=None, max_length=120)

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, value: str) -> str:
        has_upper = any(char.isupper() for char in value)
        has_lower = any(char.islower() for char in value)
        has_digit = any(char.isdigit() for char in value)
        has_special = any(not char.isalnum() for char in value)
        if not all([has_upper, has_lower, has_digit, has_special]):
            raise ValueError(
                "Password must include uppercase, lowercase, number, and special character"
            )
        return value


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class RefreshRequest(BaseModel):
    refreshToken: str | None = None


class ChangePasswordRequest(BaseModel):
    currentPassword: str = Field(min_length=1)
    newPassword: str = Field(min_length=8, max_length=128)


class UserResponse(BaseModel):
    id: str
    email: EmailStr
    firstName: str
    lastName: str
    role: str
    isActive: bool
    createdAt: datetime


class OrganizationResponse(BaseModel):
    id: str
    name: str
    slug: str


class AuthResponse(BaseModel):
    user: UserResponse
    organization: OrganizationResponse
    accessToken: str


class TokenResponse(BaseModel):
    accessToken: str
