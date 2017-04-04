#!/bin/bash

set -e

echo "Downloading Firefox"

# Track each command when running on CI
if [ $CI ]; then
  set -x
fi

SCRIPT_DIR=$(dirname $0)

. $SCRIPT_DIR/platform.sh

rm -rf $SCRIPT_DIR/artifacts/firefox
mkdir -p $SCRIPT_DIR/artifacts/

TASK_ID=$(cat $TASK_ID_PATH)
echo "TaskID: $TASK_ID"

# On buildbot, the artifact file names aren't stable and contain the firefox version number in it
# fetch buildbot_properties.json, which is stable, to figure out the name of artifacts
ARTIFACT_PREFIX=target
if [[ $OS == "win32" ]]; then
  URL=https://queue.taskcluster.net/v1/task/$TASK_ID/artifacts/public/build/buildbot_properties.json
# Windows build machines do not necessarely have curl, while curl is necessary on taskcluster linux machines
  if [[ -x $(command -v curl) ]]; then
    FIREFOX_VERSION=$(curl -L --silent $URL | grep appVersion | cut -f 4 -d '"')
  else
    FIREFOX_VERSION=$(wget -qO- $URL | grep appVersion | cut -f 4 -d '"')
  fi
  ARTIFACT_PREFIX=firefox-$FIREFOX_VERSION.en-US.win32
elif [[ $OS == "macosx64" ]]; then
  URL=https://queue.taskcluster.net/v1/task/$TASK_ID/artifacts/public/build/buildbot_properties.json
  FIREFOX_VERSION=$(curl -L --silent $URL | grep appVersion | cut -f 4 -d '"')
  ARTIFACT_PREFIX=firefox-$FIREFOX_VERSION.en-US.mac
fi

FILENAME=target.tar.bz2
if [[ $OS == "win32" ]]; then
  FILENAME=$ARTIFACT_PREFIX.zip
elif [[ $OS == "macosx64" ]]; then
  FILENAME=$ARTIFACT_PREFIX.dmg
fi
URL=https://queue.taskcluster.net/v1/task/$TASK_ID/artifacts/public/build/$FILENAME
PACKAGE=$(realpath $SCRIPT_DIR/artifacts/$FILENAME)

# Windows build machines do not necessarely have curl, while curl is necessary on taskcluster linux machines
if [[ -x $(command -v curl) ]]; then
  curl -L -o $PACKAGE $URL
else
  wget -qO $PACKAGE $URL
fi

if [[ $OS == "win32" ]]; then
# Some Windows envinronment have 7zip but not unzip
  if [ -x $(command -v unzip) ]; then
    unzip -q $PACKAGE -d $SCRIPT_DIR/artifacts/
  else
    7z x $PACKAGE -o$SCRIPT_DIR/artifacts/
  fi
elif [[ $OS == "macosx64" ]]; then
# Uncompress the dmg. Il will popup some Finder windows...
  $SCRIPT_DIR/unpack-diskimage $PACKAGE $SCRIPT_DIR/dmg-mount $SCRIPT_DIR/artifacts/
# The dmg includes a symlink to /Applications called " ", as well as some hidden files
  rm "$SCRIPT_DIR/artifacts/ "
  rm -rf $SCRIPT_DIR/artifacts/.background/
  rm $SCRIPT_DIR/artifacts/.* || true
else
  tar jxf $PACKAGE -C $SCRIPT_DIR/artifacts/
fi
#rm $PACKAGE
