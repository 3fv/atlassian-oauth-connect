#!/usr/bin/env node

import { $, argv, fs as Fs, path as Path, echo, usePwsh, which, os, useBash } from "zx"
// import Path from "path"
// import Fs from "fs"
import Sh from "shelljs"
import Os from "os"

$.verbose = true
const isLinux = /Linux/.test(Os.type())
const isMac = /Darwin/.test(Os.type())
const isWindows = /Win/.test(Os.type())
if (isWindows)
    usePwsh()
else
    useBash()

const die = (msg, exitCode = 1, err = null) => {
  if (err) {
      if (typeof err.printStackTrace === "function")
          err.printStackTrace()
      else
          err.toString()
  }

  echo`ERROR: ${msg}`
  process.exit(exitCode)
}
  
const rawArgv = process.argv.slice(2)
const npmTag = rawArgv[0]
if (!npmTag || !npmTag.length)
  die("package version must be provided")
//NPM_TAG=${1}

const pkgJson = Fs.readJSONSync("package.json")
const npmVer = pkgJson.version

await $`git push --tags`
echo("Publishing")

// ./scripts/prepare.sh
// cp README.md lib/

await $`yarn publish . --from-package --non-interactive --tag ${npmTag}`

await $`git push`


echo(`Successfully released version ${npmVer} with tag ${npmTag}!`)