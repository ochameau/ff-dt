#!/bin/bash

FF_PROFILE=$1

if [ -z $FF_PROFILE ]; then
  echo "$1 should be a path to your test profile folder"
  exit
fi

mkdir -p $FF_PROFILE/extensions

echo "user_pref(\"xpinstall.signatures.required\", false);" >> $FF_PROFILE/user.js
# Allows the add-on to work from the profile folder
echo "user_pref(\"extensions.autoDisableScopes\", 0);" >> $FF_PROFILE/user.js
# TODO: remove when devtools includes <em:multiprocessCompatible>true</em:multiprocessCompatible> in its install.rdf
echo "user_pref(\"extensions.allow-non-mpc-extensions\", true);" >> $FF_PROFILE/user.js
# Enable stdout output on dump calls
echo "user_pref('browser.dom.window.dump.enabled', true);" >> $FF_PROFILE/user.js
echo "user_pref('browser.shell.checkDefaultBrowser', false);" >> $FF_PROFILE/user.js
# Prevent having the "safe run popup when killing firefox via CTRL+C"
echo "user_pref('toolkit.startup.max_resumed_crashes', -1);" >> $FF_PROFILE/user.js
# enable browser toolbox
echo "user_pref('devtools.debugger.remote-enabled', true);" >> $FF_PROFILE/user.js
echo "user_pref('devtools.chrome.enabled', true);" >> $FF_PROFILE/user.js
# Disable prompt for the browser toolbox
echo "user_pref('devtools.debugger.prompt-connection', false);" >> $FF_PROFILE/user.js

# On cygwin, we have to ensure storing real windows path like c:\\...
# and not a unix one like /c/...
if [ -x "$(command -v cygpath)" ]; then
  echo $(cygpath -w $PWD) > $FF_PROFILE/extensions/devtools\@mozilla.org
else
  echo $PWD > $FF_PROFILE/extensions/devtools\@mozilla.org
fi
