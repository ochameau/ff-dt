#!/bin/bash

# This script allows to build a localized version of the add-on.
# It checkouts the dedicated l10n repo where all strings are translated by localizers
# and updates locales.manifest which is going to reference every single locale

set -e

echo "Cloning all locales to locales/others/ and regenerates locales.manifest"

# Update to the latest version
if [ ! -d locales/others ]; then
  git clone --single-branch --branch master https://github.com/ochameau/ff-dt-l10n.git locales/others
else
  pushd locales/others
  git fetch origin l10n
  git checkout origin/l10n
  popd
fi

echo "" > locales.manifest

LOCALES=$(ls -1 locales/others/)
for LOCALE in $LOCALES
do
  if [ "$LOCALE" == "en-US" ]; then
    continue
  fi
# For each locale, register the 'client' and 'shared' chrome URIs
  echo "" >> locales.manifest
  echo "locale devtools $LOCALE locales/others/$LOCALE/client/" >> locales.manifest
  echo "locale devtools-shared $LOCALE locales/others/$LOCALE/shared/" >> locales.manifest
done
