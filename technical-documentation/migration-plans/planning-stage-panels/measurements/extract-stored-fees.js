const d = db.getSiblingDB("eve_industry_planner_snapshot");
const key = (o) => (o && typeof o === "object" && "low" in o) ? `${o.high}:${o.low}` : String(o);
const num = (o) => (o && typeof o === "object" && "low" in o) ? o.high*4294967296 + (o.low>>>0) : o;
const cur = d.archivedJobs.find(
  { "build.sale.brokersFee.0": { $exists: true }, "build.sale.marketOrders.0": { $exists: true } },
  { "build.sale.brokersFee": 1, "build.sale.marketOrders": 1 }
);
while (cur.hasNext()) {
  const doc = cur.next();
  const orders = new Map((doc.build.sale.marketOrders || []).map((o) => [key(o.order_id), o]));
  for (const fee of doc.build.sale.brokersFee || []) {
    const o = orders.get(key(fee.order_id));
    if (!o) continue;
    print(JSON.stringify({
      amount: num(fee.amount),
      price: num(o.item_price),
      vol: num(o.volume_total),
      loc: num(o.location_id),
      stamps: (o.timeStamps || []).length,
      issued: o.issued,
      feeDate: fee.date,
    }));
  }
}
