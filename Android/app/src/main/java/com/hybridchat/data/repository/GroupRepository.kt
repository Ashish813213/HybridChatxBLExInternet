package com.hybridchat.data.repository

import com.hybridchat.data.model.*
import com.hybridchat.data.remote.ApiClient

class GroupRepository {

    private val api get() = ApiClient.getApi()

    suspend fun createGroup(name: String, members: List<String> = emptyList()): Result<CreateGroupResponse> {
        return try {
            val response = api.createGroup(CreateGroupRequest(name, members))
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception(response.errorBody()?.string() ?: "Failed to create group"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getGroups(): Result<List<Group>> {
        return try {
            val response = api.getGroups()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.groups)
            } else {
                Result.success(emptyList())
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun joinGroup(code: String): Result<JoinGroupResponse> {
        return try {
            val response = api.joinGroup(JoinGroupRequest(code))
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception(response.errorBody()?.string() ?: "Failed to join group"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getGroupMessages(groupId: String): Result<List<Message>> {
        return try {
            val response = api.getGroupMessages(groupId)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.messages)
            } else {
                Result.success(emptyList())
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun addMember(groupId: String, userId: String): Result<Group> {
        return try {
            val response = api.addGroupMember(groupId, AddMemberRequest(userId))
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to add member"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
