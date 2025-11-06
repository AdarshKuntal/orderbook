export type SideMap = Map<string, number>;

export function applyDepthDelta(sideMap: SideMap, updates: [string, string][]) {
  for (const [priceStr, qtyStr] of updates) {
    const qty = Number(qtyStr);
    if (qty === 0) {
      sideMap.delete(priceStr);
    } else {
      sideMap.set(priceStr, qty);
    }
  }
}

export function mapToSortedArray(map: SideMap, side: 'bids' | 'asks', limit = 100) {
  const arr = Array.from(map.entries()).map(([p, q]) => ({ price: Number(p), qty: q }));
  arr.sort((a, b) => (side === 'bids' ? b.price - a.price : a.price - b.price));
  let cum = 0;
  const result = arr.slice(0, limit).map((row) => {
    cum += row.qty;
    return { price: row.price, qty: row.qty, cum };
  });
  return result;
}
