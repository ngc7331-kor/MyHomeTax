package com.antigravity.my_home_tax_app

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import androidx.work.Worker
import androidx.work.WorkerParameters
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject

class UpdateWidgetWorker(context: Context, params: WorkerParameters) : Worker(context, params) {

    private val client = OkHttpClient()

    private val APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxCGe5hz8sH4AEfUWjT_-IjDpDBbmVgdqKvm9jWhLm5ZiToO6L3-MFf28TL2K-6MXKh/exec"
    private val API_KEY = "taeoh0311@gmail.com" // User's email as API key

    override fun doWork(): Result {
        return try {
            // [Security Check] 로그아웃 상태이면 백그라운드 API 호출 차단
            val prefs = applicationContext.getSharedPreferences("com.antigravity.my_home_tax_app_preferences", Context.MODE_PRIVATE)
            
            // 구버전 키(isLoggedIn) 삭제 (충돌 방지)
            if (prefs.contains("isLoggedIn")) {
                prefs.edit().remove("isLoggedIn").apply()
            }

            // flutter. 접두어와 일반 키 모두 체크 (HomeWidget 호환성)
            val isLoggedIn = prefs.getBoolean("flutter.isLoggedIn", false) || prefs.getBoolean("isLoggedIn", false)
            if (!isLoggedIn) {
                android.util.Log.d("UpdateWidgetWorker", "Logged Out: Skipping API Call")
                return Result.failure()
            }

            val url = "$APPS_SCRIPT_URL?mode=api&key=$API_KEY"
            val request = Request.Builder().url(url).build()

            val response = client.newCall(request).execute()
            if (!response.isSuccessful) {
                return Result.retry() 
            }

            val responseBody = response.body?.string() ?: return Result.failure()
            val json = JSONObject(responseBody)

            if (json.has("error")) {
                return Result.failure()
            }

            val cwTotal = json.optLong("cwTotal", 0)
            val dkTotal = json.optLong("dkTotal", 0)
            val cwRefund = json.optLong("cwRefund", 0)
            val dkRefund = json.optLong("dkRefund", 0)
            val pendingCount = json.optInt("pendingCount", 0)
            // LToBank doesn't have isLoggedIn in Worker response usually, but we assume true for widget if data fetches successfully 
            // actually we can ignore isLoggedIn for now and just write the data because the worker only runs if they authorized the widget
            
            // Save to SharedPreferences securely for Flutter sync (using flutter. prefix)
            val sharedPrefs = applicationContext.getSharedPreferences("com.antigravity.my_home_tax_app_preferences", Context.MODE_PRIVATE)
            sharedPrefs.edit().apply {
                putLong("flutter.cwTotal", cwTotal)
                putLong("flutter.dkTotal", dkTotal)
                putLong("flutter.cwRefund", cwRefund)
                putLong("flutter.dkRefund", dkRefund)
                putInt("flutter.pendingCount", pendingCount)
                putLong("flutter.lastUpdated", json.optLong("updatedAt", System.currentTimeMillis()))
                apply()
            }

            // Trigger Widget Update
            val appWidgetManager = AppWidgetManager.getInstance(applicationContext)
            val componentName = ComponentName(applicationContext, MyHomeTaxWidget::class.java)
            val appWidgetIds = appWidgetManager.getAppWidgetIds(componentName)

            for (id in appWidgetIds) {
                MyHomeTaxWidget.updateAppWidget(applicationContext, appWidgetManager, id)
            }

            Result.success()

        } catch (e: Exception) {
            e.printStackTrace()
            Result.failure()
        }
    }
}
