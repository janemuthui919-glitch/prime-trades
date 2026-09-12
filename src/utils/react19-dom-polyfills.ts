/**
 * React 19 removed several react-dom APIs that vendored UI still relies on.
 * Apply once at app/test startup so CSSTransition (react-transition-group@4) does not crash
 * when findDOMNode is missing. Animations still require nodeRef on each CSSTransition.
 *
 * Assignment mutates the imported `react-dom` namespace. That works under rsbuild's
 * CJS interop (exports are a mutable object). A frozen ESM namespace would throw
 * TypeError; catch that so startup degrades to the missing-findDOMNode path instead
 * of crashing here.
 */
import * as ReactDOM from 'react-dom';
import ReactDOMDefault from 'react-dom';

type Findable = Element | Text | null | undefined;

function findDOMNodePolyfill(node: Findable | object): Element | Text | null {
    if (node == null) return null;
    if (node instanceof Element || node instanceof Text) return node;
    return null;
}

export function applyReact19DomPolyfills(): void {
    const targets = [ReactDOM, ReactDOMDefault] as Array<
        typeof ReactDOM & { findDOMNode?: typeof findDOMNodePolyfill; default?: { findDOMNode?: typeof findDOMNodePolyfill } }
    >;

    for (const target of targets) {
        if (!target) continue;
        if (typeof target.findDOMNode !== 'function') {
            try {
                target.findDOMNode = findDOMNodePolyfill;
            } catch {
                // Frozen ESM namespace — leave findDOMNode unset.
            }
        }
        if (target.default && typeof target.default.findDOMNode !== 'function') {
            try {
                target.default.findDOMNode = findDOMNodePolyfill;
            } catch {
                // Frozen ESM namespace — leave findDOMNode unset.
            }
        }
    }
}
