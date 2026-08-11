import React from 'react';
import './skeletons.css';

export const CardSkeleton = ({ height = '200px' }) => (
  <div className="skeleton-card" style={{ height }}>
    <div className="skeleton-shimmer"></div>
  </div>
);


export const TableRowSkeleton = ({ columns = 5 }) => (
  <div className="skeleton-table-row">
    {Array.from({ length: columns }).map((_, index) => (
      <div key={index} className="skeleton-cell">
        <div className="skeleton-shimmer"></div>
      </div>
    ))}
  </div>
);


export const StatCardSkeleton = () => (
  <div className="skeleton-stat-card">
    <div className="skeleton-stat-icon">
      <div className="skeleton-shimmer"></div>
    </div>
    <div className="skeleton-stat-content">
      <div className="skeleton-stat-value">
        <div className="skeleton-shimmer"></div>
      </div>
      <div className="skeleton-stat-label">
        <div className="skeleton-shimmer"></div>
      </div>
    </div>
  </div>
);

// Notification Skeleton
export const NotificationSkeleton = () => (
  <div className="skeleton-notification">
    <div className="skeleton-notif-checkbox">
      <div className="skeleton-shimmer"></div>
    </div>
    <div className="skeleton-notif-icon">
      <div className="skeleton-shimmer"></div>
    </div>
    <div className="skeleton-notif-content">
      <div className="skeleton-notif-title">
        <div className="skeleton-shimmer"></div>
      </div>
      <div className="skeleton-notif-message">
        <div className="skeleton-shimmer"></div>
      </div>
      <div className="skeleton-notif-message short">
        <div className="skeleton-shimmer"></div>
      </div>
    </div>
  </div>
);

// Document Card Skeleton
export const DocumentCardSkeleton = () => (
  <div className="skeleton-document">
    <div className="skeleton-doc-icon">
      <div className="skeleton-shimmer"></div>
    </div>
    <div className="skeleton-doc-info">
      <div className="skeleton-doc-name">
        <div className="skeleton-shimmer"></div>
      </div>
      <div className="skeleton-doc-meta">
        <div className="skeleton-shimmer"></div>
      </div>
    </div>
    <div className="skeleton-doc-status">
      <div className="skeleton-shimmer"></div>
    </div>
  </div>
);

// Clearance Card Skeleton (for admin review)
export const ClearanceCardSkeleton = () => (
  <div className="skeleton-clearance-card">
    <div className="skeleton-clearance-header">
      <div className="skeleton-avatar">
        <div className="skeleton-shimmer"></div>
      </div>
      <div className="skeleton-student-info">
        <div className="skeleton-name">
          <div className="skeleton-shimmer"></div>
        </div>
        <div className="skeleton-meta">
          <div className="skeleton-shimmer"></div>
        </div>
      </div>
      <div className="skeleton-badge">
        <div className="skeleton-shimmer"></div>
      </div>
    </div>
    <div className="skeleton-clearance-body">
      <div className="skeleton-detail-row">
        <div className="skeleton-shimmer"></div>
      </div>
      <div className="skeleton-detail-row">
        <div className="skeleton-shimmer"></div>
      </div>
      <div className="skeleton-detail-row">
        <div className="skeleton-shimmer"></div>
      </div>
    </div>
  </div>
);

// Student Row Skeleton (for Students Management)
export const StudentRowSkeleton = () => (
  <div className="skeleton-student-row">
    <div className="skeleton-student-avatar">
      <div className="skeleton-shimmer"></div>
    </div>
    <div className="skeleton-student-name">
      <div className="skeleton-shimmer"></div>
    </div>
    <div className="skeleton-student-matric">
      <div className="skeleton-shimmer"></div>
    </div>
    <div className="skeleton-student-dept">
      <div className="skeleton-shimmer"></div>
    </div>
    <div className="skeleton-student-status">
      <div className="skeleton-shimmer"></div>
    </div>
    <div className="skeleton-student-progress">
      <div className="skeleton-shimmer"></div>
    </div>
    <div className="skeleton-student-actions">
      <div className="skeleton-shimmer"></div>
    </div>
  </div>
);

// Overview Card Skeleton (for dashboards)
export const OverviewCardSkeleton = () => (
  <div className="skeleton-overview-card">
    <div className="skeleton-card-header">
      <div className="skeleton-shimmer"></div>
    </div>
    <div className="skeleton-card-content">
      <div className="skeleton-content-line">
        <div className="skeleton-shimmer"></div>
      </div>
      <div className="skeleton-content-line short">
        <div className="skeleton-shimmer"></div>
      </div>
      <div className="skeleton-content-line">
        <div className="skeleton-shimmer"></div>
      </div>
    </div>
  </div>
);

// Activity Item Skeleton
export const ActivitySkeleton = () => (
  <div className="skeleton-activity">
    <div className="skeleton-activity-icon">
      <div className="skeleton-shimmer"></div>
    </div>
    <div className="skeleton-activity-content">
      <div className="skeleton-activity-title">
        <div className="skeleton-shimmer"></div>
      </div>
      <div className="skeleton-activity-time">
        <div className="skeleton-shimmer"></div>
      </div>
    </div>
  </div>
);

export const StudentCardSkeleton = () => (
  <div className="student-card skeleton-card">
    <div className="student-card-header">
      <div className="skeleton-avatar" style={{ width: 80, height: 80, borderRadius: '50%' }}>
        <div className="skeleton-shimmer"></div>
      </div>
      <div className="skeleton-badge" style={{ width: 90, height: 28 }}>
        <div className="skeleton-shimmer"></div>
      </div>
    </div>
    <div className="student-card-body">
      <div className="skeleton-name" style={{ width: '60%', margin: '0 auto 1rem' }}>
        <div className="skeleton-shimmer"></div>
      </div>
      <div className="skeleton-detail-row"><div className="skeleton-shimmer"></div></div>
      <div className="skeleton-detail-row"><div className="skeleton-shimmer"></div></div>
      <div className="skeleton-detail-row"><div className="skeleton-shimmer"></div></div>
      <div className="skeleton-detail-row" style={{ marginBottom: '1.25rem' }}>
        <div className="skeleton-shimmer"></div>
      </div>
      <div className="skeleton-student-progress" style={{ marginBottom: '1.25rem' }}>
        <div className="skeleton-shimmer"></div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-around', paddingTop: '1rem', borderTop: '1px solid #f3f4f6' }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ width: 24, height: 24, borderRadius: '50%' }} className="skeleton-shimmer" />
        ))}
      </div>
    </div>
    <div className="student-card-footer" style={{ display: 'flex', gap: '0.75rem' }}>
      <div className="skeleton-student-actions" style={{ flex: 1 }}>
        <div className="skeleton-shimmer"></div>
      </div>
      <div className="skeleton-student-actions" style={{ flex: 1 }}>
        <div className="skeleton-shimmer"></div>
      </div>
    </div>
  </div>
);