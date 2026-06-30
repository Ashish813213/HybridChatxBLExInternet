package com.hybridchat.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val DarkColorScheme = darkColorScheme(
    primary = BluetoothActive,
    secondary = Accent,
    tertiary = BackgroundSecondary,
    background = TextHeader,
    surface = TextHeader,
    onPrimary = TextHeader,
    onSecondary = TextHeader,
    onBackground = BackgroundMain,
    onSurface = BackgroundMain
)

private val LightColorScheme = lightColorScheme(
    primary = BluetoothActive,
    secondary = Accent,
    tertiary = BackgroundSecondary,
    background = BackgroundMain,
    surface = BackgroundCard,
    onPrimary = TextHeader,
    onSecondary = TextHeader,
    onBackground = TextHeader,
    onSurface = TextHeader
)

@Composable
fun HybridChatTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
