import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_fonts/google_fonts.dart';
import 'screens/login_screen.dart';
import 'screens/home_screen.dart';
import 'services/widget_sync_service.dart';
import 'services/migration_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // 1. Firebase 珥덇린??(?뱀뿉?쒕뒗 ?듭뀡???놁쓣 寃쎌슦 ?鍮??덉쇅 泥섎━)
  try {
    await Firebase.initializeApp();
  } catch (e) {
    debugPrint("Firebase 珥덇린??嫄대꼫? (Web/Option 誘몃퉬): $e");
  }
  
  // 2. ?꾩젽 諛깃렇?쇱슫???먮룞 ?숆린???쒖옉
  WidgetSyncService().start();
  
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '?곕━吏??멸툑',
      debugShowCheckedModeBanner: false,
      themeMode: ThemeMode.system, // ?쒖뒪???ㅼ젙???곕씪 ?먮룞 ?꾪솚
      
      // ?截??쇱씠???뚮쭏 (MyHomeTax ?ㅽ???
      theme: ThemeData(
        brightness: Brightness.light,
        colorScheme: ColorScheme.fromSeed(
          seedColor: Colors.blueAccent,
          brightness: Brightness.light,
          primary: Colors.blueAccent,
          surface: Colors.white,
        ),
        scaffoldBackgroundColor: const Color(0xFFF9FAFB),
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.transparent,
          elevation: 0,
          toolbarHeight: 0, // SliverAppBar ?ъ슜???꾪빐 ?④?
        ),
        cardColor: Colors.white,
        useMaterial3: true,
        textTheme: GoogleFonts.notoSansKrTextTheme(ThemeData(brightness: Brightness.light).textTheme),
      ),
      
      // ?뙔 ?ㅽ겕 ?뚮쭏 (?몃젴????釉붾（/洹몃젅??
      darkTheme: ThemeData(
        brightness: Brightness.dark,
        colorScheme: ColorScheme.fromSeed(
          seedColor: Colors.blueAccent,
          brightness: Brightness.dark,
          primary: Colors.blueAccent,
          surface: const Color(0xFF1F2937),
        ),
        scaffoldBackgroundColor: const Color(0xFF111827),
        cardColor: const Color(0xFF1F2937),
        useMaterial3: true,
        textTheme: GoogleFonts.notoSansKrTextTheme(ThemeData(brightness: Brightness.dark).textTheme),
      ),
      
      home: StreamBuilder<User?>(
        stream: FirebaseAuth.instance.authStateChanges(),
        builder: (context, authSnapshot) {
          if (authSnapshot.connectionState == ConnectionState.waiting) {
            return const Scaffold(
              body: Center(child: CircularProgressIndicator(color: Colors.blueAccent)),
            );
          }

          if (authSnapshot.hasData) {
            return const HomeScreen();
          }
          return const LoginScreen();
        },
      ),
    );
  }
}
