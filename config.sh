pushd mochitest/artifacts/config/

if [ -z $VIRTUAL_ENV ]; then
  virtualenv venv
fi
source venv/bin/activate
pip install -r mozbase_requirements.txt
# not document on mdn but required to execute runtests.py
pip install marionette_harness

popd
