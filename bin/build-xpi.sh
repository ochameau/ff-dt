#!/bin/bash

# Track each command when running on CI
if [ $CI ]; then
  set -x
fi

# Use 7z as zip is not able to fully ignore directories
# and is going to spent awful amount of time reading .git/gecko folders

ZIP=7z
if [[ ! -x $(command -v $ZIP) ]]; then
  ZIP=7zr
fi
if [[ ! -x $(command -v $ZIP) ]]; then
  echo "You need to install p7zip or p7zip-full to package the add-on"
  exit
fi

if [ -f devtools.xpi ]; then
  rm devtools.xpi
fi

# make 7z silent. Note that 7z do not support any silent argument
# -mx=9, maximal compression
# -tzip to force ZIP format (i.e. not 7z one!)
# Ignore files from .gitignore, but also a specific one in 'bin/zipignore'
$ZIP a devtools.xpi . -mx=9 -tzip -xr@.gitignore -xr@bin/zipignore > /dev/null
