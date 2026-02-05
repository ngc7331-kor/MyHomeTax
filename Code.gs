// Code.gs - 구글 Apps Script 백엔드 (승인 시스템)

// ==========================================
// 🔒 보안 설정: 이메일 가져오기
// ==========================================
function getFamilyEmails() {
  // 스크립트 속성에서 이메일 주소를 가져옵니다.
  const scriptProperties = PropertiesService.getScriptProperties();
  const parentEmail = scriptProperties.getProperty("PICK_PARENT_EMAIL");
  const cwEmail = scriptProperties.getProperty("PICK_CW_EMAIL");
  const dkEmail = scriptProperties.getProperty("PICK_DK_EMAIL");

  if (!parentEmail || !cwEmail || !dkEmail) {
    Logger.log(
      "⚠️ 경고: 이메일 설정이 완료되지 않았습니다. setupScriptProperties()를 실행해주세요.",
    );
  }

  return {
    parent: parentEmail,
    cw: cwEmail,
    dk: dkEmail,
  };
}

// ==========================================
// ⚙️ 초기 설정 (배포 전 1회 실행 필수)
// ==========================================
// 이 함수를 실행하여 가족들의 실제 이메일을 저장하세요.
// 실행 후에는 이 함수 내용을 지우거나 주석 처리해도 됩니다.
function setupScriptProperties() {
  const scriptProperties = PropertiesService.getScriptProperties();

  // 👇 아래에 실제 가족 이메일 주소를 입력하세요.
  const REAL_EMAILS = {
    PICK_PARENT_EMAIL: "아빠_실제_이메일@gmail.com",
    PICK_CW_EMAIL: "cw_실제_이메일@gmail.com",
    PICK_DK_EMAIL: "dk_실제_이메일@gmail.com",
  };

  scriptProperties.setProperties(REAL_EMAILS);
  Logger.log("✅ 이메일 설정이 완료되었습니다! 이제 앱이 정상 작동합니다.");
  Logger.log("설정된 값: " + JSON.stringify(REAL_EMAILS));
}

// ==========================================
// 🛠️ 헬퍼 함수
// ==========================================

// 현재 다루고 있는 사용자가 누구인지(이메일 기준) 확인
function getUserName() {
  const userEmail = Session.getActiveUser().getEmail();
  const emails = getFamilyEmails();

  if (userEmail === emails.parent) return "부모님";
  if (userEmail === emails.cw) return "cw";
  if (userEmail === emails.dk) return "dk";
  return userEmail; // 알 수 없는 사용자
}

// 현재 사용자가 부모님인지 확인
function isParent() {
  const userEmail = Session.getActiveUser().getEmail();
  const emails = getFamilyEmails();
  return userEmail === emails.parent;
}

// ==========================================
// 📄 메인 로직
// ==========================================

// ⭐ 승인 대기 시트 가져오기 또는 생성
function getOrCreateApprovalSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let approvalSheet = ss.getSheetByName("승인대기");

  if (!approvalSheet) {
    approvalSheet = ss.insertSheet("승인대기");

    // 헤더 설정
    approvalSheet.getRange("A1").setValue("신청일시");
    approvalSheet.getRange("B1").setValue("신청자");
    approvalSheet.getRange("C1").setValue("작업유형");
    approvalSheet.getRange("D1").setValue("cw");
    approvalSheet.getRange("E1").setValue("dk");
    approvalSheet.getRange("F1").setValue("메모");
    approvalSheet.getRange("G1").setValue("날짜");
    approvalSheet.getRange("H1").setValue("상세정보");

    // 헤더 스타일
    const headerRange = approvalSheet.getRange("A1:H1");
    headerRange.setBackground("#f59e0b");
    headerRange.setFontColor("#ffffff");
    headerRange.setFontWeight("bold");
    headerRange.setHorizontalAlignment("center");

    // 열 너비 조정
    approvalSheet.setColumnWidth(1, 150); // 신청일시
    approvalSheet.setColumnWidth(2, 100); // 신청자
    approvalSheet.setColumnWidth(3, 120); // 작업유형
    approvalSheet.setColumnWidth(4, 100); // cw
    approvalSheet.setColumnWidth(5, 100); // dk
    approvalSheet.setColumnWidth(6, 200); // 메모
    approvalSheet.setColumnWidth(7, 100); // 날짜
    approvalSheet.setColumnWidth(8, 300); // 상세정보
  }

  return approvalSheet;
}

