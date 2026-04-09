import { GoogleGenAI } from "@google/genai";

// This service will handle communication with the Google Apps Script Web App.
// Since we are building a real integration, we expect the user to provide the GAS Web App URL.

export interface SurveyData {
  id?: string;
  timestamp?: string;
  fullName: string;
  houseNo: string;
  soi?: string;
  road: string;
  community: string;
  respondentType?: string;
  phone: string;
  residentsCount: number;
  housingType: string;
  shopName?: string;
  housingTypeOther?: string;
  imageUrl?: string;
  imageFile?: string; // base64
  wastewaterImageUrl?: string;
  wastewaterImageFile?: string; // base64
  
  // Environment
  wasteManagement: string[];
  wasteManagementOther?: string;
  feeType: 'monthly' | 'yearly' | 'none';
  feeAmount?: number;
  feeReason?: string;
  wastewaterManagement: string[];
  wastewaterManagementOther?: string;
  
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
  
  latitude?: number;
  longitude?: number;
  
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
const GAS_WEB_APP_URL = import.meta.env.VITE_GAS_URL || "https://script.google.com/macros/s/AKfycbweKdi_ygedf4q_nH8sZuYp-Ys5YZ-Q5DG2TvQzYoD-jOWrR9c_cbXDcdQ64wQ5xzo_qw/exec";

// Caching mechanism
let cachedData: SurveyData[] | null = null;
let lastFetchTime = 0;
let pendingRequest: Promise<SurveyData[]> | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const STALE_DURATION = 1 * 60 * 1000; // 1 minute (background refresh threshold)

// Helper for JSONP with timeout and retry
const fetchJSONP = (url: string, timeout = 15000, retries = 1): Promise<any> => {
  const attempt = (retryCount: number): Promise<any> => {
    return new Promise((resolve, reject) => {
      const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
      
      const timer = setTimeout(() => {
        cleanup();
        if (retryCount > 0) {
          console.warn(`JSONP timeout, retrying... (${retryCount} left)`);
          resolve(attempt(retryCount - 1));
        } else {
          reject(new Error('JSONP request timed out'));
        }
      }, timeout);

      const cleanup = () => {
        clearTimeout(timer);
        if ((window as any)[callbackName]) delete (window as any)[callbackName];
        const script = document.getElementById(callbackName);
        if (script) document.body.removeChild(script);
      };

      (window as any)[callbackName] = (data: any) => {
        cleanup();
        resolve(data);
      };

      const script = document.createElement('script');
      script.id = callbackName;
      script.src = url + (url.indexOf('?') >= 0 ? '&' : '?') + 'callback=' + callbackName;
      script.onerror = () => {
        cleanup();
        if (retryCount > 0) {
          console.warn(`JSONP error, retrying... (${retryCount} left)`);
          resolve(attempt(retryCount - 1));
        } else {
          reject(new Error('JSONP request failed'));
        }
      };
      document.body.appendChild(script);
    });
  };

  return attempt(retries);
};

export const surveyService = {
  async submitSurvey(data: SurveyData) {
    console.log("Submitting data to GAS:", data);
    
    try {
      // Optimistic cache update would be complex for new submissions without a server-generated ID
      // So we just invalidate the cache
      cachedData = null;
      
      await fetch(GAS_WEB_APP_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({ ...data, action: 'submit' }),
      });
      
      return { success: true, message: "บันทึกข้อมูลเรียบร้อย (กรุณาตรวจสอบใน Google Sheet)" };
    } catch (error) {
      console.error("Error submitting to GAS:", error);
      return { success: false, message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" };
    }
  },

  async getSurveys(forceRefresh = false): Promise<SurveyData[]> {
    const now = Date.now();
    
    // If there's a request already in progress, return it
    if (pendingRequest) {
      return pendingRequest;
    }

    // Check if we have valid cache
    if (!forceRefresh && cachedData && (now - lastFetchTime < CACHE_DURATION)) {
      // If data is stale (older than 1 min), trigger background refresh
      if (now - lastFetchTime > STALE_DURATION) {
        console.log("Data is stale, triggering background refresh...");
        this.fetchFreshData().catch(err => console.error("Background refresh failed:", err));
      }
      return cachedData;
    }

    return this.fetchFreshData();
  },

  async fetchFreshData(): Promise<SurveyData[]> {
    // Deduplicate requests
    if (pendingRequest) return pendingRequest;

    pendingRequest = (async () => {
      try {
        console.log("Fetching fresh survey data from GAS...");
        const data = await fetchJSONP(`${GAS_WEB_APP_URL}?action=getSurveys`);
        
        if (!Array.isArray(data)) {
          throw new Error("Invalid data format from GAS");
        }

        const mappedData = data.map((item: any) => {
          const wasteStr = item.wastemanagement || "";
          const wastewaterStr = item.wastewater || "";
          
          return {
            id: item.timestamp,
            community: item.community || "",
            housingType: item.housingtype || "",
            houseNo: item.houseno || "",
            soi: item.soi || "",
            road: item.road || "",
            imageUrl: item.imageurl || "",
            latitude: (item.latitude !== undefined && item.latitude !== null && item.latitude !== "") ? Number(item.latitude) : undefined,
            longitude: (item.longitude !== undefined && item.longitude !== null && item.longitude !== "") ? Number(item.longitude) : undefined,
            fullName: item.fullname || "",
            respondentType: item.respondenttype || "",
            phone: item.phone || "",
            residentsCount: Number(item.residents) || 0,
            wasteManagement: wasteStr ? wasteStr.split(', ').map((v: string) => v.startsWith('อื่นๆ (') ? 'อื่นๆ' : v) : [],
            wasteManagementOther: wasteStr.includes('อื่นๆ (') ? (wasteStr.match(/อื่นๆ \((.*?)\)/)?.[1] || "") : "",
            wastewaterManagement: wastewaterStr ? wastewaterStr.split(', ').map((v: string) => v.startsWith('อื่นๆ (') ? 'อื่นๆ' : v) : [],
            wastewaterManagementOther: wastewaterStr.includes('อื่นๆ (') ? (wastewaterStr.match(/อื่นๆ \((.*?)\)/)?.[1] || "") : "",
            wastewaterImageUrl: item.wastewaterimageurl || "",
            feeType: item.feetype || 'none',
            feeAmount: item.feetype !== 'none' ? Number(item['feeamount/reason']) : undefined,
            feeReason: item.feetype === 'none' ? item['feeamount/reason'] : undefined,
            healthChildren: Number(item.children) || 0,
            healthPregnant: Number(item.pregnant) || 0,
            healthElderlySocial: Number(item.elderlysocial) || 0,
            healthElderlyHome: Number(item.elderlyhome) || 0,
            healthElderlyBedridden: Number(item.elderlybedridden) || 0,
            healthDisabled: Number(item.disabled) || 0,
            disabledDetails: item.disableddetails || "",
            hasPets: item.haspets || 'no',
            pets: item.petdetails ? JSON.parse(item.petdetails) : [],
            responsiblePerson: item.responsibleperson || "",
            timestamp: item.timestamp
          };
        });

        cachedData = mappedData;
        lastFetchTime = Date.now();
        return mappedData;
      } catch (error) {
        console.error("Error fetching from GAS:", error);
        return cachedData || [];
      } finally {
        pendingRequest = null;
      }
    })();

    return pendingRequest;
  },

  async deleteSurvey(id: string) {
    try {
      // Optimistic update
      if (cachedData) {
        cachedData = cachedData.filter(item => item.id !== id);
      }
      
      await fetch(GAS_WEB_APP_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({ action: 'delete', id: id }),
      });
      return { success: true, message: "ลบข้อมูลเรียบร้อย" };
    } catch (error) {
      console.error("Error deleting from GAS:", error);
      cachedData = null; // Invalidate cache on error to be safe
      return { success: false, message: "เกิดข้อผิดพลาดในการลบข้อมูล" };
    }
  },

  async updateSurvey(id: string, data: SurveyData) {
    try {
      // Optimistic update
      if (cachedData) {
        cachedData = cachedData.map(item => item.id === id ? { ...item, ...data } : item);
      }

      await fetch(GAS_WEB_APP_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({ ...data, action: 'update', id: id }),
      });
      return { success: true, message: "อัปเดตข้อมูลเรียบร้อย" };
    } catch (error) {
      console.error("Error updating GAS:", error);
      cachedData = null; // Invalidate cache on error to be safe
      return { success: false, message: "เกิดข้อผิดพลาดในการอัปเดตข้อมูล" };
    }
  }
};
