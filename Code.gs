// Code.gs - êµ¬ê? Apps Script ë°±ì—”??(?¹ì¸ ?œìŠ¤??

// ==========================================
// ?”’ ë³´ì•ˆ ?¤ì •: ?´ë©”??ê°€?¸ì˜¤ê¸?
// ==========================================
function getFamilyEmails() {
  // ?¤í¬ë¦½íŠ¸ ?ì„±?ì„œ ?´ë©”??ì£¼ì†Œë¥?ê°€?¸ì˜µ?ˆë‹¤.
  const scriptProperties = PropertiesService.getScriptProperties();
  const parentEmail = scriptProperties.getProperty("PICK_PARENT_EMAIL");
  const cwEmail = scriptProperties.getProperty("PICK_CW_EMAIL");
  const dkEmail = scriptProperties.getProperty("PICK_DK_EMAIL");

  if (!parentEmail || !cwEmail || !dkEmail) {
    Logger.log(
      "? ï¸ ê²½ê³ : ?´ë©”???¤ì •???„ë£Œ?˜ì? ?Šì•˜?µë‹ˆ?? setupScriptProperties()ë¥??¤í–‰?´ì£¼?¸ìš”.",
    );
  }

  return {
    parent: parentEmail,
    cw: cwEmail,
    dk: dkEmail,
  };
}

// ==========================================
// ?™ï¸ ì´ˆê¸° ?¤ì • (ë°°í¬ ??1???¤í–‰ ?„ìˆ˜)
// ==========================================
// ???¨ìˆ˜ë¥??¤í–‰?˜ì—¬ ê°€ì¡±ë“¤???¤ì œ ?´ë©”?¼ì„ ?€?¥í•˜?¸ìš”.
// ?¤í–‰ ?„ì—?????¨ìˆ˜ ?´ìš©??ì§€?°ê±°??ì£¼ì„ ì²˜ë¦¬?´ë„ ?©ë‹ˆ??
function setupScriptProperties() {
  const scriptProperties = PropertiesService.getScriptProperties();

  // ?‘‡ ?„ë˜???¤ì œ ê°€ì¡??´ë©”??ì£¼ì†Œë¥??…ë ¥?˜ì„¸??
  const REAL_EMAILS = {
    PICK_PARENT_EMAIL: "[PARENT_EMAIL_PROTECTED]",
    PICK_CW_EMAIL: "[CW_EMAIL_PROTECTED]",
    PICK_DK_EMAIL: "[DK_EMAIL_PROTECTED]",
    API_KEY: "[PARENT_EMAIL_PROTECTED]", // ?‘ˆ ?„ì ¯??API ??(ë³€ê²??„ìˆ˜)
  };

  scriptProperties.setProperties(REAL_EMAILS);
  Logger.log("???´ë©”???¤ì •???„ë£Œ?˜ì—ˆ?µë‹ˆ?? ?´ì œ ?±ì´ ?•ìƒ ?‘ë™?©ë‹ˆ??");
  Logger.log("?¤ì •??ê°? " + JSON.stringify(REAL_EMAILS));
}

// ==========================================
// ?› ï¸??¬í¼ ?¨ìˆ˜
// ==========================================

// ?„ì¬ ?¤ë£¨ê³??ˆëŠ” ?¬ìš©?ê? ?„êµ¬?¸ì?(?´ë©”??ê¸°ì?) ?•ì¸
function getUserName() {
  let userEmail = "";
  try {
    userEmail = Session.getActiveUser().getEmail();
  } catch (e) {
    return "Guest"; // ?¸ì…˜ ?•ë³´ë¥?ê°€?¸ì˜¬ ???†ëŠ” ê²½ìš° (?„ì ¯ ??
  }
  
  const emails = getFamilyEmails();

  if (userEmail === emails.parent) return "ë¶€ëª¨ë‹˜";
  if (userEmail === emails.cw) return "cw";
  if (userEmail === emails.dk) return "dk";
  return userEmail || "Guest"; 
}

// ?„ì¬ ?¬ìš©?ê? ë¶€ëª¨ë‹˜?¸ì? ?•ì¸
function isParent() {
  const userEmail = Session.getActiveUser().getEmail();
  const emails = getFamilyEmails();
  return userEmail === emails.parent;
}

