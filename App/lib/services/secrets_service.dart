import 'dart:convert';
import 'package:flutter/services.dart';

class SecretsService {
  static final SecretsService _instance = SecretsService._internal();
  factory SecretsService() => _instance;
  SecretsService._internal();

  List<String> _parentEmails = [];
  List<String> _cwEmails = [];
  List<String> _dkEmails = [];
  String _parentName = '태오';
  String _cwName = '채원';
  String _dkName = '도권';
  bool _isLoaded = false;

  Future<void> load() async {
    if (_isLoaded) return;
    try {
      final jsonString = await rootBundle.loadString('assets/secrets/secrets.json');
      final data = json.decode(jsonString);
      
      _parentEmails = List<String>.from(data['parent_emails'] ?? []);
      _cwEmails = List<String>.from(data['cw_emails'] ?? []);
      _dkEmails = List<String>.from(data['dk_emails'] ?? []);
      _parentName = data['parent_name'] ?? '태오';
      _cwName = data['cw_name'] ?? '채원';
      _dkName = data['dk_name'] ?? '도권';
      _isLoaded = true;
    } catch (e) {
      // 로드 실패 시 기본 하드코딩 백업
      _parentName = '태오';
      _cwName = '채원';
      _dkName = '도권';
    }
  }

  List<String> get parentEmails => _parentEmails;
  List<String> get cwEmails => _cwEmails;
  List<String> get dkEmails => _dkEmails;
  String get parentName => _parentName;
  String get cwName => _cwName;
  String get dkName => _dkName;

  String getUserRole(String? email) {
    if (email == null) return 'none';
    if (_parentEmails.contains(email)) return 'parent';
    if (_cwEmails.contains(email)) return 'cw';
    if (_dkEmails.contains(email)) return 'dk';
    return 'none';
  }

  bool isParent(String? email) {
    if (email == null) return false;
    return _parentEmails.contains(email);
  }
}
