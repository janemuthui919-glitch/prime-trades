/**
 * React 19 / @types/react 19 moved JSX off the global namespace onto React.JSX.
 * Vendored bot code still uses the global `JSX` namespace — restore it for tsc.
 */
import type { JSX as ReactJSX } from 'react';

declare global {
    namespace JSX {
        type Element = ReactJSX.Element;
        type ElementClass = ReactJSX.ElementClass;
        type ElementAttributesProperty = ReactJSX.ElementAttributesProperty;
        type ElementChildrenAttribute = ReactJSX.ElementChildrenAttribute;
        type LibraryManagedAttributes<C, P> = ReactJSX.LibraryManagedAttributes<C, P>;
        type IntrinsicAttributes = ReactJSX.IntrinsicAttributes;
        type IntrinsicClassAttributes<T> = ReactJSX.IntrinsicClassAttributes<T>;
        type IntrinsicElements = ReactJSX.IntrinsicElements;
    }
}

export {};