// ?‘ê·¼ ê¶Œí•œ ?•ì¸
function checkPermission(userEmail) {
  const emails = getFamilyEmails();
  const allowed = [emails.parent, emails.cw, emails.dk];
  return allowed.includes(userEmail);
}

// ==========================================
// ?“„ ë©”ì¸ ë¡œì§
// ==========================================

// â­??¹ì¸ ?€ê¸??œíŠ¸ ê°€?¸ì˜¤ê¸??ëŠ” ?ì„±
function getOrCreateApprovalSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let approvalSheet = ss.getSheetByName("?¹ì¸?€ê¸?);

  if (!approvalSheet) {
    approvalSheet = ss.insertSheet("?¹ì¸?€ê¸?);

    // ?¤ë” ?¤ì •
    approvalSheet.getRange("A1").setValue("? ì²­?¼ì‹œ");
    approvalSheet.getRange("B1").setValue("? ì²­??);
    approvalSheet.getRange("C1").setValue("?‘ì—…? í˜•");
    approvalSheet.getRange("D1").setValue("cw");
    approvalSheet.getRange("E1").setValue("dk");
    approvalSheet.getRange("F1").setValue("ë©”ëª¨");
    approvalSheet.getRange("G1").setValue("? ì§œ");
    approvalSheet.getRange("H1").setValue("?ì„¸?•ë³´");

    // ?¤ë” ?¤í???
    const headerRange = approvalSheet.getRange("A1:H1");
    headerRange.setBackground("#f59e0b");
    headerRange.setFontColor("#ffffff");
    headerRange.setFontWeight("bold");
    headerRange.setHorizontalAlignment("center");

    // ???ˆë¹„ ì¡°ì •
    approvalSheet.setColumnWidth(1, 150); // ? ì²­?¼ì‹œ
    approvalSheet.setColumnWidth(2, 100); // ? ì²­??
    approvalSheet.setColumnWidth(3, 120); // ?‘ì—…? í˜•
    approvalSheet.setColumnWidth(4, 100); // cw
    approvalSheet.setColumnWidth(5, 100); // dk
    approvalSheet.setColumnWidth(6, 200); // ë©”ëª¨
    approvalSheet.setColumnWidth(7, 100); // ? ì§œ
    approvalSheet.setColumnWidth(8, 300); // ?ì„¸?•ë³´
  }

  return approvalSheet;
}

// â­?ë¶€ëª¨ë‹˜?ê²Œ ?¹ì¸ ?”ì²­ ?´ë©”??ë°œì†¡
function sendApprovalRequestEmail(actionType, details) {
  try {
    const emails = getFamilyEmails();
    if (!emails.parent) {
      Logger.log("ë¶€ëª¨ë‹˜ ?´ë©”?¼ì´ ?¤ì •?˜ì? ?Šì•„ ë©”ì¼??ë³´ë‚¼ ???†ìŠµ?ˆë‹¤.");
      return;
    }

    const userName = getUserName();
    const subject = "[CWDK Bank ?¹ì¸ ?”ì²­] " + userName + "?˜ì˜ " + actionType;
    const body =
      "?ˆë…•?˜ì„¸??\n\n" +
      userName +
      "?˜ì´ ?¤ìŒ ?‘ì—…???€???¹ì¸???”ì²­?ˆìŠµ?ˆë‹¤.\n\n" +
      "?“‹ ?‘ì—… ?´ìš©: " +
      actionType +
      "\n" +
      "?‘¤ ? ì²­?? " +
      userName +
      "\n" +
      "?• ? ì²­ ?œê°„: " +
      new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }) +
      "\n" +
      "?“ ?ì„¸ ?´ìš©:\n" +
      details +
      "\n\n" +
      "? ï¸ ?¹ì¸ ?ëŠ” ê±°ë?ë¥??„í•´ ?±ì˜ [?¹ì¸ ?€ê¸? ??„ ?•ì¸?´ì£¼?¸ìš”.\n\n" +
      "---\n" +
      "CWDK T&J Bank ?ë™ ?Œë¦¼\n" +
      "??ë°”ë¡œê°€ê¸? " +
      ScriptApp.getService().getUrl();

    MailApp.sendEmail({
      to: emails.parent,
      subject: subject,
      body: body,
    });

    Logger.log("?¹ì¸ ?”ì²­ ?´ë©”??ë°œì†¡ ?„ë£Œ: " + emails.parent);
  } catch (error) {
    Logger.log("?¹ì¸ ?”ì²­ ?´ë©”??ë°œì†¡ ?¤íŒ¨: " + error.toString());
  }
}

