/**
 * ⚠️ [TÀI LIỆU LỊCH SỬ — ĐÃ NGỪNG ÁP DỤNG TRÊN TOÀN HỆ THỐNG]
 *
 * QUY TẮC BR-01 & GAP-06 (Kế hoạch V2 — 25/09/2026):
 * - Toàn bộ chức năng thanh toán trực tuyến và webhook ngân hàng tự động ĐÃ BỊ GỠ BỎ HOÀN TOÀN.
 * - Route POST /payments/webhook/bank và GET /payments/commissions/:id/vietqr trả về HTTP 404 nhất quán.
 * - Nghiệp vụ thu phí chuyển sang đối soát ngoài hệ thống (offline-collections / receivables) do Admin thực hiện.
 *
 * ⚠️ LƯU Ý BẮT BUỘC DÀNH CHO QUÂN (QUẢN TRỊ VIÊN):
 * - Việc xóa file hoặc sửa code Git KHÔNG TỰ TẮT trigger đang chạy trên Google Apps Script Console!
 * - Quân cần trực tiếp mở Google Apps Script Console (https://script.google.com),
 *   chọn dự án liên kết với Gmail ducquan16102006@gmail.com, vào mục Triggers (Trình kích hoạt),
 *   và TỰ TAY BẤM XÓA / TẮT TRIGGER `checkVietcombankEmails` để dừng gửi request vào hệ thống.
 *
 * File này được lưu lại phục vụ mục đích kiểm toán và đối chiếu lịch sử (Mục 3.1).
 */

const CONFIG = {
  // Điền URL website QNS BROKER của bạn (khi chạy production là https://qnsbroker.com/api/payments/webhook/bank)
  WEBHOOK_URL: 'https://qnsbroker.com/api/payments/webhook/bank',

  // Khóa bí mật đã đồng bộ trong file .env (BANK_WEBHOOK_SECRET)
  WEBHOOK_SECRET: 'qns_bank_sec_9f8b42ec31057e7c81d3',

  // Điều kiện tìm kiếm email từ Vietcombank trong Gmail
  SEARCH_QUERY: 'from:(vietcombank.com.vn) "biến động số dư" is:unread',

  // Tên nhãn đánh dấu sau khi đã xử lý xong để không bị trùng lặp
  PROCESSED_LABEL: 'QNS_BROKER_DA_XU_LY',

  // Số tài khoản của bạn để đối soát
  ACCOUNT_NUMBER: '1050773506',
};

/**
 * Hàm kiểm tra và xử lý email mới từ Vietcombank (chạy tự động mỗi phút)
 */
