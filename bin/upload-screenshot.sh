#!/bin/bash

set +x
set -e

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
  echo "$0 second argument should be a path to screenshot folder"
  exit 0
fi
if [ ! -d $2 ]; then
  echo "$0 second argument should be a path to screenshot folder"
  exit 0
fi

# Only upload if there is some screenshots
if ls $2/*.png 1>/dev/null 2>&1; then

# We may run against a pull request or a push
# and retrieving the sha is different...
if [ ! -z $TRAVIS_PULL_REQUEST ]; then
  SHA=$TRAVIS_PULL_REQUEST_SHA
else
  SHA=$TRAVIS_COMMIT
fi

export SSHPASS=$SSH_P
chmod 755 $2/*.png
sshpass -e ssh -o PubkeyAuthentication=no -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null $SSH_U@$SSH_H "mkdir -p /var/www/github/pr/$SHA/"
sshpass -e scp -o PubkeyAuthentication=no -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null $2/*.png $SSH_U@$SSH_H:/var/www/github/pr/$SHA/

URL=https://api.github.com/repos/ochameau/ff-dt/statuses/$SHA?access_token=$GITHUB_TOKEN 
JSON="{\"state\": \"success\", \"description\": \"Screenshot on test failure\", \"context\": \"ci/failure-screenshot\", \"target_url\": \"http://techno-barje.fr/github/pr/$SHA/\"}"

curl $URL -H "Content-Type: application/json" -X POST -d "$JSON"

fi
