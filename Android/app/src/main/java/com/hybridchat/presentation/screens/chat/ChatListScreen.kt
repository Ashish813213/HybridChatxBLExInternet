package com.hybridchat.presentation.screens.chat

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.hybridchat.data.model.Conversation
import com.hybridchat.data.model.User

@Composable
fun ChatListScreen(
    conversations: List<Conversation>,
    searchResults: List<User>,
    isSearching: Boolean,
    isLoading: Boolean,
    onSearchQuery: (String) -> Unit,
    onSelectConversation: (Conversation) -> Unit,
    onSelectUser: (User) -> Unit
) {
    var searchQuery by remember { mutableStateOf("") }

    Column(modifier = Modifier.fillMaxSize()) {
        OutlinedTextField(
            value = searchQuery,
            onValueChange = {
                searchQuery = it
                onSearchQuery(it)
            },
            placeholder = { Text("Search users...") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth().padding(8.dp)
        )

        if (isSearching) {
            LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
        }

        if (searchQuery.isNotBlank()) {
            LazyColumn(modifier = Modifier.fillMaxSize()) {
                items(searchResults) { user ->
                    UserSearchItem(user = user, onClick = { onSelectUser(user) })
                }
                if (searchResults.isEmpty() && !isSearching) {
                    item {
                        Box(modifier = Modifier.fillMaxWidth().padding(16.dp), contentAlignment = Alignment.Center) {
                            Text("No users found")
                        }
                    }
                }
            }
        } else {
            if (isLoading) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            } else if (conversations.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("No conversations yet")
                }
            } else {
                LazyColumn(modifier = Modifier.fillMaxSize()) {
                    items(conversations) { conversation ->
                        ConversationItem(
                            conversation = conversation,
                            onClick = { onSelectConversation(conversation) }
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun ConversationItem(conversation: Conversation, onClick: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 4.dp).clickable(onClick = onClick)
    ) {
        Row(
            modifier = Modifier.padding(16.dp).fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Surface(
                modifier = Modifier.size(48.dp),
                shape = MaterialTheme.shapes.extraLarge,
                color = if (conversation.isOnline)
                    MaterialTheme.colorScheme.primary.copy(alpha = 0.3f)
                else
                    MaterialTheme.colorScheme.surfaceVariant
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Text(
                        text = conversation.username.take(2).uppercase(),
                        fontWeight = FontWeight.Bold
                    )
                }
            }
            Spacer(modifier = Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = conversation.username,
                    fontWeight = FontWeight.SemiBold
                )
                Text(
                    text = conversation.lastMessage?.content ?: "",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1
                )
            }
            Spacer(modifier = Modifier.width(8.dp))
            if (conversation.isOnline) {
                Surface(
                    modifier = Modifier.size(8.dp),
                    shape = MaterialTheme.shapes.extraLarge,
                    color = MaterialTheme.colorScheme.primary
                ) {}
            }
        }
    }
}

@Composable
private fun UserSearchItem(user: User, onClick: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 4.dp).clickable(onClick = onClick)
    ) {
        Row(
            modifier = Modifier.padding(16.dp).fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Surface(
                modifier = Modifier.size(48.dp),
                shape = MaterialTheme.shapes.extraLarge,
                color = MaterialTheme.colorScheme.surfaceVariant
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Text(text = user.username.take(2).uppercase(), fontWeight = FontWeight.Bold)
                }
            }
            Spacer(modifier = Modifier.width(12.dp))
            Column {
                Text(text = user.username, fontWeight = FontWeight.SemiBold)
                Text(
                    text = user.email,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Spacer(modifier = Modifier.weight(1f))
            if (user.isOnline) {
                Surface(
                    modifier = Modifier.size(8.dp),
                    shape = MaterialTheme.shapes.extraLarge,
                    color = MaterialTheme.colorScheme.primary
                ) {}
            }
        }
    }
}
