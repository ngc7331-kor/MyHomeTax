import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

class MigrationService {
  static final FirebaseFirestore _db = FirebaseFirestore.instance;

  // 1. 2024년 데이터 (CSV)
  static const String data2024 = """날짜,cw금액,dk금액,메모
2024-05-06,1300,1300,
2024-05-06,1000,1000,설거지
2024-05-07,600,300,
2024-05-07,1300,1300,
2024-05-07,1300,1300,
2024-05-08,1300,1300,
2024-05-08,1300,1300,
2024-05-11,2800,2800,
2024-05-12,1300,2300,용돈
2024-05-20,1000,1000,설거지
2024-05-23,4300,4300,
2024-05-27,1000,1000,설거지
2024-05-27,2400,2400,부처님오신날기념
2024-05-28,-14200,-14200,탕후루등
2024-05-30,1000,1000,설거지
2024-06-02,300,300,
2024-06-03,4500,4500,
2024-06-03,1000,1000,설거지
2024-06-06,2100,2100,현충일기념
2024-06-09,1000,1000,설거지
2024-06-11,1000,1000,설거지
2024-06-12,500,500,설거지
2024-06-17,1000,1000,설거지
2024-06-19,1000,1000,설거지
2024-06-25,1000,1000,설거지
2024-06-25,100,100,계란말이
2024-06-26,1000,1000,설거지
2024-06-27,1000,1000,설거지
2024-06-28,1000,1000,설거지
2024-06-30,2000,2000,설거지
2024-08-11,8600,8600,치킨
2024-08-11,1500,2100,
2024-08-18,1300,900,
2024-08-25,800,500,
2024-09-02,21200,18400,부산가서 받은 용돈, 설거지 포함
2024-09-05,0,500,글짓기 상장에 대한 용돈
2024-09-10,0,28000,생일용돈
2024-09-10,200,0,
2024-09-10,900,500,
2024-09-16,26000,25500,추석용돈
2024-09-16,-25000,25000,족발
2024-09-22,500,300,
2024-09-29,900,500,
2024-10-01,800,0,설거지
2024-10-05,11900,11900,스타벅스
2024-10-06,900,800,
2024-10-12,900,600,
2024-10-20,800,500,
2024-10-27,900,400,
2024-10-27,0,10000,철이삼촌 용돈20%
2024-10-31,1000,300,설거지
2024-11-01,-36000,-36000,외할머니 케익
2024-11-03,900,500,주간 용돈
2024-11-10,900,500,주간 용돈
2024-11-24,900,500,주간 용돈
2024-11-30,900,500,주간 용돈
2024-11-30,500,200,설거지
2024-11-30,-30300,-30300,서윤돌날 망상커피
2024-12-02,10000,10000,할머니 강의 듣고 작은아빠에게 각각 5만원 받고 세금 20% 공제
2024-12-07,4000,3000,김장 할머니용돈
2024-12-07,1400,0,성적표
2024-12-07,900,500,
2024-12-14,900,400,
2024-12-22,900,500,
2024-12-25,12000,10000,크리스마스
2024-12-29,900,600,
2024-12-31,1200,0,설거지""";

