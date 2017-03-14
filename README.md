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
./run
* At any time, press `Ctrl+Alt+R` to reload the tools
```
This will create a development profile for you, with the devtools add-on pre-installed,
and some preferences to ease debugging the tools. It also downloads a firefox package,
and run it against the custom profile.

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
$ ./bin/build-xpi.sh
* Launch Firefox Nightly/Dev-edition/Aurora/Beta (i.e. all but release)
* Ensure setting `xpinstall.signatures.required` to false in `about:config`
* Drag'n drop `devtools.xpi` file in Firefox -or- execute path/to/firefox-bin ./devtools.xpi
```
