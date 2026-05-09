package com.antigravity.my_home_tax_app

import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import android.util.Log

class MyFirebaseMessagingService : FirebaseMessagingService() {
    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        // 🔔 Push arrived! Even if app is killed, Android wakes us up.
        // We trigger the worker to fetch latest data and update widget.
        Log.d("FCM", "Message received! Updating widget...")
        val workRequest = OneTimeWorkRequestBuilder<UpdateWidgetWorker>().build()
        WorkManager.getInstance(applicationContext).enqueue(workRequest)
    }
}