#!/bin/bash

set -e

SCRIPT_DIR=$(dirname $0)

# Download firefox if not already done
if [ ! -f $SCRIPT_DIR/mochitest/artifacts/firefox/firefox-bin ]; then
  echo "Downloading Firefox..."
  $SCRIPT_DIR/mochitest/update_firefox.sh
fi

if [ ! -d $SCRIPT_DIR/profile ]; then
  $SCRIPT_DIR/create-dev-profile.sh $SCRIPT_DIR/profile
fi

$SCRIPT_DIR/mochitest/artifacts/firefox/firefox-bin -profile $SCRIPT_DIR/profile --no-remote $@
