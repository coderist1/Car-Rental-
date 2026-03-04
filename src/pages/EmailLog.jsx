import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/pages/EmailLog.css';

function EmailLog() {
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Get email logs from localStorage
  const emailLogs = useMemo(() => {
    const stored = localStorage.getItem('emailLogs');
    return stored ? JSON.parse(stored) : [];
  }, []);

  // Filter emails
  const filteredEmails = useMemo(() => {
    let emails = [...emailLogs];

    // Filter by type
    if (activeTab !== 'all') {
      emails = emails.filter(e => e.type === activeTab);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      emails = emails.filter(e => 
        e.to?.toLowerCase().includes(query) ||
        e.subject?.toLowerCase().includes(query) ||
        e.body?.toLowerCase().includes(query)
      );
    }

    // Filter by date
    if (dateFilter) {
      const filterDate = new Date(dateFilter).toDateString();
      emails = emails.filter(e => {
        const emailDate = new Date(e.sentAt).toDateString();
        return emailDate === filterDate;
      });
    }

    // Sort by date descending
    emails.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));

    return emails;
  }, [emailLogs, activeTab, searchQuery, dateFilter]);

  // Stats
  const stats = useMemo(() => ({
    total: emailLogs.length,
    registration: emailLogs.filter(e => e.type === 'registration').length,
    rental: emailLogs.filter(e => e.type === 'rental').length,
    notification: emailLogs.filter(e => e.type === 'notification').length
  }), [emailLogs]);

  const handleBack = () => {
    navigate(-1);
  };

  const getTypeIcon = (type) => {
    const icons = {
      registration: '👤',
      rental: '🚗',
      notification: '🔔',
      password: '🔐'
    };
    return icons[type] || '📧';
  };

  const getTypeBadge = (type) => {
    const badges = {
      registration: { class: 'registration', text: 'Registration' },
      rental: { class: 'rental', text: 'Rental' },
      notification: { class: 'notification', text: 'Notification' },
      password: { class: 'password', text: 'Password' }
    };
    const badge = badges[type] || { class: 'default', text: type };
    return <span className={`type-badge ${badge.class}`}>{badge.text}</span>;
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const clearFilters = () => {
    setActiveTab('all');
    setSearchQuery('');
    setDateFilter('');
  };

  return (
    <div className="email-log-container">
      <header className="email-header">
        <button className="back-button" onClick={handleBack}>
          ← Back
        </button>
        <div className="header-info">
          <h1 className="page-title">📧 Email Log</h1>
          <p className="page-subtitle">View all system emails sent</p>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="stats-row">
        <div className="stat-card total">
          <div className="stat-icon">📧</div>
          <div className="stat-info">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Emails</span>
          </div>
        </div>
        <div className="stat-card registration">
          <div className="stat-icon">👤</div>
          <div className="stat-info">
            <span className="stat-value">{stats.registration}</span>
            <span className="stat-label">Registration</span>
          </div>
        </div>
        <div className="stat-card rental">
          <div className="stat-icon">🚗</div>
          <div className="stat-info">
            <span className="stat-value">{stats.rental}</span>
            <span className="stat-label">Rental</span>
          </div>
        </div>
        <div className="stat-card notification">
          <div className="stat-icon">🔔</div>
          <div className="stat-info">
            <span className="stat-value">{stats.notification}</span>
            <span className="stat-label">Notifications</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All
          </button>
          <button 
            className={`tab ${activeTab === 'registration' ? 'active' : ''}`}
            onClick={() => setActiveTab('registration')}
          >
            Registration
          </button>
          <button 
            className={`tab ${activeTab === 'rental' ? 'active' : ''}`}
            onClick={() => setActiveTab('rental')}
          >
            Rental
          </button>
          <button 
            className={`tab ${activeTab === 'notification' ? 'active' : ''}`}
            onClick={() => setActiveTab('notification')}
          >
            Notification
          </button>
        </div>

        <div className="filter-controls">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <input
            type="date"
            className="date-filter"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
          {(searchQuery || dateFilter || activeTab !== 'all') && (
            <button className="clear-filters" onClick={clearFilters}>
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Email List */}
      <div className="email-list">
        {filteredEmails.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No emails found</h3>
            <p>
              {emailLogs.length === 0 
                ? "No emails have been sent yet."
                : "No emails match your current filters."}
            </p>
          </div>
        ) : (
          filteredEmails.map((email, index) => (
            <div key={email.id || index} className="email-card">
              <div className="email-header-row">
                <div className="email-type">
                  <span className="type-icon">{getTypeIcon(email.type)}</span>
                  {getTypeBadge(email.type)}
                </div>
                <span className="email-date">{formatDateTime(email.sentAt)}</span>
              </div>

              <div className="email-recipient">
                <span className="label">To:</span>
                <span className="value">{email.to}</span>
              </div>

              <div className="email-subject">
                <span className="label">Subject:</span>
                <span className="value">{email.subject}</span>
              </div>

              <div className="email-body">
                <p>{email.body}</p>
              </div>

              <div className="email-footer">
                <span className={`status-indicator ${email.status || 'sent'}`}>
                  {email.status === 'failed' ? '✗ Failed' : '✓ Sent'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default EmailLog;
