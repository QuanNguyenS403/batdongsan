'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { searchSuggestions, getCategoryLabel, removeDiacritics, type SearchSuggestion } from '@/lib/search-suggestions-data';

export function HeroSearchForm() {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cập nhật gợi ý khi keyword thay đổi
  useEffect(() => {
    const results = searchSuggestions(keyword);
    setSuggestions(results);
    setShowDropdown(results.length > 0 && keyword.trim().length >= 2);
    setActiveIndex(-1);
  }, [keyword]);

  // Đóng dropdown khi click ngoài
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const executeSearch = useCallback((queryText?: string) => {
    const text = (queryText !== undefined ? queryText : keyword).trim();
    setShowDropdown(false);
    if (text) {
      router.push(`/thue?keyword=${encodeURIComponent(text)}`);
    } else {
      router.push('/thue');
    }
  }, [keyword, router]);

  const handleSelect = useCallback((text: string) => {
    setKeyword(text);
    executeSearch(text);
  }, [executeSearch]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    executeSearch();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Nếu đang chọn một gợi ý bằng phím mũi tên thì chọn gợi ý đó
      if (showDropdown && activeIndex >= 0 && suggestions[activeIndex]) {
        handleSelect(suggestions[activeIndex].text);
      } else {
        // Ngược lại tìm kiếm ngay lập tức với từ khóa hiện tại trong ô nhập
        executeSearch();
      }
      return;
    }

    if (e.key === 'Escape') {
      setShowDropdown(false);
      return;
    }

    if (!showDropdown || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    }
  }

  // Nhóm gợi ý theo category
  const groupedSuggestions: { category: string; items: SearchSuggestion[] }[] = [];
  const seenCategories = new Set<string>();
  for (const s of suggestions) {
    if (!seenCategories.has(s.category)) {
      seenCategories.add(s.category);
      groupedSuggestions.push({
        category: s.category,
        items: suggestions.filter((x) => x.category === s.category),
      });
    }
  }

  let flatIndex = -1;

  return (
    <div ref={containerRef} className="relative">
      <form
        onSubmit={handleSubmit}
        className="flex overflow-hidden rounded-b-2xl rounded-tr-2xl border border-surface-border bg-white shadow-elevated"
      >
        <input
          ref={inputRef}
          name="keyword"
          type="text"
          autoComplete="off"
          placeholder="Nhập địa chỉ bất kỳ, tên đường, trường ĐH (VD: Đại Cồ Việt, Cầu Giấy, Bách Khoa...)"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0 && keyword.trim().length >= 2) {
              setShowDropdown(true);
            }
          }}
          onKeyDown={handleKeyDown}
          className="flex-1 px-5 py-4 text-sm text-text-primary placeholder:text-text-muted outline-none"
        />
        <button
          type="submit"
          id="hero-search-button"
          className="flex items-center gap-2 bg-brand px-7 font-semibold text-white transition-colors hover:bg-brand-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          Tìm phòng ngay
        </button>
      </form>

      {/* Dropdown gợi ý */}
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-y-auto rounded-2xl border border-surface-border bg-white shadow-modal animate-slide-down">
          {groupedSuggestions.map((group) => (
            <div key={group.category}>
              <div className="sticky top-0 bg-slate-50 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-text-muted border-b border-surface-border">
                {getCategoryLabel(group.category)}
              </div>
              {group.items.map((item) => {
                flatIndex++;
                const idx = flatIndex;
                const isActive = idx === activeIndex;
                return (
                  <button
                    key={`${item.category}-${item.text}`}
                    type="button"
                    onClick={() => handleSelect(item.text)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                      isActive
                        ? 'bg-brand/5 text-brand font-medium'
                        : 'text-text-secondary hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-base shrink-0">{item.icon}</span>
                    <span className="truncate">{highlightMatch(item.text, keyword)}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Highlight phần text khớp với keyword */
function highlightMatch(text: string, keyword: string): React.ReactNode {
  if (!keyword.trim()) return text;
  const lowerText = text.toLowerCase();
  const lowerKeyword = keyword.toLowerCase().trim();
  let idx = lowerText.indexOf(lowerKeyword);
  let matchLen = lowerKeyword.length;

  if (idx === -1) {
    const textNoDia = removeDiacritics(lowerText);
    const keyNoDia = removeDiacritics(lowerKeyword);
    idx = textNoDia.indexOf(keyNoDia);
    matchLen = keyNoDia.length;
  }

  if (idx === -1) return text;

  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + matchLen);
  const after = text.slice(idx + matchLen);

  return (
    <>
      {before}
      <span className="font-bold text-brand">{match}</span>
      {after}
    </>
  );
}
