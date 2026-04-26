package com.antigravity.my_home_tax_app

import android.app.Activity
import android.appwidget.AppWidgetManager
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.SeekBar
import android.widget.TextView

import androidx.annotation.Keep

@Keep
class WidgetConfigActivity : Activity() {

    private var appWidgetId = AppWidgetManager.INVALID_APPWIDGET_ID
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // 1. Set Result CANCELED explicitly (in case user backs out)
        setResult(RESULT_CANCELED)
        
        // 2. Get App Widget ID from Intent
        val intent = intent
        val extras = intent.extras
        if (extras != null) {
            appWidgetId = extras.getInt(
                AppWidgetManager.EXTRA_APPWIDGET_ID,
                AppWidgetManager.INVALID_APPWIDGET_ID
            )
        }
        
        // If invalid ID, finish
        if (appWidgetId == AppWidgetManager.INVALID_APPWIDGET_ID) {
            finish()
            return
        }
        
        setContentView(R.layout.activity_widget_config)
        
        val seekBar = findViewById<SeekBar>(R.id.seekbar_transparency)
        val valueText = findViewById<TextView>(R.id.tv_transparency_value)
        val btnSave = findViewById<Button>(R.id.btn_save_config)
        
        // Load existing preference if any (default 70%)
        val prefs = getSharedPreferences("com.antigravity.my_home_tax_app.widget_preds", Context.MODE_PRIVATE)
        val currentAlphaPercent = prefs.getInt("alpha_percent_$appWidgetId", 70)
        
        seekBar.progress = currentAlphaPercent
        valueText.text = "배경 투명도: $currentAlphaPercent%"
        
        // Seekbar Listener
        seekBar.setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(seekBar: SeekBar?, progress: Int, fromUser: Boolean) {
                valueText.text = "배경 투명도: $progress%"
            }
            override fun onStartTrackingTouch(seekBar: SeekBar?) {}
            override fun onStopTrackingTouch(seekBar: SeekBar?) {}
        })
        
        // Save Button Listener
        btnSave.setOnClickListener {
            val context = this@WidgetConfigActivity
            val alphaPercent = seekBar.progress
            
            // Save to Prefs
            val editor = prefs.edit()
            editor.putInt("alpha_percent_$appWidgetId", alphaPercent)
            editor.apply()
            
            // Force Widget Update
            val appWidgetManager = AppWidgetManager.getInstance(context)
            MyHomeTaxWidget.updateAppWidget(context, appWidgetManager, appWidgetId)
            
            // Return OK
            val resultValue = Intent()
            resultValue.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
            setResult(RESULT_OK, resultValue)
            finish()
        }
    }
}