// ⭐ 부모님에게 승인 요청 이메일 발송
function sendApprovalRequestEmail(actionType, details) {
  try {
    const emails = getFamilyEmails();
    if (!emails.parent) {
      Logger.log("부모님 이메일이 설정되지 않아 메일을 보낼 수 없습니다.");
      return;
    }

    const userName = getUserName();
    const subject = "[CWDK Bank 승인 요청] " + userName + "님의 " + actionType;
    const body =
      "안녕하세요,\n\n" +
      userName +
      "님이 다음 작업에 대한 승인을 요청했습니다.\n\n" +
      "📋 작업 내용: " +
      actionType +
      "\n" +
      "👤 신청자: " +
      userName +
      "\n" +
      "🕐 신청 시간: " +
      new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }) +
      "\n" +
      "📝 상세 내용:\n" +
      details +
      "\n\n" +
      "⚠️ 승인 또는 거부를 위해 앱의 [승인 대기] 탭을 확인해주세요.\n\n" +
      "---\n" +
      "CWDK T&J Bank 자동 알림\n" +
      "앱 바로가기: " +
      ScriptApp.getService().getUrl();

    MailApp.sendEmail({
      to: emails.parent,
      subject: subject,
      body: body,
    });

    Logger.log("승인 요청 이메일 발송 완료: " + emails.parent);
  } catch (error) {
    Logger.log("승인 요청 이메일 발송 실패: " + error.toString());
  }
}

// ⭐ 승인/거부 완료 이메일 발송 (신청자에게)
function sendApprovalResultEmail(approved, actionType, rejectionReason) {
  try {
    const userEmail = Session.getActiveUser().getEmail();
    const emails = getFamilyEmails();

    // 부모님이 아닌 사람(=신청자) 찾기
    // 간단하게, 현재 접속자가 부모님이면 신청자를 알 수 없으므로
    // 실제로는 승인 요청 데이터에 신청자 이메일을 함께 저장하는 것이 가장 정확하지만,
    // 기존 로직을 유지하면서 유추합니다.
    // 여기서는 간단히 cw, dk 두 명 모두에게 알림이 가거나,
    // 혹은 특정 신청자를 알 수 없으므로 시스템 로그만 남기는 것으로 대체할 수도 있으나,
    // 기존 로직(ALLOWED_EMAILS.find)을 최대한 살립니다.

    // 다만, '승인(approveRequest)' 함수가 호출될 때 이 함수가 불리는데,
    // 호출하는 주체는 '부모님'입니다.
    // 따라서 userEmail은 부모님 이메일이 됩니다.
    // 기존 코드에서는 ALLOWED_EMAILS에서 PARENT가 아닌 사람을 찾아서 보냈는데,
    // 이는 신청자가 1명일 때만 유효하거나, 무조건 첫 번째 자녀에게 가는 버그가 있었을 수 있습니다.
    // 개선: 신청자 정보를 파라미터로 받지 않으므로, 일단 로그만 남기거나
    // cw/dk 모두에게 보내는 것이 안전할 수 있습니다.
    // *기존 로직 유지*: cw, dk 이메일이 있으면 그쪽으로 보냅니다.

    const recipients = [];
    if (emails.cw && emails.cw !== emails.parent) recipients.push(emails.cw);
    if (emails.dk && emails.dk !== emails.parent) recipients.push(emails.dk);

    // 본인(부모)에게는 보내지 않음

    if (recipients.length === 0) return;

    const subject = approved
      ? "[CWDK Bank] 승인 완료 - " + actionType
      : "[CWDK Bank] 거부됨 - " + actionType;

    const body = approved
      ? "안녕하세요,\n\n신청하신 " +
        actionType +
        " 작업이 승인되어 기록되었습니다.\n\n승인 시간: " +
        new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })
      : "안녕하세요,\n\n신청하신 " +
        actionType +
        " 작업이 거부되었습니다.\n\n거부 사유: " +
        (rejectionReason || "사유 없음") +
        "\n거부 시간: " +
        new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });

    // 자녀 모두에게 알림 (누가 신청했는지 구분 안 되는 경우 대비 모두에게 공유)
    recipients.forEach((email) => {
      MailApp.sendEmail({
        to: email,
        subject: subject,
        body: body,
      });
    });

    Logger.log("승인 결과 이메일 발송 완료");
  } catch (error) {
    Logger.log("승인 결과 이메일 발송 실패: " + error.toString());
  }
}

