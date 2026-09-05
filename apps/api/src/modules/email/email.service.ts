import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface EmailRecipient {
  email: string;
  name?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private isMock = true;

  constructor(private readonly config?: ConfigService) {
    this.initTransporter();
  }

  private initTransporter() {
    const driver = this.config?.get<string>('MAIL_DRIVER') ?? process.env.MAIL_DRIVER ?? 'mock';
    const host = this.config?.get<string>('SMTP_HOST') ?? process.env.SMTP_HOST;
    const port = Number(this.config?.get<number>('SMTP_PORT') ?? process.env.SMTP_PORT ?? 587);
    const user = this.config?.get<string>('SMTP_USER') ?? process.env.SMTP_USER;
    const pass = this.config?.get<string>('SMTP_PASS') ?? process.env.SMTP_PASS;

    if (driver !== 'mock' && host && user && pass) {
      try {
        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: { user, pass },
        });
        this.isMock = false;
        this.logger.log(`[EmailService] Khởi tạo SMTP transporter thành công tới ${host}:${port}`);
      } catch (err) {
        this.logger.error(`[EmailService] Không thể kết nối SMTP, fallback về MOCK: ${err}`);
        this.isMock = true;
      }
    } else {
      this.isMock = true;
      this.logger.log(`[EmailService] Chạy ở chế độ MOCK (các thông báo giao dịch sẽ log ra console server)`);
    }
  }

  private async sendEmail(to: string, subject: string, html: string, textSummary: string): Promise<boolean> {
    const from = this.config?.get<string>('SMTP_FROM') ?? process.env.SMTP_FROM ?? 'BĐS Cho Thuê <no-reply@batdongsan.vn>';

    if (this.isMock || !this.transporter) {
      this.logger.log(`\n📧 ========== [MOCK EMAIL NOTIFICATION] ==========
To:      ${to}
From:    ${from}
Subject: ${subject}
Content: ${textSummary}
==================================================\n`);
      return true;
    }

    try {
      await this.transporter.sendMail({
        from,
        to,
        subject,
        html,
        text: textSummary,
      });
      this.logger.log(`[EmailService] Đã gửi email "${subject}" tới ${to}`);
      return true;
    } catch (err: any) {
      this.logger.error(`[EmailService] Lỗi khi gửi email tới ${to}: ${err.message}`);
      return false;
    }
  }

  /**
   * (a) Thông báo cho Chủ trọ/Môi giới: Tin đăng đã được tiếp nhận và đang chờ duyệt
   */
  async sendListingSubmittedToLandlord(listing: { id: bigint | string; title: string; price: bigint | number }, landlordPhone: string, landlordEmail?: string) {
    const targetEmail = landlordEmail || `chutro-${landlordPhone}@batdongsan.vn`;
    const subject = `[BĐS Cho Thuê] Xác nhận tiếp nhận tin đăng: ${listing.title}`;
    const summary = `Xin chào! Tin đăng "${listing.title}" (Mã BĐS: #${listing.id}) của bạn đã được tiếp nhận thành công và đang trong hàng đợi kiểm duyệt. Ban quản trị sẽ xét duyệt trong vòng 24h.`;
    const html = `
      <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #0d9488;">BĐS Cho Thuê — Xác nhận tiếp nhận tin</h2>
        <p>Xin chào quý chủ nhà / môi giới <strong>${landlordPhone}</strong>,</p>
        <p>Tin cho thuê của bạn đã được gửi thành công lên hệ thống:</p>
        <blockquote style="background: #f0fdfa; padding: 12px 16px; border-left: 4px solid #0d9488; margin: 16px 0;">
          <strong>Tiêu đề:</strong> ${listing.title}<br/>
          <strong>Mã tin:</strong> #${listing.id}<br/>
          <strong>Trạng thái:</strong> Đang chờ duyệt (Pending)
        </blockquote>
        <p>Đội ngũ kiểm duyệt sẽ kiểm tra thông tin để đảm bảo tính minh bạch và thông báo tới bạn ngay khi hoàn tất.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #888;">BĐS Cho Thuê — Nền tảng tìm phòng trọ & nhà cho thuê minh bạch.</p>
      </div>
    `;

    return this.sendEmail(targetEmail, subject, html, summary);
  }

  /**
   * (b1) Thông báo cho Chủ trọ/Môi giới: Tin đăng ĐÃ ĐƯỢC DUYỆT lên sàn
   */
  async sendListingApprovedToLandlord(listing: { id: bigint | string; title: string; slug: string }, landlordPhone: string, landlordEmail?: string) {
    const targetEmail = landlordEmail || `chutro-${landlordPhone}@batdongsan.vn`;
    const subject = `[BĐS Cho Thuê] Tin đăng #${listing.id} đã được PHÊ DUYỆT`;
    const summary = `Chúc mừng bạn! Tin đăng "${listing.title}" (Mã BĐS: #${listing.id}) đã được phê duyệt và đang hiển thị công khai tới hàng nghìn sinh viên, người thuê.`;
    const html = `
      <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #0d9488;">🎉 Tin đăng của bạn đã được phê duyệt!</h2>
        <p>Xin chào <strong>${landlordPhone}</strong>,</p>
        <p>Tin cho thuê của bạn đã chính thức được hiển thị công khai:</p>
        <div style="background: #ecfdf5; padding: 16px; border-radius: 8px; border: 1px solid #a7f3d0; margin: 16px 0;">
          <p style="margin: 0; font-weight: bold; color: #065f46;">${listing.title}</p>
          <p style="margin: 4px 0 0; font-size: 13px; color: #047857;">Mã tin: #${listing.id}</p>
        </div>
        <p>Khách thuê quan tâm có thể tìm kiếm và liên hệ trực tiếp với bạn qua SĐT/Zalo.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #888;">BĐS Cho Thuê — Nền tảng kết nối trực tiếp chủ nhà và người thuê.</p>
      </div>
    `;

    return this.sendEmail(targetEmail, subject, html, summary);
  }

  /**
   * (b2) Thông báo cho Chủ trọ/Môi giới: Tin đăng BỊ TỪ CHỐI kèm lý do
   */
  async sendListingRejectedToLandlord(listing: { id: bigint | string; title: string }, landlordPhone: string, reason: string, landlordEmail?: string) {
    const targetEmail = landlordEmail || `chutro-${landlordPhone}@batdongsan.vn`;
    const subject = `[BĐS Cho Thuê] Thông báo từ chối tin đăng #${listing.id}`;
    const summary = `Tin đăng "${listing.title}" (Mã BĐS: #${listing.id}) chưa đáp ứng tiêu chuẩn sàn. Lý do: "${reason}". Vui lòng cập nhật lại thông tin.`;
    const html = `
      <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #dc2626;">Thông báo về tin đăng chưa được duyệt</h2>
        <p>Xin chào <strong>${landlordPhone}</strong>,</p>
        <p>Rất tiếc, tin cho thuê <strong>"${listing.title}"</strong> (Mã: #${listing.id}) chưa thể xuất bản vì lý do sau:</p>
        <div style="background: #fef2f2; padding: 14px 18px; border-left: 4px solid #ef4444; border-radius: 4px; margin: 16px 0; color: #991b1b;">
          <strong>Lý do từ chối:</strong> ${reason}
        </div>
        <p>Bạn có thể vào trang Quản lý tin để chỉnh sửa lại thông tin và gửi yêu cầu duyệt lại.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #888;">Ban Quản Trị BĐS Cho Thuê.</p>
      </div>
    `;

    return this.sendEmail(targetEmail, subject, html, summary);
  }

  /**
   * (c) Thông báo cho Quản trị viên (Admin): Có tin mới cần duyệt
   */
  async sendNewListingToAdmin(listing: { id: bigint | string; title: string; propertyType: string; price: bigint | number; ownerPhone?: string }) {
    const adminEmail = this.config?.get<string>('ADMIN_NOTIFICATION_EMAIL') ?? process.env.ADMIN_NOTIFICATION_EMAIL ?? 'admin@batdongsan.vn';
    const subject = `[ADMIN CẦN DUYỆT] Tin cho thuê mới #${listing.id}: ${listing.title}`;
    const summary = `Có tin cho thuê mới cần duyệt từ SĐT ${listing.ownerPhone ?? 'Chưa rõ'}. Tiêu đề: "${listing.title}". Giá: ${Number(listing.price).toLocaleString('vi-VN')} đ/tháng.`;
    const html = `
      <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #0d9488;">⚡ Cần duyệt: Tin đăng mới #${listing.id}</h2>
        <p>Hệ thống vừa nhận được 1 tin cho thuê mới từ người dùng <strong>${listing.ownerPhone ?? 'Chưa rõ'}</strong>:</p>
        <ul>
          <li><strong>Mã tin:</strong> #${listing.id}</li>
          <li><strong>Tiêu đề:</strong> ${listing.title}</li>
          <li><strong>Loại hình:</strong> ${listing.propertyType}</li>
          <li><strong>Giá thuê:</strong> ${Number(listing.price).toLocaleString('vi-VN')} đ/tháng</li>
        </ul>
        <p>Vui lòng đăng nhập vào trang Quản trị để kiểm tra nội dung và duyệt tin.</p>
      </div>
    `;

    return this.sendEmail(adminEmail, subject, html, summary);
  }

  /**
   * (d) Thông báo cho Quản trị viên (Admin): Có báo cáo vi phạm mới
   */
  async sendNewReportToAdmin(report: { id: bigint | string; reason: string; note?: string | null; listingTitle?: string; listingId?: bigint | string; reporterPhone?: string }) {
    const adminEmail = this.config?.get<string>('ADMIN_NOTIFICATION_EMAIL') ?? process.env.ADMIN_NOTIFICATION_EMAIL ?? 'admin@batdongsan.vn';
    const subject = `[CẢNH BÁO VI PHẠM] Báo cáo mới cho tin #${report.listingId ?? ''}: ${report.reason}`;
    const summary = `Có báo cáo vi phạm mới từ SĐT ${report.reporterPhone ?? 'Ẩn danh'}. Lý do: ${report.reason}. Tin: "${report.listingTitle ?? ''}". Ghi chú: ${report.note ?? 'Không có'}.`;
    const html = `
      <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #b91c1c;">⚠️ Cảnh báo: Có báo cáo vi phạm mới</h2>
        <p>Người dùng <strong>${report.reporterPhone ?? 'Khách vãng lai'}</strong> vừa gửi báo cáo vi phạm:</p>
        <div style="background: #fff1f2; border: 1px solid #fecdd3; padding: 16px; border-radius: 8px;">
          <p><strong>Mã báo cáo:</strong> #${report.id}</p>
          <p><strong>Tin bị báo cáo:</strong> #${report.listingId} — ${report.listingTitle ?? 'Chưa rõ'}</p>
          <p><strong>Lý do vi phạm:</strong> <span style="color: #e11d48; font-weight: bold;">${report.reason}</span></p>
          <p><strong>Ghi chú chi tiết:</strong> ${report.note || 'Không có ghi chú'}</p>
        </div>
        <p>Vui lòng xử lý báo cáo tại trang Quản trị Báo cáo vi phạm.</p>
      </div>
    `;

    return this.sendEmail(adminEmail, subject, html, summary);
  }
}
