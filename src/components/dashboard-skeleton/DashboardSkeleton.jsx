import React from 'react';
import './DashboardSkeleton.css';

const DashboardSkeleton = () => {
    return (
        <div className="dashboard-grid">
            {[...Array(8)].map((_, i) => (
                <div key={i} className="dashboard-card skeleton-card">
                    <div className="card-image-section skeleton-bg pulse"></div>
                    <div className="card-details">
                        <div className="skeleton-line title-line skeleton-bg pulse"></div>
                        <div className="skeleton-line artist-line skeleton-bg pulse"></div>

                        <div className="card-meta-row" style={{ marginTop: 'auto' }}>
                            <div className="skeleton-badge skeleton-bg pulse" style={{ width: '40px' }}></div>
                            <div className="skeleton-badge skeleton-bg pulse" style={{ width: '60px' }}></div>
                        </div>

                        <div className="card-footer-row" style={{ marginTop: '12px' }}>
                            <div className="skeleton-line date-line skeleton-bg pulse"></div>
                            <div className="skeleton-badge skeleton-bg pulse" style={{ width: '80px', borderRadius: '20px' }}></div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default DashboardSkeleton;
