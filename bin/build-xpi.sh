#!/bin/bash

set -x

# Use 7z as zip is not able to fully ignore directories
# and is going to spent awful amount of time reading .git/gecko folders

rm devtools.xpi

# make 7z silent. Note that 7z do not support any silent argument
7z a devtools.xpi . -xr@.gitignore -xr@bin/zipignore > /dev/null
