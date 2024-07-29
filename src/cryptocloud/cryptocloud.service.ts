import { Injectable } from "@nestjs/common";
import fetch from 'node-fetch';

@Injectable()
export class CryptocloudService {
  baseUrl: string;
  constructor() {
    this.baseUrl = "https://api.cryptocloud.plus/v2/";
  }

  async sendRequest(endpoint: string, method = "POST", payload = null) {
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

  async createInvoice(invoiceData: any): Promise<any> {
    return await this.sendRequest("invoice/create", "POST", {shop_id: process.env.CRYPTOCLOUD_SHOP_ID, ...invoiceData});
  }

  cancelInvoice(uuid: any) {
    return this.sendRequest("invoice/merchant/canceled", "POST", { uuid });
  }

  listInvoices(startDate: any, endDate: any, offset = 0, limit = 10) {
    return this.sendRequest("invoice/merchant/list", "POST", {
      start: startDate,
      end: endDate,
      offset,
      limit,
    });
  }

  getInvoiceInfo(uuids: any): Promise<any> {
    return this.sendRequest("invoice/merchant/info", "POST", { uuids });
  }

  getBalance() {
    return this.sendRequest("merchant/wallet/balance/all", "POST");
  }

  getStatistics(startDate: any, endDate: any) {
    return this.sendRequest("invoice/merchant/statistics", "POST", {
      start: startDate,
      end: endDate,
    });
  }
}
