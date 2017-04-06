#!/bin/bash

set -e
set -x

if [[ -z $ARTIFACTS ]]; then
  echo "$0 must be run with ARTIFACTS env variable set to the artifacts folder path"
  exit
fi

mkdir -p $ARTIFACTS

# Setup python environement for tests
source config.sh

# Run mochitests
export MOZ_UPLOAD_DIR=$ARTIFACTS
./test --quiet --screenshot-on-fail 2>&1 | tee $ARTIFACTS/mochitests-debug.log

# Run xpcshell tests
./bin/run-xpcshell.sh 2>&1 | tee $ARTIFACTS/xpcshell-debug.log
