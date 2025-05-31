
const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxjxq9a6Q_WBe97gywtqQPkUm7ss98E1DICs70sF0-59IGeOODSLM0XYaYsVNodRuMyuQ/exec";

export interface BillData {
  billId: string;
  customer: string;
  total: string;
  date: string;
}

export const googleSheetsApi = {
  // Fetch all bills from Google Sheets
  async getBills(): Promise<BillData[]> {
    try {
      const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: "GET",
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Assuming the first row contains headers, skip it
      if (data.length > 1) {
        return data.slice(1).map((row: string[]) => ({
          billId: row[0] || "",
          customer: row[1] || "",
          total: row[2] || "",
          date: row[3] || "",
        }));
      }
      
      return [];
    } catch (error) {
      console.error("Error fetching bills:", error);
      throw error;
    }
  },

  // Add a new bill to Google Sheets
  async addBill(billData: BillData): Promise<string> {
    try {
      const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(billData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.text();
      console.log("Bill added:", result);
      return result;
    } catch (error) {
      console.error("Error adding bill:", error);
      throw error;
    }
  },
};
