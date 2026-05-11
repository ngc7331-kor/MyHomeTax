package com.antigravity

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.view.View
import android.widget.RemoteViews
import android.util.Log

class MyHomeTaxWidget : AppWidgetProvider() {
    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    companion object {
        fun updateAppWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
            val views = RemoteViews(context.packageName, R.layout.widget_layout)
            views.setInt(R.id.widget_bg, "setImageAlpha", 204)

            try {
                val prefs = context.getSharedPreferences("HomeWidgetPreferences", Context.MODE_PRIVATE)
                val isLoggedIn = prefs.getBoolean("isLoggedIn", false)
                val userRole = prefs.getString("userRole", "") ?: ""
                val workerStatus = prefs.getString("workerStatus", "active")

                if (!isLoggedIn || userRole.isEmpty()) {
                    views.setViewVisibility(R.id.txt_login_required, View.VISIBLE)
                    views.setViewVisibility(R.id.layout_data_container, View.GONE)
                } else {
                    views.setViewVisibility(R.id.txt_login_required, View.GONE)
                    views.setViewVisibility(R.id.layout_data_container, View.VISIBLE)
                    
                    val pendingCount = prefs.getInt("pendingCount", 0)
                    val cwTotal = prefs.getString("cwTotal", "₩ 0") ?: "₩ 0"
                    val cwRefund = prefs.getString("cwRefund", "환급액: ₩ 0") ?: "환급액: ₩ 0"
                    val dkTotal = prefs.getString("dkTotal", "₩ 0") ?: "₩ 0"
                    val dkRefund = prefs.getString("dkRefund", "환급액: ₩ 0") ?: "환급액: ₩ 0"
                    val updateTime = prefs.getString("updateTime", "--:--") ?: "--:--"
                    
                    val cwName = prefs.getString("cwName", "자녀1") ?: "자녀1"
                    val dkName = prefs.getString("dkName", "자녀2") ?: "자녀2"

                    views.setTextViewText(R.id.txt_widget_title, "우리집 세금")
                    
                    if (workerStatus == "vacation") {
                        views.setViewVisibility(R.id.layout_badge, View.VISIBLE)
                        views.setTextViewText(R.id.txt_badge_label, "자동 비서 휴가 중 🏖️")
                        views.setTextViewText(R.id.txt_pending_count, "")
                    } else if (pendingCount > 0) {
                        views.setViewVisibility(R.id.layout_badge, View.VISIBLE)
                        views.setTextViewText(R.id.txt_pending_count, pendingCount.toString() + "건")
                        if (userRole == "parent") {
                            views.setTextViewText(R.id.txt_badge_label, "승인 대기: ")
                        } else {
                            views.setTextViewText(R.id.txt_badge_label, "승인 요청중: ")
                        }
                    } else {
                        views.setViewVisibility(R.id.layout_badge, View.GONE)
                    }

                    if (userRole == "parent") {
                        views.setViewVisibility(R.id.layout_left, View.VISIBLE)
                        views.setTextViewText(R.id.txt_left_name, cwName)
                        views.setViewVisibility(R.id.txt_left_name, View.VISIBLE)
                        views.setViewVisibility(R.id.layout_left_vertical, View.VISIBLE)
                        views.setViewVisibility(R.id.layout_left_vertical_child, View.GONE)
                        
                        views.setViewVisibility(R.id.layout_right, View.VISIBLE)
                        views.setTextViewText(R.id.txt_right_name, dkName)
                        views.setViewVisibility(R.id.txt_right_name, View.VISIBLE)
                        views.setViewVisibility(R.id.layout_right_vertical, View.VISIBLE)
                        views.setViewVisibility(R.id.layout_right_vertical_child, View.GONE)

                        views.setTextViewText(R.id.txt_left_amount_v, cwTotal)
                        views.setTextViewText(R.id.txt_left_refund_v, cwRefund)
                        views.setTextViewText(R.id.txt_right_amount_v, dkTotal)
                        views.setTextViewText(R.id.txt_right_refund_v, dkRefund)
                    } else {
                        if (userRole == "cw") {
                            views.setViewVisibility(R.id.layout_left, View.VISIBLE)
                            views.setViewVisibility(R.id.txt_left_name, View.GONE) 
                            views.setViewVisibility(R.id.layout_left_vertical, View.GONE)
                            views.setViewVisibility(R.id.layout_left_vertical_child, View.VISIBLE) 
                            views.setViewVisibility(R.id.layout_right, View.GONE)
                            views.setTextViewText(R.id.txt_left_amount_c, "세금액: " + cwTotal)
                            views.setTextViewText(R.id.txt_left_refund_c, cwRefund.replace("환급액: ", "이자: "))
                        } else {
                            views.setViewVisibility(R.id.layout_left, View.GONE)
                            views.setViewVisibility(R.id.layout_right, View.VISIBLE)
                            views.setViewVisibility(R.id.txt_right_name, View.GONE)
                            views.setViewVisibility(R.id.layout_right_vertical, View.GONE)
                            views.setViewVisibility(R.id.layout_right_vertical_child, View.VISIBLE)
                            views.setTextViewText(R.id.txt_right_amount_c, "세금액: " + dkTotal)
                            views.setTextViewText(R.id.txt_right_refund_c, dkRefund.replace("환급액: ", "이자: "))
                        }
                    }
                    views.setTextViewText(R.id.txt_last_updated, "최종 확인: " + updateTime)
                }

                val intent = Intent(context, MainActivity::class.java).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                }
                val pendingIntent = PendingIntent.getActivity(
                    context, 0, intent, 
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                views.setOnClickPendingIntent(R.id.widget_root, pendingIntent)
                appWidgetManager.updateAppWidget(appWidgetId, views)
            } catch (e: Exception) {
                Log.e("MyHomeTaxWidget", "Error: " + e.message)
            }
        }
    }
}