// â­??¹ì¸/ê±°ë? ?„ë£Œ ?´ë©”??ë°œì†¡ (? ì²­?ì—ê²?
function sendApprovalResultEmail(approved, actionType, rejectionReason) {
  try {
    const userEmail = Session.getActiveUser().getEmail();
    const emails = getFamilyEmails();

    // ë¶€ëª¨ë‹˜???„ë‹Œ ?¬ëŒ(=? ì²­?? ì°¾ê¸°
    // ê°„ë‹¨?˜ê²Œ, ?„ì¬ ?‘ì†?ê? ë¶€ëª¨ë‹˜?´ë©´ ? ì²­?ë? ?????†ìœ¼ë¯€ë¡?
    // ?¤ì œë¡œëŠ” ?¹ì¸ ?”ì²­ ?°ì´?°ì— ? ì²­???´ë©”?¼ì„ ?¨ê»˜ ?€?¥í•˜??ê²ƒì´ ê°€???•í™•?˜ì?ë§?
    // ê¸°ì¡´ ë¡œì§??? ì??˜ë©´??? ì¶”?©ë‹ˆ??
    // ?¬ê¸°?œëŠ” ê°„ë‹¨??cw, dk ??ëª?ëª¨ë‘?ê²Œ ?Œë¦¼??ê°€ê±°ë‚˜,
    // ?¹ì? ?¹ì • ? ì²­?ë? ?????†ìœ¼ë¯€ë¡??œìŠ¤??ë¡œê·¸ë§??¨ê¸°??ê²ƒìœ¼ë¡??€ì²´í•  ?˜ë„ ?ˆìœ¼??
    // ê¸°ì¡´ ë¡œì§(ALLOWED_EMAILS.find)??ìµœë????´ë¦½?ˆë‹¤.

    // ?¤ë§Œ, '?¹ì¸(approveRequest)' ?¨ìˆ˜ê°€ ?¸ì¶œ???????¨ìˆ˜ê°€ ë¶ˆë¦¬?”ë°,
    // ?¸ì¶œ?˜ëŠ” ì£¼ì²´??'ë¶€ëª¨ë‹˜'?…ë‹ˆ??
    // ?°ë¼??userEmail?€ ë¶€ëª¨ë‹˜ ?´ë©”?¼ì´ ?©ë‹ˆ??
    // ê¸°ì¡´ ì½”ë“œ?ì„œ??ALLOWED_EMAILS?ì„œ PARENTê°€ ?„ë‹Œ ?¬ëŒ??ì°¾ì•„??ë³´ëƒˆ?”ë°,
    // ?´ëŠ” ? ì²­?ê? 1ëª…ì¼ ?Œë§Œ ? íš¨?˜ê±°?? ë¬´ì¡°ê±?ì²?ë²ˆì§¸ ?ë??ê²Œ ê°€??ë²„ê·¸ê°€ ?ˆì—ˆ?????ˆìŠµ?ˆë‹¤.
    // ê°œì„ : ? ì²­???•ë³´ë¥??Œë¼ë¯¸í„°ë¡?ë°›ì? ?Šìœ¼ë¯€ë¡? ?¼ë‹¨ ë¡œê·¸ë§??¨ê¸°ê±°ë‚˜
    // cw/dk ëª¨ë‘?ê²Œ ë³´ë‚´??ê²ƒì´ ?ˆì „?????ˆìŠµ?ˆë‹¤.
    // *ê¸°ì¡´ ë¡œì§ ? ì?*: cw, dk ?´ë©”?¼ì´ ?ˆìœ¼ë©?ê·¸ìª½?¼ë¡œ ë³´ëƒ…?ˆë‹¤.

    const recipients = [];
    if (emails.cw && emails.cw !== emails.parent) recipients.push(emails.cw);
    if (emails.dk && emails.dk !== emails.parent) recipients.push(emails.dk);

    // ë³¸ì¸(ë¶€ëª??ê²Œ??ë³´ë‚´ì§€ ?ŠìŒ

    if (recipients.length === 0) return;

    const subject = approved
      ? "[CWDK Bank] ?¹ì¸ ?„ë£Œ - " + actionType
      : "[CWDK Bank] ê±°ë???- " + actionType;

    const body = approved
      ? "?ˆë…•?˜ì„¸??\n\n? ì²­?˜ì‹  " +
        actionType +
        " ?‘ì—…???¹ì¸?˜ì–´ ê¸°ë¡?˜ì—ˆ?µë‹ˆ??\n\n?¹ì¸ ?œê°„: " +
        new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })
      : "?ˆë…•?˜ì„¸??\n\n? ì²­?˜ì‹  " +
        actionType +
        " ?‘ì—…??ê±°ë??˜ì—ˆ?µë‹ˆ??\n\nê±°ë? ?¬ìœ : " +
        (rejectionReason || "?¬ìœ  ?†ìŒ") +
        "\nê±°ë? ?œê°„: " +
        new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });

    // ?ë? ëª¨ë‘?ê²Œ ?Œë¦¼ (?„ê? ? ì²­?ˆëŠ”ì§€ êµ¬ë¶„ ???˜ëŠ” ê²½ìš° ?€ë¹?ëª¨ë‘?ê²Œ ê³µìœ )
    recipients.forEach((email) => {
      MailApp.sendEmail({
        to: email,
        subject: subject,
        body: body,
      });
    });

    Logger.log("?¹ì¸ ê²°ê³¼ ?´ë©”??ë°œì†¡ ?„ë£Œ");
  } catch (error) {
    Logger.log("?¹ì¸ ê²°ê³¼ ?´ë©”??ë°œì†¡ ?¤íŒ¨: " + error.toString());
  }
}

