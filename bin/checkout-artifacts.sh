#!/bin/bash

set -e

SCRIPT_DIR=$(dirname $0)

. $SCRIPT_DIR/platform.sh

SHA=$(cat $SCRIPT_DIR/deps/firefox/$BRANCH/artifacts)

if [ -d $ARTIFACTS_DIR ]; then
  if [[ "$SHA" == "$(git rev-parse HEAD -c $ARTIFACTS_DIR)" ]]; then
    echo "Artifacts up-to-date."
    exit
  fi
fi

if [ ! -d $ARTIFACTS_DIR/.git ]; then
  rm -rf $ARTIFACTS_DIR
  git init $ARTIFACTS_DIR
fi

ARTIFACTS_LOCATION="https://github.com/ochameau/ff-dt.git artifacts-$BRANCH"

echo "Now downloading test dependencies via git ($ARTIFACTS_LOCATION)."

if [ $CI ]; then
  # Silence logs when running on CI.
  QUIET=-q
else
  QUIET=
fi

pushd $ARTIFACTS_DIR > /dev/null
git fetch $ARTIFACTS_LOCATION $QUIET
git checkout $SHA
popd > /dev/null

