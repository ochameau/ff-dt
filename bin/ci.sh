#!/bin/bash

set -e
set -x

if [[ -z $ARTIFACTS ]]; then
  echo "$0 must be run with ARTIFACTS env variable set to the artifacts folder path"
  exit
fi

mkdir -p $ARTIFACTS

# Setup python environement for tests
source config.sh

# Run mochitests
export MOZ_UPLOAD_DIR=$ARTIFACTS
./test --quiet --screenshot-on-fail 2>&1 | tee $ARTIFACTS/mochitests-debug.log

# Post mochitest summary to the pull request
# For now, it only works on Linux as taskclusterProxy doesn't work on Window.
if [[ ! -z "$GITHUB_PULL_REQUEST" || "$(uname -a)" =~ "Linux" ]]; then
  MODE=optimized
  if [[ "$DEBUG" -eq 1 ]]; then
    MODE=debug
  fi

  echo "## Mochitest results for Linux - $MODE" > results
  # First look for lines of interest in mochitest output
  # Get the number of test that passed and failed at the very of the logs,
  # only the summary passed/failed is prefixed with a tab.
  grep -P "\t(Passed|Failed)" $ARTIFACTS/mochitests-debug.log >> results

  # Then get the name of each failing test
  # Here is a typical line:
  #   14063 INFO TEST-UNEXPECTED-FAIL | client/inspector/test/browser_inspector_textbox-menu.js | The menu is now visible - Got closed, expected open
  # first sed to strip up to the first pipe, so that we immediately show test file path
  # second sed to prefix with a star to present each test as a markdown list item
  # last sed to replace the second pipe to a new line
  grep "TEST-UNEXPECTED-FAIL" $ARTIFACTS/mochitests-debug.log | \
    sed -E "s/[^|]+\| //" | \
    sed "s/^/ * /" | \
    sed "s/|/\n/" >> results

  ROUTE=project.devtools.revisions.$GITHUB_HEAD_REPO_SHA.$TASK_NAME
  ADDON_URL=https://index.taskcluster.net/v1/task/$ROUTE/artifacts/public/mochitests-debug.log

  echo "Full logs available [here]($ADDON_URL)." >> results

  # Next, we have to convert `results` into a JSON string
  # i.e. typically escape quotes, but also any other character that has to be escaped
  COMMENT=$(cat results | python -c 'import json,sys; print(json.dumps(sys.stdin.read()))')

  # Finally ping github to post a comment on the pull request
  URL=http://taskcluster/github/v1/repository/ochameau/ff-dt/issues/$GITHUB_PULL_REQUEST/comments &&
  JSON="{\"body\":$COMMENT}" &&
  curl $URL -H "Content-Type: application/json" -X POST -d "$JSON"
fi

# Run xpcshell tests
./bin/run-xpcshell.sh 2>&1 | tee $ARTIFACTS/xpcshell-debug.log