  // 2. 2025-2026년 데이터 (CSV)
  static const String data20252026 = """날짜,cw금액,dk금액,메모
2025-01-05,0,500,
2025-01-11,800,800,
2025-01-17,70000,0,졸업용돈
2025-01-19,0,5000,친구들과 영양 여행 용돈
2025-01-19,1100,800,
2025-01-21,-21240,-21240,피자
2025-01-26,1000,800,
2025-01-26,700,700,할아버지가 준 동전
2025-01-29,105000,45000,설용돈
2025-01-29,1100,0,설거지(도권이는 설거지 한적 없음)
2025-02-02,1200,1000,
2025-02-09,1200,1000,
2025-02-16,1500,1500,형광등 교체 용돈 포함
2025-02-22,20000,0,작은아빠 고딩 용돈
2025-02-23,1200,0,
2025-03-01,1200,0,설거지(도권이는 설거지 한적 없음)
2025-03-03,1300,1100,
2025-03-08,-13900,-13900,햄버거
2025-03-09,1100,0,도권이는 용돈 합의 못 해서 없음
2025-03-16,1300,1000,
2025-03-23,1400,1000,
2025-03-30,1400,1000,
2025-03-31,700,0,설거지
2025-04-06,1300,1000,
2025-04-06,1000,1000,이모용돈
2025-04-09,1000,1000,외할머니 용돈
2025-04-13,1400,1000,
2025-04-16,10000,10000,외삼촌할아버지용돈
2025-04-20,1400,900,
2025-04-26,-38000,-38000,서울식사
2025-04-27,2000,2000,외할머니 용돈
2025-04-27,1300,900,
2025-05-02,10000,10000,할아버지 어린이날 용돈
2025-05-03,10000,10000,
2025-05-04,1400,1000,
2025-05-06,3000,3000,이모 용돈
2025-05-06,5000,5000,외할머니 용돈
2025-05-08,-30000,-30000,외할아버지외할머니 어버이날 케이크
2025-05-11,1600,900,
2025-05-18,1400,900,
2025-05-25,1400,1000,
2025-05-31,500,0,설거지
2025-06-01,1400,800,
2025-06-08,-21500,-21500,마스크
2025-06-08,1900,900,
2025-06-15,1500,700,
2025-06-20,-5000,-3000,가족회비
2025-06-22,1300,1000,
2025-06-29,1400,900,
2025-07-06,20000,0,할아버지 용돈(채원이 생일)
2025-07-06,10000,0,외할머니 용돈(채원이 생일)
2025-07-06,6000,0,도권이가 생일선물함
2025-07-06,1400,900,27
2025-07-07,20000,0,작은아빠 용돈(채원이 생일)
2025-07-07,10000,0,이모 용돈(채원이 생일)
2025-07-10,20000,0,할머니 용돈(채원이 생일)
2025-07-13,1400,900,
2025-07-17,-5000,-3000,가족회비
2025-07-20,1300,1000,
2025-07-27,1600,900,
2025-08-02,3000,3000,외할머니 용돈
2025-08-03,1700,900,
2025-08-09,0,500,마당 청소
2025-08-10,1700,900,
2025-08-17,1500,1000,
2025-08-17,-5000,-3000,가족회비
2025-08-24,1400,800,
2025-08-31,1300,500,
2025-09-07,1300,500,
2025-09-14,1300,500,
2025-09-17,-5000,-3000,가족회비
2025-09-19,1000,1000,외할머니 용돈. 실제로 14일주심
2025-09-21,1300,500,
2025-09-28,1000,4000,외할머니 생일  용돈
2025-09-28,1300,0,
2025-09-30,0,700,
2025-09-30,0,30000,생일 용돈
2025-10-02,1000,0,이모용돈
2025-10-05,25000,25000,추석용돈
2025-10-05,1300,600,
2025-10-06,10000,10000,추석용돈
2025-10-12,1800,700,
2025-10-17,-5000,-3000,가족회비
2025-10-19,1300,700,
2025-10-19,3000,3000,외할머니용돈
2025-10-24,-22500,-22500,치킨
2025-10-26,1300,700,
2025-11-01,1300,700,
2025-11-09,1300,700,
2025-11-16,1300,700,
2025-11-17,-5000,-3000,가족회비
2025-11-23,1300,600,
2025-11-30,1300,700,
2025-12-07,1400,0,용돈
2025-12-07,0,600,용돈
2025-12-14,0,600,
2025-12-14,0,600,용돈
2025-12-14,1300,0,용돈
2025-12-17,-5000,-3000,가족회비
2025-12-21,1200,0,용돈
2025-12-25,2000,2000,크리스마스(이모)
2025-12-28,1300,0,용돈
2025-12-28,0,600,용돈
2025-12-29,0,2000,서윤이 돌봄(이모 용돈)
2026-01-03,-44000,-44000,2025년 연말정산 환급 사용
2026-01-04,1300,,용돈
2026-01-04,,600,용돈
2026-01-06,1000,,키링 만들어줌
2026-01-10,1000,,도권 문제집 도와줌
2026-01-11,0,1000,문제집 잘찾음
2026-01-11,,900,용돈
2026-01-11,1300,,용돈
2026-01-11,-19200,-19200,피자
2026-01-17,-5000,-3000,가족회비
2026-01-18,1400,,용돈
2026-01-20,-48000,0,동궁찜닭
2026-01-18,0,900,용돈
2026-01-25,1400,0,용돈
2026-01-23,-61000,0,만강홍
2026-02-01,1300,0,용돈
2026-02-01,,1000,용돈
2026-02-08,1300,0,용돈
2026-02-14,0,30000,설 용돈
2026-02-14,30000,0,설날 용돈
2026-02-15,1300,0,용돈
2026-02-18,-8500,-8500,떡볶이
2026-02-17,20000,0,설날용돈
2026-02-17,-5000,-3000,2월 회비
2026-02-18,0,20000,설 용돈
2026-02-22,1300,0,용돈
2026-03-01,1300,0,용돈
2026-03-08,1300,0,용돈
2026-03-08,0,700,용돈
2026-03-15,1100,0,용돈
2026-03-16,0,500,아빠 도움
2026-03-16,0,500,용돈""";

