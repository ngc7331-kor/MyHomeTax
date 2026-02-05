// Code.gs - 구글 Apps Script 백엔드 (승인 시스템)

// 허용된 이메일 목록 (우리 가족 이메일) - ⚠️ 배포 시 실제 가족 이메일로 수정하세요
// 허용된 이메일 목록 (우리 가족 이메일)
const ALLOWED_EMAILS = [
  'father@example.com',      // 부모님 (아빠)
  'cwcw0405@gmail.com',       // 채원
  'dokwon0807@gmail.com'      // 도권
];

// 부모님 이메일 (알림 받을 사람)
const PARENT_EMAIL = 'father@example.com';

// 현재 사용자가 부모님인지 확인
function isParent() {
  const userEmail = Session.getActiveUser().getEmail();
  return userEmail === PARENT_EMAIL;
}

// 현재 사용자 이름 가져오기
function getUserName() {
  const userEmail = Session.getActiveUser().getEmail();
  if (userEmail === PARENT_EMAIL) return "부모님";
  if (userEmail === "daughter@example.com") return "채원";
  if (userEmail === "son@example.com") return "도권";
  return userEmail;
}

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
    approvalSheet.getRange("D1").setValue("채원");
    approvalSheet.getRange("E1").setValue("도권");
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
    approvalSheet.setColumnWidth(4, 100); // 채원
    approvalSheet.setColumnWidth(5, 100); // 도권
    approvalSheet.setColumnWidth(6, 200); // 메모
    approvalSheet.setColumnWidth(7, 100); // 날짜
    approvalSheet.setColumnWidth(8, 300); // 상세정보
  }

  return approvalSheet;
}

// ⭐ 부모님에게 승인 요청 이메일 발송
function sendApprovalRequestEmail(actionType, details) {
  try {
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
      to: PARENT_EMAIL,
      subject: subject,
      body: body,
    });

    Logger.log("승인 요청 이메일 발송 완료: " + PARENT_EMAIL);
  } catch (error) {
    Logger.log("승인 요청 이메일 발송 실패: " + error.toString());
  }
}

// ⭐ 승인/거부 완료 이메일 발송 (신청자에게)
function sendApprovalResultEmail(approved, actionType, rejectionReason) {
  try {
    const userEmail = Session.getActiveUser().getEmail();

    // 부모님이 아닌 사람의 이메일 찾기
    const applicantEmail = ALLOWED_EMAILS.find(
      (email) => email !== PARENT_EMAIL,
    );
    if (!applicantEmail) return;

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

    MailApp.sendEmail({
      to: applicantEmail,
      subject: subject,
      body: body,
    });

    Logger.log("승인 결과 이메일 발송 완료");
  } catch (error) {
    Logger.log("승인 결과 이메일 발송 실패: " + error.toString());
  }
}

function doGet() {
  const userEmail = Session.getActiveUser().getEmail();

  if (!ALLOWED_EMAILS.includes(userEmail)) {
    return HtmlService.createHtmlOutput(
      `
      <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .error-box {
              background: white;
              padding: 40px;
              border-radius: 20px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.2);
              text-align: center;
              max-width: 400px;
            }
            .error-icon {
              font-size: 60px;
              margin-bottom: 20px;
            }
            h1 {
              color: #e53e3e;
              margin-bottom: 10px;
            }
            p {
              color: #4a5568;
              line-height: 1.6;
            }
          </style>
        </head>
        <body>
          <div class="error-box">
            <div class="error-icon">🔒</div>
            <h1>접근 권한 없음</h1>
            <p>죄송합니다. 이 앱은 우리 가족만 사용할 수 있어요.</p>
            <p style="font-size: 14px; color: #a0aec0; margin-top: 20px;">
              현재 계정: ${userEmail}
            </p>
          </div>
        </body>
      </html>
    `,
    ).setTitle("접근 거부");
  }

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

      const prevChaewonTotal = Number(prevSheet.getRange("B2").getValue()) || 0;
      const prevDokwonTotal = Number(prevSheet.getRange("C2").getValue()) || 0;

      sheet.getRange("B4").setValue(prevChaewonTotal);
      sheet.getRange("C4").setValue(prevDokwonTotal);
    } else {
      initializeSheet(sheet);
    }
  }

  return sheet;
}

