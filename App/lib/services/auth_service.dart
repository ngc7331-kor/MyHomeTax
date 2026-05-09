import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:home_widget/home_widget.dart';
import 'widget_service.dart';

class AuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final GoogleSignIn _googleSignIn = GoogleSignIn(
    serverClientId: '463375642465-k9j7ph76mnqhbremujp8m7g01r8uibiu.apps.googleusercontent.com',
  );

  Future<User?> signInWithGoogle() async {
    try {
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
      if (googleUser == null) return null;

      final GoogleSignInAuthentication googleAuth = await googleUser.authentication;
      final AuthCredential credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );

      final UserCredential userCredential = await _auth.signInWithCredential(credential);
      final user = userCredential.user;

      if (user != null && user.email != null) {
        final userDoc = await FirebaseFirestore.instance.collection('users').doc(user.email).get();
        
        if (!userDoc.exists) {
          await signOut();
          throw FirebaseAuthException(
            code: 'unauthorized-user',
            message: '허용된 사용자가 아닙니다. 가족 전용 계정으로 로그인해주세요.',
          );
        }

        final data = userDoc.data()!;
        final String role = data['role'] ?? 'unknown';

        // 🛡️ Save to HomeWidget storage (for Kotlin widget)
        await HomeWidget.saveWidgetData('isLoggedIn', true);
        await HomeWidget.saveWidgetData('userRole', role);
        await HomeWidget.saveWidgetData('userEmail', user.email!);
        await HomeWidget.updateWidget(name: 'MyHomeTaxWidget');

        // Also save to default SharedPreferences
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('flutter.userRole', role);
        await prefs.setString('flutter.userEmail', user.email!);
        await prefs.setBool('flutter.isLoggedIn', true);
      }
      
      return user;
    } catch (e) {
      rethrow;
    }
  }

  Future<void> signOut() async {
    await HomeWidget.saveWidgetData('isLoggedIn', false);
    await HomeWidget.updateWidget(name: 'MyHomeTaxWidget');
    
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('flutter.isLoggedIn', false);
    
    await _googleSignIn.signOut();
    await _auth.signOut();
  }

  User? get currentUser => _auth.currentUser;
  bool get isLoggedIn => currentUser != null;
}