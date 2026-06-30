package com.hybridchat.data.remote

import com.hybridchat.data.model.*
import okhttp3.MultipartBody
import okhttp3.RequestBody
import retrofit2.Response
import retrofit2.http.*

interface ApiService {

    // Auth
    @POST("auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<AuthResponse>

    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<AuthResponse>

    @POST("auth/refresh")
    suspend fun refreshToken(@Body request: RefreshTokenRequest): Response<TokenResponse>

    @POST("auth/logout")
    suspend fun logout(@Body request: LogoutRequest): Response<SuccessResponse>

    // Messages
    @POST("messages/send")
    suspend fun sendMessage(@Body request: SendMessageRequest): Response<SendMessageResponse>

    @GET("messages/sync")
    suspend fun syncMessages(): Response<MessagesResponse>

    @GET("messages/conversations")
    suspend fun getConversations(): Response<ConversationsResponse>

    @GET("messages/search")
    suspend fun searchUsers(@Query("q") query: String): Response<UsersResponse>

    @GET("messages/nearby")
    suspend fun getNearbyUsers(): Response<NearbyUsersResponse>

    @POST("messages/bluetooth")
    suspend fun logBluetoothMessage(@Body request: BluetoothLogRequest): Response<SuccessResponse>

    @Multipart
    @POST("messages/upload-image")
    suspend fun uploadImage(@Part image: MultipartBody.Part): Response<UploadResponse>

    @Multipart
    @POST("messages/upload-document")
    suspend fun uploadDocument(@Part document: MultipartBody.Part): Response<UploadResponse>

    // Groups
    @POST("groups")
    suspend fun createGroup(@Body request: CreateGroupRequest): Response<CreateGroupResponse>

    @GET("groups")
    suspend fun getGroups(): Response<GroupsListResponse>

    @POST("groups/join")
    suspend fun joinGroup(@Body request: JoinGroupRequest): Response<JoinGroupResponse>

    @GET("groups/{id}/messages")
    suspend fun getGroupMessages(@Path("id") groupId: String): Response<MessagesResponse>

    @POST("groups/{id}/members")
    suspend fun addGroupMember(
        @Path("id") groupId: String,
        @Body request: AddMemberRequest
    ): Response<Group>

    // Channels
    @POST("channels")
    suspend fun createChannel(@Body request: CreateChannelRequest): Response<ChannelResponse>

    @GET("channels")
    suspend fun getChannels(): Response<ChannelsListResponse>

    @POST("channels/{id}/subscribe")
    suspend fun subscribeChannel(@Path("id") channelId: String): Response<ChannelResponse>

    @GET("channels/{id}/messages")
    suspend fun getChannelMessages(@Path("id") channelId: String): Response<MessagesResponse>

    @POST("channels/{id}/messages/{messageId}/react")
    suspend fun reactToMessage(
        @Path("id") channelId: String,
        @Path("messageId") messageId: String,
        @Body request: ReactRequest
    ): Response<Message>
}
