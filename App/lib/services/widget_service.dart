import 'package:home_widget/home_widget.dart';

class WidgetService {
  static const String androidWidgetName = 'MyHomeTaxWidget';

  static Future<void> updateLogoutState() async {
    await HomeWidget.saveWidgetData('isLoggedIn', false);
    await HomeWidget.updateWidget(name: androidWidgetName);
  }

  static Future<void> updateWidgetData({
    required int pendingCount,
    required String cwTotal,
    required String cwRefund,
    required String dkTotal,
    required String dkRefund,
    required String userRole, // 'parent', 'cw', 'dk'
  }) async {
    final now = DateTime.now();
    final timeStr = '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}';

    await HomeWidget.saveWidgetData('isLoggedIn', true);
    await HomeWidget.saveWidgetData('userRole', userRole);
    await HomeWidget.saveWidgetData('pendingCount', pendingCount);
    await HomeWidget.saveWidgetData('cwTotal', cwTotal);
    await HomeWidget.saveWidgetData('cwRefund', cwRefund);
    await HomeWidget.saveWidgetData('dkTotal', dkTotal);
    await HomeWidget.saveWidgetData('dkRefund', dkRefund);
    await HomeWidget.saveWidgetData('updateTime', timeStr);

    await HomeWidget.updateWidget(name: androidWidgetName);
  }
}
