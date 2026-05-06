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
            : '${count}건 요청이 검토중이에요.';

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

        return StreamBuilder<List<TaxData>>(
          stream: Rx.combineLatest2(
            _dbService.getTaxData('cw'),
            _dbService.getTaxData('dk'),
            (cw, dk) => [cw, dk],
          ),
          builder: (context, taxSnapshot) {
            if (!taxSnapshot.hasData) return const Center(child: CircularProgressIndicator());
            final taxDocs = taxSnapshot.data!;
            final cwTaxDoc = taxDocs[0];
            final dkTaxDoc = taxDocs[1];

            // 📊 채원 집계 (v55: 내역 기반 실시간 합산으로 정확도 100% 확보)
            final cwHistory = all.where((t) => t.requester == 'cw').toList();
            final cwPayments = cwHistory.where((t) => t.type == 'payment').fold<int>(0, (s, t) => s + t.amount);
            final cwUsages = cwHistory.where((t) => t.type == 'usage').fold<int>(0, (s, t) => s + t.amount);
            final cwBalance = cwTaxDoc.initialCarryover + cwPayments - cwUsages;
            
            // 올해 기준 환급액 (올해 사용액의 30%)
            final cwYear = cwHistory.where((t) => t.timestamp.year == currentYear).toList();
            final cwUsageYear = cwYear.where((t) => t.type == 'usage').fold<int>(0, (s, t) => s + t.amount);
            final cwMemberYear = cwYear.where((t) => t.type == 'usage' && (t.isMembership || t.description.contains('회비'))).fold<int>(0, (s, t) => s + t.amount);
            final cwRefundYear = ((cwUsageYear - cwMemberYear) * 0.3).toInt();
            
            // 📊 도권 집계 (내역 기반 실시간 합산)
            final dkHistory = all.where((t) => t.requester == 'dk').toList();
            final dkPayments = dkHistory.where((t) => t.type == 'payment').fold<int>(0, (s, t) => s + t.amount);
            final dkUsages = dkHistory.where((t) => t.type == 'usage').fold<int>(0, (s, t) => s + t.amount);
            final dkBalance = dkTaxDoc.initialCarryover + dkPayments - dkUsages;
            
            final dkYear = dkHistory.where((t) => t.timestamp.year == currentYear).toList();
            final dkUsageYear = dkYear.where((t) => t.type == 'usage').fold<int>(0, (s, t) => s + t.amount);
            final dkMemberYear = dkYear.where((t) => t.type == 'usage' && (t.isMembership || t.description.contains('회비'))).fold<int>(0, (s, t) => s + t.amount);
            final dkRefundYear = ((dkUsageYear - dkMemberYear) * 0.3).toInt();

            // 🛰️ 실시간 위젯 동기화 (v32.5)
            WidgetsBinding.instance.addPostFrameCallback((_) {
              _updateWidgets(
                totalCw: cwBalance, totalDk: dkBalance,
                refundCw: cwRefundYear, refundDk: dkRefundYear,
                pendingCount: all.where((t) => t.status == 'pending').length,
                userRole: role,
              );
            });


            return Row(
              children: [
                if (isAdmin || isCw) 
                  Expanded(
                    child: GestureDetector(
                      onTap: () => _showTaxDetailDialog('채원', cwBalance, cwRefundYear, cwHistory),
                      child: _buildModernCard('채원', cwBalance, cwRefundYear, Colors.pink.shade50, Colors.pinkAccent),
                    ),
                  ),
                if (isAdmin) const SizedBox(width: 15),
                if (isAdmin || isDk)
                  Expanded(
                    child: GestureDetector(
                      onTap: () => _showTaxDetailDialog('도권', dkBalance, dkRefundYear, dkHistory),
                      child: _buildModernCard('도권', dkBalance, dkRefundYear, Colors.blue.shade50, Colors.blueAccent),
                    ),
                  ),
              ],
            );
          },
        );
      },
    );
  }

  Widget _buildModernCard(String name, int balance, int refund, Color bgColor, Color mainColor) {
    bool isDark = Theme.of(context).brightness == Brightness.dark;
    final format = NumberFormat.currency(locale: 'ko_KR', symbol: '₩ ', decimalDigits: 0);
    
    final String role = _getUserRole(_auth.currentUser?.email);
    final isChild = role == 'cw' || role == 'dk';

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
          if (!isChild) ...[
            // 부모 모드: 기존 수직 배치
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
          ] else ...[
            // 자녀 모드: 2단 수평 배치 (1행: 라벨, 2행: 금액)
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('세금 잔액', style: TextStyle(color: Colors.grey, fontSize: 11)),
                      const SizedBox(height: 4),
                      Text(format.format(balance), style: GoogleFonts.notoSansKr(fontSize: 18, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
                Container(width: 1, height: 30, color: mainColor.withOpacity(0.1)),
                const SizedBox(width: 15),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('환급액', style: TextStyle(color: Colors.grey, fontSize: 11)),
                      const SizedBox(height: 4),
                      Text(format.format(refund), style: GoogleFonts.notoSansKr(fontSize: 18, fontWeight: FontWeight.bold, color: mainColor)),
                    ],
                  ),
                ),
              ],
            ),
          ],
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
                  return all.take(3).toList().cast<TaxTransaction>();
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
                  return all.cast<TaxTransaction>();
                },
              )
            : _dbService.getTransactions(role, limit: _annualLimit).map((List<TaxTransaction> list) => 
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
    final String role = _getUserRole(_auth.currentUser?.email);
    final isAdmin = role == 'parent';

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
            Text(isAdmin ? '승인 대기 목록' : '내 요청 내역', style: GoogleFonts.notoSansKr(fontSize: 18, fontWeight: FontWeight.bold)),
            const Divider(),
            Expanded(
              child: ListView.builder(
                itemCount: txs.length,
                itemBuilder: (context, index) {
                  final tx = txs[index];
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                    child: _buildRequestItem(tx, isAdmin),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRequestItem(TaxTransaction tx, bool isAdmin) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final format = NumberFormat.currency(locale: 'ko_KR', symbol: '₩ ', decimalDigits: 0);
    final isPayment = tx.type == 'payment';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1F2937) : Colors.white,
        borderRadius: BorderRadius.circular(25),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 첫째 줄: 날짜 및 타입 배지
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                DateFormat('yyyy.MM.dd HH:mm').format(tx.timestamp),
                style: GoogleFonts.notoSansKr(color: Colors.grey, fontSize: 12),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: (isPayment ? Colors.green : Colors.orange).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  isPayment ? '납부' : '사용',
                  style: GoogleFonts.notoSansKr(color: isPayment ? Colors.green : Colors.orange, fontSize: 10, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // 둘째 줄: 내용 및 버튼들
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(tx.description, style: GoogleFonts.notoSansKr(fontWeight: FontWeight.bold, fontSize: 16)),
                    const SizedBox(height: 4),
                    Text(
                      '${tx.requester == 'cw' ? '채원' : '도권'} • ${format.format(tx.amount)}',
                      style: GoogleFonts.notoSansKr(color: isDark ? Colors.white70 : Colors.black54, fontSize: 14),
                    ),
                  ],
                ),
              ),
              if (isAdmin) ...[
                _buildTextButton('거절', Colors.redAccent, () => _dbService.rejectRequest(tx.id)),
                const SizedBox(width: 8),
                _buildTextButton('승인', Colors.green, () => _dbService.approveRequest(tx.id, tx)),
              ] else ...[
                _buildTextButton('삭제', Colors.redAccent, () => _showCancelConfirmDialog(tx.id)),
                const SizedBox(width: 8),
                _buildTextButton('수정', Colors.blueAccent, () => _showEditRequestDialog(tx)),
              ],
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTextButton(String label, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Text(
          label,
          style: GoogleFonts.notoSansKr(color: color, fontSize: 13, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }

  void _showEditRequestDialog(TaxTransaction tx) {
    final amountController = TextEditingController(text: tx.amount.toString());
    final descController = TextEditingController(text: tx.description);
    DateTime editDate = tx.timestamp; // 날짜 수정용 상태 (v52)
    final isDark = Theme.of(context).brightness == Brightness.dark;

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => Dialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
          backgroundColor: isDark ? const Color(0xFF1F2937) : Colors.white,
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('내역 수정', style: GoogleFonts.notoSansKr(fontSize: 20, fontWeight: FontWeight.bold)),
                const SizedBox(height: 24),
                
                // 날짜 선택 버튼 추가 (Issue 4 해결)
                InkWell(
                  onTap: () async {
                    final picked = await showDatePicker(
                      context: context,
                      initialDate: editDate,
                      firstDate: DateTime(2020),
                      lastDate: DateTime(2100),
                    );
                    if (picked != null) {
                      setDialogState(() => editDate = picked);
                    }
                  },
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isDark ? Colors.white.withOpacity(0.05) : Colors.grey.shade50,
                      borderRadius: BorderRadius.circular(15),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.calendar_today_rounded, size: 20, color: Colors.blueAccent),
                        const SizedBox(width: 12),
                        Text(DateFormat('yyyy년 MM월 dd일').format(editDate), style: const TextStyle(fontSize: 15)),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                _buildModernTextField(descController, '내용', Icons.description_outlined),
                const SizedBox(height: 16),
                _buildModernTextField(amountController, '금액', Icons.monetization_on_outlined, isNumber: true),
                const SizedBox(height: 32),
                Row(
                  children: [
                    Expanded(
                      child: TextButton(
                        onPressed: () => Navigator.pop(context),
                        child: Text('취소', style: GoogleFonts.notoSansKr(color: Colors.grey)),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () async {
                          final amt = int.tryParse(amountController.text) ?? 0;
                          if (amt > 0) {
                            await _dbService.updateRequest(tx.id, amt, descController.text, editDate);
                            if (mounted) Navigator.pop(context);
                          }
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.blueAccent,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                        ),
                        child: Text('수정 완료', style: GoogleFonts.notoSansKr(color: Colors.white, fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildModernTextField(TextEditingController controller, String label, IconData icon, {bool isNumber = false}) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return TextField(
      controller: controller,
      keyboardType: isNumber ? TextInputType.number : TextInputType.text,
      style: GoogleFonts.notoSansKr(fontSize: 15),
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon, size: 20, color: Colors.blueAccent),
        filled: true,
        fillColor: isDark ? Colors.white.withOpacity(0.05) : Colors.grey.shade50,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(15), borderSide: BorderSide.none),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      ),
    );
  }

  void _showCancelConfirmDialog(String id) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text('요청 삭제', style: GoogleFonts.notoSansKr(fontWeight: FontWeight.bold)),
        content: Text('정말로 이 요청을 삭제하시겠습니까?', style: GoogleFonts.notoSansKr()),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: Text('아니오', style: GoogleFonts.notoSansKr(color: Colors.grey))),
          ElevatedButton(
            onPressed: () async {
              await _dbService.cancelRequest(id);
              if (mounted) Navigator.pop(context);
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
            child: Text('예, 삭제합니다', style: GoogleFonts.notoSansKr(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  void _showTaxDetailDialog(String name, int balance, int refund, List<TaxTransaction> history) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final format = NumberFormat.currency(locale: 'ko_KR', symbol: '₩ ', decimalDigits: 0);
    final currentYear = DateTime.now().year;
    final role = _getUserRole(_auth.currentUser?.email);
    final isAdmin = role == 'parent';

    // 올해 데이터 필터링
    final yearHistory = history.where((t) => t.timestamp.year == currentYear).toList();
    final yearPayment = yearHistory.where((t) => t.type == 'payment').fold<int>(0, (s, t) => s + t.amount);
    final yearUsage = yearHistory.where((t) => t.type == 'usage').fold<int>(0, (s, t) => s + t.amount);

    // 연도별 집계 (부모용)
    final Map<int, List<TaxTransaction>> yearlyGroups = {};
    for (var tx in history) {
      yearlyGroups.putIfAbsent(tx.timestamp.year, () => []).add(tx);
    }
    final sortedYears = yearlyGroups.keys.toList()..sort((a, b) => b.compareTo(a));

    showDialog(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: Colors.transparent,
        child: Container(
          width: double.infinity,
          constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.8),
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1F2937) : Colors.white,
            borderRadius: BorderRadius.circular(30),
          ),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('$name님의 $currentYear년 세금 요약', style: GoogleFonts.notoSansKr(fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 20),
                _buildDetailRow('현재 잔액', format.format(balance), valueColor: balance >= 0 ? Colors.blueAccent : Colors.redAccent),
                _buildDetailRow('올해 예상 환급액', format.format(refund), valueColor: Colors.green),
                const Divider(height: 30),
                _buildDetailRow('올해 총 납부액', format.format(yearPayment)),
                _buildDetailRow('올해 총 사용액', format.format(yearUsage)),
                
                if (isAdmin) ...[
                  const SizedBox(height: 20),
                  const Divider(),
                  const SizedBox(height: 10),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Text('연도별 상세 내역', style: GoogleFonts.notoSansKr(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.blueAccent)),
                  ),
                  const SizedBox(height: 10),
                  ...sortedYears.map((year) {
                    final yearTxs = yearlyGroups[year]!;
                    final p = yearTxs.where((t) => t.type == 'payment').fold<int>(0, (s, t) => s + t.amount);
                    final u = yearTxs.where((t) => t.type == 'usage').fold<int>(0, (s, t) => s + t.amount);
                    return Theme(
                      data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
                      child: ExpansionTile(
                        title: Text('$year년', style: GoogleFonts.notoSansKr(fontSize: 14, fontWeight: FontWeight.w600)),
                        subtitle: Text('납부: ${format.format(p)} / 사용: ${format.format(u)}', style: const TextStyle(fontSize: 11, color: Colors.grey)),
                        childrenPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        children: [
                          ...yearTxs.take(5).map((tx) => Padding(
                            padding: const EdgeInsets.symmetric(vertical: 2),
                            child: Row(
                              children: [
                                Text(DateFormat('MM.dd').format(tx.timestamp), style: const TextStyle(fontSize: 11, color: Colors.grey)),
                                const SizedBox(width: 12),
                                Expanded(child: Text(tx.description, style: const TextStyle(fontSize: 12), overflow: TextOverflow.ellipsis)),
                                Text(format.format(tx.amount), style: TextStyle(fontSize: 12, color: tx.type == 'payment' ? Colors.blue : Colors.red)),
                              ],
                            ),
                          )),
                          TextButton(
                            onPressed: () => _showFullHistoryDialog(year, yearTxs),
                            child: const Text('더보기...', style: TextStyle(fontSize: 12, color: Colors.blueAccent, fontWeight: FontWeight.bold))
                          )
                        ],
                      ),
                    );
                  }).toList(),
                ],

                const SizedBox(height: 20),
                const Text('※ 최근 2000건의 데이터를 기반으로 집계되었습니다.', style: TextStyle(color: Colors.grey, fontSize: 10)),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => Navigator.pop(context),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blueAccent,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                    ),
                    child: Text('확인', style: GoogleFonts.notoSansKr(color: Colors.white, fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showFullHistoryDialog(int year, List<TaxTransaction> txs) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final format = NumberFormat.currency(locale: 'ko_KR', symbol: '₩ ', decimalDigits: 0);

    showDialog(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: Colors.transparent,
        child: Container(
          width: double.infinity,
          constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.7),
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1F2937) : Colors.white,
            borderRadius: BorderRadius.circular(30),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('$year년 전체 상세 내역', style: GoogleFonts.notoSansKr(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 20),
              Expanded(
                child: ListView.builder(
                  shrinkWrap: true,
                  itemCount: txs.length,
                  itemBuilder: (context, index) {
                    final tx = txs[index];
                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: isDark ? Colors.white.withOpacity(0.03) : Colors.grey.shade50,
                        borderRadius: BorderRadius.circular(15),
                      ),
                      child: Row(
                        children: [
                          Text(DateFormat('MM.dd').format(tx.timestamp), style: const TextStyle(fontSize: 11, color: Colors.grey)),
                          const SizedBox(width: 12),
                          Expanded(child: Text(tx.description, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500))),
                          Text(format.format(tx.amount), style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: tx.type == 'payment' ? Colors.green : Colors.red)),
                        ],
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('닫기', style: TextStyle(color: Colors.blueAccent, fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
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
