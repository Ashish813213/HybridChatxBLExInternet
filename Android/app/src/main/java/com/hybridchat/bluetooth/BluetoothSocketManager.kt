package com.hybridchat.bluetooth

import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothServerSocket
import android.bluetooth.BluetoothSocket
import android.util.Log
import java.io.IOException
import java.util.UUID

class BluetoothSocketManager {

    private val bluetoothAdapter: BluetoothAdapter? = BluetoothAdapter.getDefaultAdapter()
    private val APP_NAME = "HybridChat"
    private val MY_UUID: UUID = UUID.randomUUID()
    private val TAG = "BluetoothSocketManager"

    var onStateChange: ((ConnectionState) -> Unit)? = null
    var onMessageReceived: ((String) -> Unit)? = null

    private var acceptThread: AcceptThread? = null
    private var connectThread: ConnectThread? = null
    private var connectedThread: ConnectedThread? = null

    @Volatile
    private var _connectionState = ConnectionState.DISCONNECTED
    val connectionState: ConnectionState get() = _connectionState

    private val _messages = mutableListOf<String>()
    val messages: List<String> get() = _messages.toList()

    enum class ConnectionState {
        DISCONNECTED, CONNECTING, CONNECTED, LISTENING
    }

    fun isBluetoothEnabled(): Boolean = bluetoothAdapter?.isEnabled == true

    @SuppressLint("MissingPermission")
    fun startServer() {
        if (!isBluetoothEnabled()) {
            Log.w(TAG, "BT not enabled, cannot start server")
            return
        }
        stop()
        _connectionState = ConnectionState.LISTENING
        onStateChange?.invoke(_connectionState)
        acceptThread = AcceptThread().apply { start() }
    }

    @SuppressLint("MissingPermission")
    fun connectToDevice(device: BluetoothDevice) {
        if (!isBluetoothEnabled()) {
            Log.w(TAG, "BT not enabled, cannot connect")
            return
        }
        stop()
        _connectionState = ConnectionState.CONNECTING
        onStateChange?.invoke(_connectionState)
        connectThread = ConnectThread(device).apply { start() }
    }

    fun sendMessage(message: String) {
        connectedThread?.write(message.toByteArray())
            ?: Log.w(TAG, "sendMessage: not connected")
    }

    fun stop() {
        acceptThread?.cancel()
        connectThread?.cancel()
        connectedThread?.cancel()
        acceptThread = null
        connectThread = null
        connectedThread = null
        _connectionState = ConnectionState.DISCONNECTED
        onStateChange?.invoke(_connectionState)
    }

    private fun onSocketConnected(socket: BluetoothSocket) {
        _connectionState = ConnectionState.CONNECTED
        onStateChange?.invoke(_connectionState)
        connectedThread?.cancel()
        connectedThread = ConnectedThread(socket).apply { start() }
    }

    private inner class AcceptThread : Thread() {
        private var mmServerSocket: BluetoothServerSocket? = null

        override fun run() {
            mmServerSocket = try {
                bluetoothAdapter?.listenUsingInsecureRfcommWithServiceRecord(APP_NAME, MY_UUID)
            } catch (e: IOException) {
                Log.e(TAG, "Server socket create failed", e)
                _connectionState = ConnectionState.DISCONNECTED
                onStateChange?.invoke(_connectionState)
                return
            }

            try {
                val socket = mmServerSocket?.accept()
                socket?.also {
                    synchronized(this@BluetoothSocketManager) {
                        onSocketConnected(it)
                    }
                }
            } catch (e: IOException) {
                Log.e(TAG, "Accept failed", e)
            } finally {
                try {
                    mmServerSocket?.close()
                } catch (_: IOException) {}
            }
        }

        fun cancel() {
            try {
                mmServerSocket?.close()
            } catch (e: IOException) {
                Log.e(TAG, "Close server socket failed", e)
            }
        }
    }

    private inner class ConnectThread(private val device: BluetoothDevice) : Thread() {
        private var mmSocket: BluetoothSocket? = null

        @SuppressLint("MissingPermission")
        override fun run() {
            bluetoothAdapter?.cancelDiscovery()

            mmSocket = try {
                device.createRfcommSocketToServiceRecord(MY_UUID)
            } catch (e: IOException) {
                Log.e(TAG, "Socket create failed", e)
                _connectionState = ConnectionState.DISCONNECTED
                onStateChange?.invoke(_connectionState)
                return
            }

            try {
                mmSocket?.connect()
                mmSocket?.also {
                    synchronized(this@BluetoothSocketManager) {
                        onSocketConnected(it)
                    }
                }
            } catch (e: IOException) {
                Log.e(TAG, "Connect failed", e)
                try {
                    mmSocket?.close()
                } catch (_: IOException) {}
                _connectionState = ConnectionState.DISCONNECTED
                onStateChange?.invoke(_connectionState)
            }
        }

        fun cancel() {
            try {
                mmSocket?.close()
            } catch (e: IOException) {
                Log.e(TAG, "Close client socket failed", e)
            }
        }
    }

    private inner class ConnectedThread(private val mmSocket: BluetoothSocket) : Thread() {
        private val mmInStream = mmSocket.inputStream
        private val mmOutStream = mmSocket.outputStream
        private val mmBuffer: ByteArray = ByteArray(4096)

        override fun run() {
            while (true) {
                val numBytes = try {
                    mmInStream.read(mmBuffer)
                } catch (e: IOException) {
                    Log.d(TAG, "Disconnected", e)
                    synchronized(this@BluetoothSocketManager) {
                        _connectionState = ConnectionState.DISCONNECTED
                        onStateChange?.invoke(_connectionState)
                    }
                    break
                }
                if (numBytes > 0) {
                    val message = String(mmBuffer, 0, numBytes)
                    synchronized(this@BluetoothSocketManager) {
                        _messages.add(message)
                    }
                    onMessageReceived?.invoke(message)
                }
            }
        }

        fun write(bytes: ByteArray) {
            try {
                mmOutStream.write(bytes)
                synchronized(this@BluetoothSocketManager) {
                    _messages.add("Me: ${String(bytes)}")
                }
            } catch (e: IOException) {
                Log.e(TAG, "Write failed", e)
            }
        }

        fun cancel() {
            try {
                mmSocket.close()
            } catch (e: IOException) {
                Log.e(TAG, "Close socket failed", e)
            }
        }
    }
}
