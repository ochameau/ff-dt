#!/bin/bash

FF_PROFILE=$1

if [ -z $FF_PROFILE ]; then
  echo "$1 should be a path to your test profile folder"
  exit
fi

mkdir -p $FF_PROFILE/extensions
echo "user_pref(\"xpinstall.signatures.required\", false);" >> $FF_PROFILE/user.js
echo "user_pref(\"extensions.autoDisableScopes\", 0);" >> $FF_PROFILE/user.js

# On cygwin, we have to ensure storing real windows path like c:\\...
# and not a unix one like /c/...
if [ -x "$(command -v cygpath)" ]; then
  echo $(cygpath -w $PWD) > $FF_PROFILE/extensions/devtools\@mozilla.org
else
  echo $PWD > $FF_PROFILE/extensions/devtools\@mozilla.org
fi
