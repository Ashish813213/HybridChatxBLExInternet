package com.hybridchat.data.model

import com.google.gson.annotations.SerializedName

data class CreateGroupRequest(
    val name: String,
    val members: List<String> = emptyList()
)

data class JoinGroupRequest(
    val code: String
)

data class AddMemberRequest(
    val userId: String
)

data class Group(
    @SerializedName("_id") val id: String,
    val name: String,
    val adminId: String,
    val members: List<String> = emptyList(),
    val inviteCode: String? = null,
    val createdAt: String? = null,
    val groupPublicKey: String? = null
)

data class CreateGroupResponse(
    val group: Group,
    val inviteCode: String
)

data class GroupsListResponse(
    val groups: List<Group>
)

data class JoinGroupResponse(
    val group: Group,
    val joined: Boolean = false
)