function doGet(e) {
  // 1. API ëª¨ë“œ ?•ì¸ (?„ì ¯ ?°ì´???”ì²­) - ê°€??ë¨¼ì? ì²´í¬!
  if (e && e.parameter && e.parameter.mode === "api") {
    return handleApiRequest(e);
  }

  // 2. ?„ì ¯ ë·?ëª¨ë“œ ?•ì¸ (ë¡œê·¸???¸ì…˜ ?†ì´??ì¡°íšŒ ê°€?¥í•˜?„ë¡ ?ˆìš©)
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
        <title>?‘ê·¼ ê±°ë?</title>
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
          <h2>???‘ê·¼ ê¶Œí•œ???†ìŠµ?ˆë‹¤</h2>
          <p>?„ì¬ ë¡œê·¸?¸ëœ ê³„ì •:</p>
          <p class="email">${userEmail || "(?????†ìŒ)"}</p>
          <p>?ˆìš©??ê°€ì¡?êµ¬ì„±?ë§Œ<br>???±ì„ ?¬ìš©?????ˆìŠµ?ˆë‹¤.</p>
        </div>
      </body>
      </html>
    `;
    return HtmlService.createHtmlOutput(html)
      .setTitle("?‘ê·¼ ê±°ë?")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag("viewport", "width=device-width, initial-scale=1");
  }

  // ?„ì ¯ ëª¨ë“œ (ê°„ì†Œ?”ëœ UI)
  if (e && e.parameter && e.parameter.view === "widget") {
    return getWidgetHtml();
  }

  return HtmlService.createTemplateFromFile("index")
    .evaluate()
    .setTitle("CWDK T&J Bank")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
}

// â­??„ì ¯??HTML ?ì„± (Server-Side Data Loading for speed)
function getWidgetHtml() {
  const data = getTaxData(); // ?°ì´?°ë? ë¯¸ë¦¬ ê°€?¸ì˜´

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
          <div class="name">ì±„ì›</div>
          <div class="amount">??{Number(data.records && data.records.length > 0 ? data.cwTotal || 0 : 0).toLocaleString()}</div> 
        </div> <!-- data.cwTotal???„ì  ?¸ê¸ˆ -->
        
        <div class="card dk">
          <div class="name">?„ê¶Œ</div>
          <div class="amount">??{Number(data.records && data.records.length > 0 ? data.dkTotal || 0 : 0).toLocaleString()}</div>
        </div>
        <div class="update-time">?…ë°?´íŠ¸: ${new Date().toLocaleTimeString("ko-KR")}</div>
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
  let logSheet = ss.getSheetByName("ê¸°ë¡??);

  if (!logSheet) {
    logSheet = ss.insertSheet("ê¸°ë¡??);
    logSheet.getRange("A1").setValue("?¼ì‹œ");
    logSheet.getRange("B1").setValue("?‘ì—…??);
    logSheet.getRange("C1").setValue("ë³€ê²½ë‚´??);

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

// â­??°ì´???¼ê´„ ?™ê¸°??(DB ?¸ì‹œ)
// ?¬ìš©?ì˜ excel_data.json ?¬ë§·??ë°›ì•„???´ë‹¹ ?°ë„ ?œíŠ¸ë¥??…ë°?´íŠ¸??
function importExcelData(payload) {
  if (!isParentUser()) {
    return { success: false, message: "ê´€ë¦¬ì ê¶Œí•œ???„ìš”?©ë‹ˆ??" };
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

      // ê¸°ì¡´ ?°ì´??ì§€?°ê¸° (?¤ë” ?œì™¸)
      if (sheet.getLastRow() > 4) {
        sheet.getRange(5, 1, sheet.getLastRow() - 4, 4).clearContent();
      }

      // ?°ì´??ë³€??ë°??…ë ¥
      const valuesToInsert = rows.slice(4).map(row => {
        let date = row.col1;
        // Excel ? ì§œ ?«ì ì²˜ë¦¬
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

      // ?©ê³„ ë°??´ì›”???•ë³´ ?…ë°?´íŠ¸ (?ë‹¨ 2~4??
      const summaryRows = rows.slice(1, 4);
      if (summaryRows.length >= 3) {
        sheet.getRange("B4").setValue(summaryRows[2].col2 || 0); // ?´ì›”(ì±„ì›)
        sheet.getRange("C4").setValue(summaryRows[2].col3 || 0); // ?´ì›”(?„ê¶Œ)
      }
    });

    logChange("?°ì´?°ë² ?´ìŠ¤ ?¼ê´„ ?™ê¸°???„ë£Œ (" + totalUpdated + "ê±?");
    return { success: true, message: totalUpdated + "ê±´ì˜ ?°ì´?°ê? ?™ê¸°?”ë˜?ˆìŠµ?ˆë‹¤." };
  } catch (error) {
    Logger.log("DB ?¸ì‹œ ?¤ë¥˜: " + error.toString());
    return { success: false, message: "?™ê¸°???¤íŒ¨: " + error.toString() };
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

    Logger.log("ë¡œê·¸ ê¸°ë¡ ?„ë£Œ: " + changeDescription);
  } catch (error) {
    Logger.log("ë¡œê·¸ ê¸°ë¡ ?¤íŒ¨: " + error.toString());
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
    logChange(year + "???œíŠ¸ ?ì„±");

    const prevYear = year - 1;
    const prevSheet = ss.getSheetByName(prevYear.toString());

    if (prevSheet) {
      const headerRange = prevSheet.getRange("A1:D1");
      headerRange.copyTo(sheet.getRange("A1:D1"));

      sheet.getRange("A2").setValue("ì´??¸ê¸ˆ");
      sheet.getRange("A3").setValue("?˜ê¸‰??(30%)");
      sheet.getRange("A4").setValue("?´ì›” ê¸ˆì•¡");

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
  sheet.getRange("A1").setValue("? ì§œ");
  sheet.getRange("B1").setValue("cw");
  sheet.getRange("C1").setValue("dk");
  sheet.getRange("D1").setValue("ë©”ëª¨");

  sheet.getRange("A2").setValue("ì´??¸ê¸ˆ");
  sheet.getRange("B2").setFormula("=B4+SUM(B5:B)");
  sheet.getRange("C2").setFormula("=C4+SUM(C5:C)");

  sheet.getRange("A3").setValue("?˜ê¸‰??(30%)");
  sheet.getRange("B3").setFormula("=B2*0.3");
  sheet.getRange("C3").setFormula("=C2*0.3");

  sheet.getRange("A4").setValue("?´ì›” ê¸ˆì•¡");

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

  // ? ì§œ ê¸°ì? ?´ë¦¼ì°¨ìˆœ ?•ë ¬ (ìµœì‹ ??
  records.sort((a, b) => {
    return new Date(b.date) - new Date(a.date);
  });

  return records;
}

// â­??¹ì¸ ?€ê¸?ëª©ë¡ ì¡°íšŒ (ë¶€ëª¨ë‹˜ë§?
function getPendingApprovals(skipAuth = false) {
  if (!skipAuth && !isParent()) {
    return { success: false, message: "ë¶€ëª¨ë‹˜ë§??•ì¸?????ˆìŠµ?ˆë‹¤." };
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

// â­??¹ì¸ ?€ê¸???ª© ì¶”ê? (cw/dk??
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

  logChange("[?¹ì¸ ?”ì²­] " + actionType + " - " + userName);

  // ?Œë¦¼ ë©”ì¼ ë°œì†¡
  const details = "?“… ? ì§œ: " + (dateStr || "ë¯¸ì???) + "\n" +
                  "?’° cw: " + (cw || 0) + "??n" +
                  "?’° dk: " + (dk || 0) + "??n" +
                  "?“ ë©”ëª¨: " + (memo || "");
  sendApprovalRequestEmail(actionType, details);

  return { success: true, rowIndex: newRow };
}

// â­??¹ì¸ ?€ê¸???ª© ?˜ì • (? ì²­??ë¶€ëª¨ë‹˜ ê³µí†µ)
function updateApprovalRequest(rowIndex, cw, dk, memo, dateStr) {
  try {
    const approvalSheet = getOrCreateApprovalSheet();
    const rowData = approvalSheet.getRange(rowIndex, 1, 1, 8).getValues()[0];
    
    // ê¶Œí•œ ?•ì¸: ë³¸ì¸???¬ë¦° ê¸€?´ê±°??ë¶€ëª¨ë‹˜?´ì–´????
    const userName = getUserName();
    if (!isParent() && rowData[1] !== userName) {
      return { success: false, message: "ë³¸ì¸???”ì²­ë§??˜ì •?????ˆìŠµ?ˆë‹¤." };
    }

    if (cw !== undefined) approvalSheet.getRange(rowIndex, 4).setValue(Number(cw) || 0);
    if (dk !== undefined) approvalSheet.getRange(rowIndex, 5).setValue(Number(dk) || 0);
    if (memo !== undefined) approvalSheet.getRange(rowIndex, 6).setValue(memo);
    if (dateStr) approvalSheet.getRange(rowIndex, 7).setValue(new Date(dateStr));
    
    logChange("[?¹ì¸ ?”ì²­ ?˜ì •] " + rowData[2] + " - " + userName);
    return { success: true };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

// â­??¹ì¸ ?€ê¸???ª© ì·¨ì†Œ (?? œ)
function cancelApprovalRequest(rowIndex) {
  try {
    const approvalSheet = getOrCreateApprovalSheet();
    const rowData = approvalSheet.getRange(rowIndex, 1, 1, 3).getValues()[0];
    
    // ê¶Œí•œ ?•ì¸
    const userName = getUserName();
    if (!isParent() && rowData[1] !== userName) {
      return { success: false, message: "ë³¸ì¸???”ì²­ë§?ì·¨ì†Œ?????ˆìŠµ?ˆë‹¤." };
    }

    approvalSheet.deleteRow(rowIndex);
    logChange("[?¹ì¸ ?”ì²­ ì·¨ì†Œ] " + (rowData[2] || "??ª©") + " - " + userName);
    return { success: true };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

// â­??¸ê¸ˆ ?©ë? ? ì²­ (cw/dk??
function requestTax(person, allowance, memo, dateStr) {
  if (isParent()) {
    // ë¶€ëª¨ë‹˜?€ ë°”ë¡œ ê¸°ë¡
    return recordTaxDirect(person, allowance, memo, dateStr);
  }

  const tax = Math.floor((allowance * 0.1) / 100) * 100;
  const personName = person === "cw" ? "cw" : "dk";

  const cw = person === "cw" ? tax : 0;
  const dk = person === "dk" ? tax : 0;

  const details =
    "?©ëˆ: " +
    allowance.toLocaleString() +
    "?? ?¸ê¸ˆ: " +
    tax.toLocaleString() +
    "??;

  addApprovalRequest("?¸ê¸ˆ ?©ë?", cw, dk, memo || "?©ëˆ", dateStr, details);

  const notificationDetails =
    "???€?? " +
    personName +
    "\n" +
    "???©ëˆ: " +
    allowance.toLocaleString() +
    "??n" +
    "???¸ê¸ˆ (10%): " +
    tax.toLocaleString() +
    "??n" +
    "??? ì§œ: " +
    (dateStr || new Date().toISOString().split("T")[0]);

  sendApprovalRequestEmail("?¸ê¸ˆ ?©ë?", notificationDetails);

  return {
    success: true,
    needsApproval: true,
    tax: tax,
  };
}

// â­??Œë¹„ ?©ë? ? ì²­ (cw/dk??
function requestDues(dateStr, memo) {
  if (isParent()) {
    return recordDuesDirect(dateStr, memo);
  }

  addApprovalRequest(
    "?Œë¹„ ?©ë?",
    -5000,
    -3000,
    memo || "ê°€ì¡±íšŒë¹?,
    dateStr,
    "cw: 5,000?? dk: 3,000??,
  );

  const notificationDetails =
    "??cw: -5,000??n" +
    "??dk: -3,000??n" +
    "??? ì§œ: " +
    (dateStr || new Date().toISOString().split("T")[0]);

  sendApprovalRequestEmail("?Œë¹„ ?©ë?", notificationDetails);

  return {
    success: true,
    needsApproval: true,
  };
}

// â­??¸ê¸ˆ ?¬ìš© ? ì²­ (cw/dk??
function requestPurchase(cwAmount, dkAmount, description, dateStr) {
  if (isParent()) {
    return recordPurchaseDirect(cwAmount, dkAmount, description, dateStr);
  }

  let buyerType = "";
  if (cwAmount > 0 && dkAmount > 0) {
    buyerType = "?¨ê»˜";
  } else if (cwAmount > 0) {
    buyerType = "cw";
  } else if (dkAmount > 0) {
    buyerType = "dk";
  }

  const details =
    "êµ¬ë§¤?? " +
    buyerType +
    ", ì´ì•¡: " +
    (cwAmount + dkAmount).toLocaleString() +
    "??;

  addApprovalRequest(
    "?¸ê¸ˆ ?¬ìš©",
    -cwAmount,
    -dkAmount,
    description,
    dateStr,
    details,
  );

  const notificationDetails =
    "??êµ¬ë§¤?? " +
    buyerType +
    "\n" +
    "??cw: -" +
    cwAmount.toLocaleString() +
    "??n" +
    "??dk: -" +
    dkAmount.toLocaleString() +
    "??n" +
    "???´ìš©: " +
    description +
    "\n" +
    "??? ì§œ: " +
    (dateStr || new Date().toISOString().split("T")[0]);

  sendApprovalRequestEmail("?¸ê¸ˆ ?¬ìš©", notificationDetails);

  return {
    success: true,
    needsApproval: true,
  };
}

// â­??¹ì¸ ì²˜ë¦¬ (ë¶€ëª¨ë‹˜ë§?
function approveRequest(rowIndex) {
  if (!isParent()) {
    return { success: false, message: "ë¶€ëª¨ë‹˜ë§??¹ì¸?????ˆìŠµ?ˆë‹¤." };
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

  // ?¹ì¸ ?€ê¸???ª© ?? œ
  approvalSheet.deleteRow(rowIndex);

  logChange(
    "[?¹ì¸ ?„ë£Œ] " +
      actionType +
      " - cw: " +
      cw.toLocaleString() +
      "?? dk: " +
      dk.toLocaleString() +
      "??,
  );

  sendApprovalResultEmail(true, actionType, "");

  return { success: true, message: "?¹ì¸?˜ì—ˆ?µë‹ˆ??" };
}

// â­?ê±°ë? ì²˜ë¦¬ (ë¶€ëª¨ë‹˜ë§?
function rejectRequest(rowIndex, reason) {
  if (!isParent()) {
    return { success: false, message: "ë¶€ëª¨ë‹˜ë§?ê±°ë??????ˆìŠµ?ˆë‹¤." };
  }

  const approvalSheet = getOrCreateApprovalSheet();
  const data = approvalSheet.getRange(rowIndex, 1, 1, 8).getValues()[0];
  const actionType = data[2];

  approvalSheet.deleteRow(rowIndex);

  logChange("[?¹ì¸ ê±°ë?] " + actionType + " - ?¬ìœ : " + (reason || "?†ìŒ"));

  sendApprovalResultEmail(false, actionType, reason);

  return { success: true, message: "ê±°ë??˜ì—ˆ?µë‹ˆ??" };
}

// ë¶€ëª¨ë‹˜??ì§ì ‘ ê¸°ë¡?˜ëŠ” ?¨ìˆ˜??
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

  sheet.getRange(newRow, 4).setValue(memo || "?©ëˆ");
  sheet.getRange(newRow, 1).setNumberFormat("yyyy-mm-dd");

  const personName = person === "cw" ? "cw" : "dk";
  logChange(
    "[?¸ê¸ˆ ?©ë?] " +
      personName +
      ": " +
      tax.toLocaleString() +
      "??(" +
      (memo || "?©ëˆ") +
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
  sheet.getRange(newRow, 4).setValue(memo || "ê°€ì¡±íšŒë¹?);
  sheet.getRange(newRow, 1).setNumberFormat("yyyy-mm-dd");

  sheet.getRange(newRow, 2, 1, 2).setFontColor("#dc2626");

  logChange("[?Œë¹„ ?©ë?] cw: -5,000?? dk: -3,000??);

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
    "[?¸ê¸ˆ ?¬ìš©] " +
      description +
      " (cw: -" +
      cwAmount.toLocaleString() +
      "?? dk: -" +
      dkAmount.toLocaleString() +
      "??",
  );

  return {
    success: true,
    needsApproval: false,
    cw: cwAmount,
    dk: dkAmount,
  };
}

function updateRecord(year, rowIndex, cw, dk, memo) {
  if (!isParent()) return { success: false, message: "ê¶Œí•œ ?†ìŒ" };

  const sheet = getOrCreateYearSheet(year);
  sheet.getRange(rowIndex, 2).setValue(cw);
  sheet.getRange(rowIndex, 3).setValue(dk);
  sheet.getRange(rowIndex, 4).setValue(memo);

  logChange(`[ê¸°ë¡ ?˜ì •] ${year}??${rowIndex}???˜ì •??);
  return { success: true };
}

