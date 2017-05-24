#!/bin/bash

# This module downloads test artifacts from mozilla-central continuous integration tool (Taskcluster)
# It expects the following arguments:
# 1) Artifacts directory:
#    Path to the directory where the files are going to be downloaded
# 2) Task ID:
#    Taskcluster Task ID, identifying a precise build of Firefox
# 3) Platform:
#    Platform string id like linux64-opt, win32-debug, ...
# 4) OS:
#    Operating system string: win32, macosx64, linux32 or linux64

set -e

# Track each command when running on CI
if [ $CI ]; then
  set -x
fi

ARTIFACTS_DIR=$1
TASK_ID=$2
PLATFORM=$3
OS=$4

if [ ! -d $ARTIFACTS_DIR ]; then
  echo "$0 expects a target directory as first argument"
  exit
fi
if [ -z $TASK_ID ]; then
  echo "$0 expects a Task ID as second argument"
  exit
fi
if [ -z $PLATFORM ]; then
  echo "$0 expects the Platform string as third argument"
  exit
fi
if [ -z $OS ]; then
  echo "$0 expects the OS string as fourth argument"
  exit
fi

# On buildbot, the artifact file names aren't stable and contain the firefox version number in it
# fetch buildbot_properties.json, which is stable, to figure out the name of artifacts
ARTIFACT_PREFIX=target
if [[ $OS == "win32" ]]; then
  URL=https://queue.taskcluster.net/v1/task/$TASK_ID/artifacts/public/build/buildbot_properties.json
  ARTIFACT_PREFIX=firefox-$(curl -L --silent $URL | grep appVersion | cut -f 4 -d '"').en-US.win32
elif [[ $OS == "macosx64" ]]; then
  # MacOS sometime runs on buildbot, some other times on taskcluster...
  # buldbot_properties.json only exists when ran on buildbot
  URL=https://queue.taskcluster.net/v1/task/$TASK_ID/artifacts/public/build/buildbot_properties.json
  VERSION=$(curl -L --silent $URL | grep appVersion | cut -f 4 -d '"')
  if [ ! -z "$VERSION" ]; then
    ARTIFACT_PREFIX=firefox-$VERSION.en-US.mac
  fi
fi

# Helper to download an artifact from mozilla-central taskcluster jobs
# and extract it with optional include/exclude arguments passed to unzip
function downloadAndExtract {
  FILENAME=$1

  URL=https://queue.taskcluster.net/v1/task/$TASK_ID/artifacts/public/build/$FILENAME
  echo "Downloading: $URL"
  PACKAGE=$ARTIFACTS_DIR/$FILENAME

  curl -L -o $PACKAGE $URL

  unzip -oq $PACKAGE -d $ARTIFACTS_DIR/ "${@:2}"
  rm $PACKAGE
}

if [[ "$JUST_TEST_BINS" -ne 1 ]]; then
  rm -rf $ARTIFACTS_DIR/
  mkdir $ARTIFACTS_DIR
fi

# when updating artifacts, we update all mochitest and xpcshell deps from linux artifacts
# but also update test binaries like xpcshell and ssltunnel for each platform/debug/optimized
# JUST_TEST_BINS=1 means, we are only going to update the binaries.
if [[ "$JUST_TEST_BINS" -eq 1 ]]; then
  downloadAndExtract $ARTIFACT_PREFIX.common.tests.zip "bin/xpcshell*" "bin/ssltunnel*" "bin/certutil*" "bin/pk12util*" "bin/components/**" "bin/plugins/**" "bin/*.py"
  mkdir -p $ARTIFACTS_DIR/bin/$PLATFORM
  mv $ARTIFACTS_DIR/bin/{xpcshell,ssltunnel,certutil,pk12util,components,plugins}* $ARTIFACTS_DIR/bin/$PLATFORM
  # There is also some py files related to stacks that have to be in bin/ directory
  mv $ARTIFACTS_DIR/bin/*.py $ARTIFACTS_DIR/bin/$PLATFORM
else
  downloadAndExtract $ARTIFACT_PREFIX.common.tests.zip "certs/*" "bin/xpcshell*" "bin/ssltunnel*" "bin/certutil*" "bin/pk12util*" "bin/components/**" "bin/plugins/**" "bin/*.py" "modules/*" "mozbase/**" "config/*.txt"
  mkdir -p $ARTIFACTS_DIR/bin/$PLATFORM
  mv $ARTIFACTS_DIR/bin/{xpcshell,ssltunnel,certutil,pk12util,components,plugins}* $ARTIFACTS_DIR/bin/$PLATFORM
  # There is also some py files related to stacks that have to be in bin/ directory
  mv $ARTIFACTS_DIR/bin/*.py $ARTIFACTS_DIR/bin/$PLATFORM

  # Extract mochitest python app
  downloadAndExtract $ARTIFACT_PREFIX.mochitest.tests.zip "mochitest/**" -x "mochitest/tests/**" "mochitest/browser/**" "mochitest/chrome/**" "mochitest/a11y/**" "mochitest/jetpack-package/**"

  # Extract xpcshell python app
  downloadAndExtract $ARTIFACT_PREFIX.xpcshell.tests.zip "xpcshell/*" -x "xpcshell/tests/*" "xpcshell/node-http*" "xpcshell/moz-http*"
fi
