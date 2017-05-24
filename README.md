Developer Tools
===============

Get the sources
===============
```
git clone git@github.com:ochameau/ff-dt.git --single-branch
cd ff-dt/
```
Please use `--single-branch` to only download `master` branch.
These repo contains many branches that are not necessary to build DevTools.

Run tools with a development profile
====================================
From `ff-dt` folder:
```
./run
* At any time, press `Ctrl+Alt+R` to reload the tools
```
This will create a development profile for you, with the devtools add-on pre-installed,
and some preferences to ease debugging the tools. It also downloads a firefox package,
and run it against the custom profile.

If you want to run against a custom Firefox, hand over an absolute path to it
via `FIREFOX_BIN` environement variable.

Run tools via about:debugging
=============================
* Launch Firefox 
* Open about:debugging in a new tab
* Click on "Load temporary Add-on"
* Select `ff-dt` folder and then `install.rdf` file
* Press `Ctrl+Alt+R` to load the tools
* You can then press this same key shortcut at any time to reload the tools from sources

Build and test the add-on
=========================
```
$ ./bin/build-xpi.sh
* Launch Firefox Nightly/Dev-Edition/Aurora/Beta (i.e. all but release)
* Ensure setting `xpinstall.signatures.required` to false in `about:config`
* Drag'n drop `devtools.xpi` file in Firefox -or- execute path/to/firefox-bin ./devtools.xpi
```

Run tests
=========
In order to run test you need some python deps to be installed:
 * virtualenv (sudo pip install virtualenv)
   * pip (sudo easy_install pip)
 * npm (only for lint checks)

From `ff-dt` folder:
```
# Setup python environement for mochitest test runner
$ source config.sh

# Run all tests
$ ./test

# Run one folder
$ ./test client/inspector/

# Run one test
$ ./test client/inspector/test/browser_inspector_highlighter-01.js

# Run xpcshell test
$ ./bin/run-xpcshell.sh server/tests/unit/test_add_actors.js

# Run lint checks, for everything
$ ./lint

# Run lint checks, for a given file or folder
$ ./lint client/inspector/
$ ./lint client/inspector/inspector.js
```


A lot more information is available about the tooling, CI, scripts, tooling, repos, branches
in `bin/README.md` file.
