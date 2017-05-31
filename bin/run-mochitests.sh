#!/bin/bash

set -e

# Track each command when running on CI
if [ $CI ]; then
  set -x
fi

SCRIPT_DIR=$(dirname $0)

. $SCRIPT_DIR/platform.sh

# Folder where firefox binary is
FIREFOX_DIR=$(dirname $FIREFOX_BIN)

# Download firefox if not already done
if [ ! -f $FIREFOX_BIN ]; then
  $SCRIPT_DIR/fetch-firefox.sh
fi

# Folder where mochitest python app lives
MOCHITEST_DIR=$ARTIFACTS_DIR/mochitest

# Download artifacts files which are all the files necessary to run the test harnesses
if [ ! -d $MOCHITEST_DIR ]; then
  $SCRIPT_DIR/checkout-artifacts.sh
fi

# Create the browser folder.
# runtests.py expects it should contain a browser-chrome.ini manifest
# itself referencing other test manifests with relative paths.
# Use symlink to make that happen
rm -rf $MOCHITEST_DIR/browser
mkdir -p $MOCHITEST_DIR/browser
ln -s $(realpath $SCRIPT_DIR/../client) $MOCHITEST_DIR/browser/
ln -s $(realpath $SCRIPT_DIR/../shared) $MOCHITEST_DIR/browser/
ln -s $(realpath $SCRIPT_DIR/../server) $MOCHITEST_DIR/browser/

# Update the big manifest referencing all in-tree mochitest.ini or browser.ini files
$SCRIPT_DIR/compute-ini.sh browser.ini $SCRIPT_DIR/../ > $MOCHITEST_DIR/browser/browser-chrome.ini

# On Windows we have to set BIN_SUFFIX to please runtests.py
BIN_SUFFIX=
if [[ $OS == "win32" ]]; then
  BIN_SUFFIX=".exe"
fi

DEBUG_BOOL=false
if [[ "$DEBUG" -eq 1 ]]; then
  DEBUG_BOOL=true
fi

# Create a mozinfo file out of the bin/mozinfo template which contains template strings with capital cases.
MOZINFO=$(mktemp)
sed -e s/SUFFIX/$BIN_SUFFIX/ \
    -e s/DEBUG/$DEBUG_BOOL/ \
    -e s/BITS/64/ \
    -e s/PLATFORM/$OS/ \
    -e s/OS/$OS/ \
    -e s/TOOLKIT/gtk3/ \
    -e s/MODE/$MODE/ \
    $SCRIPT_DIR/mozinfo > $MOZINFO

# Hook the extension into the test environment
mkdir -p $FIREFOX_DIR/browser/extensions/
echo $(realpath $SCRIPT_DIR/..) > $FIREFOX_DIR/browser/extensions/devtools\@mozilla.org

# Mac has a specific "xre" path, which is not where firefox binary is (Contents/Resources/ instead of Contents/MacOS)
XRE_PATH=$FIREFOX_DIR/
if [[ $OS == "macosx64" ]]; then
  XRE_PATH=$(dirname $FIREFOX_DIR)/Resources/
fi

# Run python script to run tests
python $MOCHITEST_DIR/runtests.py \
  --appname $FIREFOX_BIN \
  --xre-path $XRE_PATH \
  -f browser \
  --utility-path $ARTIFACTS_DIR/bin/$PLATFORM/ \
  --certificate-path $ARTIFACTS_DIR/certs/ \
  --testing-modules-dir $ARTIFACTS_DIR/modules/ \
  --extra-mozinfo-json $MOZINFO \
  --subsuite devtools \
  $@
