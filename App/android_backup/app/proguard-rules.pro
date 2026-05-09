# Flutter Proguard Rules
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.** { *; }
-keep class io.flutter.util.** { *; }
-keep class io.flutter.view.** { *; }
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }

# SharedPreferences and HomeWidget preservation
-keep class com.antigravity.my_home_tax_app.** { *; }
-keep class androidx.work.** { *; }
-keep class android.appwidget.** { *; }
-keep class android.content.SharedPreferences { *; }
-keep class com.google.firebase.** { *; }

# Fix R8 compilation errors (Missing classes)
-dontwarn com.google.android.play.core.**
-dontwarn io.flutter.embedding.engine.deferredcomponents.**
-dontwarn javax.annotation.**
-dontwarn org.checkerframework.**
-dontwarn com.google.errorprone.annotations.**
