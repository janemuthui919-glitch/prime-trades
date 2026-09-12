/**
 * Shim for @deriv-com/quill-ui@1.x's vendored React 18 jsx-runtime.
 * Quill-ui imports `{ j, r }`: `j` is `{ Fragment, jsx, jsxs }` and `r` is a
 * factory that returns the same object (`r()` → j). Its bundled runtime reads
 * React.__SECRET_INTERNALS_…ReactCurrentOwner, which React 19 removed.
 * Point NormalModuleReplacementPlugin at this file instead.
 */
import { Fragment, jsx, jsxs } from 'react/jsx-runtime';

export const j = { Fragment, jsx, jsxs };
export function r() {
    return j;
}
