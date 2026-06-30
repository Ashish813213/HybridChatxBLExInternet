package com.hybridchat.presentation.screens.chat

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.AttachFile
import androidx.compose.material.icons.filled.Image
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.hybridchat.data.model.Message

data class ChatScreenConfig(
    val chatId: String,
    val chatName: String,
    val isGroup: Boolean = false,
    val isChannel: Boolean = false,
    val isChannelAdmin: Boolean = false
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatScreen(
    config: ChatScreenConfig,
    messages: List<Message>,
    currentUserId: String,
    onBack: () -> Unit,
    onSendMessage: (String) -> Unit,
    onSendImage: (Uri) -> Unit,
    onReactToMessage: ((String, String) -> Unit)? = null
) {
    var messageText by remember { mutableStateOf("") }
    val listState = rememberLazyListState()

    val imagePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri ->
        uri?.let { onSendImage(it) }
    }

    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) {
            listState.animateScrollToItem(messages.size - 1)
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = config.chatName,
                            style = MaterialTheme.typography.titleMedium
                        )
                        if (config.isChannel) {
                            Text(
                                text = if (config.isChannelAdmin) "Admin" else "Subscriber",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        },
        bottomBar = {
            if (!config.isChannel || config.isChannelAdmin) {
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    tonalElevation = 3.dp
                ) {
                    Row(
                        modifier = Modifier.padding(8.dp).fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        IconButton(onClick = { imagePickerLauncher.launch("image/*") }) {
                            Icon(Icons.Default.Image, contentDescription = "Send image")
                        }
                        IconButton(onClick = {
                            imagePickerLauncher.launch("application/*")
                        }) {
                            Icon(Icons.Default.AttachFile, contentDescription = "Attach file")
                        }
                        OutlinedTextField(
                            value = messageText,
                            onValueChange = { messageText = it },
                            placeholder = { Text("Type a message...") },
                            modifier = Modifier.weight(1f),
                            singleLine = true,
                            colors = OutlinedTextFieldDefaults.colors(
                                unfocusedBorderColor = Color.Transparent,
                                focusedBorderColor = Color.Transparent
                            )
                        )
                        IconButton(
                            onClick = {
                                if (messageText.isNotBlank()) {
                                    onSendMessage(messageText.trim())
                                    messageText = ""
                                }
                            },
                            enabled = messageText.isNotBlank()
                        ) {
                            Icon(Icons.Default.Send, contentDescription = "Send")
                        }
                    }
                }
            }
        }
    ) { padding ->
        if (messages.isEmpty()) {
            Box(
                modifier = Modifier.fillMaxSize().padding(padding),
                contentAlignment = Alignment.Center
            ) {
                Text("No messages yet", color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize().padding(padding).padding(horizontal = 8.dp),
                state = listState,
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                items(messages, key = { it.id }) { message ->
                    MessageBubbleItem(
                        message = message,
                        isOwn = message.senderId == currentUserId,
                        currentUserId = currentUserId,
                        canReact = config.isChannel && !config.isChannelAdmin,
                        onReact = onReactToMessage
                    )
                }
            }
        }
    }
}

@Composable
fun MessageBubbleItem(
    message: Message,
    isOwn: Boolean,
    currentUserId: String = "",
    canReact: Boolean = false,
    onReact: ((String, String) -> Unit)? = null
) {
    Column(
        modifier = Modifier.fillMaxWidth().padding(vertical = 2.dp)
    ) {
        Surface(
            modifier = Modifier
                .widthIn(max = 280.dp)
                .align(if (isOwn) Alignment.End else Alignment.Start),
            shape = MaterialTheme.shapes.medium,
            color = if (isOwn)
                MaterialTheme.colorScheme.primaryContainer
            else
                MaterialTheme.colorScheme.surfaceVariant
        ) {
            Column(modifier = Modifier.padding(12.dp)) {
                if (!isOwn && message.content.isNotEmpty()) {
                    Text(
                        text = message.content,
                        style = MaterialTheme.typography.bodyMedium
                    )
                } else if (message.content.isNotEmpty()) {
                    Text(
                        text = message.content,
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
                if (message.imageUrl != null) {
                    Text(
                        text = "[Image]",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Medium
                    )
                }
                if (message.documentUrl != null) {
                    Text(
                        text = "[Document: ${message.documentName ?: "File"}]",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Medium
                    )
                }
                Text(
                    text = message.timestamp.substringAfter("T").take(5),
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
        if (canReact && message.reactions.isNotEmpty()) {
            Row(
                modifier = Modifier
                    .align(if (isOwn) Alignment.End else Alignment.Start)
                    .padding(top = 2.dp)
            ) {
                message.reactions.forEach { reaction ->
                    Surface(
                        modifier = Modifier.padding(horizontal = 2.dp),
                        shape = MaterialTheme.shapes.small,
                        color = MaterialTheme.colorScheme.secondaryContainer
                    ) {
                        Text(
                            text = reaction.type,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                            style = MaterialTheme.typography.labelSmall
                        )
                    }
                }
            }
        }
    }
}
