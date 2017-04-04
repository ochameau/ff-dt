#!/bin/bash

set -e

SCRIPT_DIR=$(dirname $0)

# Update the big manifest referencing all in-tree xpcshell.ini files
mkdir -p $SCRIPT_DIR/xpcshell
$SCRIPT_DIR/compute-ini.sh xpcshell.ini $SCRIPT_DIR/../ > $SCRIPT_DIR/xpcshell/xpcshell.ini

# Create symlink to client/shared/server to make it so that xpcshell.ini
# seems to be in root folder
rm -f $SCRIPT_DIR/xpcshell/{client,shared,server}
ln -s ../../{client,shared,server} $SCRIPT_DIR/xpcshell/

# Download firefox if not already done
if [ ! -f $SCRIPT_DIR/artifacts/firefox/firefox-bin ]; then
  $SCRIPT_DIR/update-firefox.sh
fi

# Hack to ensure httpd.manifest is accessible to xpcshell test runner
# which expects it in the xre-path.
rm -f $SCRIPT_DIR/artifacts/firefox/components
ln -s ../bin/components $SCRIPT_DIR/artifacts/firefox/components

# Run python script to run tests
python $SCRIPT_DIR/xpcshell/runxpcshelltests.py --xre-path $SCRIPT_DIR/artifacts/firefox/ --utility-path $SCRIPT_DIR/artifacts/bin/ --testing-modules-dir $SCRIPT_DIR/artifacts/modules/ --xpcshell $SCRIPT_DIR/artifacts/bin/xpcshell --manifest $SCRIPT_DIR/xpcshell/xpcshell.ini $@
