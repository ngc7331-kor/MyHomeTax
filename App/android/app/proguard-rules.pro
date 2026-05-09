# Flutter �?HomeWidget 보호 규칙
-keep class com.antigravity.my_home_tax_app.my_home_tax_appWidget { *; }
-keep public class * extends es.antonborri.home_widget.HomeWidgetProvider
-keep public class * extends android.appwidget.AppWidgetProvider

# RemoteViews 관???�래??보호
-keep class android.widget.RemoteViews { *; }
-keep class android.content.Context { *; }
-keep class android.content.Intent { *; }

# Kotlin ?��???보호
-keep class kotlin.jvm.internal.** { *; }
