package com.hybridchat.data.repository

import com.hybridchat.data.model.*
import com.hybridchat.data.remote.ApiClient
import com.hybridchat.data.remote.TokenManager

class AuthRepository(private val tokenManager: TokenManager) {

    private val api get() = ApiClient.getApi()

    suspend fun register(
        username: String,
        email: String,
        password: String,
        publicKey: String = "",
        bluetoothMac: String = ""
    ): Result<AuthResponse> {
        return try {
            val response = api.register(
                RegisterRequest(username, email, password, publicKey, bluetoothMac)
            )
            if (response.isSuccessful && response.body() != null) {
                val body = response.body()!!
                tokenManager.saveAuthData(
                    token = body.token,
                    refresh = body.refreshToken,
                    userId = body.user.id,
                    username = body.user.username,
                    email = body.user.email
                )
                Result.success(body)
            } else {
                val errorBody = response.errorBody()?.string() ?: "Registration failed"
                Result.failure(Exception(errorBody))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun login(email: String, password: String): Result<AuthResponse> {
        return try {
            val response = api.login(LoginRequest(email, password))
            if (response.isSuccessful && response.body() != null) {
                val body = response.body()!!
                tokenManager.saveAuthData(
                    token = body.token,
                    refresh = body.refreshToken,
                    userId = body.user.id,
                    username = body.user.username,
                    email = body.user.email
                )
                Result.success(body)
            } else {
                val errorBody = response.errorBody()?.string() ?: "Login failed"
                Result.failure(Exception(errorBody))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun refreshToken(): Result<TokenResponse> {
        return try {
            val currentRefresh = tokenManager.refreshToken ?: return Result.failure(
                Exception("No refresh token")
            )
            val response = api.refreshToken(RefreshTokenRequest(currentRefresh))
            if (response.isSuccessful && response.body() != null) {
                val body = response.body()!!
                tokenManager.accessToken = body.token
                tokenManager.refreshToken = body.refreshToken
                Result.success(body)
            } else {
                tokenManager.clear()
                Result.failure(Exception("Token refresh failed"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun logout(): Result<SuccessResponse> {
        return try {
            val userId = tokenManager.userId ?: ""
            val response = api.logout(LogoutRequest(userId))
            tokenManager.clear()
            if (response.isSuccessful) {
                Result.success(SuccessResponse(true))
            } else {
                Result.success(SuccessResponse(true))
            }
        } catch (e: Exception) {
            tokenManager.clear()
            Result.success(SuccessResponse(true))
        }
    }

    fun isLoggedIn(): Boolean = tokenManager.isLoggedIn
}