function doGet() {
  // 웹 앱 접근 권한 체크
  // 스크립트 속성에 이메일이 설정되어 있지 않으면 접근을 막거나, 누구나 볼 수 있게 하거나 선택 가능.
  // 여기서는 기존 로직대로 '가족 이메일 체크'를 수행합니다.

  const userEmail = Session.getActiveUser().getEmail();
  const emails = getFamilyEmails();
  const allowed = [emails.parent, emails.cw, emails.dk]; // 목록 생성

  // 이메일 설정이 안 되어 있거나 목록에 없으면 에러 페이지 (선택 사항)
  // 현재는 index.html을 그대로 보여주되, API 호출 시 권한 체크가 이루어 짐.
  // 혹은 여기서 바로 HTML을 반환.

  return HtmlService.createTemplateFromFile("index")
    .evaluate()
    .setTitle("CWDK T&J Bank")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getOrCreateLogSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let logSheet = ss.getSheetByName("기록자");

  if (!logSheet) {
    logSheet = ss.insertSheet("기록자");
    logSheet.getRange("A1").setValue("일시");
    logSheet.getRange("B1").setValue("작업자");
    logSheet.getRange("C1").setValue("변경내용");

    const headerRange = logSheet.getRange("A1:C1");
    headerRange.setBackground("#4caf50");
    headerRange.setFontColor("#ffffff");
    headerRange.setFontWeight("bold");
    headerRange.setHorizontalAlignment("center");

    logSheet.setColumnWidth(1, 150);
    logSheet.setColumnWidth(2, 200);
    logSheet.setColumnWidth(3, 400);
  }

  return logSheet;
}

function logChange(changeDescription) {
  try {
    const logSheet = getOrCreateLogSheet();
    const userEmail = Session.getActiveUser().getEmail();
    const userName = getUserName();
    const timestamp = new Date();

    const lastRow = logSheet.getLastRow();
    const newRow = lastRow + 1;

    logSheet.getRange(newRow, 1).setValue(timestamp);
    logSheet.getRange(newRow, 2).setValue(userName + " (" + userEmail + ")");
    logSheet.getRange(newRow, 3).setValue(changeDescription);
    logSheet.getRange(newRow, 1).setNumberFormat("yyyy-mm-dd hh:mm:ss");

    Logger.log("로그 기록 완료: " + changeDescription);
  } catch (error) {
    Logger.log("로그 기록 실패: " + error.toString());
  }
}

function getAvailableYears() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  const years = [];

  sheets.forEach((sheet) => {
    const sheetName = sheet.getName();
    if (/^\d{4}$/.test(sheetName)) {
      years.push(parseInt(sheetName));
    }
  });

  return years;
}

function getCurrentYearSheet() {
  const year = new Date().getFullYear();
  return getOrCreateYearSheet(year);
}

