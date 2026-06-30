package com.hybridchat.presentation.navigation

import androidx.compose.runtime.*
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.hybridchat.presentation.screens.*
import com.hybridchat.presentation.screens.auth.LoginScreen
import com.hybridchat.presentation.screens.auth.RegisterScreen
import com.hybridchat.presentation.screens.channel.ChannelListScreen
import com.hybridchat.presentation.screens.chat.ChatListScreen
import com.hybridchat.presentation.screens.chat.ChatScreen
import com.hybridchat.presentation.screens.chat.ChatScreenConfig
import com.hybridchat.presentation.screens.group.GroupListScreen
import com.hybridchat.presentation.screens.home.HomeScreen
import com.hybridchat.presentation.screens.home.HomeTab
import com.hybridchat.presentation.screens.settings.SettingsScreen
import com.hybridchat.presentation.viewmodels.*
import kotlinx.coroutines.launch

object Routes {
    const val LOGIN = "login"
    const val REGISTER = "register"
    const val HOME = "home"
    const val CHAT = "chat/{chatId}/{chatName}/{type}"
    const val GROUP_CHAT = "group_chat/{groupId}/{groupName}"
    const val CHANNEL_CHAT = "channel_chat/{channelId}/{channelName}/{isAdmin}"

    fun chatRoute(chatId: String, chatName: String, type: String) =
        "chat/$chatId/$chatName/$type"

    fun groupChatRoute(groupId: String, groupName: String) =
        "group_chat/$groupId/$groupName"

    fun channelChatRoute(channelId: String, channelName: String, isAdmin: Boolean) =
        "channel_chat/$channelId/$channelName/$isAdmin"
}

