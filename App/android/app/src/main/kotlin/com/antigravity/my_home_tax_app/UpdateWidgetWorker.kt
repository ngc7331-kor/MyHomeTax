package com.antigravity.my_home_tax_app

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.SharedPreferences
import androidx.work.Worker
import androidx.work.WorkerParameters
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import android.util.Log

class UpdateWidgetWorker(context: Context, params: WorkerParameters) : Worker(context, params) {

    private val client = OkHttpClient()

    override fun doWork(): Result {
        try {
            val context = applicationContext
            val prefs = context.getSharedPreferences("HomeWidgetPreferences", Context.MODE_PRIVATE)
            val isLoggedIn = prefs.getBoolean("isLoggedIn", false)
            val userEmail = prefs.getString("userEmail", "") ?: ""
            
            if (!isLoggedIn || userEmail.isEmpty()) return Result.success()

            val proj = "gen-lang-client-0437258233"
            val key = "AIzaSyAltn1UfyietG8WuOPQOWghv0q2jrndFKk"

            // ??녔닼?Fetch Role & Names
            val uUrl = "https://firestore.googleapis.com/v1/projects/" + proj + "/databases/(default)/documents/users/" + userEmail + "?key=" + key
            val uRes = client.newCall(Request.Builder().url(uUrl).build()).execute()
            var userRole = "parent"
            var currentUserId = ""
            if (uRes.isSuccessful) {
                val f = JSONObject(uRes.body?.string() ?: "{}").getJSONObject("fields")
                userRole = f.getJSONObject("role").getString("stringValue")
                currentUserId = if (userRole == "parent") "" else userRole
                prefs.edit().putString("userRole", userRole).apply()
            }

            // Fetch Global Config
            val cUrl = "https://firestore.googleapis.com/v1/projects/" + proj + "/databases/(default)/documents/config/widget?key=" + key
            val cRes = client.newCall(Request.Builder().url(cUrl).build()).execute()
            if (cRes.isSuccessful) {
                val f = JSONObject(cRes.body?.string() ?: "{}").getJSONObject("fields")
                val cwN = f.getJSONObject("cwName").getString("stringValue")
                val dkN = f.getJSONObject("dkName").getString("stringValue")
                prefs.edit().putString("cwName", cwN).putString("dkName", dkN).apply()
            }

            // ?逾?Fetch Approvals (No Masking for robustness)
            val pUrl = "https://firestore.googleapis.com/v1/projects/" + proj + "/databases/(default)/documents/approvals?key=" + key
            val res1 = client.newCall(Request.Builder().url(pUrl).build()).execute()
            
            if (res1.isSuccessful) {
                val body = res1.body?.string() ?: ""
                var pCount = 0
                if (body.contains("documents")) {
                    val json = JSONObject(body)
                    val docs = json.getJSONArray("documents")
                    for (i in 0 until docs.length()) {
                        val f = docs.getJSONObject(i).getJSONObject("fields")
                        if (f.has("status")) {
                            val s = f.getJSONObject("status").getString("stringValue")
                            if (s == "pending") {
                                if (userRole == "parent") {
                                    pCount++
                                } else {
                                    // Robust requester check
                                    val req = if (f.has("requester")) f.getJSONObject("requester").getString("stringValue") 
                                              else if (f.has("name")) f.getJSONObject("name").getString("stringValue")
                                              else ""
                                    if (req == currentUserId) pCount++
                                }
                            }
                        }
                    }
                }
                prefs.edit().putInt("pendingCount", pCount).putString("workerStatus", "active").apply()
            } else {
                prefs.edit().putString("workerStatus", "vacation").apply()
            }

            // Sync taxes
            val uids = arrayOf("cw", "dk")
            for (u in uids) {
                val tUrl = "https://firestore.googleapis.com/v1/projects/" + proj + "/databases/(default)/documents/taxes/" + u + "?key=" + key
                val tRes = client.newCall(Request.Builder().url(tUrl).build()).execute()
                if (tRes.isSuccessful) {
                    val f = JSONObject(tRes.body?.string() ?: "{}").getJSONObject("fields")
                    val total = f.getJSONObject("totalTax").getString("integerValue")
                    val refund = f.getJSONObject("totalRefund").getString("integerValue")
                    prefs.edit().putString(u + "Total", "??" + total).putString(u + "Refund", "??랁닋?? ??" + refund).apply()
                }
            }

            // Fix Time String
            val cal = java.util.Calendar.getInstance()
            val h = cal.get(java.util.Calendar.HOUR_OF_DAY)
            val m = cal.get(java.util.Calendar.MINUTE)
            val timeStr = (if (h < 10) "0" else "") + ":" + (if (m < 10) "0" else "")
            prefs.edit().putString("updateTime", timeStr).apply()

            val manager = AppWidgetManager.getInstance(context)
            val ids = manager.getAppWidgetIds(ComponentName(context, MyHomeTaxWidget::class.java))
            for (id in ids) {
                MyHomeTaxWidget.updateAppWidget(context, manager, id)
            }

            return Result.success()
        } catch (e: Exception) {
            Log.e("Worker", "Error: " + e.message)
            return Result.failure()
        }
    }
}