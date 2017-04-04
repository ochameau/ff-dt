#!/bin/bash

set -e

# Track each command when running on CI
if [ $CI ]; then
  set -x
fi

SCRIPT_DIR=$(dirname $0)

. $SCRIPT_DIR/platform.sh

# Download firefox if not already done
if [ ! -f $FIREFOX_BIN ]; then
  $SCRIPT_DIR/fetch-firefox.sh
fi

# Folder where xpcshell python app lives
XPCSHELL_DIR=$ARTIFACTS_DIR/xpcshell
BIN_DIR=$ARTIFACTS_DIR/bin/$PLATFORM

# Download artifacts files which are all the files necessary to run the test harnesses
if [ ! -d $XPCSHELL_DIR ]; then
  $SCRIPT_DIR/checkout-artifacts.sh
fi

# Update the big manifest referencing all in-tree xpcshell.ini files
# (it has to live in xpcshell root directory)
$SCRIPT_DIR/compute-ini.sh xpcshell.ini $SCRIPT_DIR/../ > $XPCSHELL_DIR/xpcshell.ini

# Create symlink to client/shared/server folder to make it so that xpcshell.ini
# looks like being in root repo folder
rm -f $XPCSHELL_DIR/{client,shared,server}
ln -s $(realpath $SCRIPT_DIR/../client) $XPCSHELL_DIR/
ln -s $(realpath $SCRIPT_DIR/../shared) $XPCSHELL_DIR/
ln -s $(realpath $SCRIPT_DIR/../server) $XPCSHELL_DIR/

# Folder where firefox binary is
FIREFOX_DIR=$(dirname $FIREFOX_BIN)

# Hack to ensure httpd.manifest is accessible to xpcshell test runner
# which expects it in the xre-path (i.e. firefox folder).
# (Otherwise we get "Couldn't get manifest file" error)
rm -f $FIREFOX_DIR/components
ln -s $(realpath $BIN_DIR/components) $FIREFOX_DIR/components

# On Windows we have to set BIN_SUFFIX to please runxpcshelltests.py
if [[ $OS == "win32" ]]; then
  export BIN_SUFFIX=".exe"
fi

DEBUG_BOOL=false
if [[ "$DEBUG" -eq 1 ]]; then
  DEBUG_BOOL=true
fi

# Create a mozinfo file out of the `bin/mozinfo` template which contains template strings with capital cases.
MOZINFO=$(mktemp)
sed -e s/SUFFIX/$BIN_SUFFIX/ -e s/DEBUG/$DEBUG_BOOL/ -e s/BITS/64/ -e s/PLATFORM/$OS/ -e s/OS/$OS/ -e s/TOOLKIT/gtk3/ -e s/MODE/$MODE/ $SCRIPT_DIR/mozinfo > $MOZINFO

# Mac has a specific "xre" path, which is not where firefox binary is (Contents/Resources/ instead of Contents/MacOS)
XRE_PATH=$FIREFOX_DIR/
if [[ $OS == "macosx64" ]]; then
  XRE_PATH=$(dirname $FIREFOX_DIR)/Resources/
fi

# Run python script to run tests
python $XPCSHELL_DIR/runxpcshelltests.py --xre-path $XRE_PATH --utility-path $BIN_DIR/ --testing-modules-dir $ARTIFACTS_DIR/modules/ --xpcshell $BIN_DIR/xpcshell$BIN_PREFIX --build-info-json $MOZINFO --manifest $XPCSHELL_DIR/xpcshell.ini $@