@Composable
fun AppNavigation(
    authViewModel: AuthViewModel = viewModel(),
    chatViewModel: ChatViewModel = viewModel(),
    groupViewModel: GroupViewModel = viewModel(),
    channelViewModel: ChannelViewModel = viewModel(),
    bluetoothViewModel: BluetoothViewModel = viewModel()
) {
    val navController = rememberNavController()
    val authState by authViewModel.uiState.collectAsState()
    val chatState by chatViewModel.uiState.collectAsState()
    val groupState by groupViewModel.uiState.collectAsState()
    val channelState by channelViewModel.uiState.collectAsState()

    val currentUserId = authState.userId
    val isLoggedIn = authState.isLoggedIn

    val socketManager = remember { com.hybridchat.data.remote.SocketManager() }

    LaunchedEffect(isLoggedIn) {
        if (isLoggedIn) {
            val token = authViewModel.tokenManager.accessToken
            if (token != null) {
                socketManager.connect(token)
            }
        } else {
            socketManager.disconnect()
        }
    }

    LaunchedEffect(Unit) {
        launch {
            for (message in socketManager.newMessages) {
                chatViewModel.addMessage(message)
            }
        }
        launch {
            for (event in socketManager.reactionEvents) {
                // Handle channel reactions if needed
            }
        }
    }

    NavHost(
        navController = navController,
        startDestination = if (isLoggedIn) Routes.HOME else Routes.LOGIN
    ) {
        composable(Routes.LOGIN) {
            LoginScreen(
                isLoading = authState.isLoading,
                error = authState.error,
                onLogin = { email, password ->
                    authViewModel.login(email, password)
                },
                onNavigateToRegister = {
                    navController.navigate(Routes.REGISTER)
                },
                onClearError = { authViewModel.clearError() }
            )

            LaunchedEffect(authState.isLoggedIn) {
                if (authState.isLoggedIn) {
                    navController.navigate(Routes.HOME) {
                        popUpTo(Routes.LOGIN) { inclusive = true }
                    }
                }
            }
        }

        composable(Routes.REGISTER) {
            RegisterScreen(
                isLoading = authState.isLoading,
                error = authState.error,
                onRegister = { username, email, password ->
                    authViewModel.register(username, email, password)
                },
                onNavigateToLogin = {
                    navController.popBackStack()
                },
                onClearError = { authViewModel.clearError() }
            )

            LaunchedEffect(authState.isLoggedIn) {
                if (authState.isLoggedIn) {
                    navController.navigate(Routes.HOME) {
                        popUpTo(Routes.REGISTER) { inclusive = true }
                    }
                }
            }
        }

        composable(Routes.HOME) {
            var currentTab by remember { mutableStateOf(HomeTab.CHATS) }
            HomeScreen(
                currentTab = currentTab,
                onTabChange = { currentTab = it },
                chatsContent = {
                    ChatListScreen(
                        conversations = chatState.conversations,
                        searchResults = chatState.searchResults,
                        isSearching = chatState.isSearching,
                        isLoading = chatState.isLoading,
                        onSearchQuery = { chatViewModel.searchUsers(it) },
                        onSelectConversation = { conv ->
                            navController.navigate(
                                Routes.chatRoute(conv.id, conv.username, "chat")
                            )
                        },
                        onSelectUser = { user ->
                            navController.navigate(
                                Routes.chatRoute(user.id, user.username, "chat")
                            )
                        }
                    )
                    LaunchedEffect(Unit) { chatViewModel.loadConversations() }
                },
                groupsContent = {
                    GroupListScreen(
                        groups = groupState.groups,
                        isLoading = groupState.isLoading,
                        onCreateGroup = { name -> groupViewModel.createGroup(name) },
                        onJoinGroup = { code -> groupViewModel.joinGroup(code) },
                        onSelectGroup = { group ->
                            socketManager.joinGroup(group.id)
                            navController.navigate(
                                Routes.groupChatRoute(group.id, group.name)
                            )
                        }
                    )
                    LaunchedEffect(Unit) { groupViewModel.loadGroups() }
                },
                channelsContent = {
                    ChannelListScreen(
                        channels = channelState.channels,
                        isLoading = channelState.isLoading,
                        onCreateChannel = { name -> channelViewModel.createChannel(name) },
                        onSubscribeChannel = { id ->
                            channelViewModel.subscribeChannel(id)
                            socketManager.joinChannel(id)
                        },
                        onSelectChannel = { channel ->
                            socketManager.joinChannel(channel.id)
                            val isAdmin = channel.adminId == currentUserId
                            navController.navigate(
                                Routes.channelChatRoute(channel.id, channel.name, isAdmin)
                            )
                        }
                    )
                    LaunchedEffect(Unit) { channelViewModel.loadChannels() }
                },
                bluetoothContent = {
                    BluetoothScreen(viewModel = bluetoothViewModel)
                },
                settingsContent = {
                    SettingsScreen(
                        username = authViewModel.tokenManager.username ?: "",
                        email = authViewModel.tokenManager.email ?: "",
                        onLogout = {
                            authViewModel.logout()
                            navController.navigate(Routes.LOGIN) {
                                popUpTo(Routes.HOME) { inclusive = true }
                            }
                        }
                    )
                }
            )
        }

        composable(
            route = Routes.CHAT,
            arguments = listOf(
                navArgument("chatId") { type = NavType.StringType },
                navArgument("chatName") { type = NavType.StringType },
                navArgument("type") { type = NavType.StringType }
            )
        ) { backStackEntry ->
            val chatId = backStackEntry.arguments?.getString("chatId") ?: ""
            val chatName = backStackEntry.arguments?.getString("chatName") ?: ""
            ChatScreen(
                config = ChatScreenConfig(chatId = chatId, chatName = chatName),
                messages = chatState.messages,
                currentUserId = currentUserId,
                onBack = { navController.popBackStack() },
                onSendMessage = { content ->
                    chatViewModel.sendMessage(receiverId = chatId, content = content)
                },
                onSendImage = { uri ->
                    chatViewModel.uploadAndSendImage(uri, chatId)
                }
            )
            LaunchedEffect(chatId) {
                chatViewModel.loadMessages(chatId, currentUserId)
            }
        }

        composable(
            route = Routes.GROUP_CHAT,
            arguments = listOf(
                navArgument("groupId") { type = NavType.StringType },
                navArgument("groupName") { type = NavType.StringType }
            )
        ) { backStackEntry ->
            val groupId = backStackEntry.arguments?.getString("groupId") ?: ""
            val groupName = backStackEntry.arguments?.getString("groupName") ?: ""
            ChatScreen(
                config = ChatScreenConfig(chatId = groupId, chatName = groupName, isGroup = true),
                messages = groupState.messages,
                currentUserId = currentUserId,
                onBack = {
                    socketManager.leaveGroup(groupId)
                    navController.popBackStack()
                },
                onSendMessage = { content ->
                    chatViewModel.sendMessage(groupId = groupId, content = content)
                    groupViewModel.loadGroupMessages(groupId)
                },
                onSendImage = { }
            )
            LaunchedEffect(groupId) {
                groupViewModel.loadGroupMessages(groupId)
            }
        }

        composable(
            route = Routes.CHANNEL_CHAT,
            arguments = listOf(
                navArgument("channelId") { type = NavType.StringType },
                navArgument("channelName") { type = NavType.StringType },
                navArgument("isAdmin") { type = NavType.BoolType }
            )
        ) { backStackEntry ->
            val channelId = backStackEntry.arguments?.getString("channelId") ?: ""
            val channelName = backStackEntry.arguments?.getString("channelName") ?: ""
            val isAdmin = backStackEntry.arguments?.getBoolean("isAdmin") ?: false
            ChatScreen(
                config = ChatScreenConfig(
                    chatId = channelId,
                    chatName = channelName,
                    isChannel = true,
                    isChannelAdmin = isAdmin
                ),
                messages = channelState.messages,
                currentUserId = currentUserId,
                onBack = {
                    socketManager.leaveChannel(channelId)
                    navController.popBackStack()
                },
                onSendMessage = { content ->
                    if (isAdmin) {
                        chatViewModel.sendMessage(channelId = channelId, content = content)
                    }
                },
                onSendImage = { },
                onReactToMessage = { messageId, type ->
                    channelViewModel.reactToMessage(channelId, messageId, type)
                }
            )
            LaunchedEffect(channelId) {
                channelViewModel.loadChannelMessages(channelId)
            }
        }
    }
}
