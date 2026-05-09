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
        private const val KEY_CW_TOTAL = "cwTotal"
        private const val KEY_CW_REFUND = "cwRefund"
        private const val KEY_DK_TOTAL = "dkTotal"
        private const val KEY_DK_REFUND = "dkRefund"
        private const val KEY_UPDATE_TIME = "updateTime"

        fun updateAppWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
            // HomeWidget? 湲곕낯?곸쑝濡?'HomeWidgetPreferences'瑜??ъ슜?섎?濡?理쒖슦???쒖쐞濡??ㅼ젙
            val prefsFiles = arrayOf("HomeWidgetPreferences", "com.antigravity.my_home_tax_app_preferences", "FlutterSharedPreferences")
            var finalSharedPrefs: SharedPreferences? = null
            
            for (fileName in prefsFiles) {
                val sp = context.getSharedPreferences(fileName, Context.MODE_PRIVATE)
                // isLoggedIn ?먮뒗 flutter.isLoggedIn 以??섎굹?쇰룄 ?덉쑝硫??대떦 ?뚯씪???ъ슜
                if (sp.contains("flutter.$KEY_IS_LOGGED_IN") || sp.contains(KEY_IS_LOGGED_IN)) {
                    finalSharedPrefs = sp
                    if (fileName == "HomeWidgetPreferences") break // 理쒖슦???쒖쐞 ?뚯씪?대㈃ 利됱떆 以묐떒
                }
            }
            
            val sharedPrefs = finalSharedPrefs ?: context.getSharedPreferences(prefsFiles[0], Context.MODE_PRIVATE)
            
            val getSafeBool = { key: String, def: Boolean ->
                val finalKey = if (sharedPrefs.contains("flutter.$key")) "flutter.$key" else key
                var result = def
                if (sharedPrefs.contains(finalKey)) {
                    try { result = sharedPrefs.getBoolean(finalKey, def) } 
                    catch (e: Exception) {
                        try { 
                            val strVal = sharedPrefs.getString(finalKey, def.toString())
                            result = strVal?.toBoolean() ?: (strVal == "true") 
                        } catch (e2: Exception) { }
                    }
                }
                result
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
                // ?뵍 濡쒓렇???곹깭 臾닿껐??媛뺥솕 (v34: MyHomeTax ?ㅽ???
                val isLoggedIn = getSafeBool(KEY_IS_LOGGED_IN, false)
                val userRole = getSafeString(KEY_USER_ROLE, "")

                if (!isLoggedIn || userRole.isEmpty()) {
                    views.setViewVisibility(R.id.txt_login_required, View.VISIBLE)
                    views.setViewVisibility(R.id.layout_data_container, View.GONE)
                } else {
                    views.setViewVisibility(R.id.txt_login_required, View.GONE)
                    views.setViewVisibility(R.id.layout_data_container, View.VISIBLE)
                    
                    val pendingCount = getSafeInt(KEY_PENDING, 0)
                    val cwTotal = getSafeString(KEY_CW_TOTAL, "??0")
                    val cwRefund = getSafeString(KEY_CW_REFUND, "?섍툒?? ??0")
                    val dkTotal = getSafeString(KEY_DK_TOTAL, "??0")
                    val dkRefund = getSafeString(KEY_DK_REFUND, "?섍툒?? ??0")
                    val updateTime = getSafeString(KEY_UPDATE_TIME, "--:--")

                    views.setTextViewText(R.id.txt_widget_title, "?곕━吏??멸툑")
                    views.setTextViewText(R.id.txt_pending_count, pendingCount.toString())
                    views.setViewVisibility(R.id.layout_badge, if (pendingCount > 0) View.VISIBLE else View.GONE)

                    if (userRole == "parent") {
                        views.setTextViewText(R.id.txt_badge_label, "?뱀씤?湲?)
                        views.setViewVisibility(R.id.layout_left, View.VISIBLE)
                        views.setViewVisibility(R.id.txt_left_name, View.VISIBLE)
                        views.setViewVisibility(R.id.layout_left_vertical, View.VISIBLE)
                        views.setViewVisibility(R.id.layout_left_vertical_child, View.GONE)
                        
                        views.setViewVisibility(R.id.layout_right, View.VISIBLE)
                        views.setViewVisibility(R.id.txt_right_name, View.VISIBLE)
                        views.setViewVisibility(R.id.layout_right_vertical, View.VISIBLE)
                        views.setViewVisibility(R.id.layout_right_vertical_child, View.GONE)

                        views.setTextViewText(R.id.txt_left_amount_v, cwTotal)
                        views.setTextViewText(R.id.txt_left_refund_v, cwRefund)
                        views.setTextViewText(R.id.txt_right_amount_v, dkTotal)
                        views.setTextViewText(R.id.txt_right_refund_v, dkRefund)
                    } else {
                        // ?쭜 ?먮? 怨꾩젙 ?덉씠?꾩썐 (v34: ?대쫫 ?④린湲?諛??섏쭅 諛섏쓳??諛곗튂)
                        views.setTextViewText(R.id.txt_badge_label, "?뱀씤 ?붿껌 以?)
                        val cleanAmt = { amt: String -> amt.replace("?섍툒?? ", "") }

                        if (userRole == "cw") {
                            views.setViewVisibility(R.id.layout_left, View.VISIBLE)
                            views.setViewVisibility(R.id.txt_left_name, View.GONE) // ?대쫫 ?④린湲?                            views.setViewVisibility(R.id.layout_left_vertical, View.GONE)
                            views.setViewVisibility(R.id.layout_left_vertical_child, View.VISIBLE) // ?섏쭅 諛곗튂 ?쒖꽦??                            views.setViewVisibility(R.id.layout_right, View.GONE)
                            
                            views.setTextViewText(R.id.txt_left_amount_c, cwTotal)
                            views.setTextViewText(R.id.txt_left_refund_c, cleanAmt(cwRefund))
                        } else {
                            views.setViewVisibility(R.id.layout_left, View.GONE)
                            views.setViewVisibility(R.id.layout_right, View.VISIBLE)
                            views.setViewVisibility(R.id.txt_right_name, View.GONE) // ?대쫫 ?④린湲?                            views.setViewVisibility(R.id.layout_right_vertical, View.GONE)
                            views.setViewVisibility(R.id.layout_right_vertical_child, View.VISIBLE) // ?섏쭅 諛곗튂 ?쒖꽦??                            
                            views.setTextViewText(R.id.txt_right_amount_c, dkTotal)
                            views.setTextViewText(R.id.txt_right_refund_c, cleanAmt(dkRefund))
                        }
                    }
                    views.setTextViewText(R.id.txt_last_updated, "理쒖쥌 ?뺤씤: $updateTime")
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
