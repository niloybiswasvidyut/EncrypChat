/**
 * Compute unit price for a medicine item.
 * For non‑syrup medicines, unit price = boxPrice / totalUnits.
 * For 'syrup', preserve the provided unitPrice.
 *
 * @param {Object} item
 * @param {string} [item.type]
 * @param {number|string} [item.boxPrice]
 * @param {number|string} [item.totalUnits]
 * @param {number|string} [item.unitPrice]
 * @returns {number} unit price rounded to 2 decimals
 */
export function computeUnitPrice(item = {}) {
  const type = (item.type || '').toString().trim().toLowerCase();
  const boxPrice = Number(item.boxPrice || 0);
  const totalUnits = Number(item.totalUnits || 0);
  if (!totalUnits || totalUnits <= 0) return 0;
  if (type !== 'syrup') {
    return Number((boxPrice / totalUnits).toFixed(2));
  }
  return Number(item.unitPrice || 0);
}

/**
 * Build a cart line item including computed `unitPrice` and `lineTotal`.
 *
 * @param {Object} item
 * @param {number|string} [item.qty]
 * @returns {Object} item with `unitPrice` and `lineTotal`
 */
export function buildCartLine(item = {}) {
  const unitPrice = computeUnitPrice(item);
  const qty = Number(item.qty || 1);
  const lineTotal = Number((unitPrice * qty).toFixed(2));
  return { ...item, unitPrice, lineTotal };
}

export default computeUnitPrice;
