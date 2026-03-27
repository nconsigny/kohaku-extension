/* @ts-self-types="./eth_prices.d.ts" */

import init from "./eth_prices_bg.wasm";
import * as bg from "./eth_prices_bg.js";

let initialized = false;

async function ensureInit() {
  if (initialized) return;
  const wasm = await init({ "./eth_prices_bg.js": bg });
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
