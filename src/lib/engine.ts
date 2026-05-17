/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const calculatePerfumeMix = (bottleSize: number, oilPercentage: number) => {
  const oilQuantity = (bottleSize * oilPercentage) / 100;
  const alcoholQuantity = bottleSize - oilQuantity;
  return {
    oilQuantity,
    alcoholQuantity
  };
};

export const calculateCustomPerfumePrice = (
  oilPricePerMl: number, 
  alcoholPricePerMl: number, 
  bottlePrice: number, 
  oilQuantity: number, 
  alcoholQuantity: number
) => {
  const oilCost = oilPricePerMl * oilQuantity;
  const alcoholCost = alcoholPricePerMl * alcoholQuantity;
  return oilCost + alcoholCost + bottlePrice;
};
