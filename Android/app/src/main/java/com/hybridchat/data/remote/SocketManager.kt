package com.hybridchat.data.remote

import android.util.Log
import com.hybridchat.BuildConfig
import com.hybridchat.data.model.ChannelReactionEvent
import com.hybridchat.data.model.Message
import com.google.gson.Gson
import io.socket.client.IO
import io.socket.client.Socket
import io.socket.emitter.Emitter
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import org.json.JSONObject

class SocketManager {

    private var socket: Socket? = null
    private val gson = Gson()

    private val _newMessages = Channel<Message>(Channel.BUFFERED)
    val newMessages: Channel<Message> = _newMessages

    private val _reactionEvents = Channel<ChannelReactionEvent>(Channel.BUFFERED)
    val reactionEvents: Channel<ChannelReactionEvent> = _reactionEvents

    private val _isConnected = MutableStateFlow(false)
    val isConnected: StateFlow<Boolean> = _isConnected.asStateFlow()

    fun connect(token: String) {
        if (socket?.connected() == true) return
        disconnect()

        try {
            val options = IO.Options().apply {
                auth = mapOf("token" to token)
                transports = arrayOf("websocket")
                reconnection = true
                reconnectionAttempts = 10
                reconnectionDelay = 1000
                reconnectionDelayMax = 5000
            }

            val s = IO.socket(BuildConfig.API_BASE_URL, options)

            s.on(Socket.EVENT_CONNECT, Emitter.Listener {
                _isConnected.value = true
                Log.d(TAG, "Socket connected")
            })

            s.on(Socket.EVENT_DISCONNECT, Emitter.Listener {
                _isConnected.value = false
                Log.d(TAG, "Socket disconnected")
            })

            s.on(Socket.EVENT_CONNECT_ERROR, Emitter.Listener { args ->
                Log.e(TAG, "Connection error: ${args?.firstOrNull()}")
            })

            s.on(EVENT_NEW_MESSAGE, Emitter.Listener { args ->
                args?.firstOrNull()?.let { raw ->
                    try {
                        val json = (raw as JSONObject).toString()
                        val message = gson.fromJson(json, Message::class.java)
                        _newMessages.trySend(message)
                    } catch (e: Exception) {
                        Log.e(TAG, "Parse new_message failed", e)
                    }
                }
            })

            s.on(EVENT_CHANNEL_REACTION, Emitter.Listener { args ->
                args?.firstOrNull()?.let { raw ->
                    try {
                        val json = (raw as JSONObject).toString()
                        val event = gson.fromJson(json, ChannelReactionEvent::class.java)
                        _reactionEvents.trySend(event)
                    } catch (e: Exception) {
                        Log.e(TAG, "Parse reaction failed", e)
                    }
                }
            })

            s.connect()
            socket = s
        } catch (e: Exception) {
            Log.e(TAG, "Socket init error", e)
        }
    }

    fun disconnect() {
        socket?.disconnect()
        socket?.off()
        socket = null
        _isConnected.value = false
    }

    fun joinGroup(groupId: String) {
        socket?.emit("join_group", groupId)
            ?: Log.w(TAG, "joinGroup: socket not connected")
    }

    fun joinChannel(channelId: String) {
        socket?.emit("join_channel", channelId)
            ?: Log.w(TAG, "joinChannel: socket not connected")
    }

    fun leaveGroup(groupId: String) {
        socket?.emit("leave_group", groupId)
    }

    fun leaveChannel(channelId: String) {
        socket?.emit("leave_channel", channelId)
    }

    companion object {
        private const val TAG = "SocketManager"
        private const val EVENT_NEW_MESSAGE = "new_message"
        private const val EVENT_CHANNEL_REACTION = "channel_reaction_updated"
    }
}
