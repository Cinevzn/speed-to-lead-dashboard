import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const TrendsChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>No trend data available</div>;
  }

  const chartData = data.map((item) => ({
    period: item.period,
    avgSpeed: Math.round(item.avg_speed_minutes || 0),
    totalLeads: parseInt(item.total_leads || 0),
    contactedLeads: parseInt(item.contacted_leads || 0),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
        <XAxis dataKey="period" stroke="#9ca3af" />
        <YAxis stroke="#9ca3af" />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#1a1a1a', 
            border: '1px solid #2a2a2a',
            color: '#e0e0e0'
          }} 
        />
        <Legend wrapperStyle={{ color: '#e0e0e0' }} />
        <Line
          type="monotone"
          dataKey="avgSpeed"
          stroke="#ef4444"
          strokeWidth={2}
          name="Avg Speed (minutes)"
          dot={{ fill: '#dc2626', r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

const PercentileChart = ({ data }) => {
  if (!data) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>No percentile data available</div>;
  }

  const chartData = [
    { name: '50th', value: data.p50 || 0 },
    { name: '75th', value: data.p75 || 0 },
    { name: '90th', value: data.p90 || 0 },
    { name: '95th', value: data.p95 || 0 },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
        <XAxis dataKey="name" stroke="#9ca3af" />
        <YAxis stroke="#9ca3af" />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#1a1a1a', 
            border: '1px solid #2a2a2a',
            color: '#e0e0e0'
          }} 
        />
        <Bar dataKey="value" fill="#dc2626" />
      </BarChart>
    </ResponsiveContainer>
  );
};

const SetterComparisonChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>No setter data available</div>;
  }

  const chartData = data.map((item) => ({
    name: item.setter_name || item.setter_email,
    avgSpeed: item.stats?.avg_speed_minutes || 0,
    totalLeads: item.stats?.total_leads || 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={chartData} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
        <XAxis type="number" stroke="#9ca3af" />
        <YAxis dataKey="name" type="category" width={150} stroke="#9ca3af" />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#1a1a1a', 
            border: '1px solid #2a2a2a',
            color: '#e0e0e0'
          }} 
        />
        <Legend wrapperStyle={{ color: '#e0e0e0' }} />
        <Bar dataKey="avgSpeed" fill="#dc2626" name="Avg Speed (minutes)" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default {
  TrendsChart,
  PercentileChart,
  SetterComparisonChart,
};

