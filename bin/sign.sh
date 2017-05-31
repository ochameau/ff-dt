#!/bin/bash

set -e

# This script uses AMO (addons.mozilla.org) API
# to upload devtools add-on and get it signed.

XPI=$1
if [[ -z $XPI || ! -f $XPI ]]; then
  echo "$0 expects path to xpi as first argument"
  exit
fi
if [[ ! -x $(command -v jq) ]]; then
  echo "$0 requires 'jq' to be installed"
  exit
fi
if [[ ! -x $(command -v openssl) ]]; then
  echo "$0 requires 'openssl' to be installed"
  exit
fi
if [ -z $AMO_USER ]; then
  echo "$0 expects AMO_USER env variable to be set"
  exit
fi
if [ -z $AMO_SECRET ]; then
  echo "$0 expects AMO_SECRET env variable to be set"
  exit
fi
SCRIPT_DIR=$(dirname $0)

VERSION=$(unzip -c $XPI install.rdf | grep em:version | grep -oE "[0-9.ab-]+")

echo "Addon version: $VERSION"

echo "Uploading xpi to sign"
JWT=$($SCRIPT_DIR/jwt.sh)
UPLOAD=$(curl "https://addons.mozilla.org/api/v3/addons/devtools@mozilla.org/versions/$VERSION/" \
  -g -XPUT --form "upload=@$XPI" \
  -H "Authorization: JWT $JWT")
echo $UPLOAD
UPLOAD_URL=$(echo -n $UPLOAD | jq .url -r)
echo $UPLOAD_URL

# wait a bit for the addon to be available after upload
sleep 10

# Number of attempts to look for the addon url
MAX_STEPS=20
i=0
while true; do
  if [ $i -gt $MAX_STEPS ]; then
      echo "No files found, exiting"
      exit 1
  fi
  i=$(expr $i + 1)
  echo "Fetch signed xpi URL"
  JWT=$($SCRIPT_DIR/jwt.sh)
  UPLOAD_STATUS=$(curl $UPLOAD_URL -g -H "Authorization: JWT $JWT")
  echo $UPLOAD_STATUS
  FILE=$(echo -n $UPLOAD_STATUS | jq .files[0].download_url -r)
  echo $FILE
  # The addon may still not be ready, so check if we got the url
  if [ "$FILE" != "null" ]; then
    break
  fi
  sleep 5
done

echo "Downloading signed xpi"
JWT=$($SCRIPT_DIR/jwt.sh)
curl -o devtools-signed.xpi $FILE -g -H "Authorization: JWT $JWT"
