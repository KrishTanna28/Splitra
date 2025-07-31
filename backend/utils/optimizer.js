// Takes net balances and returns list of simplified settlements
function minimizeTransactions(balances) {
  const settlements = [];

  const debtors = [];
  const creditors = [];

  for (const [userId, balance] of Object.entries(balances)) {
    const bal = parseFloat(balance);
    if (bal < 0) debtors.push({ userId, amount: -bal });
    if (bal > 0) creditors.push({ userId, amount: bal });
  }

  let i = 0, j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const settleAmount = Math.min(debtor.amount, creditor.amount);
    settlements.push({
      from: parseInt(debtor.userId),
      to: parseInt(creditor.userId),
      amount: +settleAmount.toFixed(2)
    });

    debtor.amount -= settleAmount;
    creditor.amount -= settleAmount;

    if (debtor.amount === 0) i++;
    if (creditor.amount === 0) j++;
  }

  return settlements;
}

module.exports = { minimizeTransactions };
