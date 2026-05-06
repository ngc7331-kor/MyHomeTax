import 'package:firebase_core/firebase_core.dart';
import 'package:my_home_tax_app/services/migration_service.dart';
import 'package:flutter/widgets.dart';

void main() async {
  // Dart CLI 환경에서 Firebase 인잇 시도
  WidgetsFlutterBinding.ensureInitialized();
  try {
    await Firebase.initializeApp();
    await MigrationService.runMigration();
    print("🚀 CLI Migration Finish!");
  } catch (e) {
    print("❌ Migration Error: $e");
  }
}
