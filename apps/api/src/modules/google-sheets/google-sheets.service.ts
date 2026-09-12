import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';

/**
 * Sanitize giá trị trước khi ghi vào Google Sheets để triệt tiêu lỗ hổng Formula Injection (CSV Injection - BE-10).
 * Nếu chuỗi bắt đầu bằng =, +, -, @, tab, newline, thêm dấu nháy đơn ' ở đầu để Google Sheets coi là plain text.
 * Nếu là chuỗi số điện thoại (bắt đầu bằng 0 hoặc +), cũng prepend ' để tránh Google Sheets tự convert sang number làm mất số 0 đầu.
 */
export function sanitizeSheetCell(val: any): string | number {
  if (val === null || val === undefined) {
    return '';
  }
  if (typeof val === 'number') {
    return Number.isFinite(val) ? val : 0;
  }
  const rawStr = String(val);
  if (!rawStr) return '';

  // Ký tự khởi đầu công thức nguy hiểm trong bảng tính Excel / Google Sheets
  const DANGEROUS_CHARS = ['=', '+', '-', '@', '\t', '\r'];
  if (DANGEROUS_CHARS.some((char) => rawStr.startsWith(char))) {
    return `'${rawStr}`;
  }

  const str = rawStr.trim();
  if (!str) return '';

  if (DANGEROUS_CHARS.some((char) => str.startsWith(char))) {
    return `'${str}`;
  }

  // Số điện thoại Việt Nam bắt đầu bằng 0 hoặc +84
  if (/^0\d{8,11}$/.test(str) || /^\+84\d{8,11}$/.test(str)) {
    return `'${str}`;
  }

  return str;
}

@Injectable()
export class GoogleSheetsService {
  private readonly logger = new Logger(GoogleSheetsService.name);
  private sheets: any = null;
  private spreadsheetId: string | null = null;
  public isMock = true;

  constructor(private readonly config?: ConfigService) {
    this.initGoogleSheets();
  }

  private initGoogleSheets() {
    const driver = this.config?.get<string>('GOOGLE_SHEETS_DRIVER') ?? process.env.GOOGLE_SHEETS_DRIVER ?? 'mock';
    this.spreadsheetId = this.config?.get<string>('GOOGLE_SHEETS_SPREADSHEET_ID') ?? process.env.GOOGLE_SHEETS_SPREADSHEET_ID ?? null;
    const credsJson = this.config?.get<string>('GOOGLE_SHEETS_CREDENTIALS_JSON') ?? process.env.GOOGLE_SHEETS_CREDENTIALS_JSON;

    if (driver !== 'mock' && this.spreadsheetId && credsJson) {
      try {
        let credentials: any;
        if (credsJson.startsWith('{')) {
          credentials = JSON.parse(credsJson);
        } else {
          // File path
          const fs = require('fs');
          credentials = JSON.parse(fs.readFileSync(credsJson, 'utf8'));
        }

        const auth = new google.auth.GoogleAuth({
          credentials,
          scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        this.sheets = google.sheets({ version: 'v4', auth });
        this.isMock = false;
        this.logger.log(`[GoogleSheetsService] Đã kết nối Google Sheets API thành công (Spreadsheet ID: ${this.spreadsheetId})`);
      } catch (err) {
        this.logger.error(`[GoogleSheetsService] Không thể kết nối Google Sheets API, fallback về MOCK: ${err}`);
        this.isMock = true;
      }
    } else {
      this.isMock = true;
      this.logger.log(`[GoogleSheetsService] Chạy ở chế độ MOCK (đồng bộ bảng tính sẽ log ra console server)`);
    }
  }

  /**
   * Thêm 1 dòng vào Google Sheet theo tên tab (1 chiều ghi), tự động sanitize chống Formula Injection
   */
  private async appendRow(sheetName: string, rawRowData: (string | number)[]): Promise<boolean> {
    const rowData = rawRowData.map(sanitizeSheetCell);

    if (this.isMock || !this.sheets || !this.spreadsheetId) {
      this.logger.log(`\n📊 ========== [MOCK GOOGLE SHEETS SYNC] ==========
Sheet:   "${sheetName}"
Row:     ${JSON.stringify(rowData, null, 2)}
==================================================\n`);
      return true;
    }

    try {
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A:Z`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [rowData],
        },
      });
      this.logger.log(`[GoogleSheetsService] Đã append 1 dòng vào sheet "${sheetName}" thành công.`);
      return true;
    } catch (err: any) {
      this.logger.error(`[GoogleSheetsService] Lỗi khi ghi vào sheet "${sheetName}": ${err.message}`);
      return false;
    }
  }

  /**
   * Đồng bộ tin đăng mới vào tab "Tin chờ duyệt"
   */
  async appendPendingListing(listing: {
    id: bigint | string;
    title: string;
    propertyType: string;
    price: bigint | number;
    depositAmount?: bigint | number | null;
    locationName?: string;
    addressDetail?: string | null;
    ownerName?: string | null;
    ownerPhone?: string;
    createdAt?: Date | string;
    slug?: string;
  }) {
    const siteUrl = this.config?.get<string>('NEXT_PUBLIC_SITE_URL') ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
    const link = listing.slug ? `${siteUrl}/tin/${listing.slug}` : `${siteUrl}/admin/tin-cho-duyet`;

    const row = [
      listing.id.toString(),
      listing.title,
      listing.propertyType,
      [listing.addressDetail, listing.locationName].filter(Boolean).join(', ') || 'Chưa rõ',
      Number(listing.price),
      listing.depositAmount ? Number(listing.depositAmount) : 0,
      listing.ownerName || 'Chưa cập nhật',
      listing.ownerPhone || 'Chưa rõ',
      listing.createdAt ? new Date(listing.createdAt).toLocaleString('vi-VN') : new Date().toLocaleString('vi-VN'),
      link,
    ];

    return this.appendRow('Tin chờ duyệt', row);
  }

  /**
   * Đồng bộ báo cáo vi phạm mới vào tab "Báo cáo vi phạm"
   */
  async appendViolationReport(report: {
    id: bigint | string;
    listingId: bigint | string;
    listingTitle?: string;
    reason: string;
    note?: string | null;
    reporterPhone?: string;
    createdAt?: Date | string;
  }) {
    const row = [
      report.id.toString(),
      report.listingId.toString(),
      report.listingTitle || 'Tin BĐS',
      report.reason,
      report.note || 'Không có',
      report.reporterPhone || 'Khách vãng lai',
      report.createdAt ? new Date(report.createdAt).toLocaleString('vi-VN') : new Date().toLocaleString('vi-VN'),
    ];

    return this.appendRow('Báo cáo vi phạm', row);
  }
}
