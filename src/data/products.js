// src/data/products.js

const products = [

  {
    id: "cube_pro",
    name: "JONIX Cube Professional",
    sector: ["clinic", "office", "beauty"],
    maxArea: 85,
    type: "standalone",
    price: 2000,
    currency: "EUR"
  },

  {
    id: "steel_4c",
    name: "JONIX Steel 4C",
    sector: ["food", "cold_room", "restaurant"],
    maxVolume: 500,
    type: "wall",
    price: 6000,
    currency: "EUR"
  },

  {
    id: "steel_2f",
    name: "JONIX Steel 2F",
    sector: ["cold_room", "warehouse"],
    maxVolume: 1000,
    type: "wall",
    price: 4000,
    currency: "EUR"
  },

  {
    id: "steel_4f",
    name: "JONIX Steel 4F",
    sector: ["cold_room", "warehouse"],
    maxVolume: 2000,
    type: "wall",
    price: 7000,
    currency: "EUR"
  }

];

export default products;
