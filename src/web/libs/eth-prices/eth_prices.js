/* @ts-self-types="./eth_prices.d.ts" */

import * as bg from "./eth_prices_bg.js";

let initialized = false;

async function ensureInit() {
  if (initialized) return;
  // webpack asyncWebAssembly handles instantiation — import the module
  // which resolves to the WASM exports object
  const wasm = await import("./eth_prices_bg.wasm");
  bg.__wbg_set_wasm(wasm);
  bg.__wbindgen_init_externref_table();
  initialized = true;
}

export async function createQuoter(config) {
  await ensureInit();
  return bg.createQuoter(config);
}

export const Quoter = bg.Quoter;
export const Route = bg.Route;
