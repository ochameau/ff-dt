#!/bin/bash

set -e

rm -rf l10n-branch/
mkdir -p l10n-branch/
pushd l10n-branch/

# Pull locales list from m-c
LOCALES=$(wget -qO- https://hg.mozilla.org/mozilla-central/raw-file/tip/browser/locales/all-locales)

for LOCALE in $LOCALES
do
  mkdir $LOCALE
  pushd $LOCALE

# Clone m-c l10n repo for each locale
# Use zip archive to speed up versus hg clone
  wget -q https://hg.mozilla.org/l10n-central/$LOCALE/archive/tip.zip
  unzip -q tip.zip
  rm tip.zip
# hg archive put everything in a subfolder containing the head sha
  mv $LOCALE-*/* .

# Strip all but devtools
  find . -maxdepth 1 -type d ! -name devtools ! -name . -exec rm -rf {} \;

# Make client and shared folder top level folders
  mv devtools/* .
  rmdir devtools/

  popd
done

cp -r ../devtools/locales/en-US .

git init
git add .
git commit -m "Import strings from mozilla-central l10n repos"

# -q is important to not leak GITHUB_TOKEN
git push "https://$GITHUB_TOKEN@github.com/ochameau/ff-dt.git" HEAD:l10n -qf
popd
