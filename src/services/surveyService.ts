import { GoogleGenAI } from "@google/genai";

// This service will handle communication with the Google Apps Script Web App.
// Since we are building a real integration, we expect the user to provide the GAS Web App URL.

export interface SurveyData {
  id?: string;
  timestamp?: string;
  prefix: string;
  fullName: string;
  houseNo: string;
  road: string;
  community: string;
  phone: string;
  residentsCount: number;
  housingType: string;
  shopName?: string;
  housingTypeOther?: string;
  imageUrl?: string;
  imageFile?: string; // base64
  
  // Environment
  wasteManagement: string[];
  wasteManagementOther?: string;
  feeType: 'monthly' | 'yearly' | 'none';
  feeAmount?: number;
  feeReason?: string;
  wastewaterManagement: string[];
  
  // Health
  healthChildren: number;
  healthPregnant: number;
  healthElderlySocial: number;
  healthElderlyHome: number;
  healthElderlyBedridden: number;
  healthDisabled: number;
  disabledDetails?: string;
  
  // Pets
  hasPets: 'yes' | 'no';
  pets: PetData[];
  
  responsiblePerson: string;
}

export interface PetData {
  type: 'dog' | 'cat' | 'other';
  typeOther?: string;
  gender?: 'male' | 'female';
  ageYear?: number;
  ageMonth?: number;
  rabiesVaccine?: 'yes' | 'no';
  sterilized?: 'yes' | 'no';
  count?: number; // For non dog/cat
}

// The GAS Web App URL should be set in environment variables or provided by the user.
// For now, we'll use a placeholder that the user can replace.
const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbweKdi_ygedf4q_nH8sZuYp-Ys5YZ-Q5DG2TvQzYoD-jOWrR9c_cbXDcdQ64wQ5xzo_qw/exec";

// Helper for JSONP
const fetchJSONP = (url: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
    (window as any)[callbackName] = (data: any) => {
      delete (window as any)[callbackName];
      document.body.removeChild(script);
      resolve(data);
    };

    const script = document.createElement('script');
    script.src = url + (url.indexOf('?') >= 0 ? '&' : '?') + 'callback=' + callbackName;
    script.onerror = () => {
      delete (window as any)[callbackName];
      document.body.removeChild(script);
      reject(new Error('JSONP request failed'));
    };
    document.body.appendChild(script);
  });
};

export const surveyService = {
  async submitSurvey(data: SurveyData) {
    console.log("Submitting data to GAS:", data);
    
    try {
      // For POST, we still use fetch with no-cors as it's a "simple request"
      // GAS will receive it and process it even if we can't read the response
      await fetch(GAS_WEB_APP_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      // Since no-cors doesn't allow reading the response, we assume success
      // if no error was thrown during the fetch call itself.
      return { success: true, message: "บันทึกข้อมูลเรียบร้อย" };
    } catch (error) {
      console.error("Error submitting to GAS:", error);
      return { success: false, message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" };
    }
  },

  async getSurveys() {
    try {
      // Using JSONP to bypass CORS for GET requests
      const data = await fetchJSONP(`${GAS_WEB_APP_URL}?action=getSurveys`);
      
      // Map GAS headers to our interface
      // GAS headers: timestamp, prefix, fullname, houseno, road, community, phone, residents, housingtype, imageurl, wastemanagement, feetype, feeamount/reason, wastewater, children, pregnant, elderlysocial, elderlyhome, elderlybedridden, disabled, disableddetails, haspets, petdetails, responsibleperson
      return data.map((item: any) => ({
        id: item.timestamp, // Use timestamp as ID
        prefix: item.prefix,
        fullName: item.fullname,
        houseNo: item.houseno,
        road: item.road,
        community: item.community,
        phone: item.phone,
        residentsCount: Number(item.residents),
        housingType: item.housingtype,
        shopName: item.shopname,
        imageUrl: item.imageurl,
        wasteManagement: item.wastemanagement ? item.wastemanagement.split(', ') : [],
        feeType: item.feetype,
        feeAmount: item.feetype !== 'none' ? Number(item['feeamount/reason']) : undefined,
        feeReason: item.feetype === 'none' ? item['feeamount/reason'] : undefined,
        wastewaterManagement: item.wastewater ? item.wastewater.split(', ') : [],
        healthChildren: Number(item.children),
        healthPregnant: Number(item.pregnant),
        healthElderlySocial: Number(item.elderlysocial),
        healthElderlyHome: Number(item.elderlyhome),
        healthElderlyBedridden: Number(item.elderlybedridden),
        healthDisabled: Number(item.disabled),
        disabledDetails: item.disableddetails,
        hasPets: item.haspets,
        pets: item.petdetails ? JSON.parse(item.petdetails) : [],
        responsiblePerson: item.responsibleperson,
        timestamp: item.timestamp
      }));
    } catch (error) {
      console.error("Error fetching from GAS:", error);
      return [];
    }
  },

  async deleteSurvey(id: string) {
    try {
      await fetch(GAS_WEB_APP_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({ action: 'delete', id: id }),
      });
      return { success: true, message: "ลบข้อมูลเรียบร้อย" };
    } catch (error) {
      console.error("Error deleting from GAS:", error);
      return { success: false, message: "เกิดข้อผิดพลาดในการลบข้อมูล" };
    }
  }
};
