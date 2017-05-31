#!/bin/bash

# Script to automatically download Firefox,
# a precise version known to be passing tests with this changeset.
# Then automatically create a development profile folder,
# with some useful preferences set, named "profile"
# and created at repo's root.
# In order to finally run firefox with the DevTools add-on
# automatically registered in this profile.

set -e

SCRIPT_DIR=$(dirname $0)

. $SCRIPT_DIR/platform.sh

# Download firefox if not already done
if [ ! -f $FIREFOX_BIN ]; then
  $SCRIPT_DIR/fetch-firefox.sh
fi

if [ ! -d $SCRIPT_DIR/../profile ]; then
  $SCRIPT_DIR/create-dev-profile.sh $SCRIPT_DIR/../profile
fi

$FIREFOX_BIN -profile $SCRIPT_DIR/../profile --no-remote $@
