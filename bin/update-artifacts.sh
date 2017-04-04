#!/bin/bash

set -e

SCRIPT_DIR=$(dirname $0)

. $SCRIPT_DIR/platform.sh

rm -rf $SCRIPT_DIR/artifacts/
mkdir $SCRIPT_DIR/artifacts

## Get whatever is the latest build from mozilla-central taskcluster jobs
URL=https://index.taskcluster.net/v1/task/gecko.v2.mozilla-central.latest.firefox.$PLATFORM
TASK_ID=$(curl $URL --silent | grep taskId | cut -f 4 -d '"')
echo "TaskID: $TASK_ID"
echo $TASK_ID > $SCRIPT_DIR/task_id

# On buildbot, the artifact file names aren't stable and contain the firefox version number in it
# fetch buildbot_properties.json, which is stable, to figure out the name of artifacts
ARTIFACT_PREFIX=target
if [[ $OS == "win32" ]]; then
  URL=https://queue.taskcluster.net/v1/task/$TASK_ID/artifacts/public/build/buildbot_properties.json
  ARTIFACT_PREFIX=firefox-$(curl -L --silent $URL | grep appVersion | cut -f 4 -d '"').en-US.win32
fi

# Helper to download an artifact from mozilla-central taskcluster jobs
# and extract it with optional include/exclude arguments passed to unzip
function downloadAndExtract {
  FILENAME=$1

  URL=https://queue.taskcluster.net/v1/task/$TASK_ID/artifacts/public/build/$FILENAME
  PACKAGE=$SCRIPT_DIR/$FILENAME

  curl -L -o $PACKAGE $URL

  unzip -q $PACKAGE -d $SCRIPT_DIR/artifacts/ "${@:2}"
#rm $PACKAGE
}

downloadAndExtract $ARTIFACT_PREFIX.common.tests.zip "certs/*" "bin/*" "modules/*" "mozbase/*" "config/*"

downloadAndExtract $ARTIFACT_PREFIX.mochitest.tests.zip "mochitest/*" -x "mochitest/tests/*" "mochitest/browser/*" "mochitest/chrome/*" "mochitest/a11y/*" "mochitest/jetpack-package/*"
rm -rf $SCRIPT_DIR/mochitest/
mv $SCRIPT_DIR/artifacts/mochitest $SCRIPT_DIR/mochitest

downloadAndExtract $ARTIFACT_PREFIX.xpcshell.tests.zip "xpcshell/*" -x "xpcshell/tests/*" "xpcshell/node-http*" "xpcshell/moz-http*"

rm -rf $SCRIPT_DIR/xpcshell/
mv $SCRIPT_DIR/artifacts/xpcshell $SCRIPT_DIR/xpcshell
