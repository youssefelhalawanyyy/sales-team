import products from "../data/jonixProducts";

export function recommendProduct(sector, size, unit) {

  let volume = unit === "m2" ? size * 3 : size;

  const available = products.filter(p =>
    p.sector.includes(sector)
  );

  if (!available.length) return [];

  const product = available.sort((a,b)=>{
    const aCap = a.coverageM3 || a.coverageM2*3;
    const bCap = b.coverageM3 || b.coverageM2*3;
    return aCap - bCap;
  })[0];

  const capacity =
    product.coverageM3 ||
    product.coverageM2 * 3;

  const units = Math.ceil(volume / capacity);

  return [{
    ...product,
    units,
    total: units * product.price
  }];
}