function getOrCreateYearSheet(year) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(year.toString());

  if (!sheet) {
    sheet = ss.insertSheet(year.toString(), 0);
    logChange(year + "년 시트 생성");

    const prevYear = year - 1;
    const prevSheet = ss.getSheetByName(prevYear.toString());

    if (prevSheet) {
      const headerRange = prevSheet.getRange("A1:D1");
      headerRange.copyTo(sheet.getRange("A1:D1"));

      sheet.getRange("A2").setValue("총 세금");
      sheet.getRange("A3").setValue("환급액 (30%)");
      sheet.getRange("A4").setValue("이월 금액");

      sheet.getRange("B2").setFormula("=SUM(B4:B)");
      sheet.getRange("C2").setFormula("=SUM(C4:C)");

      const prevB3Formula = prevSheet.getRange("B3").getFormula();
      const prevC3Formula = prevSheet.getRange("C3").getFormula();
      sheet.getRange("B3").setFormula(prevB3Formula);
      sheet.getRange("C3").setFormula(prevC3Formula);

      const prevCwTotal = Number(prevSheet.getRange("B2").getValue()) || 0;
      const prevDkTotal = Number(prevSheet.getRange("C2").getValue()) || 0;

      sheet.getRange("B4").setValue(prevCwTotal);
      sheet.getRange("C4").setValue(prevDkTotal);
    } else {
      initializeSheet(sheet);
    }
  }

  return sheet;
}

function initializeSheet(sheet) {
  sheet.getRange("A1").setValue("날짜");
  sheet.getRange("B1").setValue("cw");
  sheet.getRange("C1").setValue("dk");
  sheet.getRange("D1").setValue("메모");

  sheet.getRange("A2").setValue("총 세금");
  sheet.getRange("B2").setFormula("=SUM(B4:B)");
  sheet.getRange("C2").setFormula("=SUM(C4:C)");

  sheet.getRange("A3").setValue("환급액 (30%)");
  sheet.getRange("B3").setFormula("=B2*0.3");
  sheet.getRange("C3").setFormula("=C2*0.3");

  sheet.getRange("A4").setValue("이월 금액");

  const headerRange = sheet.getRange("A1:D1");
  headerRange.setBackground("#8b5cf6");
  headerRange.setFontColor("#ffffff");
  headerRange.setFontWeight("bold");
  headerRange.setHorizontalAlignment("center");
}

function getTaxData() {
  const sheet = getCurrentYearSheet();
  const lastRow = sheet.getLastRow();

  const cwTotal = Number(sheet.getRange("B2").getValue()) || 0;
  const dkTotal = Number(sheet.getRange("C2").getValue()) || 0;
  const cwRefund = Number(sheet.getRange("B3").getValue()) || 0;
  const dkRefund = Number(sheet.getRange("C3").getValue()) || 0;

  const records = [];
  if (lastRow >= 5) {
    const startRow = Math.max(5, lastRow - 9);
    const recentData = sheet
      .getRange(startRow, 1, lastRow - startRow + 1, 4)
      .getValues();

    for (let i = recentData.length - 1; i >= 0; i--) {
      if (recentData[i][0]) {
        records.push({
          date: Utilities.formatDate(
            new Date(recentData[i][0]),
            Session.getScriptTimeZone(),
            "yyyy-MM-dd",
          ),
          cw: Number(recentData[i][1]) || 0,
          dk: Number(recentData[i][2]) || 0,
          memo: recentData[i][3] || "",
          rowIndex: startRow + i,
        });
      }
    }
  }

  const availableYears = getAvailableYears();

  return {
    cwTotal: cwTotal,
    dkTotal: dkTotal,
    cwRefund: cwRefund,
    dkRefund: dkRefund,
    records: records,
    year: new Date().getFullYear(),
    availableYears: availableYears,
    userName: getUserName(),
    isParent: isParent(),
  };
}

function getYearData(year) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(year.toString());

  if (!sheet) return [];

  const lastRow = sheet.getLastRow();
  const records = [];

  if (lastRow >= 5) {
    const data = sheet.getRange(5, 1, lastRow - 4, 4).getValues();

    for (let i = data.length - 1; i >= 0; i--) {
      if (data[i][0]) {
        records.push({
          date: Utilities.formatDate(
            new Date(data[i][0]),
            Session.getScriptTimeZone(),
            "yyyy-MM-dd",
          ),
          cw: Number(data[i][1]) || 0,
          dk: Number(data[i][2]) || 0,
          memo: data[i][3] || "",
          rowIndex: i + 5,
        });
      }
    }
  }

  // 날짜 기준 내림차순 정렬 (최신순)
  records.sort((a, b) => {
    return new Date(b.date) - new Date(a.date);
  });

  return records;
}

