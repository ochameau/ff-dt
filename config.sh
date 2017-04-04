pushd bin/artifacts/config/

if [ ! -d venv ]; then
#-z $VIRTUAL_ENV ]; then
  virtualenv venv
fi
source venv/bin/activate
pip install -r mozbase_requirements.txt
# not document on mdn but required to execute runtests.py
# '| cat' to disable progressbar...
pip install marionette_harness | cat

popd
