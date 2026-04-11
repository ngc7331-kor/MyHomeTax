import 'package:cloud_firestore/cloud_firestore.dart';

class TaxData {
  final String name;
  final int totalTax;
  final int totalRefund;

  TaxData({required this.name, required this.totalTax, required this.totalRefund});

  factory TaxData.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>? ?? {};
    return TaxData(
      name: data['name'] ?? '',
      totalTax: data['totalTax'] ?? 0,
      totalRefund: data['totalRefund'] ?? 0,
    );
  }
}

class TaxTransaction {
  final String id;
  final String requester;
  final String description;
  final int amount;
  final String type; // 'payment' (납부), 'usage' (사용)
  final String status; // 'pending', 'approved', 'rejected'
  final DateTime timestamp;
  final bool isMembership;

  TaxTransaction({
    required this.id,
    required this.requester,
    required this.description,
    required this.amount,
    required this.type,
    required this.status,
    required this.timestamp,
    this.isMembership = false,
  });

  Map<String, dynamic> toMap() {
    return {
      'requester': requester,
      'description': description,
      'amount': amount,
      'type': type,
      'status': status,
      'isMembership': isMembership,
      'timestamp': FieldValue.serverTimestamp(),
    };
  }

  factory TaxTransaction.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return TaxTransaction(
      id: doc.id,
      requester: data['requester'] ?? '',
      description: data['description'] ?? '',
      amount: data['amount'] ?? 0,
      type: data['type'] ?? 'payment',
      status: data['status'] ?? 'pending',
      isMembership: data['isMembership'] ?? false,
      timestamp: (data['timestamp'] as Timestamp?)?.toDate() ?? DateTime.now(),
    );
  }
}

class DatabaseService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  // 📊 실시간 세금 데이터 감시 (cw, dk)
  Stream<TaxData> getTaxData(String userId) {
    return _db.collection('taxes').doc(userId).snapshots().map((doc) => TaxData.fromFirestore(doc));
  }

  // 📝 실시간 거래 내역 감시 (페이지네이션 지원)
  Stream<List<TaxTransaction>> getTransactions(String userId, {int limit = 10}) {
    return _db
        .collection('taxes')
        .doc(userId)
        .collection('history')
        .orderBy('timestamp', descending: true)
        .limit(limit)
        .snapshots()
        .map((snapshot) => snapshot.docs.map((doc) => TaxTransaction.fromFirestore(doc)).toList());
  }

  // 🔔 승인 대기 항목 감시
  // userId가 null이면 부모용(전체 pending), 존재하면 아이용(본인 요청 중인 pending)
  Stream<List<TaxTransaction>> getPendingApprovals({String? userId}) {
    Query query = _db.collection('approvals').where('status', isEqualTo: 'pending');
    
    if (userId != null) {
      query = query.where('requester', isEqualTo: userId);
    }
    
    return query
        .orderBy('timestamp', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs.map((doc) => TaxTransaction.fromFirestore(doc)).toList());
  }

  // ➕ 새로운 세금/사용 요청
  Future<void> requestTaxAction(TaxTransaction tx) async {
    await _db.collection('approvals').add(tx.toMap());
  }

  // ➕ '함께' 사용 요청 (각각 50%씩 분할)
  Future<void> requestTogetherAction(String description, int totalAmount, DateTime date) async {
    final batch = _db.batch();
    final halfAmount = (totalAmount / 2).round();

    // 1. 채분분 신청
    final cwRef = _db.collection('approvals').doc();
    batch.set(cwRef, {
      'requester': 'cw',
      'description': '[공동] $description',
      'amount': halfAmount,
      'type': 'usage',
      'status': 'pending',
      'timestamp': Timestamp.fromDate(date),
      'details': '총액 $totalAmount원 중 50% 분기',
    });

    // 2. 도권분 신청
    final dkRef = _db.collection('approvals').doc();
    batch.set(dkRef, {
      'requester': 'dk',
      'description': '[공동] $description',
      'amount': halfAmount,
      'type': 'usage',
      'status': 'pending',
      'timestamp': Timestamp.fromDate(date),
      'details': '총액 $totalAmount원 중 50% 분기',
    });

    await batch.commit();
  }

  // ✅ 요청 승인 처리 (Batch 작업)
  Future<void> approveRequest(String approvalId, TaxTransaction tx) async {
    final batch = _db.batch();
    final taxRef = _db.collection('taxes').doc(tx.requester);
    final approvalRef = _db.collection('approvals').doc(approvalId);
    final historyRef = taxRef.collection('history').doc();

    // 1. 승인 상태 업데이트
    batch.update(approvalRef, {
      'status': 'approved',
      'approvedAt': FieldValue.serverTimestamp(),
    });

    // 2. 히스토리에 기록
    batch.set(historyRef, {
      ...tx.toMap(),
      'status': 'approved',
      'timestamp': FieldValue.serverTimestamp(),
    });

    // 3. 누적 데이터 업데이트 (v30: 필드 보정 포함)
    int taxChange = (tx.type == 'payment') ? tx.amount : -tx.amount;
    int refundChange = (taxChange * 0.3).round();

    batch.update(taxRef, {
      'totalTax': FieldValue.increment(taxChange),
      'totalRefund': FieldValue.increment(refundChange),
      'lastUpdated': FieldValue.serverTimestamp(),
    });

    await batch.commit();
  }

  // ❌ 요청 거절 처리
  Future<void> rejectRequest(String approvalId) async {
    await _db.collection('approvals').doc(approvalId).update({
      'status': 'rejected',
      'rejectedAt': FieldValue.serverTimestamp(),
    });
  }
}
