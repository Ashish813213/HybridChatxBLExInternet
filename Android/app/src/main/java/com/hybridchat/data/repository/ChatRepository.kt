package com.hybridchat.data.repository

import android.content.Context
import android.net.Uri
import com.hybridchat.data.model.*
import com.hybridchat.data.remote.ApiClient
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.toRequestBody

class ChatRepository(private val context: Context) {

    private val api get() = ApiClient.getApi()

    suspend fun sendMessage(request: SendMessageRequest): Result<SendMessageResponse> {
        return try {
            val response = api.sendMessage(request)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception(response.errorBody()?.string() ?: "Send failed"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun syncMessages(): Result<List<Message>> {
        return try {
            val response = api.syncMessages()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.messages)
            } else {
                Result.failure(Exception(response.errorBody()?.string() ?: "Sync failed"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getConversations(): Result<List<Conversation>> {
        return try {
            val response = api.getConversations()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.conversations)
            } else {
                Result.failure(Exception("Failed to get conversations"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun searchUsers(query: String): Result<List<User>> {
        return try {
            val response = api.searchUsers(query)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.users)
            } else {
                Result.success(emptyList())
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getNearbyUsers(): Result<List<User>> {
        return try {
            val response = api.getNearbyUsers()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.users)
            } else {
                Result.success(emptyList())
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun logBluetoothMessage(request: BluetoothLogRequest): Result<SuccessResponse> {
        return try {
            val response = api.logBluetoothMessage(request)
            if (response.isSuccessful) {
                Result.success(SuccessResponse(true))
            } else {
                Result.failure(Exception("Failed to log bluetooth message"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun uploadImage(uri: Uri): Result<String> {
        return try {
            val inputStream = context.contentResolver.openInputStream(uri)
                ?: return Result.failure(Exception("Cannot open file"))
            val bytes = inputStream.readBytes()
            inputStream.close()

            val requestBody = bytes.toRequestBody("image/*".toMediaTypeOrNull())
            val part = MultipartBody.Part.createFormData("image", "image.jpg", requestBody)
            val response = api.uploadImage(part)
            if (response.isSuccessful && response.body()?.imageUrl != null) {
                Result.success(response.body()!!.imageUrl!!)
            } else {
                Result.failure(Exception("Upload failed"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun uploadDocument(uri: Uri): Result<UploadResponse> {
        return try {
            val inputStream = context.contentResolver.openInputStream(uri)
                ?: return Result.failure(Exception("Cannot open file"))
            val bytes = inputStream.readBytes()
            inputStream.close()

            val requestBody = bytes.toRequestBody("application/octet-stream".toMediaTypeOrNull())
            val part = MultipartBody.Part.createFormData("document", "document", requestBody)
            val response = api.uploadDocument(part)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Upload failed"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
