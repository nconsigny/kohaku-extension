/* @ts-self-types="./eth_prices.d.ts" */

import wasm from "./eth_prices_bg.wasm";
import { __wbg_set_wasm, __wbindgen_start } from "./eth_prices_bg.js";
__wbg_set_wasm(wasm);
if (typeof __wbindgen_start === 'function') __wbindgen_start();
export {
    Quoter, Route, createQuoter
} from "./eth_prices_bg.js";
