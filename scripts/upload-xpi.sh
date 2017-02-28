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

export SSHPASS=$SSH_P
sshpass -e ssh -o PubkeyAuthentication=no -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null $SSH_U@$SSH_H "mkdir -p /var/www/github/pr/$SHA/"
sshpass -e scp -o PubkeyAuthentication=no -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null devtools.xpi $SSH_U@$SSH_H:/var/www/github/pr/$SHA/

URL=https://api.github.com/repos/ochameau/ff-dt/statuses/$SHA?access_token=$GITHUB_TOKEN
JSON="{\"state\": \"success\", \"description\": \"Add-on built out of these changes\", \"context\": \"ci/addon\", \"target_url\": \"http://techno-barje.fr/github/pr/$SHA/devtools.xpi\"}"

curl $URL -H "Content-Type: application/json" -X POST -d "$JSON"