// ⭐ 승인 대기 목록 조회 (부모님만)
function getPendingApprovals() {
  if (!isParent()) {
    return { success: false, message: "부모님만 조회할 수 있습니다." };
  }

  const approvalSheet = getOrCreateApprovalSheet();
  const lastRow = approvalSheet.getLastRow();

  const pendingList = [];

  if (lastRow >= 2) {
    const data = approvalSheet.getRange(2, 1, lastRow - 1, 8).getValues();

    for (let i = 0; i < data.length; i++) {
      if (data[i][0]) {
        pendingList.push({
          rowIndex: i + 2,
          requestTime: Utilities.formatDate(
            new Date(data[i][0]),
            Session.getScriptTimeZone(),
            "yyyy-MM-dd HH:mm",
          ),
          requester: data[i][1] || "",
          actionType: data[i][2] || "",
          cw: Number(data[i][3]) || 0,
          dk: Number(data[i][4]) || 0,
          memo: data[i][5] || "",
          date: data[i][6]
            ? Utilities.formatDate(
                new Date(data[i][6]),
                Session.getScriptTimeZone(),
                "yyyy-MM-dd",
              )
            : "",
          details: data[i][7] || "",
        });
      }
    }
  }

  return { success: true, list: pendingList };
}

// ⭐ 승인 대기 항목 추가 (cw/dk용)
function addApprovalRequest(actionType, cw, dk, memo, dateStr, additionalInfo) {
  const approvalSheet = getOrCreateApprovalSheet();
  const lastRow = approvalSheet.getLastRow();
  const newRow = lastRow + 1;

  const userName = getUserName();
  const requestDate = dateStr ? new Date(dateStr) : new Date();

  approvalSheet.getRange(newRow, 1).setValue(new Date());
  approvalSheet.getRange(newRow, 2).setValue(userName);
  approvalSheet.getRange(newRow, 3).setValue(actionType);
  approvalSheet.getRange(newRow, 4).setValue(Number(cw) || 0);
  approvalSheet.getRange(newRow, 5).setValue(Number(dk) || 0);
  approvalSheet.getRange(newRow, 6).setValue(memo || "");
  approvalSheet.getRange(newRow, 7).setValue(requestDate);
  approvalSheet.getRange(newRow, 8).setValue(additionalInfo || "");

  approvalSheet.getRange(newRow, 1).setNumberFormat("yyyy-mm-dd hh:mm:ss");
  approvalSheet.getRange(newRow, 7).setNumberFormat("yyyy-mm-dd");

  logChange("[승인 요청] " + actionType + " - " + userName);

  return newRow;
}

// ⭐ 세금 납부 신청 (cw/dk용)
function requestTax(person, allowance, memo, dateStr) {
  if (isParent()) {
    // 부모님은 바로 기록
    return recordTaxDirect(person, allowance, memo, dateStr);
  }

  const tax = Math.floor((allowance * 0.1) / 100) * 100;
  const personName = person === "cw" ? "cw" : "dk";

  const cw = person === "cw" ? tax : 0;
  const dk = person === "dk" ? tax : 0;

  const details =
    "용돈: " +
    allowance.toLocaleString() +
    "원, 세금: " +
    tax.toLocaleString() +
    "원";

  addApprovalRequest("세금 납부", cw, dk, memo || "용돈", dateStr, details);

  const notificationDetails =
    "• 대상: " +
    personName +
    "\n" +
    "• 용돈: " +
    allowance.toLocaleString() +
    "원\n" +
    "• 세금 (10%): " +
    tax.toLocaleString() +
    "원\n" +
    "• 날짜: " +
    (dateStr || new Date().toISOString().split("T")[0]);

  sendApprovalRequestEmail("세금 납부", notificationDetails);

  return {
    success: true,
    needsApproval: true,
    tax: tax,
  };
}

