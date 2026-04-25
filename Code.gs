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
    PICK_PARENT_EMAIL: "taeoh0311@gmail.com",
    PICK_CW_EMAIL: "ngc7331cw@gmail.com",
    PICK_DK_EMAIL: "ngc7331dk@gmail.com",
    API_KEY: "taeoh0311@gmail.com", // 👈 위젯용 API 키 (변경 필수)
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
  let userEmail = "";
  try {
    userEmail = Session.getActiveUser().getEmail();
  } catch (e) {
    return "Guest"; // 세션 정보를 가져올 수 없는 경우 (위젯 등)
  }
  
  const emails = getFamilyEmails();

  if (userEmail === emails.parent) return "부모님";
  if (userEmail === emails.cw) return "cw";
  if (userEmail === emails.dk) return "dk";
  return userEmail || "Guest"; 
}

// 현재 사용자가 부모님인지 확인
function isParent() {
  const userEmail = Session.getActiveUser().getEmail();
  const emails = getFamilyEmails();
  return userEmail === emails.parent;
}

// 접근 권한 확인
function checkPermission(userEmail) {
  const emails = getFamilyEmails();
  const allowed = [emails.parent, emails.cw, emails.dk];
  return allowed.includes(userEmail);
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

function doGet(e) {
  // 1. API 모드 확인 (위젯 데이터 요청) - 가장 먼저 체크!
  if (e && e.parameter && e.parameter.mode === "api") {
    return handleApiRequest(e);
  }

  // 2. 위젯 뷰 모드 확인 (로그인 세션 없이도 조회 가능하도록 허용)
  if (e && e.parameter && e.parameter.view === "widget") {
    return getWidgetHtml();
  }

  const userEmail = Session.getActiveUser().getEmail();

  if (!checkPermission(userEmail)) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>접근 거부</title>
        <style>
          body { display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #f3f4f6; padding: 20px; text-align: center; }
          .container { background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 400px; width: 100%; }
          h2 { color: #ef4444; margin-top: 0; }
          p { color: #4b5563; line-height: 1.5; }
          .email { font-weight: bold; color: #1f2937; background: #e5e7eb; padding: 2px 6px; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>⛔ 접근 권한이 없습니다</h2>
          <p>현재 로그인된 계정:</p>
          <p class="email">${userEmail || "(알 수 없음)"}</p>
          <p>허용된 가족 구성원만<br>이 앱을 사용할 수 있습니다.</p>
        </div>
      </body>
      </html>
    `;
    return HtmlService.createHtmlOutput(html)
      .setTitle("접근 거부")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag("viewport", "width=device-width, initial-scale=1");
  }

  // 위젯 모드 (간소화된 UI)
  if (e && e.parameter && e.parameter.view === "widget") {
    return getWidgetHtml();
  }

  return HtmlService.createTemplateFromFile("index")
    .evaluate()
    .setTitle("CWDK T&J Bank")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
}

// ⭐ 위젯용 HTML 생성 (Server-Side Data Loading for speed)
function getWidgetHtml() {
  const data = getTaxData(); // 데이터를 미리 가져옴

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { margin: 0; padding: 16px; font-family: -apple-system, sans-serif; background: #fff; }
        .widget-container { display: flex; flex-direction: column; gap: 12px; }
        .card { background: #f8fafc; border-radius: 12px; padding: 16px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .name { font-weight: bold; font-size: 16px; color: #334155; }
        .amount { font-weight: 800; font-size: 20px; color: #0f172a; white-space: nowrap; }
        .cw .name { color: #db2777; }
        .dk .name { color: #2563eb; }
        .update-time { font-size: 10px; color: #94a3b8; text-align: right; margin-top: 4px; }
      </style>
    </head>
    <body>
      <div class="widget-container">
        <div class="card cw">
          <div class="name">채원</div>
          <div class="amount">₩${Number(data.records && data.records.length > 0 ? data.cwTotal || 0 : 0).toLocaleString()}</div> 
        </div> <!-- data.cwTotal이 누적 세금 -->
        
        <div class="card dk">
          <div class="name">도권</div>
          <div class="amount">₩${Number(data.records && data.records.length > 0 ? data.dkTotal || 0 : 0).toLocaleString()}</div>
        </div>
        <div class="update-time">업데이트: ${new Date().toLocaleTimeString("ko-KR")}</div>
      </div>
    </body>
    </html>
  `;

  return HtmlService.createHtmlOutput(html)
    .setTitle("MyHomeTax Widget")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
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

// ⭐ 데이터 일괄 동기화 (DB 푸시)
// 사용자의 excel_data.json 포맷을 받아서 해당 연도 시트를 업데이트함
function importExcelData(payload) {
  if (!isParentUser()) {
    return { success: false, message: "관리자 권한이 필요합니다." };
  }

  try {
    const batchData = JSON.parse(payload);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let totalUpdated = 0;

    batchData.forEach(sheetObj => {
      const year = sheetObj.sheet;
      const rows = sheetObj.data;
      if (!year || !rows) return;

      let sheet = ss.getSheetByName(year.toString());
      if (!sheet) {
        sheet = ss.insertSheet(year.toString(), 0);
        initializeSheet(sheet);
      }

      // 기존 데이터 지우기 (헤더 제외)
      if (sheet.getLastRow() > 4) {
        sheet.getRange(5, 1, sheet.getLastRow() - 4, 4).clearContent();
      }

      // 데이터 변환 및 입력
      const valuesToInsert = rows.slice(4).map(row => {
        let date = row.col1;
        // Excel 날짜 숫자 처리
        if (typeof date === 'number' && date > 40000) {
          date = new Date((date - 25569) * 86400 * 1000);
          date = Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy-MM-dd");
        }
        return [
          date || "",
          row.col2 === null ? 0 : row.col2,
          row.col3 === null ? 0 : row.col3,
          row.col4 || ""
        ];
      });

      if (valuesToInsert.length > 0) {
        sheet.getRange(5, 1, valuesToInsert.length, 4).setValues(valuesToInsert);
        totalUpdated += valuesToInsert.length;
      }

      // 합계 및 이월액 정보 업데이트 (상단 2~4행)
      const summaryRows = rows.slice(1, 4);
      if (summaryRows.length >= 3) {
        sheet.getRange("B4").setValue(summaryRows[2].col2 || 0); // 이월(채원)
        sheet.getRange("C4").setValue(summaryRows[2].col3 || 0); // 이월(도권)
      }
    });

    logChange("데이터베이스 일괄 동기화 완료 (" + totalUpdated + "건)");
    return { success: true, message: totalUpdated + "건의 데이터가 동기화되었습니다." };
  } catch (error) {
    Logger.log("DB 푸시 오류: " + error.toString());
    return { success: false, message: "동기화 실패: " + error.toString() };
  }
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

      sheet.getRange("B2").setFormula("=B4+SUM(B5:B)");
      sheet.getRange("C2").setFormula("=C4+SUM(C5:C)");

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
  sheet.getRange("B2").setFormula("=B4+SUM(B5:B)");
  sheet.getRange("C2").setFormula("=C4+SUM(C5:C)");

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
function getPendingApprovals(skipAuth = false) {
  if (!skipAuth && !isParent()) {
    return { success: false, message: "부모님만 확인할 수 있습니다." };
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

  // 알림 메일 발송
  const details = "📅 날짜: " + (dateStr || "미지정") + "\n" +
                  "💰 cw: " + (cw || 0) + "원\n" +
                  "💰 dk: " + (dk || 0) + "원\n" +
                  "📝 메모: " + (memo || "");
  sendApprovalRequestEmail(actionType, details);

  return { success: true, rowIndex: newRow };
}

// ⭐ 승인 대기 항목 수정 (신청자/부모님 공통)
function updateApprovalRequest(rowIndex, cw, dk, memo, dateStr) {
  try {
    const approvalSheet = getOrCreateApprovalSheet();
    const rowData = approvalSheet.getRange(rowIndex, 1, 1, 8).getValues()[0];
    
    // 권한 확인: 본인이 올린 글이거나 부모님이어야 함
    const userName = getUserName();
    if (!isParent() && rowData[1] !== userName) {
      return { success: false, message: "본인의 요청만 수정할 수 있습니다." };
    }

    if (cw !== undefined) approvalSheet.getRange(rowIndex, 4).setValue(Number(cw) || 0);
    if (dk !== undefined) approvalSheet.getRange(rowIndex, 5).setValue(Number(dk) || 0);
    if (memo !== undefined) approvalSheet.getRange(rowIndex, 6).setValue(memo);
    if (dateStr) approvalSheet.getRange(rowIndex, 7).setValue(new Date(dateStr));
    
    logChange("[승인 요청 수정] " + rowData[2] + " - " + userName);
    return { success: true };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

// ⭐ 승인 대기 항목 취소 (삭제)
function cancelApprovalRequest(rowIndex) {
  try {
    const approvalSheet = getOrCreateApprovalSheet();
    const rowData = approvalSheet.getRange(rowIndex, 1, 1, 3).getValues()[0];
    
    // 권한 확인
    const userName = getUserName();
    if (!isParent() && rowData[1] !== userName) {
      return { success: false, message: "본인의 요청만 취소할 수 있습니다." };
    }

    approvalSheet.deleteRow(rowIndex);
    logChange("[승인 요청 취소] " + (rowData[2] || "항목") + " - " + userName);
    return { success: true };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
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

  logChange("[회비 납부] cw: -5,000원, dk: -3,000원");

  return {
    success: true,
    needsApproval: false,
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
      " (cw: -" +
      cwAmount.toLocaleString() +
      "원, dk: -" +
      dkAmount.toLocaleString() +
      "원)",
  );

  return {
    success: true,
    needsApproval: false,
    cw: cwAmount,
    dk: dkAmount,
  };
}

function updateRecord(year, rowIndex, cw, dk, memo) {
  if (!isParent()) return { success: false, message: "권한 없음" };

  const sheet = getOrCreateYearSheet(year);
  sheet.getRange(rowIndex, 2).setValue(cw);
  sheet.getRange(rowIndex, 3).setValue(dk);
  sheet.getRange(rowIndex, 4).setValue(memo);

  logChange(`[기록 수정] ${year}년 ${rowIndex}행 수정됨`);
  return { success: true };
}

// ==========================================
// 🤖 안드로이드 위젯 API (보안 필수)
// ==========================================

function handleApiRequest(e) {
  const SERVER_API_KEY = "taeoh0311@gmail.com";
  // Support both key and apiKey for backwards compatibility
  const requestKey =
    (e.parameter && (e.parameter.apiKey || e.parameter.key)) || "";

  // 1. API 키 검증
  if (requestKey !== SERVER_API_KEY) {
    return ContentService.createTextOutput(
      JSON.stringify({ error: "Invalid API Key" }),
    ).setMimeType(ContentService.MimeType.JSON);
  }

  // 2. 데이터 조회
  const data = getWidgetData();

  // 3. JSON 응답 반환
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function getWidgetData() {
  try {
    const taxData = getTaxData();

    // 최근 기록 3개만 추출
    const recentRecords =
      taxData.records && taxData.records.length > 0
        ? taxData.records.slice(0, 3)
        : [];

    let pendingCount = 0;
    try {
      const pendingListObj = getPendingApprovals(true); // Pass true to skip auth
      if (pendingListObj && pendingListObj.list) {
        pendingCount = pendingListObj.list.length;
      }
    } catch (err) {
      // Ignore errors if getPendingApprovals fails
    }

    return {
      cwTotal: taxData.cwTotal,
      dkTotal: taxData.dkTotal,
      cwRefund: taxData.cwRefund,
      dkRefund: taxData.dkRefund,
      pendingCount: pendingCount,
      records: recentRecords,
      updatedAt: new Date().toLocaleString("ko-KR", {
        timeZone: "Asia/Seoul",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  } catch (error) {
    return {
      error: error.toString(),
      cwTotal: 0,
      dkTotal: 0,
      cwRefund: 0,
      dkRefund: 0,
      records: [],
      updatedAt: "Error",
    };
  }
}

function deleteRecord(year, rowIndex) {
  if (!isParent()) return { success: false, message: "권한 없음" };

  const sheet = getOrCreateYearSheet(year);
  sheet.deleteRow(rowIndex);

  logChange(`[기록 삭제] ${year}년 ${rowIndex}행 삭제됨`);
  return { success: true };
}
