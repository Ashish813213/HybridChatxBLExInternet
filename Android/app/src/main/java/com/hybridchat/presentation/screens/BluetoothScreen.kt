package com.hybridchat.presentation.screens

import android.annotation.SuppressLint
import android.bluetooth.BluetoothDevice
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
import com.hybridchat.bluetooth.BluetoothSocketManager
import com.hybridchat.presentation.viewmodels.BluetoothViewModel

@SuppressLint("MissingPermission")
@Composable
fun BluetoothScreen(
    viewModel: BluetoothViewModel,
    onBack: () -> Unit = {}
) {
    val foundDevices by viewModel.foundDevices.collectAsState()
    val isScanning by viewModel.isScanning.collectAsState()
    val connectionState by viewModel.connectionState.collectAsState()
    val messages by viewModel.messages.collectAsState()

    var messageText by remember { mutableStateOf("") }

    Column(
        modifier = Modifier.fillMaxSize().padding(16.dp)
    ) {
        Text(
            text = "Bluetooth Chat",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold
        )
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = "Status: ${connectionState.name}",
            style = MaterialTheme.typography.bodyMedium,
            color = when (connectionState) {
                BluetoothSocketManager.ConnectionState.CONNECTED -> MaterialTheme.colorScheme.primary
                BluetoothSocketManager.ConnectionState.LISTENING -> MaterialTheme.colorScheme.tertiary
                else -> MaterialTheme.colorScheme.onSurfaceVariant
            }
        )
        Spacer(modifier = Modifier.height(12.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Button(
                onClick = { viewModel.startScanning() },
                enabled = !isScanning,
                modifier = Modifier.weight(1f)
            ) {
                Text(if (isScanning) "Scanning..." else "Scan")
            }
            OutlinedButton(
                onClick = { viewModel.startServer() },
                modifier = Modifier.weight(1f)
            ) {
                Text("Listen")
            }
        }

        HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))

        if (connectionState == BluetoothSocketManager.ConnectionState.CONNECTED) {
            LazyColumn(
                modifier = Modifier.weight(1f).fillMaxWidth()
            ) {
                items(messages) { msg ->
                    Surface(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 2.dp),
                        shape = MaterialTheme.shapes.small,
                        color = if (msg.startsWith("Me:"))
                            MaterialTheme.colorScheme.primaryContainer
                        else
                            MaterialTheme.colorScheme.surfaceVariant
                    ) {
                        Text(
                            text = msg,
                            modifier = Modifier.padding(8.dp)
                        )
                    }
                }
            }
            Spacer(modifier = Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                OutlinedTextField(
                    value = messageText,
                    onValueChange = { messageText = it },
                    modifier = Modifier.weight(1f),
                    placeholder = { Text("Type message...") },
                    singleLine = true
                )
                Spacer(modifier = Modifier.width(8.dp))
                Button(
                    onClick = {
                        viewModel.sendMessage(messageText)
                        messageText = ""
                    },
                    enabled = messageText.isNotBlank()
                ) {
                    Text("Send")
                }
            }
        } else {
            Text(
                text = "Found Devices",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold
            )
            Spacer(modifier = Modifier.height(8.dp))
            if (foundDevices.isEmpty()) {
                Box(
                    modifier = Modifier.weight(1f).fillMaxWidth(),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = if (isScanning) "Scanning for devices..." else "No devices found",
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            } else {
                LazyColumn(modifier = Modifier.weight(1f).fillMaxWidth()) {
                    items(foundDevices.toList()) { device ->
                        Card(
                            modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)
                                .clickable { viewModel.connectToDevice(device) }
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text(
                                    text = device.name ?: "Unknown",
                                    fontWeight = FontWeight.Medium
                                )
                                Text(
                                    text = device.address,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
