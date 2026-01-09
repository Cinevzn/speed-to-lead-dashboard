import React, { useState, useEffect } from 'react';
import { getOverallStats, getLeads, getTrends, getTimeOfDay } from '../api';
import Charts from './Charts';
import { format } from 'date-fns';

function Dashboard() {
  const [overallStats, setOverallStats] = useState(null);
  const [leads, setLeads] = useState([]);
  const [trends, setTrends] = useState([]);
  const [timeOfDay, setTimeOfDay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('day');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    loadData();
  }, [period, currentPage]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsRes, leadsRes, trendsRes, timeOfDayRes] = await Promise.all([
        getOverallStats(),
        getLeads({ limit: 50, page: currentPage }),
        getTrends(period),
        getTimeOfDay()
      ]);

      setOverallStats(statsRes.data);
      setLeads(leadsRes.data.leads || []);
      setPagination(leadsRes.data.pagination);
      setTrends(trendsRes.data.trends || []);
      setTimeOfDay(timeOfDayRes.data.time_of_day);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load dashboard data');
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatMinutes = (minutes) => {
    if (minutes === null || minutes === undefined) return 'N/A';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div>
      {/* Overall Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Leads</h3>
          <div className="value">{overallStats?.stats?.total_leads || 0}</div>
        </div>
        <div className="stat-card">
          <h3>Contacted Leads</h3>
          <div className="value">{overallStats?.stats?.contacted_leads || 0}</div>
          <div className="sub-value">
            {overallStats?.stats?.contact_rate || 0}% contact rate
          </div>
        </div>
        <div className="stat-card">
          <h3>Average Speed to Lead</h3>
          <div className="value">
            {formatMinutes(overallStats?.stats?.avg_speed_minutes)}
          </div>
        </div>
        <div className="stat-card">
          <h3>Fastest Response</h3>
          <div className="value">
            {formatMinutes(overallStats?.stats?.min_speed_minutes)}
          </div>
        </div>
        <div className="stat-card">
          <h3>Avg Lead Creation Time</h3>
          <div className="value">
            {timeOfDay?.formatted_time || 'N/A'}
          </div>
          <div className="sub-value">
            Based on {timeOfDay?.total_leads || 0} leads
          </div>
        </div>
      </div>

      {/* Trends Chart */}
      <div className="chart-container">
        <div className="chart-header">
          <h2>Speed to Lead Trends</h2>
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="day">Daily</option>
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
          </select>
        </div>
        <Charts.TrendsChart data={trends} />
      </div>

      {/* Recent Leads Table */}
      <div className="table-container">
        <h2>Recent Leads</h2>
        <table>
          <thead>
            <tr>
              <th>Lead ID</th>
              <th>Setter</th>
              <th>Created</th>
              <th>Contacted</th>
              <th>Speed to Lead</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>
                  No leads found
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead.id}>
                  <td>{lead.ghl_lead_id}</td>
                  <td>{lead.setter_name || lead.setter_email || 'Unassigned'}</td>
                  <td>{format(new Date(lead.created_at), 'MMM d, yyyy HH:mm')}</td>
                  <td>
                    {lead.first_contacted_at
                      ? format(new Date(lead.first_contacted_at), 'MMM d, yyyy HH:mm')
                      : 'Not contacted'}
                  </td>
                  <td>{formatMinutes(lead.speed_to_lead_minutes)}</td>
                  <td>
                    <span
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        backgroundColor:
                          lead.status === 'contacted' ? '#1a2e1a' : 
                          lead.status === 'unassigned' ? '#2d1a1a' : '#2e2a1a',
                        color: lead.status === 'contacted' ? '#4ade80' : 
                               lead.status === 'unassigned' ? '#ef4444' : '#fbbf24',
                        border: lead.status === 'contacted' ? '1px solid #4ade80' : 
                                lead.status === 'unassigned' ? '1px solid #dc2626' : '1px solid #fbbf24',
                      }}
                    >
                      {lead.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        {/* Pagination Controls */}
        {pagination && pagination.total_pages > 1 && (
          <div className="pagination">
            <button 
              className="btn"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!pagination.has_prev}
            >
              Previous
            </button>
            
            <div className="pagination-info">
              Page {pagination.current_page} of {pagination.total_pages}
              <span className="pagination-total">
                ({pagination.total_leads} total leads)
              </span>
            </div>
            
            <button 
              className="btn"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!pagination.has_next}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;

