package com.hybridchat.data.model

import com.google.gson.annotations.SerializedName

data class CreateChannelRequest(
    val name: String,
    val isPublic: Boolean = true
)

data class Channel(
    @SerializedName("_id") val id: String,
    val name: String,
    val adminId: String,
    val subscribers: List<String> = emptyList(),
    val createdAt: String? = null,
    val isPublic: Boolean = true
)

data class ChannelResponse(
    val channel: Channel
)

data class ChannelsListResponse(
    val channels: List<Channel>
)

data class ReactRequest(
    val type: String
)

data class ChannelReactionEvent(
    val messageId: String,
    val reactions: List<Reaction>
)
