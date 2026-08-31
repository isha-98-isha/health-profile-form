import React from 'react';

export default function Pagination({ currentPage, totalPages, setCurrentPage }) {
  if (totalPages <= 1) return null;

  return (
    <div className="vy-pagination">
      <button
        className="vy-page-btn"
        onClick={() => setCurrentPage(1)}
        disabled={currentPage === 1}
        aria-label="First page"
      >
        «
      </button>

      <button
        className="vy-page-btn"
        onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
        disabled={currentPage === 1}
        aria-label="Previous page"
      >
        ‹
      </button>

      {Array.from({ length: totalPages }, (_, index) => index + 1)
        .filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
        .reduce((pages, page, index, visiblePages) => {
          if (index > 0 && page - visiblePages[index - 1] > 1) {
            pages.push('...');
          }
          pages.push(page);
          return pages;
        }, [])
        .map((page, index) =>
          page === '...' ? (
            <span key={`ellipsis-${index}`} className="vy-page-ellipsis">
              …
            </span>
          ) : (
            <button
              key={page}
              className={`vy-page-btn ${currentPage === page ? 'active' : ''}`}
              onClick={() => setCurrentPage(page)}
              aria-label={`Page ${page}`}
              aria-current={currentPage === page ? 'page' : undefined}
            >
              {page}
            </button>
          )
        )}

      <button
        className="vy-page-btn"
        onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
        disabled={currentPage === totalPages}
        aria-label="Next page"
      >
        ›
      </button>

      <button
        className="vy-page-btn"
        onClick={() => setCurrentPage(totalPages)}
        disabled={currentPage === totalPages}
        aria-label="Last page"
      >
        »
      </button>
    </div>
  );
}
