/**
 * Google Apps Script (Code.gs)
 * Copy this code into your Google Apps Script project.
 * 
 * Instructions:
 * 1. Go to script.google.com
 * 2. Create a new project.
 * 3. Replace the code in Code.gs with this content.
 * 4. Replace SHEET_ID and FOLDER_ID with your actual IDs.
 * 5. Deploy as a Web App (Execute as: Me, Access: Anyone).
 * 6. Copy the Web App URL and paste it into surveyService.ts.
 */

const SHEET_ID = "1eSd0dtE8D7uoYkGptzboIjiAPBU0dHIttjmeCfCCQ1Y";
const FOLDER_ID = "1fXPsQTMrD1Lt-MViaBpLTo8QJ1trTMTD";

function doGet(e) {
  const action = e.parameter.action;
  const callback = e.parameter.callback;
  
  if (action === 'getSurveys') {
    const data = getSurveysRaw();
    if (callback) {
      return ContentService.createTextOutput(callback + '(' + JSON.stringify(data) + ')')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return ContentService.createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput("Service is running").setMimeType(ContentService.MimeType.TEXT);
}

function getSurveysRaw() {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheets()[0];
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    return rows.map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        const key = header.toLowerCase().replace(/ /g, '');
        obj[key] = row[index];
      });
      return obj;
    });
  } catch (error) {
    return { error: error.toString() };
  }
}

function doPost(e) {
  try {
    const contents = JSON.parse(e.postData.contents);
    const action = contents.action || 'submit';
    
    if (action === 'delete') {
      return deleteSurvey(contents.id);
    }

    const data = contents;
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheets()[0];
    
    // Create header if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Timestamp", "Prefix", "Full Name", "House No", "Road", "Community", 
        "Phone", "Residents", "Housing Type", "Shop Name", "Image URL", 
        "Waste Management", "Fee Type", "Fee Amount/Reason", "Wastewater",
        "Children", "Pregnant", "Elderly Social", "Elderly Home", "Elderly Bedridden", "Disabled", "Disabled Details",
        "Has Pets", "Pet Details", "Responsible Person"
      ]);
    }

    let imageUrl = "";
    if (data.imageFile) {
      imageUrl = uploadImage(data.imageFile, data.fullName);
    }

    const rowData = [
      new Date(),
      data.prefix,
      data.fullName,
      data.houseNo,
      data.road,
      data.community,
      data.phone ? "'" + data.phone : "",
      data.residentsCount,
      data.housingType,
      data.shopName || "",
      imageUrl,
      data.wasteManagement.join(", "),
      data.feeType,
      data.feeType === 'none' ? data.feeReason : data.feeAmount,
      data.wastewaterManagement.join(", "),
      data.healthChildren,
      data.healthPregnant,
      data.healthElderlySocial,
      data.healthElderlyHome,
      data.healthElderlyBedridden,
      data.healthDisabled,
      data.disabledDetails || "",
      data.hasPets,
      JSON.stringify(data.pets),
      data.responsiblePerson || "System"
    ];

    sheet.appendRow(rowData);

    return ContentService.createTextOutput(JSON.stringify({ success: true, message: "บันทึกข้อมูลเรียบร้อย" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function deleteSurvey(id) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheets()[0];
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      // Assuming ID is in some column, or we use timestamp as ID
      // Let's use timestamp (first column) as a simple ID for now
      if (data[i][0].toString() === id.toString()) {
        sheet.deleteRow(i + 1);
        return ContentService.createTextOutput(JSON.stringify({ success: true, message: "ลบข้อมูลเรียบร้อย" }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: "ไม่พบข้อมูล" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function uploadImage(base64Data, name) {
  try {
    const folder = DriveApp.getFolderById(FOLDER_ID);
    const contentType = base64Data.substring(5, base64Data.indexOf(';'));
    const bytes = Utilities.base64Decode(base64Data.split(',')[1]);
    const blob = Utilities.newBlob(bytes, contentType, "House_" + name + "_" + new Date().getTime());
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (e) {
    return "Error: " + e.toString();
  }
}
