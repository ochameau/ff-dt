#!/bin/bash

PLATFORM=linux64-opt

set -e

SCRIPT_DIR=$(dirname $0)

rm -rf $SCRIPT_DIR/artifacts/
mkdir $SCRIPT_DIR/artifacts

URL=https://index.taskcluster.net/v1/task/gecko.v2.mozilla-central.latest.firefox.$PLATFORM
TASK_ID=$(curl $URL --silent | grep taskId | cut -f 4 -d '"')
echo "TaskID: $TASK_ID"
echo $TASK_ID > $SCRIPT_DIR/task_id

########

$SCRIPT_DIR/update_firefox.sh

######## 

FILENAME=target.common.tests.zip

#URL=https://index.taskcluster.net/v1/task/gecko.v2.mozilla-central.latest.firefox.$PLATFORM/artifacts/public/build/$FILENAME
URL=https://queue.taskcluster.net/v1/task/$TASK_ID/artifacts/public/build/$FILENAME
PACKAGE=$SCRIPT_DIR/$FILENAME

wget $URL -O $PACKAGE

unzip -q $PACKAGE -d $SCRIPT_DIR/artifacts/ certs* bin* modules* mozbase/* config/*
#rm $PACKAGE

######## 

FILENAME=target.mochitest.tests.zip

#URL=https://index.taskcluster.net/v1/task/gecko.v2.mozilla-central.latest.firefox.$PLATFORM/artifacts/public/build/$FILENAME
URL=https://queue.taskcluster.net/v1/task/$TASK_ID/artifacts/public/build/$FILENAME
PACKAGE=$SCRIPT_DIR/$FILENAME

wget $URL -O $PACKAGE
unzip -q $PACKAGE -d $SCRIPT_DIR/artifacts/ mochitest* -x mochitest/tests* mochitest/browser* mochitest/chrome* mochitest/a11y* mochitest/jetpack*
#rm $PACKAGE

rm -rf $SCRIPT_DIR/mochitest/
mv $SCRIPT_DIR/artifacts/mochitest $SCRIPT_DIR/mochitest/

