import React from 'react';
import { formatCurrency } from '../utils/currency';

export default function DealStats({ deals }) {
  const total = deals.length;

  const closed = deals.filter(d => d.status === 'closed');

  const revenue = closed.reduce(
    (s, d) => s + (Number(d.price) || 0),
    0
  );

  const pending = deals.filter(
    d => d.status === 'pending_approval'
  ).length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">

      <Stat title="Total Deals" value={total} />
      <Stat title="Closed" value={closed.length} />
      <Stat title="Revenue" value={formatCurrency(revenue)} />
      <Stat title="Pending" value={pending} />

    </div>
  );
}

function Stat({ title, value }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow">

      <p className="text-sm text-gray-500">
        {title}
      </p>

      <p className="text-2xl font-bold">
        {value}
      </p>

    </div>
  );
}
