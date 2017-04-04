#!/bin/bash

if [ -z $1 ]; then
  echo "$0 first argument should be manifest name we are looking for"
  echo "like browser.ini, chrome.ini or xpcshell.ini"
  exit
fi

if [ ! -d $2/client ]; then
  echo "$0 second argument should be path to devtools repo"
  exit
fi

pushd $2 > /dev/null
for manifest in $(find {client,shared,server} -type f -name $1); do
  echo "[include:$manifest]"
done
popd > /dev/null
