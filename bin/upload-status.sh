#!/bin/bash

set +x
set -e

if [ "$TRAVIS_PULL_REQUEST" != "true" ]; then
  echo "Can only push status for pull requests"
  exit 0
fi

if [ -z $SSH_H ]; then
  echo "Missing SSH_H env variables for upload"
  exit 0
fi
if [ -z $SSH_P ]; then
  echo "Missing SSH_P env variables for upload"
  exit 0
fi
if [ -z $SSH_U ]; then
  echo "Missing SSH_U env variables for upload"
  exit 0
fi
if [ -z $GITHUB_TOKEN ]; then
  echo "Missing GITHUB_TOKEN env variables for upload"
  exit 0
fi

if [ -z $1 ]; then
  echo "$0 first argument should be HEAD's SHA"
  exit 0
fi
SHA=$1

if [ -z $2 ]; then
  echo "$0 second argument should be a path to test log file"
  exit 0
fi
if [ ! -f $2 ]; then
  echo "$0 second argument should be a path to test log file"
  exit 0
fi

SUMMARY=$(cat $2 | grep -P '(^\t(Passed|Failed)|TEST-UNEXPECTED-|TEST-OK)' | python -c 'import json,sys; print(json.dumps(sys.stdin.read()))')
URL=https://api.github.com/repos/ochameau/ff-dt/issues/$TRAVIS_PULL_REQUEST/comments?access_token=$GITHUB_TOKEN 
JSON="{ \"body\": $SUMMARY }"

curl $URL -H "Content-Type: application/json" -X POST -d "$JSON"
