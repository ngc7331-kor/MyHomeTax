import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:rxdart/rxdart.dart';
import 'package:home_widget/home_widget.dart';
import 'package:intl/intl.dart';
import '../services/database_service.dart';
import '../services/migration_service.dart';
import '../widgets/transaction_form.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final DatabaseService _dbService = DatabaseService();
  
  int _pageSize = 10;
  int _currentPage = 0;
  String? _selectedYearMonth; // "2024-04" 형식

  // v32.4 실시간 필터 및 집계 상태
  int _annualYear = DateTime.now().year;
  int _annualLimit = 30;

  @override
  void initState() {
    super.initState();
    // v6 정밀 복구 엔진 가동
    MigrationService.runMigration();
  }

  // 위젯 동기화 로직 (v32.4 - 세액, 환급액, 대기건수 통합)
  Future<void> _updateWidgets({
    required int totalCw, 
    required int totalDk, 
    required int refundCw,
    required int refundDk,
    required int pendingCount,
    required String userRole,
  }) async {
    try {
      final format = NumberFormat.currency(locale: 'ko_KR', symbol: '₩ ', decimalDigits: 0);
      await HomeWidget.saveWidgetData('cwTotal', format.format(totalCw));
      await HomeWidget.saveWidgetData('dkTotal', format.format(totalDk));
      await HomeWidget.saveWidgetData('cwRefund', '환급액: ${format.format(refundCw)}');
      await HomeWidget.saveWidgetData('dkRefund', '환급액: ${format.format(refundDk)}');
      await HomeWidget.saveWidgetData('pendingCount', pendingCount);
      await HomeWidget.saveWidgetData('userRole', userRole);
      await HomeWidget.saveWidgetData('isLoggedIn', true);
      await HomeWidget.saveWidgetData('updateTime', DateFormat('HH:mm').format(DateTime.now()));
      await HomeWidget.updateWidget(name: 'MyHomeTaxWidget');
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final user = _auth.currentUser;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF111827) : const Color(0xFFF9FAFB),
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            // 1. 프리미엄 헤더 (Logo & Logout)
            _buildSliverHeader(user),
            
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // 2. 인사말 섹션
                    _buildGreetingSection(user),
                    const SizedBox(height: 20),
                    
                    // 3. 승인 알림 카드 (v32.4 최적화)
                    _buildApprovalBanner(user),
                    const SizedBox(height: 30),
                    
                    // 4. 아이들 세금 현황 (실시간 집계 엔진 탑재)
                    _buildSectionTitle('아이들의 세금 현황'),
                    const SizedBox(height: 15),
                    _buildDynamicAccountCards(),
                    const SizedBox(height: 30),
                    
                    // 6. 최근 거래 내역 (요청사항: 최대 3개 고정)
                    _buildRecentTransactionsSection(),
                    const SizedBox(height: 30),

                    // 7. [NEW] 연도별 납부현황 상세 섹션 (드롭박스 필터)
                    _buildAnnualStatusSection(),
                    const SizedBox(height: 50),
                  ],
                ),
              ),
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 100)),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showAddTransactionForm(context),
        backgroundColor: Colors.blueAccent,
        icon: const Icon(Icons.add, color: Colors.white),
        label: const Text('거래 등록', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
    );
  }

  Widget _buildSliverHeader(User? user) {
    return SliverAppBar(
      floating: true,
      backgroundColor: Colors.transparent,
      elevation: 0,
      leadingWidth: 150,
      leading: Padding(
        padding: const EdgeInsets.only(left: 20, top: 10),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.asset('assets/logo.jpg', height: 32, width: 32, fit: BoxFit.cover),
            ),
            const SizedBox(width: 10),
            Text(
              '우리집 세금',
              style: GoogleFonts.notoSansKr(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.blueAccent),
            ),
          ],
        ),
      ),
      actions: [
        IconButton(
          onPressed: () async {
            await _auth.signOut();
            await GoogleSignIn().signOut();
          },
          icon: const Icon(Icons.logout_rounded, color: Colors.grey),
        ),
        const SizedBox(width: 10),
      ],
    );
  }

  Widget _buildGreetingSection(User? user) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(25),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(15),
            child: Image.asset('assets/logo.jpg', height: 50, width: 50, fit: BoxFit.cover),
          ),
          const SizedBox(width: 15),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('반가워요, ${_getDisplayName(user?.email)}님', style: GoogleFonts.notoSansKr(fontSize: 18, fontWeight: FontWeight.bold)),
              const Text('오늘도 스마트한 세금 습관을 응원해요! 💰', style: TextStyle(color: Colors.grey, fontSize: 13)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildApprovalBanner(User? user) {
    final String? userEmail = user?.email;
    final String role = _getUserRole(userEmail);
    final isAdmin = role == 'parent';
    final userId = isAdmin ? null : role;
    final isCw = role == 'cw';
    final isDk = role == 'dk';
    
    return StreamBuilder<List<TaxTransaction>>(
      stream: _dbService.getPendingApprovals(userId: userId),
      builder: (context, snapshot) {
        final count = snapshot.data?.length ?? 0;
        if (count == 0) return const SizedBox.shrink();

        // 🛡️ 역할별 레이블 최적화 (v32.4)
        final String title = isAdmin ? '승인 대기' : '승인 요청 중';
        final String msg = isAdmin 
            ? '총 ${count}건의 요청이 기다리고 있어요!' 
            : '내가 보낸 ${count}건의 요청이 성실히 검토 중이에요.';

        return GestureDetector(
          onTap: () => _showApprovalDetails(snapshot.data!),
          child: Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: isAdmin 
                    ? [Colors.orange.shade400, Colors.orange.shade600] 
                    : [Colors.blue.shade400, Colors.blue.shade600]
              ),
              borderRadius: BorderRadius.circular(20),
              boxShadow: [BoxShadow(color: (isAdmin ? Colors.orange : Colors.blue).withOpacity(0.3), blurRadius: 10, offset: const Offset(0, 4))],
            ),
            child: Row(
              children: [
                const Icon(Icons.notifications_active_rounded, color: Colors.white, size: 28),
                const SizedBox(width: 15),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                      Text(msg, style: TextStyle(color: Colors.white.withOpacity(0.9), fontSize: 13)),
                    ],
                  ),
                ),
                const Icon(Icons.arrow_forward_ios_rounded, color: Colors.white, size: 16),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildDynamicAccountCards() {
    final currentYear = DateTime.now().year;
    
    final String role = _getUserRole(_auth.currentUser?.email);
    final isAdmin = role == 'parent';
    final isCw = role == 'cw';
    final isDk = role == 'dk';
    
    return StreamBuilder<List<TaxTransaction>>(
      stream: isAdmin 
        ? Rx.combineLatest2(
            _dbService.getTransactions('cw', limit: 2000),
            _dbService.getTransactions('dk', limit: 2000),
            (cwTxs, dkTxs) => [...cwTxs, ...dkTxs],
          )
        : _dbService.getTransactions(role, limit: 2000),
      builder: (context, snapshot) {
        if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());
        final all = snapshot.data!;

        // 📊 채원 집계 (잔액은 전체 기간, 세금/환급은 올해 기준)
        final cwHistory = all.where((t) => t.requester == 'cw').toList();
        final cwYear = cwHistory.where((t) => t.timestamp.year == currentYear).toList();
        
        final cwPaid = cwYear.where((t) => t.type == 'payment').fold<int>(0, (s, t) => s + t.amount);
        final cwUsage = cwYear.where((t) => t.type == 'usage').fold<int>(0, (s, t) => s + t.amount);
        final cwMember = cwYear.where((t) => t.type == 'usage' && (t.isMembership || t.description.contains('회비'))).fold<int>(0, (s, t) => s + t.amount);
        final cwRefund = ((cwUsage - cwMember) * 0.3).toInt();
        
        final cwTotalPaid = cwHistory.where((t) => t.type == 'payment').fold<int>(0, (s, t) => s + t.amount);
        final cwTotalUsage = cwHistory.where((t) => t.type == 'usage').fold<int>(0, (s, t) => s + t.amount);
        final cwBalance = cwTotalPaid - cwTotalUsage;

        // 📊 도권 집계
        final dkHistory = all.where((t) => t.requester == 'dk').toList();
        final dkYear = dkHistory.where((t) => t.timestamp.year == currentYear).toList();
        
        final dkPaid = dkYear.where((t) => t.type == 'payment').fold<int>(0, (s, t) => s + t.amount);
        final dkUsage = dkYear.where((t) => t.type == 'usage').fold<int>(0, (s, t) => s + t.amount);
        final dkMember = dkYear.where((t) => t.type == 'usage' && (t.isMembership || t.description.contains('회비'))).fold<int>(0, (s, t) => s + t.amount);
        final dkRefund = ((dkUsage - dkMember) * 0.3).toInt();
        
        final dkTotalPaid = dkHistory.where((t) => t.type == 'payment').fold<int>(0, (s, t) => s + t.amount);
        final dkTotalUsage = dkHistory.where((t) => t.type == 'usage').fold<int>(0, (s, t) => s + t.amount);
        final dkBalance = dkTotalPaid - dkTotalUsage;

        // 🛰️ 실시간 위젯 동기화 (v32.4)
        WidgetsBinding.instance.addPostFrameCallback((_) {
          _updateWidgets(
            totalCw: cwBalance, totalDk: dkBalance,
            refundCw: cwRefund, refundDk: dkRefund,
            pendingCount: all.where((t) => t.status == 'pending').length,
            userRole: _auth.currentUser?.email == 'taeoh0311@gmail.com' ? 'parent' : 
                     ((_auth.currentUser?.email == 'ngc7331cw@gmail.com' || _auth.currentUser?.email == 'taeoh0317@gmail.com') ? 'cw' : 'dk'),
          );
        });

        return Row(
          children: [
            if (isAdmin || isCw) 
              Expanded(child: _buildModernCard('채원', cwBalance, cwRefund, Colors.pink.shade50, Colors.pinkAccent)),
            if (isAdmin) const SizedBox(width: 15),
            if (isAdmin || isDk)
              Expanded(child: _buildModernCard('도권', dkBalance, dkRefund, Colors.blue.shade50, Colors.blueAccent)),
          ],
        );
      },
    );
  }

  Widget _buildModernCard(String name, int balance, int refund, Color bgColor, Color mainColor) {
    bool isDark = Theme.of(context).brightness == Brightness.dark;
    final format = NumberFormat.currency(locale: 'ko_KR', symbol: '₩ ', decimalDigits: 0);
    
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: isDark ? mainColor.withOpacity(0.1) : bgColor,
        borderRadius: BorderRadius.circular(25),
        border: Border.all(color: mainColor.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(name, style: GoogleFonts.notoSansKr(fontSize: 16, fontWeight: FontWeight.bold, color: mainColor)),
              Icon(Icons.account_balance_wallet_rounded, color: mainColor.withOpacity(0.5), size: 20),
            ],
          ),
          const SizedBox(height: 25),
          Text(
            format.format(balance),
            style: GoogleFonts.notoSansKr(fontSize: 22, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Icon(Icons.auto_awesome_rounded, color: mainColor, size: 14),
              const SizedBox(width: 5),
              Text('환급액: ${format.format(refund)}', style: TextStyle(color: mainColor, fontSize: 13, fontWeight: FontWeight.w500)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSimplifiedTransactionCard(TaxTransaction tx) {
    final isPayment = tx.type == 'payment';
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final format = NumberFormat.currency(locale: 'ko_KR', symbol: '', decimalDigits: 0);
    
    return GestureDetector(
      onTap: () => _showTransactionDetail(tx),
      child: Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: isDark ? Colors.white.withOpacity(0.03) : Colors.white,
        borderRadius: BorderRadius.circular(15),
        border: Border.all(color: isDark ? Colors.white.withOpacity(0.05) : Colors.black.withOpacity(0.02)),
      ),
      child: LayoutBuilder(
        builder: (context, constraints) {
          bool isNarrow = constraints.maxWidth < 320; // 폴드3 접힌 화면 대비
          
          return Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: (isPayment ? Colors.green : Colors.red).withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  isPayment ? Icons.add_circle_outline_rounded : Icons.remove_circle_outline_rounded,
                  color: isPayment ? Colors.green : Colors.red, size: 16,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 2,
                child: Text(
                  DateFormat('MM.dd').format(tx.timestamp),
                  style: TextStyle(color: Colors.grey, fontSize: isNarrow ? 10 : 12),
                ),
              ),
              Expanded(
                flex: 2,
                child: Text(
                  tx.requester == 'cw' ? "채원" : "도권",
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: isNarrow ? 11 : 13),
                ),
              ),
              Expanded(
                flex: 6,
                child: Text(
                  tx.description,
                  style: GoogleFonts.notoSansKr(fontSize: isNarrow ? 11 : 13),
                  maxLines: 1, overflow: TextOverflow.ellipsis,
                ),
              ),
              Expanded(
                flex: 4,
                child: Text(
                  '${isPayment ? '+' : '-'}${format.format(tx.amount)}',
                  textAlign: TextAlign.end,
                  style: GoogleFonts.notoSansKr(
                    fontWeight: FontWeight.bold, fontSize: isNarrow ? 13 : 15,
                    color: isPayment ? Colors.green : Colors.red,
                  ),
                ),
              ),
            ],
          );
        },
      ),
    ),
  );
}

  void _showTransactionDetail(TaxTransaction tx) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final format = NumberFormat.currency(locale: 'ko_KR', symbol: '₩ ', decimalDigits: 0);
    final isPayment = tx.type == 'payment';

    showDialog(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: const EdgeInsets.symmetric(horizontal: 24),
        child: Container(
          padding: const EdgeInsets.all(28),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1F2937) : Colors.white,
            borderRadius: BorderRadius.circular(30),
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.2), blurRadius: 20)],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: (isPayment ? Colors.green : Colors.red).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      isPayment ? '납부 내역' : '사용 내역',
                      style: TextStyle(color: isPayment ? Colors.green : Colors.red, fontWeight: FontWeight.bold, fontSize: 13),
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close_rounded, color: Colors.grey),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              Text(tx.description, style: GoogleFonts.notoSansKr(fontSize: 22, fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              const Divider(height: 1, color: Colors.white10),
              const SizedBox(height: 20),
              _buildDetailRow('대상', tx.requester == 'cw' ? '채원' : '도권'),
              _buildDetailRow('날짜', DateFormat('yyyy년 MM월 dd일').format(tx.timestamp)),
              _buildDetailRow('금액', format.format(tx.amount), valueColor: isPayment ? Colors.green : Colors.red),
              if (tx.isMembership) _buildDetailRow('항목', '🏆 회비'),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 54,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.blueAccent,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                    elevation: 0,
                  ),
                  child: const Text('확인', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value, {Color? valueColor}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.grey, fontSize: 14)),
          Text(value, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: valueColor)),
        ],
      ),
    );
  }

  Widget _buildRecentTransactionsSection() {
    final String role = _getUserRole(_auth.currentUser?.email);
    final isAdmin = role == 'parent';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle('최근 거래 내역'),
        const SizedBox(height: 15),
        StreamBuilder<List<TaxTransaction>>(
          stream: isAdmin 
            ? Rx.combineLatest2(
                _dbService.getTransactions('cw', limit: 3),
                _dbService.getTransactions('dk', limit: 3),
                (cw, dk) {
                  final all = [...cw, ...dk];
                  all.sort((a, b) => b.timestamp.compareTo(a.timestamp));
                  return all.take(3).toList();
                },
              )
            : _dbService.getTransactions(role, limit: 3),
          builder: (context, snapshot) {
            if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());
            final txs = snapshot.data!;
            if (txs.isEmpty) return const Center(child: Padding(padding: EdgeInsets.all(20), child: Text('내역이 없습니다.')));
            return Column(children: txs.map((tx) => _buildSimplifiedTransactionCard(tx)).toList());
          },
        ),
      ],
    );
  }

  Widget _buildAnnualStatusSection() {
    final String role = _getUserRole(_auth.currentUser?.email);
    final isAdmin = role == 'parent';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            _buildSectionTitle('연도별 납부현황 상세'),
            Row(
              children: [
                _buildYearDropdown(),
                const SizedBox(width: 10),
                _buildLimitDropdown(),
              ],
            ),
          ],
        ),
        const SizedBox(height: 15),
        StreamBuilder<List<TaxTransaction>>(
          stream: isAdmin 
            ? Rx.combineLatest2(
                _dbService.getTransactions('cw', limit: _annualLimit),
                _dbService.getTransactions('dk', limit: _annualLimit),
                (cw, dk) {
                  final all = [...cw, ...dk].where((t) => t.timestamp.year == _annualYear).toList();
                  all.sort((a, b) => b.timestamp.compareTo(a.timestamp));
                  return all;
                },
              )
            : _dbService.getTransactions(role, limit: _annualLimit).map((list) => 
                list.where((t) => t.timestamp.year == _annualYear).toList()..sort((a, b) => b.timestamp.compareTo(a.timestamp))),
          builder: (context, snapshot) {
            if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());
            final txs = snapshot.data!;
            if (txs.isEmpty) return const Center(child: Padding(padding: EdgeInsets.all(40), child: Text('기록이 없습니다.')));
            return Column(children: txs.map((tx) => _buildSimplifiedTransactionCard(tx)).toList());
          },
        ),
      ],
    );
  }

  Widget _buildYearDropdown() {
    return DropdownButton<int>(
      value: _annualYear,
      items: [2024, 2025, 2026].map((y) => DropdownMenuItem(value: y, child: Text('${y}년'))).toList(),
      onChanged: (y) { if (y != null) setState(() => _annualYear = y); },
      style: const TextStyle(fontSize: 13, color: Colors.blueAccent, fontWeight: FontWeight.bold),
      underline: const SizedBox(),
    );
  }

  Widget _buildLimitDropdown() {
    return DropdownButton<int>(
      value: _annualLimit,
      items: [10, 30, 50, 100].map((l) => DropdownMenuItem(value: l, child: Text('${l}개씩'))).toList(),
      onChanged: (l) { if (l != null) setState(() => _annualLimit = l); },
      style: const TextStyle(fontSize: 13, color: Colors.blueAccent, fontWeight: FontWeight.bold),
      underline: const SizedBox(),
    );
  }

  Widget _buildTransactionCard(TaxTransaction tx) {
    return _buildSimplifiedTransactionCard(tx);
  }

  Widget _buildPageSizeSelector() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: Colors.grey.withOpacity(0.1),
        borderRadius: BorderRadius.circular(10),
      ),
      child: DropdownButton<int>(
        value: _pageSize,
        items: [10, 30, 50, 100].map((e) => DropdownMenuItem(value: e, child: Text('$e개씩'))).toList(),
        onChanged: (val) {
          if (val != null) setState(() { _pageSize = val; _currentPage = 0; });
        },
        underline: const SizedBox(),
        style: const TextStyle(fontSize: 13, color: Colors.blueAccent, fontWeight: FontWeight.bold),
        icon: const Icon(Icons.keyboard_arrow_down_rounded, size: 18, color: Colors.blueAccent),
      ),
    );
  }

  Widget _buildPaginationControls() {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 20),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          IconButton(
            onPressed: _currentPage > 0 ? () => setState(() => _currentPage--) : null,
            icon: const Icon(Icons.chevron_left_rounded),
          ),
          const SizedBox(width: 10),
          Text(
            '${_currentPage + 1} 페이지',
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
          const SizedBox(width: 10),
          IconButton(
            onPressed: () => setState(() => _currentPage++),
            icon: const Icon(Icons.chevron_right_rounded),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: GoogleFonts.notoSansKr(fontSize: 17, fontWeight: FontWeight.bold),
    );
  }

  void _showAddTransactionForm(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const TransactionForm(),
    );
  }

  void _showApprovalDetails(List<TaxTransaction> txs) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.7,
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(35)),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 20)],
        ),
        child: Column(
          children: [
            const SizedBox(height: 20),
            Text('요청 내역', style: GoogleFonts.notoSansKr(fontSize: 18, fontWeight: FontWeight.bold)),
            const Divider(),
            Expanded(
              child: ListView.builder(
                itemCount: txs.length,
                itemBuilder: (context, index) {
                  final tx = txs[index];
                  final isDark = Theme.of(context).brightness == Brightness.dark;
                  // 여기서 승인/거절 또는 수정/취소 UI 구현
                  return Container(
                    margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                    decoration: BoxDecoration(
                      color: isDark ? Colors.white.withOpacity(0.05) : Colors.grey.withOpacity(0.05),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: ListTile(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                      title: Text(tx.description, style: const TextStyle(fontWeight: FontWeight.bold)),
                      subtitle: Text('${tx.requester == 'cw' ? '채원' : '도권'} · ${tx.amount}원'),
                      trailing: _auth.currentUser?.email == 'taeoh0311@gmail.com' 
                        ? Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              ElevatedButton(onPressed: () => _dbService.approveRequest(tx.id, tx), style: ElevatedButton.styleFrom(backgroundColor: Colors.blueAccent, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))), child: const Text('승인', style: TextStyle(color: Colors.white))),
                              const SizedBox(width: 8),
                              TextButton(onPressed: () => _dbService.rejectRequest(tx.id), child: const Text('거절', style: TextStyle(color: Colors.red))),
                            ],
                          )
                        : null,
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _getDisplayName(String? email) {
    final role = _getUserRole(email);
    if (role == 'parent') return '태오';
    if (role == 'cw') return '채원';
    if (role == 'dk') return '도권';
    return '사용자';
  }

  String _getUserRole(String? email) {
    if (email == 'taeoh0311@gmail.com') return 'parent';
    if (email == 'ngc7331cw@gmail.com' || email == 'taeoh0317@gmail.com') return 'cw';
    if (email == 'ngc7331dk@gmail.com' || email == 'taeoh0318@gmail.com') return 'dk';
    return 'none';
  }
}
