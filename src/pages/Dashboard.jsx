import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { calculateTotalReceivable, calculateTotalPayable, calculateTotalSales } from '../utils/helpers';
import DashboardCard from '../components/DashboardCard';
import SalesChart from '../components/SalesChart';

export default function Dashboard() {
  const { parties, transactions } = useApp();
  const navigate = useNavigate();

  const totalReceivable = useMemo(() => calculateTotalReceivable(parties), [parties]);
  const totalPayable = useMemo(() => calculateTotalPayable(parties), [parties]);
  const totalSales = useMemo(() => calculateTotalSales(transactions), [transactions]);

  const receivableParties = parties.filter(p => p.type === 'customer' && p.balance > 0).length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DashboardCard
          title="You'll Get"
          amount={totalReceivable}
          subtitle={`From ${receivableParties} Part${receivableParties !== 1 ? 'ies' : 'y'}`}
          color="green"
          trend="down"
          delay={1}
          onClick={() => navigate('/parties')}
        />
        <DashboardCard
          title="You'll Pay"
          amount={totalPayable}
          subtitle={totalPayable === 0 ? "You don't have any pending payments right now." : undefined}
          color="red"
          trend="up"
          delay={2}
          onClick={() => navigate('/parties')}
        />
        <DashboardCard
          title="Total Sale"
          amount={totalSales}
          color="blue"
          delay={3}
          onClick={() => navigate('/sale')}
        />
      </div>

      {/* Chart */}
      <div className="w-full">
        <SalesChart />
      </div>
    </div>
  );
}
