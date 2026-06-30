package com.hybridchat.data.repository

import com.hybridchat.data.model.*
import com.hybridchat.data.remote.ApiClient

class ChannelRepository {

    private val api get() = ApiClient.getApi()

    suspend fun createChannel(name: String, isPublic: Boolean = true): Result<Channel> {
        return try {
            val response = api.createChannel(CreateChannelRequest(name, isPublic))
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.channel)
            } else {
                Result.failure(Exception(response.errorBody()?.string() ?: "Failed to create channel"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getChannels(): Result<List<Channel>> {
        return try {
            val response = api.getChannels()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.channels)
            } else {
                Result.success(emptyList())
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun subscribeChannel(channelId: String): Result<Channel> {
        return try {
            val response = api.subscribeChannel(channelId)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.channel)
            } else {
                Result.failure(Exception("Failed to subscribe"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getChannelMessages(channelId: String): Result<List<Message>> {
        return try {
            val response = api.getChannelMessages(channelId)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.messages)
            } else {
                Result.success(emptyList())
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun reactToMessage(channelId: String, messageId: String, type: String): Result<Message> {
        return try {
            val response = api.reactToMessage(channelId, messageId, ReactRequest(type))
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to react"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
