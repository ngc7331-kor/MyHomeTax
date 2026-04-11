import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../services/database_service.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class TransactionForm extends StatefulWidget {
  const TransactionForm({super.key});

  @override
  State<TransactionForm> createState() => _TransactionFormState();
}

class _TransactionFormState extends State<TransactionForm> {
  final DatabaseService _dbService = DatabaseService();
  final _amountController = TextEditingController();
  final _descriptionController = TextEditingController();
  
  String _category = 'payment'; // 'payment' (납부), 'usage' (사용)
  String _usageType = 'general'; // 'general' (일반), 'membership' (회비)
  String? _target; // 'cw', 'dk', 'both'
  DateTime _selectedDate = DateTime.now();

  int get _calculatedTax => (_parseAmount(_amountController.text) * 0.1).round();

  int _parseAmount(String val) {
    return int.tryParse(val.replaceAll(RegExp(r'[^0-9]'), '')) ?? 0;
  }

  @override
  void initState() {
    super.initState();
    _amountController.addListener(() {
      if (mounted) setState(() {});
    });
  }

  void _resetFields() {
    setState(() {
      _target = null;
      _amountController.clear();
      _descriptionController.clear();
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF111827) : const Color(0xFFF3F4F6),
      body: Column(
        children: [
          // 💎 Premium Header with Safe Area Protection
          Container(
            padding: EdgeInsets.only(top: MediaQuery.of(context).padding.top + 20, bottom: 20, left: 24, right: 24),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1F2937) : Colors.white,
              borderRadius: const BorderRadius.vertical(bottom: Radius.circular(30)),
              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)],
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: Icon(Icons.close_rounded, color: isDark ? Colors.white70 : Colors.black54),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                ),
                Text(
                  '내역 등록',
                  style: GoogleFonts.notoSansKr(fontSize: 20, fontWeight: FontWeight.bold, color: isDark ? Colors.white : Colors.black87),
                ),
                const SizedBox(width: 32), // Balance for back button
              ],
            ),
          ),
          
          Expanded(
            child: SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 24),
                  
                  _buildSectionTitle('유형'),
                  _buildCategorySelector(),
                  const SizedBox(height: 28),

                  _buildSectionTitle('날짜'),
                  _buildInfoCard(
                    child: ListTile(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16),
                      leading: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(color: Colors.blueAccent.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
                        child: const Icon(Icons.calendar_month_rounded, color: Colors.blueAccent, size: 20),
                      ),
                      title: Text(DateFormat('yyyy년 MM월 dd일').format(_selectedDate), style: const TextStyle(fontWeight: FontWeight.w600)),
                      trailing: const Icon(Icons.keyboard_arrow_down_rounded, color: Colors.grey),
                      onTap: () async {
                        final picked = await showDatePicker(
                          context: context,
                          initialDate: _selectedDate,
                          firstDate: DateTime(2020),
                          lastDate: DateTime(2100),
                        );
                        if (picked != null) setState(() => _selectedDate = picked);
                      },
                    ),
                  ),
                  const SizedBox(height: 28),
                  
                  if (_category == 'usage') ...[
                    _buildSectionTitle('항목'),
                    Row(
                      children: [
                        _buildSubOptionButton('💳 일반 소비', 'general'),
                        const SizedBox(width: 12),
                        _buildSubOptionButton('🏆 회비/기타', 'membership'),
                      ],
                    ),
                    const SizedBox(height: 28),
                  ],

                  _buildSectionTitle('대상'),
                  _buildTargetSelector(),
                  const SizedBox(height: 28),

                  if (!(_category == 'usage' && _usageType == 'membership')) ...[
                    _buildSectionTitle('내용'),
                    _buildInfoCard(
                      child: TextField(
                        controller: _descriptionController,
                        style: const TextStyle(fontSize: 16),
                        decoration: const InputDecoration(
                          hintText: '내용을 입력해주세요',
                          hintStyle: TextStyle(fontSize: 14, color: Colors.grey),
                          contentPadding: EdgeInsets.all(18),
                          border: InputBorder.none,
                        ),
                      ),
                    ),
                    const SizedBox(height: 28),
                  ],

                  _buildSectionTitle('금액'),
                  _buildInfoCard(
                    child: TextField(
                      controller: _amountController,
                      keyboardType: TextInputType.number,
                      style: GoogleFonts.notoSansKr(fontSize: 26, fontWeight: FontWeight.bold, color: Colors.blueAccent),
                      decoration: const InputDecoration(
                        hintText: '0',
                        suffixText: '원',
                        suffixStyle: TextStyle(fontSize: 18, color: Colors.grey),
                        contentPadding: EdgeInsets.all(18),
                        border: InputBorder.none,
                      ),
                    ),
                  ),
                  
                  if (_category == 'payment') ...[
                    const SizedBox(height: 12),
                    _buildTaxInfoBox(),
                  ],

                  if (_category == 'usage' && _target == 'both') ...[
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      decoration: BoxDecoration(color: Colors.orange.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
                      child: const Row(
                        children: [
                          Icon(Icons.lightbulb_outline, size: 16, color: Colors.orange),
                          SizedBox(width: 8),
                          Text('공동 선택 시 각각 50%씩 차감됩니다.', style: TextStyle(color: Colors.orange, fontSize: 13, fontWeight: FontWeight.w500)),
                        ],
                      ),
                    ),
                  ],
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
          
          // 🛡️ Safe Area Bottom Button
          Container(
            padding: EdgeInsets.only(left: 24, right: 24, top: 16, bottom: MediaQuery.of(context).padding.bottom + 16),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF111827) : Colors.white,
              border: Border(top: BorderSide(color: isDark ? Colors.white10 : Colors.black.withOpacity(0.05))),
            ),
            child: SizedBox(
              width: double.infinity,
              height: 58,
              child: ElevatedButton(
                onPressed: _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blueAccent,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  elevation: 0,
                ),
                child: const Text('등록하기', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCategorySelector() {
    return Row(
      children: [
        _buildTypeButton('납부', 'payment', Icons.account_balance_wallet_outlined),
        const SizedBox(width: 12),
        _buildTypeButton('사용', 'usage', Icons.shopping_bag_outlined),
      ],
    );
  }

  Widget _buildTypeButton(String label, String value, IconData icon) {
    bool isSelected = _category == value;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Expanded(
      child: GestureDetector(
        onTap: () {
          if (_category != value) {
            _category = value;
            _resetFields();
          }
        },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 18),
          decoration: BoxDecoration(
            color: isSelected ? Colors.blueAccent : (isDark ? Colors.grey.withOpacity(0.05) : Colors.white),
            borderRadius: BorderRadius.circular(15),
            boxShadow: isSelected ? [BoxShadow(color: Colors.blueAccent.withOpacity(0.3), blurRadius: 10, offset: const Offset(0, 4))] : [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 5)],
          ),
          child: Column(
            children: [
              Icon(icon, color: isSelected ? Colors.white : Colors.grey, size: 24),
              const SizedBox(height: 8),
              Text(label, style: TextStyle(color: isSelected ? Colors.white : Colors.grey, fontWeight: FontWeight.bold, fontSize: 15)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSubOptionButton(String label, String value) {
    bool isSelected = _usageType == value;
    return Expanded(
      child: GestureDetector(
        onTap: () {
          if (_usageType != value) {
            _usageType = value;
            _resetFields();
          }
        },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            color: isSelected ? Colors.blueAccent.withOpacity(0.1) : Colors.transparent,
            border: Border.all(color: isSelected ? Colors.blueAccent : Colors.grey.withOpacity(0.2)),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Center(
            child: Text(label, style: TextStyle(color: isSelected ? Colors.blueAccent : Colors.grey, fontWeight: FontWeight.bold)),
          ),
        ),
      ),
    );
  }

  Widget _buildTargetSelector() {
    List<String> targets = ['cw', 'dk'];
    if (_category == 'usage' && _usageType != 'membership') targets.add('both');

    return Row(
      children: targets.map((t) {
        bool isSelected = _target == t;
        String label = t == 'cw' ? '채원' : (t == 'dk' ? '도권' : '함께');
        return Expanded(
          child: GestureDetector(
            onTap: () => setState(() => _target = t),
            child: Container(
              margin: const EdgeInsets.only(right: 8),
              padding: const EdgeInsets.symmetric(vertical: 14),
              decoration: BoxDecoration(
                color: isSelected ? Colors.blueAccent.withOpacity(0.1) : Colors.transparent,
                border: Border.all(color: isSelected ? Colors.blueAccent : Colors.grey.withOpacity(0.2)),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Center(
                child: Text(label, style: TextStyle(color: isSelected ? Colors.blueAccent : Colors.grey, fontWeight: FontWeight.bold)),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12, top: 8),
      child: Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.grey)),
    );
  }

  Widget _buildInfoCard({required Widget child, EdgeInsets? padding}) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: isDark ? Colors.white.withOpacity(0.03) : Colors.white,
        borderRadius: BorderRadius.circular(15),
        border: Border.all(color: isDark ? Colors.white.withOpacity(0.05) : Colors.black.withOpacity(0.02)),
      ),
      child: child,
    );
  }

  Widget _buildTaxInfoBox() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.blue.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          const Text('납부할 세금 (10%)', style: TextStyle(color: Colors.blueAccent, fontWeight: FontWeight.bold, fontSize: 13)),
          Text('${_calculatedTax.toString().replaceAllMapped(RegExp(r"(\d{1,3})(?=(\d{3})+(?!\d))"), (Match m) => "${m[1]},")}원', 
               style: const TextStyle(color: Colors.blueAccent, fontWeight: FontWeight.bold, fontSize: 18)),
        ],
      ),
    );
  }

  Widget _buildSubmitButton() {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: SizedBox(
        width: double.infinity,
        height: 60,
        child: ElevatedButton(
          onPressed: _submit,
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.blueAccent,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
            elevation: 8,
            shadowColor: Colors.blueAccent.withOpacity(0.4),
          ),
          child: const Text('등록하기', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
        ),

      ),
    );
  }

  void _submit() async {
    if (_target == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('대상을 선택해주세요.')));
      return;
    }

    final amount = _parseAmount(_amountController.text);
    if (amount <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('금액을 입력해주세요.')));
      return;
    }

    final realDescription = _usageType == 'membership' ? '월 회비' : _descriptionController.text.trim();
    if (realDescription.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('내용을 입력해주세요.')));
      return;
    }

    try {
      if (_target == 'both') {
        await _dbService.requestTogetherAction(realDescription, amount, _selectedDate);
      } else {
        final tx = TaxTransaction(
          id: '',
          requester: _target!,
          description: realDescription,
          amount: _category == 'payment' ? _calculatedTax : amount,
          type: _category,
          status: 'pending',
          timestamp: _selectedDate,
          isMembership: _usageType == 'membership',
        );
        await _dbService.requestTaxAction(tx);
      }
      
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('승인 요청이 등록되었습니다.')));
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('등록 실패: $e')));
    }
  }
}
