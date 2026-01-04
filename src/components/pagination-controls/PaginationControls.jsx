import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Shuffle } from 'lucide-react';
import './PaginationControls.css';

export default function PaginationControls({
  pageCount,
  currentPage,
  posts = [],
  onPageChange,
  totalCount,
  isRandom = false,
  onReroll
}) {
  const { t } = useLanguage();
  const [inputPage, setInputPage] = useState(currentPage + 1);

  useEffect(() => {
    setInputPage(currentPage + 1);
  }, [currentPage]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    if (val === "" || /^[0-9]+$/.test(val)) {
      setInputPage(val);
    }
  };

  const handleInputSubmit = (e) => {
    e.preventDefault();
    let pageNum = parseInt(inputPage, 10);
    if (!isNaN(pageNum)) {
      if (pageNum < 1) pageNum = 1;
      if (pageNum > pageCount) pageNum = pageCount;
      onPageChange(pageNum - 1);
    } else {
      setInputPage(currentPage + 1);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleInputSubmit(e);
    }
  };

  const handleBlur = (e) => {
    handleInputSubmit(e);
  };

  if (!isRandom && pageCount <= 1) {
    return null;
  }

  const resultsCount = totalCount !== undefined ? totalCount : posts.length;

  return (
    <div className="pagination-card">
      <div className="pagination-info">
        {!isRandom && <p>{(t('search.showingCharts', { count: resultsCount }) || '').replace('{0}', resultsCount).replace('{{count}}', resultsCount)}</p>}
      </div>
      <div className="pagination-controls">
        {isRandom ? (
          <button
            className="pagination-btn reroll-btn"
            onClick={onReroll}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.75rem 1.5rem' }}
          >
            <Shuffle size={18} />
            {t('search.reroll', 'Reroll')}
          </button>
        ) : (
          <>
            <button
              className="pagination-btn"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 0}
            >
              {t('search.previous')}
            </button>

            <div className="pagination-input-container">
              <span className="pagination-text">{t('search.page')}</span>
              <input
                type="text"
                className="pagination-input"
                value={inputPage}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                aria-label="Page number"
              />
              <span className="pagination-text">{t('search.of')} {pageCount}</span>
            </div>

            <button
              className="pagination-btn"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= pageCount - 1}
            >
              {t('search.next')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
