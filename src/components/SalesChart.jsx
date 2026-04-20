import { useMemo, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
} from 'recharts';
import { useApp } from '../store/AppContext';
import { motion } from 'framer-motion';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl p-3 border border-gray-100 dark:border-gray-700">
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        <p className="text-sm font-bold text-primary-600">₹ {payload[0].value?.toLocaleString('en-IN')}</p>
      </div>
    );
  }
  return null;
};

export default function SalesChart() {
  const { transactions } = useApp();
  const [filter, setFilter] = useState('month');

  const chartData = useMemo(() => {
    const now = new Date();
    const salesTransactions = transactions.filter(t => t.type === 'SALE');

    if (filter === 'month') {
      const year = now.getFullYear();
      const month = now.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const dailyData = [];

      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayLabel = `${day} ${now.toLocaleDateString('en-IN', { month: 'short' })}`;
        const total = salesTransactions
          .filter(t => t.date === dateStr)
          .reduce((sum, t) => sum + t.totalAmount, 0);
        dailyData.push({ name: dayLabel, sales: total });
      }
      return dailyData;
    }

    // Weekly
    const weekData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      const total = salesTransactions
        .filter(t => t.date === dateStr)
        .reduce((sum, t) => sum + t.totalAmount, 0);
      weekData.push({ name: dayLabel, sales: total });
    }
    return weekData;
  }, [transactions, filter]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="card"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">Total Sale</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
            ₹ {transactions
              .filter(t => t.type === 'SALE')
              .reduce((s, t) => s + t.totalAmount, 0)
              .toLocaleString('en-IN')}
          </p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-600 dark:text-gray-300 outline-none focus:border-primary-500"
        >
          <option value="month">This Month</option>
          <option value="week">This Week</option>
        </select>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              axisLine={{ stroke: '#E5E7EB' }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="sales"
              stroke="#3B82F6"
              strokeWidth={2.5}
              fill="url(#salesGradient)"
              dot={false}
              activeDot={{ r: 6, fill: '#3B82F6', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
