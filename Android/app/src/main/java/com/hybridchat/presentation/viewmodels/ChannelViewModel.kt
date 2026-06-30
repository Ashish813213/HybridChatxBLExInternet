package com.hybridchat.presentation.viewmodels

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.hybridchat.data.model.*
import com.hybridchat.data.repository.ChannelRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ChannelUiState(
    val channels: List<Channel> = emptyList(),
    val messages: List<Message> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
)

class ChannelViewModel(application: Application) : AndroidViewModel(application) {

    private val channelRepository = ChannelRepository()

    private val _uiState = MutableStateFlow(ChannelUiState())
    val uiState: StateFlow<ChannelUiState> = _uiState.asStateFlow()

    fun loadChannels() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            val result = channelRepository.getChannels()
            result.fold(
                onSuccess = { channels ->
                    _uiState.value = _uiState.value.copy(
                        channels = channels,
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

    fun createChannel(name: String, isPublic: Boolean = true) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            val result = channelRepository.createChannel(name, isPublic)
            result.fold(
                onSuccess = {
                    _uiState.value = _uiState.value.copy(isLoading = false)
                    loadChannels()
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

    fun subscribeChannel(channelId: String) {
        viewModelScope.launch {
            val result = channelRepository.subscribeChannel(channelId)
            result.fold(
                onSuccess = { loadChannels() },
                onFailure = { e ->
                    _uiState.value = _uiState.value.copy(error = e.message)
                }
            )
        }
    }

    fun loadChannelMessages(channelId: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            val result = channelRepository.getChannelMessages(channelId)
            result.fold(
                onSuccess = { messages ->
                    _uiState.value = _uiState.value.copy(
                        messages = messages.sortedBy { it.timestamp },
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

    fun reactToMessage(channelId: String, messageId: String, type: String) {
        viewModelScope.launch {
            val result = channelRepository.reactToMessage(channelId, messageId, type)
            result.fold(
                onSuccess = { updatedMessage ->
                    val updatedMessages = _uiState.value.messages.map {
                        if (it.id == messageId) updatedMessage else it
                    }
                    _uiState.value = _uiState.value.copy(messages = updatedMessages)
                },
                onFailure = { e ->
                    _uiState.value = _uiState.value.copy(error = e.message)
                }
            )
        }
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }
}