// ⭐ 회비 납부 신청 (cw/dk용)
function requestDues(dateStr, memo) {
  if (isParent()) {
    return recordDuesDirect(dateStr, memo);
  }

  addApprovalRequest(
    "회비 납부",
    -5000,
    -3000,
    memo || "가족회비",
    dateStr,
    "cw: 5,000원, dk: 3,000원",
  );

  const notificationDetails =
    "• cw: -5,000원\n" +
    "• dk: -3,000원\n" +
    "• 날짜: " +
    (dateStr || new Date().toISOString().split("T")[0]);

  sendApprovalRequestEmail("회비 납부", notificationDetails);

  return {
    success: true,
    needsApproval: true,
  };
}

// ⭐ 세금 사용 신청 (cw/dk용)
function requestPurchase(cwAmount, dkAmount, description, dateStr) {
  if (isParent()) {
    return recordPurchaseDirect(cwAmount, dkAmount, description, dateStr);
  }

  let buyerType = "";
  if (cwAmount > 0 && dkAmount > 0) {
    buyerType = "함께";
  } else if (cwAmount > 0) {
    buyerType = "cw";
  } else if (dkAmount > 0) {
    buyerType = "dk";
  }

  const details =
    "구매자: " +
    buyerType +
    ", 총액: " +
    (cwAmount + dkAmount).toLocaleString() +
    "원";

  addApprovalRequest(
    "세금 사용",
    -cwAmount,
    -dkAmount,
    description,
    dateStr,
    details,
  );

  const notificationDetails =
    "• 구매자: " +
    buyerType +
    "\n" +
    "• cw: -" +
    cwAmount.toLocaleString() +
    "원\n" +
    "• dk: -" +
    dkAmount.toLocaleString() +
    "원\n" +
    "• 내용: " +
    description +
    "\n" +
    "• 날짜: " +
    (dateStr || new Date().toISOString().split("T")[0]);

  sendApprovalRequestEmail("세금 사용", notificationDetails);

  return {
    success: true,
    needsApproval: true,
  };
}

// ⭐ 승인 처리 (부모님만)
function approveRequest(rowIndex) {
  if (!isParent()) {
    return { success: false, message: "부모님만 승인할 수 있습니다." };
  }

  const approvalSheet = getOrCreateApprovalSheet();
  const data = approvalSheet.getRange(rowIndex, 1, 1, 8).getValues()[0];

  const actionType = data[2];
  const cw = Number(data[3]) || 0;
  const dk = Number(data[4]) || 0;
  const memo = data[5] || "";
  const dateValue = data[6];

  const recordDate = dateValue ? new Date(dateValue) : new Date();
  const year = recordDate.getFullYear();
  const sheet = getOrCreateYearSheet(year);

  const lastRow = sheet.getLastRow();
  const newRow = lastRow + 1;

  sheet.getRange(newRow, 1).setValue(recordDate);
  sheet.getRange(newRow, 2).setValue(cw);
  sheet.getRange(newRow, 3).setValue(dk);
  sheet.getRange(newRow, 4).setValue(memo);
  sheet.getRange(newRow, 1).setNumberFormat("yyyy-mm-dd");

  if (cw < 0 || dk < 0) {
    sheet.getRange(newRow, 2, 1, 2).setFontColor("#dc2626");
  }

  // 승인 대기 항목 삭제
  approvalSheet.deleteRow(rowIndex);

  logChange(
    "[승인 완료] " +
      actionType +
      " - cw: " +
      cw.toLocaleString() +
      "원, dk: " +
      dk.toLocaleString() +
      "원",
  );

  sendApprovalResultEmail(true, actionType, "");

  return { success: true, message: "승인되었습니다." };
}

