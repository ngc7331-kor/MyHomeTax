import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'widget_service.dart';

class AuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final GoogleSignIn _googleSignIn = GoogleSignIn(
    serverClientId: '463375642465-k9j7ph76mnqhbremujp8m7g01r8uibiu.apps.googleusercontent.com',
  );

  // 🛡️ 허용된 사용자 이메일 (화이트리스트)
  final List<String> _allowedEmails = [
    'taeoh0311@gmail.com', // 아빠 (나)
    'ngc7331cw@gmail.com', // 채원 1
    'taeoh0317@gmail.com', // 채원 2 (추가)
    'ngc7331dk@gmail.com', // 도권 1
    'taeoh0318@gmail.com', // 도권 2 (추가)
  ];

  // 🚪 구글 로그인
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

      if (user != null) {
        // [Security Check] 3인 화이트리스트 검증
        if (!_allowedEmails.contains(user.email)) {
          await signOut();
          throw FirebaseAuthException(
            code: 'unauthorized-user',
            message: '허용된 사용자가 아닙니다. 가족 전용 계정으로 로그인해주세요.',
          );
        }

        // 역할(Role) 판별 및 저장
        String role = 'parent';
        if (user.email == 'ngc7331cw@gmail.com' || user.email == 'taeoh0317@gmail.com') role = 'cw';
        if (user.email == 'ngc7331dk@gmail.com' || user.email == 'taeoh0318@gmail.com') role = 'dk';

        // Firestore에 사용자 정보 저장 및 동기화
        await FirebaseFirestore.instance.collection('users').doc(user.uid).set({
          'email': user.email,
          'role': role,
          'lastLogin': FieldValue.serverTimestamp(),
        }, SetOptions(merge: true));

        // SharedPreferences에 역할 저장 (위젯용)
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('flutter.userRole', role);
        await prefs.setBool('flutter.isLoggedIn', true);
      }
      
      return user;
    } catch (e) {
      rethrow;
    }
  }

  // 🚪 로그아웃
  Future<void> signOut() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('flutter.isLoggedIn', false);
    await WidgetService.updateLogoutState(); // 위젯에 로그아웃 상태 전송
    await _googleSignIn.signOut();
    await _auth.signOut();
  }

  // 👤 현재 사용자 상태 확인
  User? get currentUser => _auth.currentUser;
  bool get isLoggedIn => currentUser != null && _allowedEmails.contains(currentUser?.email);
  
  String get userRole {
    final email = currentUser?.email;
    if (email == 'taeoh0311@gmail.com') return 'parent';
    if (email == 'ngc7331cw@gmail.com' || email == 'taeoh0317@gmail.com') return 'cw';
    if (email == 'ngc7331dk@gmail.com' || email == 'taeoh0318@gmail.com') return 'dk';
    return 'unknown';
  }
}