function initializeSheet(sheet) {
  sheet.getRange("A1").setValue("날짜");
  sheet.getRange("B1").setValue("채원");
  sheet.getRange("C1").setValue("도권");
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

  const chaewonTotal = Number(sheet.getRange("B2").getValue()) || 0;
  const dokwonTotal = Number(sheet.getRange("C2").getValue()) || 0;
  const chaewonRefund = Number(sheet.getRange("B3").getValue()) || 0;
  const dokwonRefund = Number(sheet.getRange("C3").getValue()) || 0;

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
          chaewon: Number(recentData[i][1]) || 0,
          dokwon: Number(recentData[i][2]) || 0,
          memo: recentData[i][3] || "",
          rowIndex: startRow + i,
        });
      }
    }
  }

  const availableYears = getAvailableYears();

  return {
    chaewonTotal: chaewonTotal,
    dokwonTotal: dokwonTotal,
    chaewonRefund: chaewonRefund,
    dokwonRefund: dokwonRefund,
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
          chaewon: Number(data[i][1]) || 0,
          dokwon: Number(data[i][2]) || 0,
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
          chaewon: Number(data[i][3]) || 0,
          dokwon: Number(data[i][4]) || 0,
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

// ⭐ 승인 대기 항목 추가 (채원/도권용)
function addApprovalRequest(
  actionType,
  chaewon,
  dokwon,
  memo,
  dateStr,
  additionalInfo,
) {
  const approvalSheet = getOrCreateApprovalSheet();
  const lastRow = approvalSheet.getLastRow();
  const newRow = lastRow + 1;

  const userName = getUserName();
  const requestDate = dateStr ? new Date(dateStr) : new Date();

  approvalSheet.getRange(newRow, 1).setValue(new Date());
  approvalSheet.getRange(newRow, 2).setValue(userName);
  approvalSheet.getRange(newRow, 3).setValue(actionType);
  approvalSheet.getRange(newRow, 4).setValue(Number(chaewon) || 0);
  approvalSheet.getRange(newRow, 5).setValue(Number(dokwon) || 0);
  approvalSheet.getRange(newRow, 6).setValue(memo || "");
  approvalSheet.getRange(newRow, 7).setValue(requestDate);
  approvalSheet.getRange(newRow, 8).setValue(additionalInfo || "");

  approvalSheet.getRange(newRow, 1).setNumberFormat("yyyy-mm-dd hh:mm:ss");
  approvalSheet.getRange(newRow, 7).setNumberFormat("yyyy-mm-dd");

  logChange("[승인 요청] " + actionType + " - " + userName);

  return newRow;
}

// ⭐ 세금 납부 신청 (채원/도권용)
function requestTax(person, allowance, memo, dateStr) {
  if (isParent()) {
    // 부모님은 바로 기록
    return recordTaxDirect(person, allowance, memo, dateStr);
  }

  const tax = Math.floor((allowance * 0.1) / 100) * 100;
  const personName = person === "chaewon" ? "채원" : "도권";

  const chaewon = person === "chaewon" ? tax : 0;
  const dokwon = person === "dokwon" ? tax : 0;

  const details =
    "용돈: " +
    allowance.toLocaleString() +
    "원, 세금: " +
    tax.toLocaleString() +
    "원";

  addApprovalRequest(
    "세금 납부",
    chaewon,
    dokwon,
    memo || "용돈",
    dateStr,
    details,
  );

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

// ⭐ 회비 납부 신청 (채원/도권용)
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
    "채원: 5,000원, 도권: 3,000원",
  );

  const notificationDetails =
    "• 채원: -5,000원\n" +
    "• 도권: -3,000원\n" +
    "• 날짜: " +
    (dateStr || new Date().toISOString().split("T")[0]);

  sendApprovalRequestEmail("회비 납부", notificationDetails);

  return {
    success: true,
    needsApproval: true,
  };
}

