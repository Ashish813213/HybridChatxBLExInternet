package com.hybridchat.presentation.viewmodels

import android.app.Application
import android.net.Uri
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.hybridchat.data.model.*
import com.hybridchat.data.remote.SocketManager
import com.hybridchat.data.repository.ChatRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ChatUiState(
    val conversations: List<Conversation> = emptyList(),
    val messages: List<Message> = emptyList(),
    val searchResults: List<User> = emptyList(),
    val nearbyUsers: List<User> = emptyList(),
    val isLoading: Boolean = false,
    val isSearching: Boolean = false,
    val error: String? = null
)

class ChatViewModel(application: Application) : AndroidViewModel(application) {

    private val chatRepository = ChatRepository(application)

    private val _uiState = MutableStateFlow(ChatUiState())
    val uiState: StateFlow<ChatUiState> = _uiState.asStateFlow()

    fun loadConversations() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            val result = chatRepository.getConversations()
            result.fold(
                onSuccess = { conversations ->
                    _uiState.value = _uiState.value.copy(
                        conversations = conversations,
                        isLoading = false
                    )
                },
                onFailure = { e ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = e.message
                    )
                }
            )
        }
    }

    fun loadMessages(chatId: String, currentUserId: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            val result = chatRepository.syncMessages()
            result.fold(
                onSuccess = { allMessages ->
                    val filtered = allMessages.filter { msg ->
                        (msg.senderId == chatId && msg.receiverId == currentUserId) ||
                                (msg.senderId == currentUserId && msg.receiverId == chatId)
                    }
                    _uiState.value = _uiState.value.copy(
                        messages = filtered.sortedBy { it.timestamp },
                        isLoading = false
                    )
                },
                onFailure = { e ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = e.message
                    )
                }
            )
        }
    }

    fun loadGroupMessages(groupId: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            val result = chatRepository.syncMessages()
            result.fold(
                onSuccess = { allMessages ->
                    val filtered = allMessages.filter { it.groupId == groupId }
                    _uiState.value = _uiState.value.copy(
                        messages = filtered.sortedBy { it.timestamp },
                        isLoading = false
                    )
                },
                onFailure = { e ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = e.message
                    )
                }
            )
        }
    }

    fun loadChannelMessages(channelId: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            val result = chatRepository.syncMessages()
            result.fold(
                onSuccess = { allMessages ->
                    val filtered = allMessages.filter { it.channelId == channelId }
                    _uiState.value = _uiState.value.copy(
                        messages = filtered.sortedBy { it.timestamp },
                        isLoading = false
                    )
                },
                onFailure = { e ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = e.message
                    )
                }
            )
        }
    }

    fun sendMessage(
        receiverId: String? = null,
        groupId: String? = null,
        channelId: String? = null,
        content: String? = null,
        imageUrl: String? = null,
        documentUrl: String? = null,
        documentName: String? = null,
        documentType: String? = null
    ) {
        viewModelScope.launch {
            val request = SendMessageRequest(
                receiverId = receiverId,
                groupId = groupId,
                channelId = channelId,
                content = content,
                imageUrl = imageUrl,
                documentUrl = documentUrl,
                documentName = documentName,
                documentType = documentType,
                mode = if (content == null && imageUrl == null) "bluetooth" else "internet"
            )
            val result = chatRepository.sendMessage(request)
            result.fold(
                onSuccess = { response ->
                    _uiState.value = _uiState.value.copy(
                        messages = _uiState.value.messages + response.message
                    )
                },
                onFailure = { e ->
                    _uiState.value = _uiState.value.copy(error = e.message)
                }
            )
        }
    }

    fun searchUsers(query: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSearching = true)
            val result = chatRepository.searchUsers(query)
            result.fold(
                onSuccess = { users ->
                    _uiState.value = _uiState.value.copy(
                        searchResults = users,
                        isSearching = false
                    )
                },
                onFailure = {
                    _uiState.value = _uiState.value.copy(isSearching = false)
                }
            )
        }
    }

    fun loadNearbyUsers() {
        viewModelScope.launch {
            val result = chatRepository.getNearbyUsers()
            result.fold(
                onSuccess = { users ->
                    _uiState.value = _uiState.value.copy(nearbyUsers = users)
                },
                onFailure = { }
            )
        }
    }

    fun uploadAndSendImage(uri: Uri, receiverId: String? = null) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            val result = chatRepository.uploadImage(uri)
            result.fold(
                onSuccess = { imageUrl ->
                    if (receiverId != null) {
                        sendMessage(receiverId = receiverId, imageUrl = imageUrl)
                    }
                    _uiState.value = _uiState.value.copy(isLoading = false)
                },
                onFailure = { e ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = e.message
                    )
                }
            )
        }
    }

    fun addMessage(message: Message) {
        val current = _uiState.value.messages
        if (current.none { it.id == message.id }) {
            _uiState.value = _uiState.value.copy(
                messages = current + message
            )
        }
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }
}
