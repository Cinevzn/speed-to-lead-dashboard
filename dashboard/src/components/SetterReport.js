import React, { useState, useEffect } from 'react';
import { getSetters, getSetterById, getStatsBySetter } from '../api';
import Charts from './Charts';

function SetterReport() {
  const [setters, setSetters] = useState([]);
  const [selectedSetter, setSelectedSetter] = useState(null);
  const [setterDetails, setSetterDetails] = useState(null);
  const [statsBySetter, setStatsBySetter] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedSetter) {
      loadSetterDetails(selectedSetter);
    }
  }, [selectedSetter]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [settersRes, statsRes] = await Promise.all([
        getSetters(),
        getStatsBySetter()
      ]);

      setSetters(settersRes.data.setters || []);
      setStatsBySetter(statsRes.data.stats_by_setter || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load setter data');
      console.error('Error loading setters:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSetterDetails = async (setterId) => {
    try {
      const res = await getSetterById(setterId);
      setSetterDetails(res.data);
    } catch (err) {
      console.error('Error loading setter details:', err);
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
    return <div className="loading">Loading setter reports...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div>
      {/* Setter Comparison Chart */}
      <div className="chart-container">
        <h2>Setter Performance Comparison</h2>
        <Charts.SetterComparisonChart data={statsBySetter} />
      </div>

      {/* Setter Selection */}
      <div className="filter-bar" style={{ marginBottom: '20px' }}>
        <label>Select Setter:</label>
        <select
          value={selectedSetter || ''}
          onChange={(e) => setSelectedSetter(e.target.value ? parseInt(e.target.value) : null)}
        >
          <option value="">All Setters</option>
          {setters.map((setter) => (
            <option key={setter.id} value={setter.id}>
              {setter.name} ({setter.email})
            </option>
          ))}
        </select>
      </div>

      {/* All Setters Table */}
      <div className="table-container">
        <h2>All Appointment Setters</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Total Leads</th>
              <th>Contacted</th>
              <th>Contact Rate</th>
              <th>Avg Speed</th>
              <th>Min Speed</th>
              <th>Max Speed</th>
            </tr>
          </thead>
          <tbody>
            {setters.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>
                  No setters found
                </td>
              </tr>
            ) : (
              setters.map((setter) => (
                <tr
                  key={setter.id}
                  onClick={() => setSelectedSetter(setter.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>{setter.name}</td>
                  <td>{setter.email}</td>
                  <td>{setter.stats?.total_leads || 0}</td>
                  <td>{setter.stats?.contacted_leads || 0}</td>
                  <td>{setter.stats?.contact_rate || 0}%</td>
                  <td>{formatMinutes(setter.stats?.avg_speed_minutes)}</td>
                  <td>{formatMinutes(setter.stats?.min_speed_minutes)}</td>
                  <td>{formatMinutes(setter.stats?.max_speed_minutes)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Selected Setter Details */}
      {setterDetails && (
        <div className="chart-container" style={{ marginTop: '30px' }}>
          <h2>Details: {setterDetails.setter.name}</h2>
          <div className="stats-grid" style={{ marginTop: '20px' }}>
            <div className="stat-card">
              <h3>Total Leads</h3>
              <div className="value">{setterDetails.stats?.total_leads || 0}</div>
            </div>
            <div className="stat-card">
              <h3>Contacted Leads</h3>
              <div className="value">{setterDetails.stats?.contacted_leads || 0}</div>
              <div className="sub-value">
                {setterDetails.stats?.contact_rate || 0}% contact rate
              </div>
            </div>
            <div className="stat-card">
              <h3>Average Speed</h3>
              <div className="value">
                {formatMinutes(setterDetails.stats?.avg_speed_minutes)}
              </div>
            </div>
            <div className="stat-card">
              <h3>Fastest Response</h3>
              <div className="value">
                {formatMinutes(setterDetails.stats?.min_speed_minutes)}
              </div>
            </div>
          </div>

          {setterDetails.recent_leads && setterDetails.recent_leads.length > 0 && (
            <div style={{ marginTop: '30px' }}>
              <h3>Recent Leads</h3>
              <table>
                <thead>
                  <tr>
                    <th>Lead ID</th>
                    <th>Created</th>
                    <th>Contacted</th>
                    <th>Speed to Lead</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {setterDetails.recent_leads.map((lead) => (
                    <tr key={lead.id}>
                      <td>{lead.ghl_lead_id}</td>
                      <td>{new Date(lead.created_at).toLocaleString()}</td>
                      <td>
                        {lead.first_contacted_at
                          ? new Date(lead.first_contacted_at).toLocaleString()
                          : 'Not contacted'}
                      </td>
                      <td>{formatMinutes(lead.speed_to_lead_minutes)}</td>
                      <td>{lead.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SetterReport;

