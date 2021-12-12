#!/usr/bin/env fish

set rootDir (dirname (dirname (realpath (status filename))))

mkdir -p lib/mjs lib/cjs
echo '{
    "type": "commonjs"
}' > lib/cjs/package.json

echo '{
    "type": "module"
}' > lib/mjs/package.json

set tscArgs -b tsconfig.json $argv --preserveWatchOutput

echo "Building with args: $tscArgs"
tsc $tscArgs

echo "$PWD/lib successfully built"

