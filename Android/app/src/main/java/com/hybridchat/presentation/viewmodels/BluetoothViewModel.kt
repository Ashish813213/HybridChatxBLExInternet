package com.hybridchat.presentation.viewmodels

import android.app.Application
import android.bluetooth.BluetoothDevice
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.hybridchat.bluetooth.BluetoothScanner
import com.hybridchat.bluetooth.BluetoothSocketManager
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class BluetoothViewModel(application: Application) : AndroidViewModel(application) {

    private val scanner = BluetoothScanner(application)
    private val socketManager = BluetoothSocketManager()

    val foundDevices: StateFlow<Set<BluetoothDevice>> = scanner.foundDevices
    val isScanning: StateFlow<Boolean> = scanner.isScanning

    private val _connectionState = MutableStateFlow(BluetoothSocketManager.ConnectionState.DISCONNECTED)
    val connectionState: StateFlow<BluetoothSocketManager.ConnectionState> = _connectionState.asStateFlow()

    private val _messages = MutableStateFlow<List<String>>(emptyList())
    val messages: StateFlow<List<String>> = _messages.asStateFlow()

    init {
        socketManager.onStateChange = { state ->
            _connectionState.value = state
        }
        socketManager.onMessageReceived = { msg ->
            _messages.value = _messages.value + msg
        }
    }

    fun isBluetoothEnabled(): Boolean = scanner.isBluetoothEnabled()

    fun startScanning() {
        scanner.startDiscovery()
    }

    fun stopScanning() {
        scanner.stopDiscovery()
    }

    fun connectToDevice(device: BluetoothDevice) {
        socketManager.connectToDevice(device)
    }

    fun startServer() {
        socketManager.startServer()
    }

    fun sendMessage(message: String) {
        socketManager.sendMessage(message)
    }

    override fun onCleared() {
        super.onCleared()
        scanner.unregisterReceiver()
        socketManager.stop()
    }
}
