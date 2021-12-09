#!/bin/bash -e

NPM_VERSION=${1}

if [[ -z "${NPM_VERSION}" ]];then
  echo "package version must be provided"
  exit 255
fi

git push --tags
echo Publishing

cat package.json | jq 'del(.scripts)' > lib/package.json
cp README.md lib/
#cd src
#find ./ -name "*.ts" | xargs -IsrcFile cp srcFile ../lib

pushd lib
yarn publish . --from-package --non-interactive --tag ${NPM_VERSION}
#cp package.json ../
popd
git push 
echo "Successfully released version ${NPM_VERSION}!"