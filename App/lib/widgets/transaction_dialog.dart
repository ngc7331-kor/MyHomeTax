import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:intl/intl.dart';

class TransactionDialog extends StatefulWidget {
  const TransactionDialog({super.key});

  @override
  State<TransactionDialog> createState() => _TransactionDialogState();
}

class _TransactionDialogState extends State<TransactionDialog> {
  final _formKey = GlobalKey<FormState>();
  final _descriptionController = TextEditingController();
  final _amountCwController = TextEditingController();
  final _amountDkController = TextEditingController();
  DateTime _selectedDate = DateTime.now();
  bool _isJoint = true;

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      backgroundColor: const Color(0xFF2C3E50),
      title: const Text('새 내역 추가', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      content: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildDatePicker(),
              const SizedBox(height: 16),
              _buildTextField(_descriptionController, '내용 (예: 설거지, 용돈)', Icons.edit),
              const SizedBox(height: 16),
              _buildJointToggle(),
              const SizedBox(height: 16),
              if (_isJoint) 
                _buildTextField(_amountCwController, '공동 금액 (입금+, 출금-)', Icons.money)
              else ...[
                _buildTextField(_amountCwController, '채원 금액', Icons.person, color: Colors.pinkAccent),
                const SizedBox(height: 12),
                _buildTextField(_amountDkController, '도권 금액', Icons.person, color: Colors.lightBlueAccent),
              ],
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('취소', style: TextStyle(color: Colors.white54)),
        ),
        ElevatedButton(
          onPressed: _submit,
          style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF4A90E2)),
          child: const Text('저장', style: TextStyle(color: Colors.white)),
        ),
      ],
    );
  }

  Widget _buildDatePicker() {
    return InkWell(
      onTap: () async {
        final picked = await showDatePicker(
          context: context,
          initialDate: _selectedDate,
          firstDate: DateTime(2020),
          lastDate: DateTime(2100),
        );
        if (picked != null) setState(() => _selectedDate = picked);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.1),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          children: [
            const Icon(Icons.calendar_today, color: Colors.white70, size: 20),
            const SizedBox(width: 12),
            Text(
              DateFormat('yyyy-MM-dd').format(_selectedDate),
              style: const TextStyle(color: Colors.white, fontSize: 16),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildJointToggle() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        const Text('공동 입력', style: TextStyle(color: Colors.white70)),
        Switch(
          value: _isJoint,
          onChanged: (val) => setState(() {
            _isJoint = val;
            _amountCwController.clear();
            _amountDkController.clear();
          }),
          activeColor: const Color(0xFF4A90E2),
        ),
      ],
    );
  }

  Widget _buildTextField(TextEditingController controller, String hint, IconData icon, {Color? color}) {
    return TextFormField(
      controller: controller,
      style: const TextStyle(color: Colors.white),
      keyboardType: controller == _descriptionController ? TextInputType.text : TextInputType.number,
      decoration: InputDecoration(
        prefixIcon: Icon(icon, color: color ?? Colors.white70),
        hintText: hint,
        hintStyle: const TextStyle(color: Colors.white30),
        filled: true,
        fillColor: Colors.white.withOpacity(0.05),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
      ),
    );
  }

  void _submit() async {
    if (!_formKey.currentState!.validate()) return;

    final dateStr = DateFormat('yyyy-MM-dd').format(_selectedDate);
    final description = _descriptionController.text.trim();
    int cw = 0;
    int dk = 0;

    if (_isJoint) {
      cw = int.tryParse(_amountCwController.text) ?? 0;
      dk = cw; // 공동이면 동일하게 적용
    } else {
      cw = int.tryParse(_amountCwController.text) ?? 0;
      dk = int.tryParse(_amountDkController.text) ?? 0;
    }

    try {
      await FirebaseFirestore.instance.collection('transactions').add({
        'date': dateStr,
        'description': description,
        'cw': cw,
        'dk': dk,
        'user': '나',
        'timestamp': FieldValue.serverTimestamp(),
      });
      if (mounted) Navigator.pop(context);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('오류: $e')));
    }
  }
}
