package com.hybridchat.data.model

import com.google.gson.annotations.SerializedName

data class RegisterRequest(
    val username: String,
    val email: String,
    val password: String,
    val publicKey: String = "",
    val bluetoothMac: String = ""
)

data class LoginRequest(
    val email: String,
    val password: String
)

data class RefreshTokenRequest(
    val token: String
)

data class LogoutRequest(
    val userId: String
)

data class AuthResponse(
    val user: UserDto,
    val token: String,
    val refreshToken: String
)

data class TokenResponse(
    val token: String,
    val refreshToken: String
)

data class UserDto(
    val id: String,
    val username: String,
    val email: String,
    val publicKey: String = "",
    val bluetoothMac: String = "",
    val isOnline: Boolean = false,
    val lastSeen: String? = null
)

data class User(
    @SerializedName("_id") val id: String,
    val username: String,
    val email: String,
    val publicKey: String = "",
    val bluetoothMac: String = "",
    val isOnline: Boolean = false,
    val lastSeen: String? = null
)
