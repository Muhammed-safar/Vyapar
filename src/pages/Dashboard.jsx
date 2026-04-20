import { useMemo } from 'react';
import { useApp } from '../store/AppContext';
import { calculateTotalReceivable, calculateTotalPayable, calculateTotalSales } from '../utils/helpers';
import DashboardCard from '../components/DashboardCard';
import SalesChart from '../components/SalesChart';

export default function Dashboard() {
  const { parties, transactions } = useApp();

  const totalReceivable = useMemo(() => calculateTotalReceivable(parties), [parties]);
  const totalPayable = useMemo(() => calculateTotalPayable(parties), [parties]);
  const totalSales = useMemo(() => calculateTotalSales(transactions), [transactions]);

  const receivableParties = parties.filter(p => p.type === 'customer' && p.balance > 0).length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DashboardCard
          title="Total Receivable"
          amount={totalReceivable}
          subtitle={`From ${receivableParties} Part${receivableParties !== 1 ? 'ies' : 'y'}`}
          color="green"
          trend="down"
          delay={1}
        />
        <DashboardCard
          title="Total Payable"
          amount={totalPayable}
          subtitle={totalPayable === 0 ? "You don't have any payables as of now." : undefined}
          color="red"
          trend="up"
          delay={2}
        />
        <DashboardCard
          title="Total Sale"
          amount={totalSales}
          color="blue"
          delay={3}
        />
      </div>

      {/* Chart */}
      <div className="w-full">
        <SalesChart />
      </div>
    </div>
  );
}
