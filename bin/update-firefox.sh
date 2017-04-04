#!/bin/bash

set -e
set -x

SCRIPT_DIR=$(dirname $0)

. $SCRIPT_DIR/platform.sh

rm -rf $SCRIPT_DIR/artifacts/firefox
mkdir -p $SCRIPT_DIR/artifacts/

TASK_ID=$(cat $SCRIPT_DIR/task_id)
echo "TaskID: $TASK_ID"

# On buildbot, the artifact file names aren't stable and contain the firefox version number in it
# fetch buildbot_properties.json, which is stable, to figure out the name of artifacts
ARTIFACT_PREFIX=target
if [[ $OS == "win32" ]]; then
  URL=https://queue.taskcluster.net/v1/task/$TASK_ID/artifacts/public/build/buildbot_properties.json
  ARTIFACT_PREFIX=firefox-$(curl -L --silent $URL | grep appVersion | cut -f 4 -d '"').en-US.win32
fi

FILENAME=target.tar.bz2
if [[ $OS == "win32" ]]; then
  FILENAME=$ARTIFACT_PREFIX.zip
fi
URL=https://queue.taskcluster.net/v1/task/$TASK_ID/artifacts/public/build/$FILENAME
PACKAGE=$(readlink -f $SCRIPT_DIR/$FILENAME)

curl -L -o $PACKAGE $URL

if [[ $OS == "win32" ]]; then
  unzip -q $PACKAGE -d $SCRIPT_DIR/artifacts/
else
  tar jxf $PACKAGE -C $SCRIPT_DIR/artifacts/
fi
#rm $PACKAGE
