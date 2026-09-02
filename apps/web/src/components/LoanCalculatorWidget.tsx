'use client';

import { useState, useMemo } from 'react';
import { formatPrice } from '@/lib/api';

interface LoanCalculatorWidgetProps {
  initialPrice: number | string;
}

export function LoanCalculatorWidget({ initialPrice }: LoanCalculatorWidgetProps) {
  const numericInitialPrice = typeof initialPrice === 'string' ? Number(initialPrice) : initialPrice;
  const [price, setPrice] = useState(numericInitialPrice > 0 ? numericInitialPrice : 2_000_000_000);
  const [downPaymentPercent, setDownPaymentPercent] = useState(30); // 30% trả trước
  const [loanTermYears, setLoanTermYears] = useState(20); // 20 năm
  const [interestRate, setInterestRate] = useState(8.0); // 8%/năm

  const calculation = useMemo(() => {
    const downPayment = Math.round(price * (downPaymentPercent / 100));
    const loanAmount = Math.max(0, price - downPayment);
    const months = loanTermYears * 12;
    const monthlyRate = interestRate / 100 / 12;

    if (loanAmount === 0 || months === 0) {
      return { downPayment, loanAmount, monthlyPayment: 0, totalInterest: 0 };
    }

    let monthlyPayment = 0;
    if (monthlyRate === 0) {
      monthlyPayment = Math.round(loanAmount / months);
    } else {
      monthlyPayment = Math.round(
        (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, months))) / (Math.pow(1 + monthlyRate, months) - 1),
      );
    }

    const totalPayment = monthlyPayment * months;
    const totalInterest = Math.max(0, totalPayment - loanAmount);

    return { downPayment, loanAmount, monthlyPayment, totalInterest };
  }, [price, downPaymentPercent, loanTermYears, interestRate]);

  return (
    <div className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-xl">📊</span>
        <h3 className="text-lg font-bold text-gray-900">Ước tính khoản vay mua nhà</h3>
      </div>
      <p className="mt-1 text-xs text-gray-500">
        Công cụ tính toán số tiền trả góp hàng tháng theo phương thức dư nợ giảm dần cố định (chuẩn ngân hàng).
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Giá trị BĐS */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-600">Giá trị BĐS (VNĐ)</label>
          <input
            type="number"
            step="100000000"
            value={price}
            onChange={(e) => setPrice(Math.max(0, Number(e.target.value)))}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-dark"
          />
        </div>

        {/* Tỷ lệ trả trước */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-600">Trả trước: {downPaymentPercent}%</label>
          <select
            value={downPaymentPercent}
            onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-dark"
          >
            <option value={20}>20% (Vay 80%)</option>
            <option value={30}>30% (Vay 70%)</option>
            <option value={40}>40% (Vay 60%)</option>
            <option value={50}>50% (Vay 50%)</option>
            <option value={70}>70% (Vay 30%)</option>
          </select>
        </div>

        {/* Thời hạn vay */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-600">Thời hạn: {loanTermYears} năm</label>
          <select
            value={loanTermYears}
            onChange={(e) => setLoanTermYears(Number(e.target.value))}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-dark"
          >
            <option value={5}>5 năm (60 tháng)</option>
            <option value={10}>10 năm (120 tháng)</option>
            <option value={15}>15 năm (180 tháng)</option>
            <option value={20}>20 năm (240 tháng)</option>
            <option value={25}>25 năm (300 tháng)</option>
          </select>
        </div>

        {/* Lãi suất */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-600">Lãi suất ưu đãi (%/năm)</label>
          <input
            type="number"
            step="0.1"
            min="1"
            max="25"
            value={interestRate}
            onChange={(e) => setInterestRate(Number(e.target.value))}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-dark"
          />
        </div>
      </div>

      {/* Kết quả ước tính */}
      <div className="mt-6 grid grid-cols-2 gap-4 rounded-xl bg-gray-50 p-4 sm:grid-cols-4">
        <div>
          <p className="text-xs text-gray-500">Cần trả trước ({downPaymentPercent}%)</p>
          <p className="mt-1 text-base font-bold text-gray-900">{formatPrice(calculation.downPayment)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Số tiền vay ({100 - downPaymentPercent}%)</p>
          <p className="mt-1 text-base font-bold text-gray-900">{formatPrice(calculation.loanAmount)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Trả mỗi tháng (gốc + lãi)</p>
          <p className="mt-1 text-base font-extrabold text-brand-dark">{formatPrice(calculation.monthlyPayment)}/tháng</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Tổng tiền lãi toàn kỳ</p>
          <p className="mt-1 text-base font-bold text-gray-700">{formatPrice(calculation.totalInterest)}</p>
        </div>
      </div>

      <p className="mt-3 text-[11px] text-gray-400">
        * Số liệu mang tính chất ước tính tham khảo. Mức lãi suất và điều kiện vay thực tế phụ thuộc vào chính sách của từng ngân hàng tại thời điểm nộp hồ sơ.
      </p>
    </div>
  );
}
