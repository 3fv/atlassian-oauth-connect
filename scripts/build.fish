#!/usr/bin/env fish

set rootDir (dirname (dirname (realpath (status filename))))

if not test -e index.d.ts
  if test -d $rootDir/lib && test "$NODE_ENV" = "production"
    echo echo "$PWD/lib cleaned"
    rm -Rf $rootDir/lib
  end
  mkdir -p $rootDir/lib
  cp package.json $rootDir/lib

  set tscArgs -b tsconfig.json $argv --preserveWatchOutput

  echo "Building with args: $tscArgs"
  tsc $tscArgs

  echo "$PWD/lib successfully built"
end
