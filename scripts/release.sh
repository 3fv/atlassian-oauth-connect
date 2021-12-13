#!/bin/bash -e

NPM_VERSION=${1}

if [[ -z "${NPM_VERSION}" ]];then
  echo "package version must be provided"
  exit 255
fi

git push --tags
echo Publishing

# Publish to Github
# yarn publish . --from-package --non-interactive --tag ${NPM_VERSION} --registry=https://npm.pkg.github.com
 
# Publish to NPM 
yarn publish . --from-package --non-interactive --tag ${NPM_VERSION} --registry=http://registry.npmjs.org

git push --all

echo "Successfully released version ${NPM_VERSION}!"