  // 3. 기록자 로그 (CSV) - raw string으로 처리하여 이스케이프 문제 회피
  static const String dataLogs = r"""일시,아이디,변경내용
2026-01-20 19:33:33,부모님 (taeoh0311@gmail.com),[기록 삭제] 2026-01-20 - 채원: -24,000원, 도권: -24,000원 (동궁찜닭)
2026-01-20 19:35:12,채원 (ngc7331cw@gmail.com),[승인 요청] 세금 사용 - 채원
2026-01-20 22:31:04,부모님 (taeoh0311@gmail.com),[승인 완료] 세금 사용 - 채원: -48,000원, 도권: 0원
2026-01-20 22:31:39,부모님 (taeoh0311@gmail.com),[기록 삭제] 2026-01-18 - 채원: 1,400원, 도권: 0원 (용돈)
2026-01-23 12:38:11,도권 (ngc7331dk@gmail.com),[승인 요청] 세금 납부 - 도권
2026-01-23 13:44:19,부모님 (taeoh0311@gmail.com),[승인 완료] 세금 납부 - 채원: 0원, 도권: 900원
2026-01-25 20:52:25,채원 (ngc7331cw@gmail.com),[승인 요청] 세금 납부 - 채원
2026-01-26 15:16:45,채원 (ngc7331cw@gmail.com),[승인 요청] 세금 사용 - 채원
2026-01-26 20:19:00,부모님 (taeoh0311@gmail.com),[승인 완료] 세금 납부 - 채원: 1,400원, 도권: 0원
2026-01-26 20:19:19,부모님 (taeoh0311@gmail.com),[승인 완료] 세금 사용 - 채원: -61,000원, 도권: 0원
2026-02-01 00:10:41,채원 (ngc7331cw@gmail.com),[승인 요청] 세금 납부 - 채원
2026-02-01 19:58:26,부모님 (taeoh0311@gmail.com),[승인 완료] 세금 납부 - 채원: 1,300원, 도권: 0원
2026-02-04 17:35:56,도권 (ngc7331dk@gmail.com),[기록 수정] 2026-01-11 - 메모: '용돈' -> '문제집 잘찾음'
2026-02-04 17:37:02,도권 (ngc7331dk@gmail.com),[승인 요청] 세금 납부 - 도권
2026-02-04 17:49:58,부모님 (taeoh0311@gmail.com),[승인 완료] 세금 납부 - 채원: 0원, 도권: 1,000원
2026-02-04 17:50:29,부모님 (taeoh0311@gmail.com),[기록 삭제] 2026-02-04 - 채원: 0원, 도권: 1,000원 (용돈)
2026-02-04 17:50:43,부모님 (taeoh0311@gmail.com),[세금 납부] 도권: 1,000원 (용돈)
2026-02-08 23:30:08,cw (ngc7331cw@gmail.com),[승인 요청] 세금 납부 - cw
2026-02-14 23:39:20,dk (ngc7331dk@gmail.com),[승인 요청] 세금 납부 - dk
2026-02-15 09:22:35,부모님 (taeoh0311@gmail.com),[승인 완료] 세금 납부 - cw: 1,300원, dk: 0원
2026-02-15 09:22:48,부모님 (taeoh0311@gmail.com),[승인 완료] 세금 납부 - cw: 0원, dk: 30,000원
2026-02-15 09:23:40,부모님 (taeoh0311@gmail.com),[기록 수정] 2026년 23행 수정됨
2026-02-15 22:21:31,cw (ngc7331cw@gmail.com),[승인 요청] 세금 납부 - cw
2026-02-15 22:21:56,cw (ngc7331cw@gmail.com),[승인 요청] 세금 납부 - cw
2026-02-17 12:13:27,cw (ngc7331cw@gmail.com),[승인 요청] 세금 납부 - cw
2026-02-17 18:52:04,cw (ngc7331cw@gmail.com),[승인 요청] 회비 납부 - cw
2026-02-18 16:51:42,dk (ngc7331dk@gmail.com),[승인 요청] 세금 납부 - dk
2026-02-18 17:16:17,부모님 (taeoh0311@gmail.com),[승인 완료] 세금 납부 - cw: 30,000원, dk: 0원
2026-02-18 18:13:36,부모님 (taeoh0311@gmail.com),[승인 완료] 세금 납부 - cw: 1,300원, dk: 0원
2026-02-18 18:14:03,부모님 (taeoh0311@gmail.com),[세금 사용] 떡볶이 (cw: -8,500원, dk: -8,500원)
2026-02-18 18:14:39,부모님 (taeoh0311@gmail.com),[세금 사용] 테스트 (cw: -8,500원, dk: -8,500원)
2026-02-18 18:15:02,부모님 (taeoh0311@gmail.com),[세금 사용] 테스트 (cw: -17,000원, dk: -0원)
2026-02-18 18:15:28,부모님 (taeoh0311@gmail.com),2026년 28행 삭제됨
2026-02-18 18:15:39,부모님 (taeoh0311@gmail.com),2026년 27행 삭제됨
2026-02-22 19:48:17,cw (ngc7331cw@gmail.com),[승인 요청] 세금 납부 - cw
2026-02-23 01:26:25,부모님 (taeoh0311@gmail.com),[승인 완료] 세금 납부 - cw: 20,000원, dk: 0원
2026-02-23 01:47:51,부모님 (taeoh0311@gmail.com),[승인 완료] 회비 납부 - cw: -5,000원, dk: -3,000원
2026-02-23 01:48:07,부모님 (taeoh0311@gmail.com),[승인 완료] 세금 납부 - cw: 0원, dk: 20,000원
2026-02-23 01:48:25,부모님 (taeoh0311@gmail.com),[승인 완료] 세금 납부 - cw: 1,300원, dk: 0원
2026-03-01 01:04:23,cw (ngc7331cw@gmail.com),[승인 요청] 세금 납부 - cw
2026-03-01 15:35:50,부모님 (taeoh0311@gmail.com),[승인 완료] 세금 납부 - cw: 1,300원, dk: 0원
2026-03-09 17:28:02,dk (ngc7331dk@gmail.com),[승인 요청] 세금 납부 - dk
2026-03-10 01:40:27,cw (ngc7331cw@gmail.com),[승인 요청] 세금 납부 - cw
2026-03-10 12:38:15,부모님 (taeoh0311@gmail.com),[승인 완료] 세금 납부 - cw: 1,300원, dk: 0원
2026-03-10 12:38:26,부모님 (taeoh0311@gmail.com),[승인 완료] 세금 납부 - cw: 0원, dk: 700원
2026-03-16 00:48:22,cw (ngc7331cw@gmail.com),[승인 요청] 세금 납부 - cw
2026-03-16 20:28:19,dk (ngc7331dk@gmail.com),[승인 요청] 세금 납부 - dk
2026-03-16 20:28:27,dk (ngc7331dk@gmail.com),[승인 요청] 세금 납부 - dk
2026-03-19 02:12:00,부모님 (taeoh0311@gmail.com),[승인 완료] 세금 납부 - cw: 1,100원, dk: 0원
2026-03-19 02:12:16,부모님 (taeoh0311@gmail.com),[승인 완료] 세금 납부 - cw: 0원, dk: 500원
2026-03-19 02:12:27,부모님 (taeoh0311@gmail.com),[승인 완료] 세금 납부 - cw: 0원, dk: 500원
2026-03-23 02:12:57,cw (ngc7331cw@gmail.com),[승인 요청] 세금 납부 - cw
2026-03-23 18:01:38,cw (ngc7331cw@gmail.com),[승인 요청] 회비 납부 - cw""";

