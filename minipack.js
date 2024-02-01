const fs = require('fs');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const {transformFromAst} = require('babel-core');
const path = require('path');
let ID = 0;
function createAsset(filename) {
    const content = fs.readFileSync(filename, 'utf-8');

    const ast = parser.parse(content, {sourceType: 'module'});

    const dependencies = [];

    traverse(ast, {
        ImportDeclaration: function({node}) {
            dependencies.push(node.source.value);
        }
    });

    const {code} = transformFromAst(ast, null, {presets: ['env']});
    return {
        filename,
        id: ID++,
        code,
        dependencies
    }
}

/**
 * Create Graph using recursion
 * @param {*} entry 
 * @returns 
 */

// function createDependencyGraph(asset) {
//     let graph = [asset]
//     const dirname = path.dirname(asset.filename);
//         asset.mapping = {};
//         asset.dependencies.forEach(relativePath => {
//             const absolutePath = path.join(dirname, relativePath);
//             const child = createAsset(absolutePath);
//             asset.mapping[relativePath] = child.id;
//             graph = [...graph, ...createDependencyGraph(child)];
//         });

//     return graph
// }


// function createGraph(entry) {
//     const asset = createAsset(entry);

//     return createDependencyGraph(asset);
// }


function createGraph(entry) {
    const asset = createAsset(entry);

    const queue = [asset];

    for(const asset of queue) {
        const dirname = path.dirname(asset.filename);
        asset.mapping = {};
        asset.dependencies.forEach(relativePath => {
            const absolutePath = path.join(dirname, relativePath);
            const child = createAsset(absolutePath);
            asset.mapping[relativePath] = child.id;
            queue.push(child);
        });
    }

    return queue;
}


function bundle(graph) {
    let modules = '';

    graph.forEach(module => {
        modules += `${module.id}: [
            function(require, module, exports) {
                ${module.code};
            },
            ${JSON.stringify(module.mapping)}
        ],`
    })

    const result = `(function(modules) {
        function require(id) {
            const [fn, mapping] = modules[id];

            function localRequire(name) {
                return require(mapping[name]);
            }

            const module = {exports: {}};

            fn(localRequire, module, module.exports);

            return module.exports;
        }

        require(0);
    })({${modules}})`;

    return result;
}

const graph = createGraph('./example/index.js');
const res = bundle(graph);

console.log(res);