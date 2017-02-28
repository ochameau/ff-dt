#!/bin/bash

set -e

SCRIPT_DIR=$(dirname $0)

# Create the browser folder runtests.py expects
# it should contain browser-chrome.ini manifest
# itself referencing other test manifest with relative paths
# Use symlink to make that happen
rm -rf $SCRIPT_DIR/mochitest/browser
mkdir -p $SCRIPT_DIR/mochitest/browser
ln -s ../../../{client,shared,server} $SCRIPT_DIR/mochitest/browser/

# Update the big manifest referencing all in-tree mochitest.ini or browser.ini files
$SCRIPT_DIR/compute-ini.sh browser.ini $SCRIPT_DIR/../ > $SCRIPT_DIR/mochitest/browser/browser-chrome.ini

# Download firefox if not already done
if [ ! -f $SCRIPT_DIR/artifacts/firefox/firefox-bin ]; then
  $SCRIPT_DIR/update_firefox.sh
fi

# Run python script to run tests
python $SCRIPT_DIR/mochitest/runtests.py --appname $SCRIPT_DIR/artifacts/firefox/firefox-bin --xre-path $SCRIPT_DIR/artifacts/firefox/ -f browser --utility-path $SCRIPT_DIR/artifacts/bin/ --certificate-path $SCRIPT_DIR/artifacts/certs/ --testing-modules-dir $SCRIPT_DIR/artifacts/modules/ --subsuite devtools $@
