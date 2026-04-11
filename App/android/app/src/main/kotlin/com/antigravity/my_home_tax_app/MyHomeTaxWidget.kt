package com.antigravity.my_home_tax_app

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.view.View
import android.widget.RemoteViews
import android.util.Log
import java.text.NumberFormat
import java.util.Locale
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.ExistingWorkPolicy
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import java.util.concurrent.TimeUnit

class MyHomeTaxWidget : AppWidgetProvider() {
    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        scheduleWidgetUpdate(context)
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onEnabled(context: Context) {
        scheduleWidgetUpdate(context)
    }

    private fun scheduleWidgetUpdate(context: Context) {
        val workRequest = PeriodicWorkRequestBuilder<UpdateWidgetWorker>(15, TimeUnit.MINUTES).build()
        WorkManager.getInstance(context).enqueueUniquePeriodicWork(
            "UpdateMyHomeTaxWidgetWork",
            ExistingPeriodicWorkPolicy.KEEP,
            workRequest
        )
        
        val oneTimeRequest = OneTimeWorkRequestBuilder<UpdateWidgetWorker>().build()
        WorkManager.getInstance(context).enqueueUniqueWork(
            "UpdateMyHomeTaxWidgetWork_Once",
            ExistingWorkPolicy.KEEP,
            oneTimeRequest
        )
    }

    companion object {
        private const val PREFS_NAME = "FlutterSharedPreferences"
        private const val KEY_IS_LOGGED_IN = "isLoggedIn"
        private const val KEY_USER_ROLE = "userRole"
        private const val KEY_PENDING = "pendingCount"
        private const val KEY_CW_TOTAL = "cwTotalAmount"
        private const val KEY_CW_REFUND = "cwRefundAmount"
        private const val KEY_DK_TOTAL = "dkTotalAmount"
        private const val KEY_DK_REFUND = "dkRefundAmount"
        private const val KEY_UPDATE_TIME = "lastUpdateTime"

        fun updateAppWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
            val sharedPrefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            
            val getSafeBool = { key: String, def: Boolean ->
                val finalKey = if (sharedPrefs.contains("flutter.$key")) "flutter.$key" else key
                sharedPrefs.getBoolean(finalKey, def)
            }

            val getSafeString = { key: String, def: String ->
                val finalKey = if (sharedPrefs.contains("flutter.$key")) "flutter.$key" else key
                sharedPrefs.getString(finalKey, def) ?: def
            }

            val getSafeInt = { key: String, def: Int ->
                val finalKey = if (sharedPrefs.contains("flutter.$key")) "flutter.$key" else key
                var result = def
                if (sharedPrefs.contains(finalKey)) {
                    try { result = sharedPrefs.getInt(finalKey, def) } 
                    catch (e: Exception) {
                        try { result = (sharedPrefs.getString(finalKey, def.toString())?.toDouble()?.toInt()) ?: def } catch (e2: Exception) { }
                    }
                }
                result
            }

            val views = RemoteViews(context.packageName, R.layout.widget_layout)
            views.setInt(R.id.widget_bg, "setImageAlpha", 204)

            try {
                val isLoggedIn = getSafeBool(KEY_IS_LOGGED_IN, false)
                
                if (!isLoggedIn) {
                    views.setViewVisibility(R.id.txt_login_required, View.VISIBLE)
                    views.setViewVisibility(R.id.layout_data_container, View.GONE)
                } else {
                    views.setViewVisibility(R.id.txt_login_required, View.GONE)
                    views.setViewVisibility(R.id.layout_data_container, View.VISIBLE)
                    
                    val userRole = getSafeString(KEY_USER_ROLE, "parent")
                    val pendingCount = getSafeInt(KEY_PENDING, 0)
                    val cwTotal = getSafeString(KEY_CW_TOTAL, "₩ 0")
                    val cwRefund = getSafeString(KEY_CW_REFUND, "환급액: ₩ 0")
                    val dkTotal = getSafeString(KEY_DK_TOTAL, "₩ 0")
                    val dkRefund = getSafeString(KEY_DK_REFUND, "환급액: ₩ 0")
                    val updateTime = getSafeString(KEY_UPDATE_TIME, "--:--")

                    views.setTextViewText(R.id.txt_widget_title, "우리집 세금")
                    views.setTextViewText(R.id.txt_pending_count, pendingCount.toString())
                    views.setViewVisibility(R.id.layout_badge, View.VISIBLE)

                    if (userRole == "parent") {
                        views.setViewVisibility(R.id.txt_badge_label, View.VISIBLE)
                        views.setTextViewText(R.id.txt_badge_label, "승인대기")
                        views.setViewVisibility(R.id.layout_left, View.VISIBLE)
                        views.setViewVisibility(R.id.layout_left_vertical, View.VISIBLE)
                        views.setViewVisibility(R.id.layout_left_horizontal, View.GONE)
                        views.setViewVisibility(R.id.layout_right, View.VISIBLE)
                        views.setViewVisibility(R.id.layout_right_vertical, View.VISIBLE)
                        views.setViewVisibility(R.id.layout_right_horizontal, View.GONE)

                        views.setTextViewText(R.id.txt_left_amount_v, cwTotal)
                        views.setTextViewText(R.id.txt_left_refund_v, cwRefund)
                        views.setTextViewText(R.id.txt_right_amount_v, dkTotal)
                        views.setTextViewText(R.id.txt_right_refund_v, dkRefund)
                    } else {
                        views.setTextViewText(R.id.txt_badge_label, "승인 요청 중")
                        if (userRole == "cw") {
                            views.setViewVisibility(R.id.layout_left, View.VISIBLE)
                            views.setViewVisibility(R.id.layout_left_vertical, View.GONE)
                            views.setViewVisibility(R.id.layout_left_horizontal, View.VISIBLE)
                            views.setViewVisibility(R.id.layout_right, View.GONE)
                            views.setTextViewText(R.id.txt_left_amount_h, cwTotal)
                            views.setTextViewText(R.id.txt_left_refund_h, cwRefund)
                        } else {
                            views.setViewVisibility(R.id.layout_left, View.GONE)
                            views.setViewVisibility(R.id.layout_right, View.VISIBLE)
                            views.setViewVisibility(R.id.layout_right_vertical, View.GONE)
                            views.setViewVisibility(R.id.layout_right_horizontal, View.VISIBLE)
                            views.setTextViewText(R.id.txt_right_amount_h, dkTotal)
                            views.setTextViewText(R.id.txt_right_refund_h, dkRefund)
                        }
                    }
                    views.setTextViewText(R.id.txt_last_updated, "최종 확인: $updateTime")
                }

                val appIntent = Intent(context, MainActivity::class.java)
                val appPendingIntent = PendingIntent.getActivity(
                    context, 0, appIntent, 
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                views.setOnClickPendingIntent(R.id.widget_root, appPendingIntent)
                appWidgetManager.updateAppWidget(appWidgetId, views)
            } catch (e: Exception) {
                Log.e("MyHomeTaxWidget", "Widget Update Error: ${e.message}")
            }
        }
    }
}