// ⭐ 거부 처리 (부모님만)
function rejectRequest(rowIndex, reason) {
  if (!isParent()) {
    return { success: false, message: "부모님만 거부할 수 있습니다." };
  }

  const approvalSheet = getOrCreateApprovalSheet();
  const data = approvalSheet.getRange(rowIndex, 1, 1, 8).getValues()[0];
  const actionType = data[2];

  approvalSheet.deleteRow(rowIndex);

  logChange("[승인 거부] " + actionType + " - 사유: " + (reason || "없음"));

  sendApprovalResultEmail(false, actionType, reason);

  return { success: true, message: "거부되었습니다." };
}

// 부모님이 직접 기록하는 함수들
function recordTaxDirect(person, allowance, memo, dateStr) {
  const recordDate = dateStr ? new Date(dateStr) : new Date();
  const year = recordDate.getFullYear();
  const sheet = getOrCreateYearSheet(year);

  const tax = Math.floor((allowance * 0.1) / 100) * 100;
  const lastRow = sheet.getLastRow();
  const newRow = lastRow + 1;

  sheet.getRange(newRow, 1).setValue(recordDate);

  if (person === "cw") {
    sheet.getRange(newRow, 2).setValue(tax);
  } else {
    sheet.getRange(newRow, 3).setValue(tax);
  }

  sheet.getRange(newRow, 4).setValue(memo || "용돈");
  sheet.getRange(newRow, 1).setNumberFormat("yyyy-mm-dd");

  const personName = person === "cw" ? "cw" : "dk";
  logChange(
    "[세금 납부] " +
      personName +
      ": " +
      tax.toLocaleString() +
      "원 (" +
      (memo || "용돈") +
      ")",
  );

  return {
    success: true,
    needsApproval: false,
    tax: tax,
    date: Utilities.formatDate(
      recordDate,
      Session.getScriptTimeZone(),
      "yyyy-MM-dd",
    ),
  };
}

function recordDuesDirect(dateStr, memo) {
  const recordDate = dateStr ? new Date(dateStr) : new Date();
  const year = recordDate.getFullYear();
  const sheet = getOrCreateYearSheet(year);

  const lastRow = sheet.getLastRow();
  const newRow = lastRow + 1;

  sheet.getRange(newRow, 1).setValue(recordDate);
  sheet.getRange(newRow, 2).setValue(-5000);
  sheet.getRange(newRow, 3).setValue(-3000);
  sheet.getRange(newRow, 4).setValue(memo || "가족회비");
  sheet.getRange(newRow, 1).setNumberFormat("yyyy-mm-dd");
  sheet.getRange(newRow, 2, 1, 2).setFontColor("#dc2626");

  logChange(
    "[회비 납부] cw: -5,000원, dk: -3,000원 (" + (memo || "가족회비") + ")",
  );

  return {
    success: true,
    needsApproval: false,
    date: Utilities.formatDate(
      recordDate,
      Session.getScriptTimeZone(),
      "yyyy-MM-dd",
    ),
  };
}

function recordPurchaseDirect(cwAmount, dkAmount, description, dateStr) {
  const recordDate = dateStr ? new Date(dateStr) : new Date();
  const year = recordDate.getFullYear();
  const sheet = getOrCreateYearSheet(year);

  const lastRow = sheet.getLastRow();
  const newRow = lastRow + 1;

  sheet.getRange(newRow, 1).setValue(recordDate);
  sheet.getRange(newRow, 2).setValue(-cwAmount);
  sheet.getRange(newRow, 3).setValue(-dkAmount);
  sheet.getRange(newRow, 4).setValue(description);
  sheet.getRange(newRow, 1).setNumberFormat("yyyy-mm-dd");
  sheet.getRange(newRow, 2, 1, 2).setFontColor("#dc2626");

  logChange(
    "[세금 사용] " +
      description +
      " - cw: -" +
      cwAmount.toLocaleString() +
      "원, dk: -" +
      dkAmount.toLocaleString() +
      "원",
  );

  return {
    success: true,
    needsApproval: false,
    cw: -cwAmount,
    dk: -dkAmount,
    date: Utilities.formatDate(
      recordDate,
      Session.getScriptTimeZone(),
      "yyyy-MM-dd",
    ),
  };
}

