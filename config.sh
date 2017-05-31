
if [ ! -x ./bin/checkout-artifacts.sh ]; then
  echo "source config.sh should be executed from devtools root folder"
  exit
fi

./bin/checkout-artifacts.sh

# note that we can't rely on platform.sh to get the ARTIFACTS_DIR
# as importing it from here mess up with its SCRIPT_DIR
pushd ./bin/artifacts/tests/config/ > /dev/null

# The following instructions are partially documented here:
# https://developer.mozilla.org/en-US/docs/Mozilla/Projects/Mochitest#Running_tests_without_mach

if [ ! -d venv ]; then
  virtualenv venv
fi
# On Git bash for windows, activate script is in Scripts folder
if [ -f venv/Scripts/activate ]; then
  source venv/Scripts/activate
else
  source venv/bin/activate
fi

pip install -r mozbase_requirements.txt

# Not documented on mdn but required to execute runtests.py
# Added `| cat` to disable progressbar on CI
pip install marionette_harness | cat

popd > /dev/null
