import 'package:firebase_auth/firebase_auth.dart';
import 'database_service.dart';
import 'widget_service.dart';
import 'dart:async';

class WidgetSyncService {
  static final WidgetSyncService _instance = WidgetSyncService._internal();
  factory WidgetSyncService() => _instance;
  WidgetSyncService._internal();

  final _db = DatabaseService();
  StreamSubscription? _cwSub;
  StreamSubscription? _dkSub;
  StreamSubscription? _pendingSub;

  String _cwTotal = "₩ 0";
  String _cwRefund = "환급액: ₩ 0";
  String _dkTotal = "₩ 0";
  String _dkRefund = "환급액: ₩ 0";
  int _pendingCount = 0;

  bool _isInitialized = false;

  void start() {
    if (_isInitialized) return;
    _isInitialized = true;

    // 즉각적인 현재 상태 체크 (비동기 리스너 이전 대처)
    if (FirebaseAuth.instance.currentUser == null) {
      WidgetService.updateLogoutState();
    }

    FirebaseAuth.instance.authStateChanges().listen((user) {
      if (user == null) {
        _stopSyncing();
        WidgetService.updateLogoutState();
      } else {
        _startSyncing();
        _updateWidget();
      }
    });
  }

  void _startSyncing() {
    _cwSub?.cancel();
    _dkSub?.cancel();
    _pendingSub?.cancel();

    // '우리집 세금' DatabaseService 규격에 맞게 메서드명 및 필드명 수정
    _cwSub = _db.getTaxData('cw').listen((data) {
      _cwTotal = _formatNum(data.totalTax);
      _cwRefund = "환급액: ${_formatNum(data.totalRefund)}";
      _updateWidget();
    });

    _dkSub = _db.getTaxData('dk').listen((data) {
      _dkTotal = _formatNum(data.totalTax);
      _dkRefund = "환급액: ${_formatNum(data.totalRefund)}";
      _updateWidget();
    });

    _pendingSub = _db.getPendingApprovals().listen((txs) {
      _pendingCount = txs.length;
      _updateWidget();
    });
  }

  void _stopSyncing() {
    _cwSub?.cancel();
    _dkSub?.cancel();
    _pendingSub?.cancel();
  }

  void _updateWidget() {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;

    String role = 'parent';
    final email = user.email;
    if (email == 'ngc7331cw@gmail.com' || email == 'taeoh0317@gmail.com') {
      role = 'cw';
    } else if (email == 'ngc7331dk@gmail.com' || email == 'taeoh0318@gmail.com') {
      role = 'dk';
    }

    WidgetService.updateWidgetData(
      pendingCount: _pendingCount,
      cwTotal: _cwTotal,
      cwRefund: _cwRefund,
      dkTotal: _dkTotal,
      dkRefund: _dkRefund,
      userRole: role,
    );
  }

  String _formatNum(int number) {
    return '₩ ${number.toString().replaceAllMapped(RegExp(r"(\d{1,3})(?=(\d{3})+(?!\d))"), (Match m) => "${m[1]},")}';
  }
}
