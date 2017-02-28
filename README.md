Developer Tools
===============

Get the sources
===============
```
git clone git@github.com:ochameau/ff-dt.git
cd ff-dt/
```

Run tools with a development profile
====================================
From `ff-dt` folder:
```
./create-dev-profile.sh ~/profile/
path/to/firefox-bin -profile ~/profile/
* At any time, press `Ctrl+Alt+R` to reload the tools
```
TODO: Introduce an helper script to create the profile with custom prefs?

Run tools via about:debugging
=============================
* Launch Firefox 
* Open about:debugging in a new tab
* Click on "Load temporary Add-on"
* Select `ff-dt` folder and then `install.rdf` file
* Press `Ctrl+Alt+R` to load the tools
* You can then press this same key shortcut at any time to reload the tools from sources

TODO: Finilize permanent addon loading in about:debugging?

Build and test the add-on
=========================
```
$ ./scripts/build-devtools-xpi.sh
* Launch Firefox Nightly/Dev-edition/Aurora/Beta (i.e. all but release)
* Ensure setting `xpinstall.signatures.required` to false in `about:config`
* Drag'n drop `devtools.xpi` file in Firefox -or- execute path/to/firefox-bin ./devtools.xpi
```

Run tests
=========
In order to run test you need some python deps to be installed:
 * virtualenv

From `ff-dt` folder:
```
# Setup python environement for mochitest test runner
$ source config.sh

# Run all tests
$ ./test.sh

# Run one folder
$ ./test.sh client/inspector/

# Run one test
$ ./test.sh client/inspector/test/browser_inspector_highlighter-01.js
```
