#!/bin/bash

set -e

###

echo "Import eslint rules"

cat .eslintignore  | grep -E "^\!?devtools" | sed -e "s@^\(\!\?\)devtools/@\1@" > devtools/.eslintignore
# Ignore new bin and profile folders
echo "bin/**" >> devtools/.eslintignore
echo "profile/**" >> devtools/.eslintignore

git add devtools/.eslintignore

git commit -a -m "[AUTO] Copy devtools eslint ignore list to devtools folder"

### Remove shim and platform folders that are only meaningful in Firefox/m-c

git rm -r devtools/shim/ devtools/platform/
git commit -a -m "[AUTO] Strip shim and platform folders from devtools repo"

###

echo "Pruning git repo from all but devtools, this takes a while (about 10 minutes)!"
echo "The following git comment is going to be computing for a while without any output,"
echo "keep waiting, it will eventually finish!"
time git filter-branch --subdirectory-filter devtools -- HEAD

# Move en-US locale to the new location matching pontoon needs
mkdir -p locales/en-US
git mv client/locales/en-US locales/en-US/client
git mv shared/locales/en-US locales/en-US/shared

###

# Cleanup old folders
git rm -rf client/locales/ shared/locales/

# Strip any 'locale' entry in the manifest
sed -i '/^locale/d' chrome.manifest

# That to readd the default en-US locale to the new location
echo "" >> chrome.manifest
echo "locale devtools en-US locales/en-US/client/" >> chrome.manifest
echo "locale devtools-shared en-US locales/en-US/shared/" >> chrome.manifest

# Also register an empty locales.manifest file that is going to be used to multilocales builds
echo "manifest locales.manifest" >> chrome.manifest
git add chrome.manifest

echo "" >> locales.manifest
git add locales.manifest

git commit -a -m "[AUTO] Setup new l10n folder layout by merging client and shared l10n folders into /locales/en-US/"

###

echo "Rewriting test URLs"
find {client,shared,server} -type f -print0 | xargs -0 sed -i 's/browser\/devtools/browser/g'
find {client,shared,server} -type f -print0 | xargs -0 sed -i 's/\!\/devtools/\!/g'
git commit -a -m "[AUTO] Rewrite some test URLs to remove /devtools/"

###

echo "Remove useless files"
find . -name jar.mn -type f -delete
find . -name moz.build -type f -delete
find . -name *.cpp -type f -delete
find . -name *.h -type f -delete
find . -name *.py -type f -delete
find . -name *.in -type f -delete
rm templates.mozbuild
git commit -a -m "[AUTO] Remove useless file from firefox build system"

###

echo "Remove references to /browser/ tests"
find . -name "*.ini" -type f -exec sed -i '/\.\.\/browser\//d' {} \;
git commit -a -m "[AUTO] Remove references to /browser/ tests"

###

echo "Import existing changesets"
# (origin remote is gecko-dev)
git fetch https://github.com/ochameau/ff-dt.git reference:reference -q
# cherry-pick all changesets including "[GITHUB]" in the commit message from "reference" branch
# (use allow-empty to prevent failing if some patches landed in m-c)
git cherry-pick --allow-empty $(git log reference --grep="\[GITHUB\]" --format=format:%H --reverse)

###

echo "Update the mochitest artifacts"
echo "This may take a while again as it download firefox and some other test packages"
time ./bin/update-artifacts.sh
git add bin/deps
git commit -m "[AUTO] Update mochitest/xpcshell artifacts SHA against latest firefox + update firefox task id, that for all platforms"

###

echo "Pushing"
# -q is important to not leak GITHUB_TOKEN
git push "https://$GITHUB_TOKEN@github.com/ochameau/ff-dt.git" HEAD:master -qf
