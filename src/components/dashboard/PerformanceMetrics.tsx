import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'

// Mock data - replace with actual API data
const performanceData = [
  { date: '2024-01-01', return: 2.5, benchmark: 2.1 },
  { date: '2024-01-02', return: 2.8, benchmark: 2.3 },
  { date: '2024-01-03', return: 3.1, benchmark: 2.4 },
  { date: '2024-01-04', return: 2.9, benchmark: 2.2 },
  { date: '2024-01-05', return: 3.2, benchmark: 2.5 },
]

const PerformanceMetrics = () => {
  const metrics = [
    { name: '年化收益率', value: '12.8%', change: '+2.3%', status: 'up' },
    { name: '夏普比率', value: '1.75', change: '+0.15', status: 'up' },
    { name: '最大回撤', value: '-8.2%', change: '-1.4%', status: 'down' },
    { name: '信息比率', value: '0.95', change: '+0.05', status: 'up' },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Performance Metrics</h2>
      <div className="grid grid-cols-2 gap-4">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-gray-50 p-4 rounded-md">
            <div className="text-sm text-gray-500">{metric.name}</div>
            <div className="flex items-end mt-1">
              <div className="text-2xl font-bold">{metric.value}</div>
              <div
                className={`ml-2 text-sm ${
                  metric.status === 'up' ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {metric.change}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Performance vs Benchmark</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => format(new Date(date), 'MMM d')}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(date) => format(new Date(date), 'MMM d, yyyy')}
                formatter={(value) => [`${value}%`, '']}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="return"
                stroke="#2563eb"
                name="Portfolio Return"
              />
              <Line
                type="monotone"
                dataKey="benchmark"
                stroke="#9ca3af"
                name="Benchmark"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default PerformanceMetrics 