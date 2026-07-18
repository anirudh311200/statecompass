export function buildSegmentStats(profiles) {
  const active = profiles.filter((profile) => profile && !profile.unsubscribed);
  const totals = {
    profiles: active.length,
    unsubscribed: profiles.length - active.length,
    byStage: {},
    byModel: {},
    byTax: {},
    byVc: {},
    byLens: {},
  };

  for (const profile of active) {
    const answers = profile.quizAnswers ?? {};
    increment(totals.byStage, answers.stage);
    increment(totals.byModel, answers.model);
    increment(totals.byTax, answers.tax);
    increment(totals.byVc, answers.vc);
    increment(totals.byLens, profile.defaultLens || "overall");
  }

  return totals;
}

function increment(bucket, key) {
  if (!key) {
    return;
  }
  bucket[key] = (bucket[key] ?? 0) + 1;
}
