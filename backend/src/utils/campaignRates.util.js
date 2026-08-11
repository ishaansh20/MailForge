function roundRate(numerator, denominator) {
  if (!denominator) {
    return 0;
  }

  return Math.round((numerator / denominator) * 1000) / 10;
}

function computeCampaignRates(stats) {
  const deliveredOrSent = stats.delivered > 0 ? stats.delivered : stats.sent;

  return {
    openRate: roundRate(stats.opened, deliveredOrSent),
    clickRate: roundRate(stats.clicked, deliveredOrSent),
    bounceRate: roundRate(stats.bounced, stats.sent),
  };
}

module.exports = { roundRate, computeCampaignRates };
