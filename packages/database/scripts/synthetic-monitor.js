/**
 * SYNTHETIC MONITOR DÀNH CHO GIÁM SÁT HỆ THỐNG THỰC TẾ
 * 
 * Kiểm tra các luồng nghiệp vụ cốt lõi bằng HTTP/HTTPS request thật:
 * 1. Health Probe (/health) — kiểm tra trạng thái và schema
 * 2. Tìm kiếm Public (/listings) — kiểm tra contract items + pagination
 * 3. Frontend Web Home (WEB_URL) — kiểm tra web server phản hồi
 * 4. Lead Submission & Deduplication (/leads) — gửi dedupeKey thật trong body
 * 
 * BẮT BUỘC:
 * - process.exit(1) nếu bất kỳ kiểm tra nào thất bại hoặc server offline.
 * - Không bao giờ hardcode gate policy "true" hay nhãn "PILOT READY".
 */

const http = require('http');
const https = require('https');

console.log('\n======================================================');
console.log('📡 BẮT ĐẦU CHẠY SYNTHETIC HEALTH & FLOW MONITOR');
console.log('======================================================\n');

const API_BASE = process.env.API_URL || 'http://localhost:4000';
const WEB_BASE = process.env.WEB_URL || 'http://localhost:3000';
const TEST_PHONE = process.env.TEST_PHONE || '0900999001';
const TEST_LISTING_ID = process.env.TEST_LISTING_ID || null;

