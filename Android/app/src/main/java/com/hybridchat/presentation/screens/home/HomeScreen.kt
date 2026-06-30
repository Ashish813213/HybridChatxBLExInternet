package com.hybridchat.presentation.screens.home

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bluetooth
import androidx.compose.material.icons.filled.Chat
import androidx.compose.material.icons.filled.Groups
import androidx.compose.material.icons.filled.Campaign
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier

enum class HomeTab(val label: String) {
    CHATS("Chats"),
    GROUPS("Groups"),
    CHANNELS("Channels"),
    BLUETOOTH("Bluetooth"),
    SETTINGS("Settings")
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    currentTab: HomeTab,
    onTabChange: (HomeTab) -> Unit,
    chatsContent: @Composable () -> Unit,
    groupsContent: @Composable () -> Unit,
    channelsContent: @Composable () -> Unit,
    bluetoothContent: @Composable () -> Unit,
    settingsContent: @Composable () -> Unit
) {
    Scaffold(
        bottomBar = {
            NavigationBar {
                NavigationBarItem(
                    icon = { Icon(Icons.Default.Chat, contentDescription = "Chats") },
                    label = { Text("Chats") },
                    selected = currentTab == HomeTab.CHATS,
                    onClick = { onTabChange(HomeTab.CHATS) }
                )
                NavigationBarItem(
                    icon = { Icon(Icons.Default.Groups, contentDescription = "Groups") },
                    label = { Text("Groups") },
                    selected = currentTab == HomeTab.GROUPS,
                    onClick = { onTabChange(HomeTab.GROUPS) }
                )
                NavigationBarItem(
                    icon = { Icon(Icons.Default.Campaign, contentDescription = "Channels") },
                    label = { Text("Channels") },
                    selected = currentTab == HomeTab.CHANNELS,
                    onClick = { onTabChange(HomeTab.CHANNELS) }
                )
                NavigationBarItem(
                    icon = { Icon(Icons.Default.Bluetooth, contentDescription = "Bluetooth") },
                    label = { Text("Bluetooth") },
                    selected = currentTab == HomeTab.BLUETOOTH,
                    onClick = { onTabChange(HomeTab.BLUETOOTH) }
                )
                NavigationBarItem(
                    icon = { Icon(Icons.Default.Settings, contentDescription = "Settings") },
                    label = { Text("Settings") },
                    selected = currentTab == HomeTab.SETTINGS,
                    onClick = { onTabChange(HomeTab.SETTINGS) }
                )
            }
        }
    ) { padding ->
        Box(modifier = Modifier.fillMaxSize().padding(padding)) {
            when (currentTab) {
                HomeTab.CHATS -> chatsContent()
                HomeTab.GROUPS -> groupsContent()
                HomeTab.CHANNELS -> channelsContent()
                HomeTab.BLUETOOTH -> bluetoothContent()
                HomeTab.SETTINGS -> settingsContent()
            }
        }
    }
}
