import { Injectable } from "@nestjs/common";

@Injectable()
export class CryptocloudService {
  baseUrl: string;
  constructor() {
    this.baseUrl = "https://api.cryptocloud.plus/v2/";
  }

  async sendRequest(endpoint, method = "POST", payload = null) {
    const headers = {
      Authorization: `Token ${process.env.CRYPTOCLOUD_API_KEY}`,
      "Content-Type": "application/json",
    };
    const url = this.baseUrl + endpoint;

    const response = await fetch(url, {
      method: method,
      headers: headers,
      body: payload ? JSON.stringify(payload) : null,
    });

    return response.json();
  }

  async createInvoice(invoiceData) {
    return await this.sendRequest("invoice/create", "POST", {shop_id: process.env.CRYPTOCLOUD_SHOP_ID, ...invoiceData});
  }

  cancelInvoice(uuid) {
    return this.sendRequest("invoice/merchant/canceled", "POST", { uuid });
  }

  listInvoices(startDate, endDate, offset = 0, limit = 10) {
    return this.sendRequest("invoice/merchant/list", "POST", {
      start: startDate,
      end: endDate,
      offset,
      limit,
    });
  }

  getInvoiceInfo(uuids) {
    return this.sendRequest("invoice/merchant/info", "POST", { uuids });
  }

  getBalance() {
    return this.sendRequest("merchant/wallet/balance/all", "POST");
  }

  getStatistics(startDate, endDate) {
    return this.sendRequest("invoice/merchant/statistics", "POST", {
      start: startDate,
      end: endDate,
    });
  }
}