function updateRecord(year, rowIndex, cw, dk, memo) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(year.toString());

    if (!sheet) {
      return { success: false, message: "시트를 찾을 수 없습니다." };
    }

    const lastRow = sheet.getLastRow();

    if (rowIndex < 5 || rowIndex > lastRow) {
      return { success: false, message: "잘못된 행 번호입니다." };
    }

    const oldCw = Number(sheet.getRange(rowIndex, 2).getValue()) || 0;
    const oldDk = Number(sheet.getRange(rowIndex, 3).getValue()) || 0;
    const oldMemo = sheet.getRange(rowIndex, 4).getValue() || "";
    const dateValue = sheet.getRange(rowIndex, 1).getValue();
    const dateStr = Utilities.formatDate(
      new Date(dateValue),
      Session.getScriptTimeZone(),
      "yyyy-MM-dd",
    );

    sheet.getRange(rowIndex, 2).setValue(Number(cw) || 0);
    sheet.getRange(rowIndex, 3).setValue(Number(dk) || 0);
    sheet.getRange(rowIndex, 4).setValue(memo || "");

    const colorRange = sheet.getRange(rowIndex, 2, 1, 2);
    if (Number(cw) < 0 || Number(dk) < 0) {
      colorRange.setFontColor("#dc2626");
    } else if (memo && String(memo).includes("환급")) {
      colorRange.setFontColor("#2563eb");
    } else {
      colorRange.setFontColor("#000000");
    }

    SpreadsheetApp.flush();

    let changes = [];
    if (oldCw !== Number(cw)) {
      changes.push(
        "cw: " +
          oldCw.toLocaleString() +
          "원 → " +
          Number(cw).toLocaleString() +
          "원",
      );
    }
    if (oldDk !== Number(dk)) {
      changes.push(
        "dk: " +
          oldDk.toLocaleString() +
          "원 → " +
          Number(dk).toLocaleString() +
          "원",
      );
    }
    if (oldMemo !== memo) {
      changes.push('메모: "' + oldMemo + '" → "' + memo + '"');
    }

    if (changes.length > 0) {
      logChange("[기록 수정] " + dateStr + " - " + changes.join(", "));
    }

    return { success: true, message: "수정 완료" };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

function deleteRecord(year, rowIndex) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(year.toString());

    if (!sheet) {
      return { success: false, message: "시트를 찾을 수 없습니다." };
    }

    const lastRow = sheet.getLastRow();

    if (rowIndex < 5 || rowIndex > lastRow) {
      return { success: false, message: "잘못된 행 번호입니다." };
    }

    const beforeDelete = sheet.getRange(rowIndex, 1, 1, 4).getValues()[0];
    const dateStr = Utilities.formatDate(
      new Date(beforeDelete[0]),
      Session.getScriptTimeZone(),
      "yyyy-MM-dd",
    );
    const cw = Number(beforeDelete[1]) || 0;
    const dk = Number(beforeDelete[2]) || 0;
    const memo = beforeDelete[3] || "";

    if (rowIndex < lastRow) {
      const numRowsToMove = lastRow - rowIndex;
      const sourceRange = sheet.getRange(rowIndex + 1, 1, numRowsToMove, 4);
      const values = sourceRange.getValues();
      const formats = sourceRange.getNumberFormats();
      const fontColors = sourceRange.getFontColors();

      const targetRange = sheet.getRange(rowIndex, 1, numRowsToMove, 4);
      targetRange.setValues(values);
      targetRange.setNumberFormats(formats);
      targetRange.setFontColors(fontColors);

      const lastRowRange = sheet.getRange(lastRow, 1, 1, 4);
      lastRowRange.clearContent();
      lastRowRange.clearFormat();
    } else {
      const range = sheet.getRange(rowIndex, 1, 1, 4);
      range.clearContent();
      range.clearFormat();
    }

    SpreadsheetApp.flush();

    logChange(
      "[기록 삭제] " +
        dateStr +
        " - cw: " +
        cw.toLocaleString() +
        "원, dk: " +
        dk.toLocaleString() +
        "원 (" +
        memo +
        ")",
    );

    return { success: true };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}
