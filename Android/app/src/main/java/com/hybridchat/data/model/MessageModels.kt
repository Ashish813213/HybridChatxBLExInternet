package com.hybridchat.data.model

import com.google.gson.annotations.SerializedName

data class SendMessageRequest(
    val receiverId: String? = null,
    val groupId: String? = null,
    val channelId: String? = null,
    val content: String? = null,
    val imageUrl: String? = null,
    val documentUrl: String? = null,
    val documentName: String? = null,
    val documentType: String? = null,
    val mode: String = "internet"
)

data class Message(
    @SerializedName("_id") val id: String,
    val senderId: String,
    val receiverId: String? = null,
    val groupId: String? = null,
    val channelId: String? = null,
    val content: String = "",
    val imageUrl: String? = null,
    val documentUrl: String? = null,
    val documentName: String? = null,
    val documentType: String? = null,
    val timestamp: String,
    val mode: String = "internet",
    val isEncrypted: Boolean = true,
    val reactions: List<Reaction> = emptyList()
)

data class Reaction(
    val userId: String,
    val type: String,
    val reactedAt: String? = null
)

data class SendMessageResponse(
    val message: Message,
    val success: Boolean
)

data class MessagesResponse(
    val messages: List<Message>
)

data class ConversationsResponse(
    val conversations: List<Conversation>
)

data class Conversation(
    @SerializedName("_id") val id: String,
    val username: String,
    val email: String,
    val isOnline: Boolean,
    val lastMessage: LastMessage? = null
)

data class LastMessage(
    @SerializedName("_id") val id: String,
    val senderId: String? = null,
    val receiverId: String? = null,
    val content: String = "",
    val timestamp: String? = null
)

data class NearbyUsersResponse(
    val users: List<User>
)

data class UsersResponse(
    val users: List<User>
)

data class UploadResponse(
    val imageUrl: String? = null,
    val documentUrl: String? = null,
    val documentName: String? = null,
    val documentType: String? = null,
    val success: Boolean
)

data class BluetoothLogRequest(
    val receiverId: String,
    val messageId: String,
    val timestamp: String? = null,
    val metadata: Map<String, Any>? = null
)
