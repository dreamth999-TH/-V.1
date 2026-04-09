/**
 * GOOGLE APPS SCRIPT BACKEND FOR SURVEY APP
 * 
 * Instructions:
 * 1. Go to script.google.com and create a new project.
 * 2. Replace the code in Code.gs with this content.
 * 3. Replace SHEET_ID with your Google Sheet ID.
 * 4. Replace FOLDER_ID with your Google Drive Folder ID (for images).
 * 5. Deploy as Web App:
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 6. Copy the Web App URL and paste it into src/config.ts in the React app.
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
  if (!e || !e.postData || !e.postData.contents) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: "No data received" }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  try {
    const contents = JSON.parse(e.postData.contents);
    const action = contents.action || 'submit';
    
    if (action === 'delete') {
      return deleteSurvey(contents.id);
    }
    
    if (action === 'update') {
      return updateSurvey(contents.id, contents);
    }

    const data = contents;
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheets()[0];
    
    // Create header if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Timestamp", "Community", "Housing Type", "Shop Name", "House No", "Soi", "Road", 
        "Image URL", "Latitude", "Longitude", "Full Name", "Respondent Type",
        "Phone", "Residents", "Waste Management", "Wastewater", "Wastewater Image URL",
        "Fee Type", "Fee Amount/Reason",
        "Children", "Pregnant", "Elderly Social", "Elderly Home", "Elderly Bedridden", "Disabled", "Disabled Details",
        "Has Pets", "Pet Details", "Responsible Person"
      ]);
    }

    let imageUrl = "";
    if (data.imageFile) {
      imageUrl = uploadImage(data.imageFile, data.fullName + "_House");
    }

    let wastewaterImageUrl = "";
    if (data.wastewaterImageFile) {
      wastewaterImageUrl = uploadImage(data.wastewaterImageFile, data.fullName + "_Wastewater");
    }

    const rowData = [
      new Date(),
      data.community,
      data.housingType === 'อื่นๆ' ? data.housingTypeOther : data.housingType,
      data.shopName || "",
      data.houseNo,
      data.soi || "",
      data.road,
      imageUrl,
      data.latitude || "",
      data.longitude || "",
      data.fullName,
      data.respondentType || "",
      data.phone ? "'" + data.phone : "",
      data.residentsCount,
      (data.wasteManagement || []).map(v => v === 'อื่นๆ' ? `อื่นๆ (${data.wasteManagementOther || ''})` : v).join(", "),
      (data.wastewaterManagement || []).map(v => v === 'อื่นๆ' ? `อื่นๆ (${data.wastewaterManagementOther || ''})` : v).join(", "),
      wastewaterImageUrl,
      data.feeType,
      data.feeType === 'none' ? data.feeReason : data.feeAmount,
      data.healthChildren || 0,
      data.healthPregnant || 0,
      data.healthElderlySocial || 0,
      data.healthElderlyHome || 0,
      data.healthElderlyBedridden || 0,
      data.healthDisabled || 0,
      data.disabledDetails || "",
      data.hasPets,
      JSON.stringify(data.pets || []),
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
      const rowTimestamp = data[i][0];
      let rowId = "";
      
      if (rowTimestamp instanceof Date) {
        rowId = rowTimestamp.toISOString();
      } else {
        rowId = rowTimestamp.toString();
      }

      if (rowId === id.toString()) {
        sheet.deleteRow(i + 1);
        return ContentService.createTextOutput(JSON.stringify({ success: true, message: "ลบข้อมูลเรียบร้อย" }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: "ไม่พบข้อมูล (ID: " + id + ")" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function updateSurvey(id, data) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheets()[0];
    const sheetData = sheet.getDataRange().getValues();
    
    for (let i = 1; i < sheetData.length; i++) {
      const rowTimestamp = sheetData[i][0];
      let rowId = "";
      
      if (rowTimestamp instanceof Date) {
        rowId = rowTimestamp.toISOString();
      } else {
        rowId = rowTimestamp.toString();
      }

      if (rowId === id.toString()) {
        // Prepare row data (same logic as doPost)
        let imageUrl = data.imageUrl || "";
        if (data.imageFile && data.imageFile.startsWith("data:image")) {
          imageUrl = uploadImage(data.imageFile, data.fullName + "_House");
        }

        let wastewaterImageUrl = data.wastewaterImageUrl || "";
        if (data.wastewaterImageFile && data.wastewaterImageFile.startsWith("data:image")) {
          wastewaterImageUrl = uploadImage(data.wastewaterImageFile, data.fullName + "_Wastewater");
        }

        const rowData = [
          rowTimestamp, // Keep original timestamp
          data.community,
          data.housingType === 'อื่นๆ' ? data.housingTypeOther : data.housingType,
          data.shopName || "",
          data.houseNo,
          data.soi || "",
          data.road,
          imageUrl,
          data.latitude || "",
          data.longitude || "",
          data.fullName,
          data.respondentType || "",
          data.phone ? "'" + data.phone : "",
          data.residentsCount,
          (data.wasteManagement || []).map(v => v === 'อื่นๆ' ? `อื่นๆ (${data.wasteManagementOther || ''})` : v).join(", "),
          (data.wastewaterManagement || []).map(v => v === 'อื่นๆ' ? `อื่นๆ (${data.wastewaterManagementOther || ''})` : v).join(", "),
          wastewaterImageUrl,
          data.feeType,
          data.feeType === 'none' ? data.feeReason : data.feeAmount,
          data.healthChildren || 0,
          data.healthPregnant || 0,
          data.healthElderlySocial || 0,
          data.healthElderlyHome || 0,
          data.healthElderlyBedridden || 0,
          data.healthDisabled || 0,
          data.disabledDetails || "",
          data.hasPets,
          JSON.stringify(data.pets || []),
          data.responsiblePerson || "System"
        ];

        sheet.getRange(i + 1, 1, 1, rowData.length).setValues([rowData]);
        return ContentService.createTextOutput(JSON.stringify({ success: true, message: "อัปเดตข้อมูลเรียบร้อย" }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: "ไม่พบข้อมูลที่ต้องการอัปเดต" }))
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
    // Return direct link for <img> tag to display online
    return "https://drive.google.com/uc?export=view&id=" + file.getId();
  } catch (e) {
    return "Error: " + e.toString();
  }
}
