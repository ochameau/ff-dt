#!/bin/bash

set -e


SCRIPT_DIR=$(dirname $0)

#ORIG=$PWD
ls $SCRIPT_DIR
cd $SCRIPT_DIR/artifacts
return
cd $SCRIPT_DIR/artifacts/config/
return
virtualenv venv
source venv/bin/activate
pip install -r mozbase_requirements.txt
# not document on mdn but required to execute runtests.py
pip install marionette_harness
cd $ORIG
