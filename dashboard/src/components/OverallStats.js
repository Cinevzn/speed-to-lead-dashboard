import React, { useState, useEffect } from 'react';
import { getOverallStats, getAverageStats, getPercentiles, getTrends } from '../api';
import Charts from './Charts';

function OverallStats() {
  const [overallStats, setOverallStats] = useState(null);
  const [averageStats, setAverageStats] = useState(null);
  const [percentiles, setPercentiles] = useState(null);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('day');

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [overallRes, avgRes, percRes, trendsRes] = await Promise.all([
        getOverallStats(),
        getAverageStats(),
        getPercentiles(),
        getTrends(period)
      ]);

      setOverallStats(overallRes.data);
      setAverageStats(avgRes.data);
      setPercentiles(percRes.data);
      setTrends(trendsRes.data.trends || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load statistics');
      console.error('Error loading stats:', err);
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

  if (loading) {
    return <div className="loading">Loading statistics...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div>
      {/* Key Metrics */}
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
          <h3>Average Speed</h3>
          <div className="value">
            {formatMinutes(averageStats?.average_speed_minutes)}
          </div>
        </div>
        <div className="stat-card">
          <h3>Fastest Response</h3>
          <div className="value">
            {formatMinutes(averageStats?.min_speed_minutes)}
          </div>
        </div>
        <div className="stat-card">
          <h3>Slowest Response</h3>
          <div className="value">
            {formatMinutes(averageStats?.max_speed_minutes)}
          </div>
        </div>
      </div>

      {/* Percentiles */}
      <div className="chart-container">
        <h2>Percentile Analysis</h2>
        <div className="stats-grid" style={{ marginTop: '20px' }}>
          <div className="stat-card">
            <h3>50th Percentile (Median)</h3>
            <div className="value">{formatMinutes(percentiles?.percentiles?.p50)}</div>
          </div>
          <div className="stat-card">
            <h3>75th Percentile</h3>
            <div className="value">{formatMinutes(percentiles?.percentiles?.p75)}</div>
          </div>
          <div className="stat-card">
            <h3>90th Percentile</h3>
            <div className="value">{formatMinutes(percentiles?.percentiles?.p90)}</div>
          </div>
          <div className="stat-card">
            <h3>95th Percentile</h3>
            <div className="value">{formatMinutes(percentiles?.percentiles?.p95)}</div>
          </div>
        </div>
        <Charts.PercentileChart data={percentiles?.percentiles} />
      </div>

      {/* Trends */}
      <div className="chart-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Speed to Lead Trends</h2>
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="day">Daily</option>
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
          </select>
        </div>
        <Charts.TrendsChart data={trends} />
      </div>
    </div>
  );
}

export default OverallStats;

