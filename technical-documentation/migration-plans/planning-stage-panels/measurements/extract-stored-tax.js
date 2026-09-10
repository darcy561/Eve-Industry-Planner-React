const d = db.getSiblingDB("eve_industry_planner_snapshot");
const num = (o) => (o && typeof o === "object" && "low" in o) ? o.high*4294967296 + (o.low>>>0) : o;
const cur = d.archivedJobs.find({ "build.sale.transactions.0": { $exists: true } }, { "build.sale.transactions": 1 });
while (cur.hasNext()) {
  for (const t of cur.next().build.sale.transactions || []) {
    print(JSON.stringify({
      tax: num(t.tax), unit: num(t.unit_price), qty: num(t.quantity),
      amount: num(t.amount), date: t.date, hash: t.CharacterHash,
    }));
  }
}