// ==========================================
// ?¤– ?ˆë“œë¡œì´???„ì ¯ API (ë³´ì•ˆ ?„ìˆ˜)
// ==========================================

function handleApiRequest(e) {
  const SERVER_API_KEY = "[PARENT_EMAIL_PROTECTED]";
  // Support both key and apiKey for backwards compatibility
  const requestKey =
    (e.parameter && (e.parameter.apiKey || e.parameter.key)) || "";

  // 1. API ??ê²€ì¦?
  if (requestKey !== SERVER_API_KEY) {
    return ContentService.createTextOutput(
      JSON.stringify({ error: "Invalid API Key" }),
    ).setMimeType(ContentService.MimeType.JSON);
  }

  // 2. ?°ì´??ì¡°íšŒ
  const data = getWidgetData();

  // 3. JSON ?‘ë‹µ ë°˜í™˜
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function getWidgetData() {
  try {
    const taxData = getTaxData();

    // ìµœê·¼ ê¸°ë¡ 3ê°œë§Œ ì¶”ì¶œ
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
  if (!isParent()) return { success: false, message: "ê¶Œí•œ ?†ìŒ" };

  const sheet = getOrCreateYearSheet(year);
  sheet.deleteRow(rowIndex);

  logChange(`[ê¸°ë¡ ?? œ] ${year}??${rowIndex}???? œ??);
  return { success: true };
}
