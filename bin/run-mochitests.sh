#!/bin/bash

set -e

SCRIPT_DIR=$(dirname $0)

. $SCRIPT_DIR/platform.sh

# Create the browser folder runtests.py expects
# it should contain browser-chrome.ini manifest
# itself referencing other test manifest with relative paths
# Use symlink to make that happen
rm -rf $SCRIPT_DIR/mochitest/browser
mkdir -p $SCRIPT_DIR/mochitest/browser
ln -s ../../../{client,shared,server} $SCRIPT_DIR/mochitest/browser/

# Update the big manifest referencing all in-tree mochitest.ini or browser.ini files
$SCRIPT_DIR/compute-ini.sh browser.ini $SCRIPT_DIR/../ > $SCRIPT_DIR/mochitest/browser/browser-chrome.ini

FIREFOX_BIN=$SCRIPT_DIR/artifacts/firefox/firefox-bin
if [[ $OS == "win32" ]]; then
  FIREFOX_BIN=$SCRIPT_DIR/artifacts/firefox/firefox.exe
fi

# Download firefox if not already done
if [ ! -f $FIREFOX_BIN ]; then
  $SCRIPT_DIR/update-firefox.sh
fi

# Run python script to run tests
python $SCRIPT_DIR/mochitest/runtests.py --appname $FIREFOX_BIN --xre-path $SCRIPT_DIR/artifacts/firefox/ -f browser --utility-path $SCRIPT_DIR/artifacts/bin/ --certificate-path $SCRIPT_DIR/artifacts/certs/ --testing-modules-dir $SCRIPT_DIR/artifacts/modules/ --subsuite devtools $@
