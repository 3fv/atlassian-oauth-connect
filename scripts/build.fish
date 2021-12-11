#!/usr/bin/env fish

set rootDir (dirname (dirname (realpath (status filename))))

set tscArgs -b tsconfig.json $argv --preserveWatchOutput

echo "Building with args: $tscArgs"
tsc $tscArgs

echo "$PWD/lib successfully built"

