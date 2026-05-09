import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
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
  String _currentRole = 'parent';

  bool _isInitialized = false;

  void start() {
    if (_isInitialized) return;
    _isInitialized = true;

    FirebaseAuth.instance.authStateChanges().listen((user) async {
      if (user == null) {
        _stopSyncing();
        WidgetService.updateLogoutState();
      } else {
        // 🛡️ Fetch role from DB instead of hardcoding
        final userDoc = await FirebaseFirestore.instance.collection('users').doc(user.email).get();
        if (userDoc.exists) {
          _currentRole = userDoc.data()?['role'] ?? 'parent';
        }
        _startSyncing();
      }
    });
  }

  void _startSyncing() {
    _cwSub?.cancel();
    _dkSub?.cancel();
    _pendingSub?.cancel();

    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;

    String? currentUserId = (_currentRole == 'parent') ? null : _currentRole;

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

    _pendingSub = _db.getPendingApprovals(userId: currentUserId).listen((txs) {
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

    WidgetService.updateWidgetData(
      pendingCount: _pendingCount,
      cwTotal: _cwTotal,
      cwRefund: _cwRefund,
      dkTotal: _dkTotal,
      dkRefund: _dkRefund,
      userRole: _currentRole,
      userEmail: user.email ?? "",
    );
  }

  String _formatNum(int number) {
    return '₩ ${number.toString().replaceAllMapped(RegExp(r"(\d{1,3})(?=(\d{3})+(?!\d))"), (Match m) => "${m[1]},")}';
  }
}
