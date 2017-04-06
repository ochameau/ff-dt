
if [ ! -x ./bin/checkout-artifacts.sh ]; then
  echo "source config.sh should be executed from devtools root folder"
  exit
fi

./bin/checkout-artifacts.sh

# note that we can't on platform.js to get the ARTIFACTS_DIR
# as importing it from here mess up with its SCRIPT_DIR
pushd ./bin/artifacts/tests/config/ > /dev/null

if [ ! -d venv ]; then
#-z $VIRTUAL_ENV ]; then
  virtualenv venv
fi
# On Git bash for windows, activate script is in Scripts folder
if [ -f venv/Scripts/activate ]; then
  source venv/Scripts/activate
else
  source venv/bin/activate
fi

pip install -r mozbase_requirements.txt
# not document on mdn but required to execute runtests.py
# '| cat' to disable progressbar...
pip install marionette_harness | cat

popd > /dev/null
