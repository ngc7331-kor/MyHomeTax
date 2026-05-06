import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:googleapis_auth/auth_io.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:http/http.dart' as http;
import 'package:flutter/services.dart';

class FCMService {
  static final FCMService _instance = FCMService._internal();
  factory FCMService() => _instance;
  FCMService._internal();

  final FirebaseMessaging _fcm = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();

  Future<void> initialize() async {
    if (kIsWeb) return;

    // ?뚮┝ 沅뚰븳 ?붿껌
    await _fcm.requestPermission(alert: true, badge: true, sound: true);

    // 濡쒖뺄 ?뚮┝ 珥덇린??    const androidInit = AndroidInitializationSettings('@mipmap/launcher_icon');
    const iosInit = DarwinInitializationSettings();
    const initSettings = InitializationSettings(android: androidInit, iOS: iosInit);
    await _localNotifications.initialize(settings: initSettings);

    // ?뚮┝ 梨꾨꼸 ?앹꽦
    const channel = AndroidNotificationChannel(
      'myhometax_channel',
      '?곕━吏??멸툑 ?뚮┝',
      description: '?멸툑 ?뱀씤 諛??붿껌 ?뚮┝?낅땲??',
      importance: Importance.max,
    );
    await _localNotifications
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(channel);

    // ?ш렇?쇱슫??硫붿떆吏 由ъ뒪??    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      final notification = message.notification;
      if (notification != null) {
        _localNotifications.show(
          id: notification.hashCode,
          title: notification.title,
          body: notification.body,
          notificationDetails: NotificationDetails(
            android: AndroidNotificationDetails(
              channel.id,
              channel.name,
              channelDescription: channel.description,
              icon: '@mipmap/launcher_icon',
              importance: Importance.max,
              priority: Priority.high,
            ),
          ),
        );
      }
    });
  }

  Future<String?> getToken() async => await _fcm.getToken();

  // ?쒕퉬??怨꾩젙 ?ㅻ? ?듯븳 ?≪꽭???좏겙 ?띾뱷
  Future<String?> _getAccessToken() async {
    try {
      final String jsonString = await rootBundle.loadString('assets/secrets/service-account.json');
      final accountCredentials = ServiceAccountCredentials.fromJson(jsonString);
      final scopes = ['https://www.googleapis.com/auth/firebase.messaging'];
      final authClient = await clientViaServiceAccount(accountCredentials, scopes);
      final token = authClient.credentials.accessToken.data;
      authClient.close();
      return token;
    } catch (e) {
      debugPrint("FCM Access Token Error: $e");
      return null;
    }
  }

  // ?몄떆 硫붿떆吏 諛쒖넚 (MyHomeTax 濡쒖쭅 ?댁떇)
  Future<void> sendPushMessage({
    required String targetRole, 
    required String title, 
    required String body
  }) async {
    try {
      // 1. ?寃??좎? 寃??      final users = await FirebaseFirestore.instance.collection('users').where('role', isEqualTo: targetRole).get();
      if (users.docs.isEmpty) return;

      final targetToken = users.docs.first.data()['fcmToken'];
      if (targetToken == null) return;

      // 2. ?좏겙 諛??꾨줈?앺듃 ID ?띾뱷
      final String jsonString = await rootBundle.loadString('assets/secrets/service-account.json');
      final projectId = jsonDecode(jsonString)['project_id'];
      final accessToken = await _getAccessToken();
      if (accessToken == null || projectId == null) return;

      // 3. 諛쒖넚
      await http.post(
        Uri.parse('https://fcm.googleapis.com/v1/projects/$projectId/messages:send'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $accessToken',
        },
        body: jsonEncode({
          'message': {
            'token': targetToken,
            'notification': {'title': title, 'body': body},
            'android': {
              'notification': {'icon': 'launcher_icon', 'color': '#1F3243'}
            }
          }
        }),
      );
    } catch (e) {
      debugPrint('FCM Send Error: $e');
    }
  }
}