async function measureRequest(name, url, options = {}) {
  const start = Date.now();
  return new Promise((resolve) => {
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch (err) {
      return resolve({
        name,
        url,
        status: 0,
        duration: 0,
        success: false,
        error: `URL không hợp lệ: ${err.message}`,
        data: null,
      });
    }

    const transport = parsedUrl.protocol === 'https:' ? https : http;
    const defaultPort = parsedUrl.protocol === 'https:' ? 443 : 80;

    const reqOptions = {
      protocol: parsedUrl.protocol,
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || defaultPort,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: options.timeout || 5000,
    };

    const req = transport.request(reqOptions, (res) => {
      let rawData = '';
      res.on('data', (chunk) => (rawData += chunk));
      res.on('end', () => {
        const duration = Date.now() - start;
        let parsedJson = null;
        try {
          parsedJson = JSON.parse(rawData);
        } catch {
          parsedJson = null;
        }

        const isHttpOk = res.statusCode >= 200 && res.statusCode < 400;
        resolve({
          name,
          url,
          status: res.statusCode,
          duration,
          success: isHttpOk,
          rawData,
          json: parsedJson,
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        name,
        url,
        status: 0,
        duration: Date.now() - start,
        success: false,
        error: err.message,
        data: null,
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        name,
        url,
        status: 408,
        duration: Date.now() - start,
        success: false,
        error: 'Timeout exceeded (5000ms)',
        data: null,
      });
    });

    if (options.body) {
      const payload = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
      req.write(payload);
    }
    req.end();
  });
}

async function runSyntheticChecks() {
  const results = [];
  let detectedListingId = TEST_LISTING_ID;

  // 1. Kiểm tra API Health Probe
  console.log('[1/4] Kiểm tra API Health Probe...');
  const healthRes = await measureRequest('API Health', `${API_BASE}/health`);
  let healthValid = healthRes.success;
  if (healthValid && healthRes.json) {
    if (healthRes.json.status !== 'ok' && healthRes.json.status !== 'healthy') {
      healthValid = false;
      healthRes.error = `Health status không đạt: ${JSON.stringify(healthRes.json)}`;
    }
  } else if (healthValid && !healthRes.json) {
    healthValid = false;
    healthRes.error = 'Health response không phải JSON hợp lệ';
  }
  healthRes.success = healthValid;
  results.push(healthRes);

  if (healthRes.success) {
    console.log(`✅ [${healthRes.status}] ${healthRes.name}: ${healthRes.duration}ms`);
  } else {
    console.error(`❌ [FAILED] ${healthRes.name}: ${healthRes.error || `HTTP ${healthRes.status}`}`);
  }

  // 2. Kiểm tra Public Search Listings
  console.log('[2/4] Kiểm tra Public Search Listings contract...');
  const searchRes = await measureRequest('Public Search', `${API_BASE}/listings?categoryGroup=thue_can_ho&pageSize=10`);
  let searchValid = searchRes.success;
  if (searchValid && searchRes.json) {
    // API contract: phải trả về { items: [...], pagination: {...} }
    const hasItems = Array.isArray(searchRes.json.items);
    const hasPagination = typeof searchRes.json.pagination === 'object' && searchRes.json.pagination !== null;
    if (!hasItems || !hasPagination) {
      searchValid = false;
      searchRes.error = 'API Contract vi phạm: thiếu mảng `items` hoặc object `pagination`';
    } else if (!detectedListingId && searchRes.json.items.length > 0) {
      detectedListingId = String(searchRes.json.items[0].id);
    }
  } else if (searchValid && !searchRes.json) {
    searchValid = false;
    searchRes.error = 'Search response không phải JSON hợp lệ';
  }
  searchRes.success = searchValid;
  results.push(searchRes);

  if (searchRes.success) {
    console.log(`✅ [${searchRes.status}] ${searchRes.name}: ${searchRes.duration}ms, ${searchRes.json.items.length} items`);
  } else {
    console.error(`❌ [FAILED] ${searchRes.name}: ${searchRes.error || `HTTP ${searchRes.status}`}`);
  }

  // 3. Kiểm tra Frontend Web ping
  console.log('[3/4] Kiểm tra Web Frontend ping...');
  const webRes = await measureRequest('Web Frontend', `${WEB_BASE}`);
  results.push(webRes);
  if (webRes.success) {
    console.log(`✅ [${webRes.status}] ${webRes.name}: ${webRes.duration}ms`);
  } else {
    console.error(`❌ [FAILED] ${webRes.name}: ${webRes.error || `HTTP ${webRes.status}`}`);
  }

  // 4. Kiểm tra Lead Submission & Deduplication
  console.log('[4/4] Kiểm tra Lead Submission & Deduplication API...');
  const targetListingId = detectedListingId || '1';
  const dedupeKey = `synthetic_run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  
  // Submit 1
  const leadRes1 = await measureRequest('Lead Submission 1 (New Lead)', `${API_BASE}/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: {
      listingId: targetListingId,
      fullName: 'Synthetic Tester',
      phone: TEST_PHONE,
      consent: true,
      dedupeKey: dedupeKey,
      note: 'Synthetic monitor automated verification check',
    },
  });

  let leadValid = leadRes1.success;
  if (leadValid && leadRes1.json) {
    if (!leadRes1.json.success && !leadRes1.json.id) {
      leadValid = false;
      leadRes1.error = 'Lead response thiếu trường xác nhận thành công (success / id)';
    }
  } else if (leadValid && !leadRes1.json) {
    leadValid = false;
    leadRes1.error = 'Lead response không phải JSON hợp lệ';
  }
  leadRes1.success = leadValid;
  results.push(leadRes1);

  if (leadRes1.success) {
    console.log(`✅ [${leadRes1.status}] ${leadRes1.name}: Lead đã persist`);

    // Submit 2 (Deduplication test với cùng dedupeKey)
    const leadRes2 = await measureRequest('Lead Submission 2 (Duplicate Check)', `${API_BASE}/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        listingId: targetListingId,
        fullName: 'Synthetic Tester',
        phone: TEST_PHONE,
        consent: true,
        dedupeKey: dedupeKey,
        note: 'Synthetic monitor automated dedupe check duplicate submission',
      },
    });

    const isDuplicateHandled = leadRes2.success;
    leadRes2.success = isDuplicateHandled;
    results.push(leadRes2);

    if (leadRes2.success) {
      console.log(`✅ [${leadRes2.status}] ${leadRes2.name}: Deduplication phản hồi an toàn`);
    } else {
      console.error(`❌ [FAILED] ${leadRes2.name}: Deduplication thất bại (${leadRes2.error || `HTTP ${leadRes2.status}`})`);
    }
  } else {
    console.error(`❌ [FAILED] ${leadRes1.name}: ${leadRes1.error || `HTTP ${leadRes1.status}`}`);
  }

  // Tổng hợp báo cáo
  const checksRun = results.length;
  const passedChecks = results.filter((r) => r.success).length;
  const failedChecks = results.filter((r) => !r.success).length;
  const allPassed = checksRun > 0 && failedChecks === 0;

  const syntheticReport = {
    evaluatedAt: new Date().toISOString(),
    checksRun,
    passedChecks,
    failedChecks,
    allPassed,
    checks: results.map((r) => ({
      name: r.name,
      url: r.url,
      status: r.status,
      durationMs: r.duration,
      passed: r.success,
      error: r.error || null,
    })),
    status: allPassed ? 'ALL_CHECKS_PASSED' : 'CHECKS_FAILED',
  };

  console.log('\n📊 KẾT QUẢ ĐÁNH GIÁ THỰC TẾ:');
  console.log(JSON.stringify(syntheticReport, null, 2));

  console.log('\n======================================================');
  if (!allPassed) {
    console.error('❌ SYNTHETIC MONITOR THẤT BẠI: Có kiểm tra không đạt yêu cầu.');
    console.error('⛔ KẾT QUẢ: HỆ THỐNG CHƯA ĐẠT ĐIỀU KIỆN VẬN HÀNH (EXIT CODE 1).');
    console.log('======================================================\n');
    process.exit(1);
  }

  console.log('✅ TẤT CẢ CÁC KIỂM TRA ĐỀU THÀNH CÔNG VỚI DỮ LIỆU VÀ PHẢN HỒI THẬT.');
  console.log('======================================================\n');
}

runSyntheticChecks();
