#!/bin/bash

set -e

# Track each command when running on CI
if [ $CI ]; then
  set -x
fi

# Use 7z as zip is not able to fully ignore directories
# and is going to spent awful amount of time reading .git/gecko folders

rm devtools.xpi

# make 7z silent. Note that 7z do not support any silent argument
7z a devtools.xpi . -mx=9 -tzip -xr@.gitignore -xr@bin/zipignore > /dev/null