function checkVietcombankEmails() {
  const threads = GmailApp.search(CONFIG.SEARCH_QUERY, 0, 10);
  if (!threads || threads.length === 0) {
    Logger.log('Không có email biến động số dư mới từ Vietcombank');
    return;
  }

  const label = getOrCreateLabel(CONFIG.PROCESSED_LABEL);

  for (let i = 0; i < threads.length; i++) {
    const thread = threads[i];
    const messages = thread.getMessages();

    for (let j = 0; j < messages.length; j++) {
      const message = messages[j];
      if (!message.isUnread()) continue;

      const subject = message.getSubject() || '';
      const body = message.getPlainBody() || message.getBody() || '';

      Logger.log('Đang xử lý email: ' + subject);

      // Trích xuất số tiền: kiểm tra tiền cộng (+)
      // Mẫu Vietcombank: Số tiền GD: +1,000,000 VND hoặc GD: +500,000 VND
      const amountMatch =
        body.match(/\+\s*([0-9.,]+)\s*(?:VND|VNĐ|đ)/i) ||
        body.match(/(?:Số tiền|Giao dịch|Số tiền giao dịch)[\s:]*([+\-]?\s*[0-9.,]+)/i);

      // Nếu không có dấu cộng hoặc là giao dịch trừ tiền thì bỏ qua
      if (!amountMatch || body.includes('trừ tiền') || body.match(/\-\s*[0-9.,]+\s*(?:VND|VNĐ|đ)/i)) {
        Logger.log('Bỏ qua: Không phải giao dịch cộng tiền');
        message.markRead();
        thread.addLabel(label);
        continue;
      }

      const cleanNum = amountMatch[1].replace(/[,.\s]/g, '');
      const amount = parseInt(cleanNum, 10);

      // Trích xuất nội dung chuyển khoản (Memo)
      let description = '';
      const descMatch = body.match(/(?:Nội dung|Nội dung giao dịch|Chi tiết|Details)[\s:]*([^\r\n]+)/i);
      if (descMatch) {
        description = descMatch[1].trim();
      }

      // Trích xuất mã giao dịch / mã tham chiếu
      let reference = '';
      const refMatch = body.match(
        /(?:Số tham chiếu|Mã giao dịch|Ref|Transaction ID|MBVCB)[\s.:]*([A-Za-z0-9.]+)/i,
      );
      if (refMatch) {
        reference = refMatch[1].trim();
      } else {
        reference = 'VCB-EMAIL-' + message.getId();
      }

      // Gửi Webhook về hệ thống QNS BROKER
      const payload = {
        secret: CONFIG.WEBHOOK_SECRET,
        bankName: 'Vietcombank',
        accountNumber: CONFIG.ACCOUNT_NUMBER,
        amount: amount,
        description: description,
        reference: reference,
        rawEmail: body,
        transactionDateTime: message.getDate().toISOString(),
      };

      try {
        const response = UrlFetchApp.fetch(CONFIG.WEBHOOK_URL, {
          method: 'post',
          contentType: 'application/json',
          headers: {
            'x-webhook-secret': CONFIG.WEBHOOK_SECRET,
          },
          payload: JSON.stringify(payload),
          muteHttpExceptions: true,
        });

        const statusCode = response.getResponseCode();
        const responseText = response.getContentText();
        Logger.log('Kết quả Webhook (' + statusCode + '): ' + responseText);

        if (statusCode >= 200 && statusCode < 300) {
          message.markRead();
          thread.addLabel(label);
          Logger.log('Gạch nợ thành công cho giao dịch: ' + reference);
        } else {
          Logger.log('Máy chủ trả mã lỗi: ' + statusCode);
        }
      } catch (err) {
        Logger.log('Lỗi khi gửi webhook: ' + err.toString());
      }
    }
  }
}

/**
 * Hàm gửi dữ liệu mẫu để thử nghiệm kết nối ngay lập tức mà không cần chờ email thật
 */
function testConnect() {
  Logger.log('Bắt đầu thử nghiệm kết nối Webhook tới QNS BROKER...');
  const testPayload = {
    secret: CONFIG.WEBHOOK_SECRET,
    bankName: 'Vietcombank',
    accountNumber: CONFIG.ACCOUNT_NUMBER,
    amount: 100000,
    description: 'TEST GOOGLE APPS SCRIPT KET NOI QNS BROKER',
    reference: 'TEST-SCRIPT-' + new Date().getTime(),
    transactionDateTime: new Date().toISOString(),
  };

  try {
    const response = UrlFetchApp.fetch(CONFIG.WEBHOOK_URL, {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'x-webhook-secret': CONFIG.WEBHOOK_SECRET,
      },
      payload: JSON.stringify(testPayload),
      muteHttpExceptions: true,
    });

    Logger.log('Mã HTTP: ' + response.getResponseCode());
    Logger.log('Phản hồi từ website: ' + response.getContentText());
  } catch (err) {
    Logger.log('Lỗi kết nối: ' + err.toString());
  }
}

/**
 * Hàm tiện ích lấy hoặc tạo nhãn Gmail
 */
function getOrCreateLabel(name) {
  let label = GmailApp.getUserLabelByName(name);
  if (!label) {
    label = GmailApp.createLabel(name);
  }
  return label;
}
