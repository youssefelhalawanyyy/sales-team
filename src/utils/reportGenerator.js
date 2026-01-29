// Report generation utilities for PDF export
export const generatePDFContent = (title, sections) => {
  // This creates structured data for PDF generation
  return {
    title,
    sections,
    timestamp: new Date().toLocaleString(),
    generatedDate: new Date().toLocaleDateString()
  };
};

export const formatPDFDate = (date) => {
  if (!date) return 'N/A';
  if (typeof date === 'string') {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const calculatePnL = (financialData) => {
  const totalRevenue = financialData.incomes?.reduce((sum, inc) => sum + (inc.amount || 0), 0) || 0;
  const totalExpenses = financialData.expenses?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0;
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(2) : 0;

  return {
    totalRevenue,
    totalExpenses,
    netProfit,
    profitMargin
  };
};

export const generateFinancialSummary = (finances) => {
  const incomes = finances.filter(f => f.type === 'income' || f.type === 'commission');
  const expenses = finances.filter(f => f.type === 'expense');
  const commissions = finances.filter(f => f.type === 'commission');

  const totalIncome = incomes.reduce((sum, inc) => sum + (inc.amount || 0), 0);
  const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  const totalCommissions = commissions.reduce((sum, comm) => sum + (comm.amount || 0), 0);

  return {
    totalIncome,
    totalExpenses,
    totalCommissions,
    netCash: totalIncome - totalExpenses,
    incomeBreakdown: incomes,
    expenseBreakdown: expenses
  };
};

export const groupByMonth = (items, dateField = 'date') => {
  const grouped = {};
  
  items.forEach(item => {
    const date = new Date(item[dateField]);
    const month = date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
    
    if (!grouped[month]) {
      grouped[month] = [];
    }
    grouped[month].push(item);
  });

  return grouped;
};

export const calculateCashFlow = (finances) => {
  const grouped = groupByMonth(finances);
  const cashFlow = [];

  let cumulativeCash = 0;

  Object.keys(grouped).sort().forEach(month => {
    const monthItems = grouped[month];
    const monthIncome = monthItems
      .filter(f => f.type === 'income' || f.type === 'commission')
      .reduce((sum, item) => sum + (item.amount || 0), 0);
    const monthExpense = monthItems
      .filter(f => f.type === 'expense')
      .reduce((sum, item) => sum + (item.amount || 0), 0);
    
    cumulativeCash += (monthIncome - monthExpense);

    cashFlow.push({
      month,
      inflow: monthIncome,
      outflow: monthExpense,
      netFlow: monthIncome - monthExpense,
      cumulativeCash
    });
  });

  return cashFlow;
};

// Download JSON as PDF using html2pdf library
export const downloadPDF = async (element, filename) => {
  try {
    // Load html2pdf library dynamically
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    
    script.onload = () => {
      const opt = {
        margin: 10,
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
      };
      
      window.html2pdf().set(opt).from(element).save();
    };
    
    document.head.appendChild(script);
  } catch (error) {
    console.error('Error generating PDF:', error);
  }
};