// ⭐ 세금 사용 신청 (채원/도권용)
function requestPurchase(chaewonAmount, dokwonAmount, description, dateStr) {
  if (isParent()) {
    return recordPurchaseDirect(
      chaewonAmount,
      dokwonAmount,
      description,
      dateStr,
    );
  }

  let buyerType = "";
  if (chaewonAmount > 0 && dokwonAmount > 0) {
    buyerType = "함께";
  } else if (chaewonAmount > 0) {
    buyerType = "채원";
  } else if (dokwonAmount > 0) {
    buyerType = "도권";
  }

  const details =
    "구매자: " +
    buyerType +
    ", 총액: " +
    (chaewonAmount + dokwonAmount).toLocaleString() +
    "원";

  addApprovalRequest(
    "세금 사용",
    -chaewonAmount,
    -dokwonAmount,
    description,
    dateStr,
    details,
  );

  const notificationDetails =
    "• 구매자: " +
    buyerType +
    "\n" +
    "• 채원: -" +
    chaewonAmount.toLocaleString() +
    "원\n" +
    "• 도권: -" +
    dokwonAmount.toLocaleString() +
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
  const chaewon = Number(data[3]) || 0;
  const dokwon = Number(data[4]) || 0;
  const memo = data[5] || "";
  const dateValue = data[6];

  const recordDate = dateValue ? new Date(dateValue) : new Date();
  const year = recordDate.getFullYear();
  const sheet = getOrCreateYearSheet(year);

  const lastRow = sheet.getLastRow();
  const newRow = lastRow + 1;

  sheet.getRange(newRow, 1).setValue(recordDate);
  sheet.getRange(newRow, 2).setValue(chaewon);
  sheet.getRange(newRow, 3).setValue(dokwon);
  sheet.getRange(newRow, 4).setValue(memo);
  sheet.getRange(newRow, 1).setNumberFormat("yyyy-mm-dd");

  if (chaewon < 0 || dokwon < 0) {
    sheet.getRange(newRow, 2, 1, 2).setFontColor("#dc2626");
  }

  // 승인 대기 항목 삭제
  approvalSheet.deleteRow(rowIndex);

  logChange(
    "[승인 완료] " +
      actionType +
      " - 채원: " +
      chaewon.toLocaleString() +
      "원, 도권: " +
      dokwon.toLocaleString() +
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

  if (person === "chaewon") {
    sheet.getRange(newRow, 2).setValue(tax);
  } else {
    sheet.getRange(newRow, 3).setValue(tax);
  }

  sheet.getRange(newRow, 4).setValue(memo || "용돈");
  sheet.getRange(newRow, 1).setNumberFormat("yyyy-mm-dd");

  const personName = person === "chaewon" ? "채원" : "도권";
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
    "[회비 납부] 채원: -5,000원, 도권: -3,000원 (" + (memo || "가족회비") + ")",
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

function recordPurchaseDirect(
  chaewonAmount,
  dokwonAmount,
  description,
  dateStr,
) {
  const recordDate = dateStr ? new Date(dateStr) : new Date();
  const year = recordDate.getFullYear();
  const sheet = getOrCreateYearSheet(year);

  const lastRow = sheet.getLastRow();
  const newRow = lastRow + 1;

  sheet.getRange(newRow, 1).setValue(recordDate);
  sheet.getRange(newRow, 2).setValue(-chaewonAmount);
  sheet.getRange(newRow, 3).setValue(-dokwonAmount);
  sheet.getRange(newRow, 4).setValue(description);
  sheet.getRange(newRow, 1).setNumberFormat("yyyy-mm-dd");
  sheet.getRange(newRow, 2, 1, 2).setFontColor("#dc2626");

  let buyerType = "";
  if (chaewonAmount > 0 && dokwonAmount > 0) {
    buyerType = "함께";
  } else if (chaewonAmount > 0) {
    buyerType = "채원";
  } else if (dokwonAmount > 0) {
    buyerType = "도권";
  }

  logChange(
    "[세금 사용] " +
      buyerType +
      " - 채원: -" +
      chaewonAmount.toLocaleString() +
      "원, 도권: -" +
      dokwonAmount.toLocaleString() +
      "원 (" +
      description +
      ")",
  );

  return {
    success: true,
    needsApproval: false,
    chaewon: -chaewonAmount,
    dokwon: -dokwonAmount,
    date: Utilities.formatDate(
      recordDate,
      Session.getScriptTimeZone(),
      "yyyy-MM-dd",
    ),
  };
}

function updateRecord(year, rowIndex, chaewon, dokwon, memo) {
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

    const oldChaewon = Number(sheet.getRange(rowIndex, 2).getValue()) || 0;
    const oldDokwon = Number(sheet.getRange(rowIndex, 3).getValue()) || 0;
    const oldMemo = sheet.getRange(rowIndex, 4).getValue() || "";
    const dateValue = sheet.getRange(rowIndex, 1).getValue();
    const dateStr = Utilities.formatDate(
      new Date(dateValue),
      Session.getScriptTimeZone(),
      "yyyy-MM-dd",
    );

    sheet.getRange(rowIndex, 2).setValue(Number(chaewon) || 0);
    sheet.getRange(rowIndex, 3).setValue(Number(dokwon) || 0);
    sheet.getRange(rowIndex, 4).setValue(memo || "");

    const colorRange = sheet.getRange(rowIndex, 2, 1, 2);
    if (Number(chaewon) < 0 || Number(dokwon) < 0) {
      colorRange.setFontColor("#dc2626");
    } else if (memo && String(memo).includes("환급")) {
      colorRange.setFontColor("#2563eb");
    } else {
      colorRange.setFontColor("#000000");
    }

    SpreadsheetApp.flush();

    let changes = [];
    if (oldChaewon !== Number(chaewon)) {
      changes.push(
        "채원: " +
          oldChaewon.toLocaleString() +
          "원 → " +
          Number(chaewon).toLocaleString() +
          "원",
      );
    }
    if (oldDokwon !== Number(dokwon)) {
      changes.push(
        "도권: " +
          oldDokwon.toLocaleString() +
          "원 → " +
          Number(dokwon).toLocaleString() +
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
    const chaewon = Number(beforeDelete[1]) || 0;
    const dokwon = Number(beforeDelete[2]) || 0;
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
        " - 채원: " +
        chaewon.toLocaleString() +
        "원, 도권: " +
        dokwon.toLocaleString() +
        "원 (" +
        memo +
        ")",
    );

    return { success: true };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}
