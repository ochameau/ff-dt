#!/bin/bash

set -e

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
