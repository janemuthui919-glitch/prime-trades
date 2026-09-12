module.exports = {
    presets: [
        '@babel/preset-env',
        '@babel/preset-typescript',
        [
            '@babel/preset-react',
            {
                runtime: 'automatic',
            },
        ],
    ],
    plugins: [
        'syntax-dynamic-import',
        [
            '@babel/plugin-proposal-decorators',
            {
                legacy: true,
            },
        ],
        [
            '@babel/plugin-proposal-class-properties',
            {
                loose: true,
            },
        ],
        [
            '@babel/plugin-proposal-private-methods',
            {
                loose: true,
            },
        ],
        [
            '@babel/plugin-proposal-private-property-in-object',
            {
                loose: true,
            },
        ],
        '@babel/plugin-proposal-export-default-from',
        '@babel/plugin-proposal-object-rest-spread',
        '@babel/plugin-proposal-export-namespace-from',
        '@babel/plugin-syntax-dynamic-import',
        '@babel/plugin-proposal-optional-chaining',
        // react-router@8 ships ESM that uses `import.meta.hot`; Jest/CJS cannot parse it.
        function babelPluginStripImportMeta() {
            return {
                name: 'strip-import-meta',
                visitor: {
                    MetaProperty(path) {
                        path.replaceWithSourceString('({ url: "", hot: undefined })');
                    },
                },
            };
        },
    ],
};
