#!/bin/bash

set -e

SCRIPT_DIR=$(dirname $0)

BRANCH=mozilla-central
mkdir -p $SCRIPT_DIR/deps/firefox/$BRANCH

ARTIFACTS_DIR=$(mktemp -d)
echo $ARTIFACTS_DIR

function updatePlatform {
  PLATFORM=$1
  OS=$2

  ## Get whatever is the latest build from mozilla-central taskcluster jobs
  URL=https://index.taskcluster.net/v1/task/gecko.v2.$BRANCH.latest.firefox.$PLATFORM
  ## For optimized build, instead of fetching whatever is the latest from mozilla-central,
  ## we fetch the latest Nightly build.
  if [[ "$PLATFORM" =~ "-opt" ]]; then
    URL=https://index.taskcluster.net/v1/task/gecko.v2.$BRANCH.nightly.latest.firefox.$PLATFORM
  fi
  echo "Route URL: $URL"
  TASK_ID=$(curl $URL --silent | grep taskId | cut -f 4 -d '"')
  TASK_ID_PATH=$(readlink -f $SCRIPT_DIR/deps/firefox/$BRANCH/$PLATFORM)
  echo "TaskID: $TASK_ID"
  if [[ $(cat $TASK_ID_PATH) == $TASK_ID ]]; then
    echo "Artifacts already up to date for $PLATFORM."
  fi
  # Updates the Task ID for this platform in-tree
  echo $TASK_ID > $TASK_ID_PATH
  echo "Fetch artifacts for $PLATFORM"
  $SCRIPT_DIR/fetch-artifacts.sh $ARTIFACTS_DIR $TASK_ID $PLATFORM $OS
}

# Download artifacts for all platforms and mode
updatePlatform linux64-opt linux64
# We base all platform agnostic artifact files on linux optimized,
# but still need OS-specific binaries like xpcshell
JUST_TEST_BINS=1 updatePlatform linux64-debug linux64
JUST_TEST_BINS=1 updatePlatform win32-opt win32
JUST_TEST_BINS=1 updatePlatform win32-debug win32
JUST_TEST_BINS=1 updatePlatform macosx64-opt macosx64
JUST_TEST_BINS=1 updatePlatform maxosx64-debug macosx64

# Push the artifacts to one of the artifacts branches, for the given m-c branch
pushd $ARTIFACTS_DIR/
git init .
git add .
git commit -m "Bump artifacts"
ARTIFACTS_SHA=$(git rev-parse HEAD)
echo "Artifacts sha: $ARTIFACTS_SHA"
git tag tag-$ARTIFACTS_SHA $ARTIFACTS_SHA
# -q is important to not leak the github token
git push "https://$GITHUB_TOKEN@github.com/ochameau/ff-dt-artifacts.git" "tag-$ARTIFACTS_SHA" -q
popd

# Updates the artifacts sha for this build in-tree
echo $ARTIFACTS_SHA > $SCRIPT_DIR/deps/firefox/$BRANCH/artifacts