  // 4. 승인 대기 데이터 (CSV) - 누락분 추가
  static const String dataApprovals = r"""신청일시,신청자,작업유형,cw,dk,메모,날짜,상세정보
2026-03-22 10:00:00,cw,세금 납부,1100,0,용돈,2026-03-22,"용돈: 11,000원, 세금: 1,100원"
2026-03-17 15:00:00,cw,회비 납부,-5000,-3000,3월 회비,2026-03-17,"cw: 5,000원, dk: 3,000원" """;

  // 🚀 마이그레이션 실행 함수 (v6: 데이터 필드 전수 조사 및 보정 버전)
  static Future<void> runMigration() async {
    final prefs = await SharedPreferences.getInstance();
    
    // v8 강제 재실행 여부 체크 (2025년 누락 데이터 복구 v8)
    if (prefs.getBool('is_migrated_v8') ?? false) {
      debugPrint("✅ 이미 데이터 8차 정밀 복구(v8)가 완료되었습니다.");
      return;
    }

    debugPrint("🚀 [v8] 2025년 누락 데이터 포함 초정밀 복구 시작...");

    try {
      // [0단계: 기존 데이터 초기화 (v8 재작업을 위한 클린업)]
      // 중복 방지를 위해 기존의 모든 history와 approvals를 먼저 삭제합니다.
      final cwHistory = await _db.collection('taxes').doc('cw').collection('history').get();
      for (var doc in cwHistory.docs) await doc.reference.delete();
      
      final dkHistory = await _db.collection('taxes').doc('dk').collection('history').get();
      for (var doc in dkHistory.docs) await doc.reference.delete();

      final approvals = await _db.collection('approvals').get();
      for (var doc in approvals.docs) await doc.reference.delete();

      final batch = _db.batch();
      int cwTotal = 0;
      int dkTotal = 0;

      // [1단계: 하드코딩된 예전 데이터(2024-2026) 처리]
      final fullData = data2024 + "\n" + data20252026;
      final csvLines = fullData.split("\n");

      for (var line in csvLines) {
        if (line.isEmpty || line.startsWith("날짜")) continue;
        final parts = line.split(",");
        if (parts.length < 4) continue;

        final dateStr = parts[0].trim();
        final cwVal = _parseAmount(parts[1]);
        final dkVal = _parseAmount(parts[2]);
        final memo = parts[3].trim();

        DateTime timestamp;
        try {
          timestamp = DateTime.parse(dateStr);
        } catch (e) {
          timestamp = DateTime.now();
        }

        if (cwVal != 0) {
          cwTotal += cwVal;
          final docRef = _db.collection('taxes').doc('cw').collection('history').doc();
          batch.set(docRef, {
            'requester': 'cw',
            'description': memo.isEmpty ? '기본 내역' : memo,
            'amount': cwVal.abs(),
            'type': cwVal > 0 ? 'payment' : 'usage',
            'status': 'approved',
            'timestamp': Timestamp.fromDate(timestamp),
          });
        }

        if (dkVal != 0) {
          dkTotal += dkVal;
          final docRef = _db.collection('taxes').doc('dk').collection('history').doc();
          batch.set(docRef, {
            'requester': 'dk',
            'description': memo.isEmpty ? '기본 내역' : memo,
            'amount': dkVal.abs(),
            'type': dkVal > 0 ? 'payment' : 'usage',
            'status': 'approved',
            'timestamp': Timestamp.fromDate(timestamp),
          });
        }
      }

      // [2단계: 서버(Firestore)의 '나' 데이터 검색 및 정밀 이관]
      final legacySnap = await _db.collection('transactions').where('user', isEqualTo: '나').get();
      debugPrint("🔍 '나'로 표시된 이전 기록 ${legacySnap.docs.length}개를 정밀 분석합니다.");

      for (var doc in legacySnap.docs) {
        final data = doc.data();
        final cwVal = _parseAmount(data['cw']?.toString() ?? '0');
        final dkVal = _parseAmount(data['dk']?.toString() ?? '0');
        
        // 🔍 모든 가능성 있는 필드 조사 (데이터 유실 방지 핵심)
        String memo = data['description']?.toString() ?? 
                     data['메모']?.toString() ?? 
                     data['내용']?.toString() ?? 
                     data['title']?.toString() ?? 
                     data['note']?.toString() ?? 
                     "";
        
        if (memo.isEmpty) memo = "서버 데이터";

        final dateStr = data['date']?.toString() ?? '';
        Timestamp? timestamp;
        if (data['timestamp'] is Timestamp) {
          timestamp = data['timestamp'] as Timestamp;
        } else if (dateStr.isNotEmpty) {
          try {
            timestamp = Timestamp.fromDate(DateTime.parse(dateStr));
          } catch (_) {}
        }
        timestamp ??= Timestamp.now();

        if (cwVal != 0) {
          cwTotal += cwVal;
          final docRef = _db.collection('taxes').doc('cw').collection('history').doc();
          batch.set(docRef, {
            'requester': 'cw',
            'description': memo,
            'amount': cwVal.abs(),
            'type': cwVal > 0 ? 'payment' : 'usage',
            'status': 'approved',
            'timestamp': timestamp,
          });
        }

        if (dkVal != 0) {
          dkTotal += dkVal;
          final docRef = _db.collection('taxes').doc('dk').collection('history').doc();
          batch.set(docRef, {
            'requester': 'dk',
            'description': memo,
            'amount': dkVal.abs(),
            'type': dkVal > 0 ? 'payment' : 'usage',
            'status': 'approved',
            'timestamp': timestamp,
          });
        }
      }

      // [3단계: 최종 합계 업데이트 (v6: 중복 방지를 위해 전체 합산값으로 직접 갱신)]
      final cwFinalRefund = (cwTotal * 0.3).round();
      final dkFinalRefund = (dkTotal * 0.3).round();

      batch.set(_db.collection('taxes').doc('cw'), {
        'totalTax': cwTotal,
        'totalRefund': cwFinalRefund,
        'lastUpdated': FieldValue.serverTimestamp(),
        'is_migrated_v8': true,
      }, SetOptions(merge: true));

      batch.set(_db.collection('taxes').doc('dk'), {
        'totalTax': dkTotal,
        'totalRefund': dkFinalRefund,
        'lastUpdated': FieldValue.serverTimestamp(),
        'is_migrated_v8': true,
      }, SetOptions(merge: true));

      // [4단계: 승인 대기 데이터(Approvals) 이관]
      final approvalLines = dataApprovals.split("\n");
      for (var line in approvalLines) {
        if (line.isEmpty || line.startsWith("신청일시")) continue;
        final parts = _splitCsvLine(line);
        if (parts.length < 8) continue;

        final requester = parts[1].trim();
        final actionType = parts[2].trim();
        final cwVal = _parseAmount(parts[3]);
        final dkVal = _parseAmount(parts[4]);
        final memo = parts[5].trim();
        final dateStr = parts[6].trim();
        final details = parts[7].trim();

        final approvalRef = _db.collection('approvals').doc();
        batch.set(approvalRef, {
          'requester': requester,
          'description': memo.isEmpty ? '승인 대기' : memo,
          'amount': (cwVal == 0 ? dkVal : cwVal).abs(),
          'type': actionType == "세금 사용" ? "usage" : "payment",
          'status': 'pending',
          'timestamp': Timestamp.fromDate(DateTime.parse(dateStr)),
          'details': details,
          'cw': cwVal,
          'dk': dkVal,
        });
      }

      await batch.commit();
      await prefs.setBool('is_migrated_v8', true);
      debugPrint("✅ [v8] 2025년 데이터 복구 포함 마이그레이션 최종 완료!");
    } catch (e) {
      debugPrint("❌ [v8] 마이그레이션 에러: $e");
    }
  }

  static int _parseAmount(String val) {
    if (val.isEmpty) return 0;
    // ₩1,300 또는 -44000 등 처리
    final clean = val.replaceAll("₩", "").replaceAll(",", "").replaceAll("원", "").trim();
    return int.tryParse(clean) ?? 0;
  }

  static List<String> _splitCsvLine(String line) {
    // 쉼표가 따옴표 안에 있는 경우 무시하는 간단한 CSV 파서
    final result = <String>[];
    bool inQuotes = false;
    StringBuffer sb = StringBuffer();

    for (int i = 0; i < line.length; i++) {
        String char = line[i];
        if (char == '"') {
            inQuotes = !inQuotes;
        } else if (char == ',' && !inQuotes) {
            result.add(sb.toString());
            sb.clear();
        } else {
            sb.write(char);
        }
    }
    result.add(sb.toString());
    return result;
  }
}
