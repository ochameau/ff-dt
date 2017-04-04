# How to run tests
```
$ . config.sh      # Setup python for test runner
$ ./run-mochitests.sh                                                  # to run all tests
$ ./run-mochitests.sh client/framework/test/browser_toolbox_raise.js   # to run a diretory or a single test

$ ./run-xpcshell.sh                                           # to run all tests
$ ./run-xpcshell.sh server/tests/unit/test_frameactor-01.js   # to run a diretory or a single test
```

# Tests Story

## Testing combinations - Firefox Binary

DevTools Add-on is compatible with all current Firefox channels*:
* Release
* Beta
* Nightly
(* Starting with Firefox 56)

So that, DevTools tests should be run on against all these channels.
In order to do that, we store the last good version of Firefox for each release in `deps` folder.
Also, Firefox officialy supports 3 platforms on Desktop, so there is one file per platform.
But that is not the only combination. We should run the tests against Debug builds of Firefox
as well as optimized. This folder `deps` looks like this:
  /bin/deps/firefox/$(firefox-channel)/$(platform)-$(debug-or-opt)
The resulting file contains a TaskID.

This TaskID comes from Taskcluster, the Continuous Integration tool used by Firefox.
It allows to designate a very precise build of Firefox.

We then use this TaskID to download the Firefox binary used by `run` and `test` scripts.

## How to run xpcshell and mochitests without mozilla-central?

These two test harnesses are python modules, coming from mozilla-central:
  http://searchfox.org/mozilla-central/source/testing/mochitest
  http://searchfox.org/mozilla-central/source/testing/xpcshell
But the issue is that it contains JS code interacting with Firefox/m-c codebase.
So that it must be kept in sync with whatever firefox version you are running.

We pull all the necessary files via mozilla-central CI, from three packages:
* target.common.tests.zip (contains platform specifics [i.e. the binaries]) [9MB]
  From which we retrieve:
   * test helper binaries (like xpcshell and ssltunnel),
    (ends up in `bin/artifacts/tests/bin/$(platform)-$(debug-or-opt)/`)
   * python dependencies (mozbase),
    (ends up in `bin/artifacts/tests/bin/mozbase/`)
   * virtual env helpers (used by `source config.sh`),
    (ends up in `bin/artifacts/tests/bin/config/`)
   * some chrome javascripts helpers (test JSM modules, like ContentTask.jsm)
    (ends up in `bin/artifacts/tests/bin/modules/`)
   * test certificates, necessary to run the harnesses
    (ends up in `bin/artifacts/tests/bin/certs/`)
* target.xpcshell.tests.zip [10MB]
  From which we retrieve xpcshell python application sources
  (ends up in `bin/artifacts/tests/xpcshell/`)
* target.mochitests.tests.zip [65MB]
  From which we retrieve mochitests python application sources
  (ends up in `bin/artifacts/tests/mochitest/`)

`bin/fetch-artifacts.sh` does that work of downloading all these zip files
and picking the necessary files.

`bin/updates-artifacts.sh` script is then pushing the necessary artifacts
to a branch on DevTools repo `artifacts-$(firefox-channel)`.
The precise revision to checkout for each branch is specified in a text file
`deps/firefox/$(firefox-channel)/artifacts`.
Test scripts automatically fetch and checkout this branch for you to
`bin/artifacts/tests` folder.
Firefox package, which is synchronized with the test artifacts, is also
specified by `deps/firefox/$(firefox-channel)/$(platform)-$(debug-or-opt)`
and downloaded and uncompressed to `bin/artifacts/firefox` folder.

# How to update xpcshell, mochitest and firefox?

So, all of that (test artifacts and firefox) have to be updated at once as they all depends on each others.
There is a script that will do that for you.
It will :
* download artifacts from mozilla-central CI (described in the previous paragraph),
* pick what is needed,
* push it to special branches on the DevTools repo (`artifacts-$(firefox-channel)`),
* update `deps/firefox/$(firefox-channel)/artifacts` with the SHA of the just-pushed commit,
  This is later used to checkout the right version of the artifacts,
* also update all `deps/firefox/$(firefox-channel)/$(platform)-$(debug-or-opt) files,
  to later checkout the right Firefox package.

As it automatically pushes to github, you have to pass a GITHUB_TOKEN as environment variable.
```
$ GITHUB_TOKEN=xxxx ./update_artifact.sh
$ git add bin/deps
$ git commit -m "[AUTO] Update mochitest/xpcshell artifacts SHA against latest firefox + update firefox task id, that for all platforms"
```

# This folder content

* Folders:

 * artifacts/
   * artifacts/tests
   Contains all artifacts that are necessary to run xpcshell and mochitests:
   python dependencies (mozbase), chrome modules, certificates and some binaries used
   by test harnesses. Last but not least, it contains XPCShell and Mochitest test harnesses.
   * artifacts/firefox
   Contains uncompressed Firefox package used for `./run` and `./test` scripts

 * deps/
   Kind of git sub-modules definitons. Reference the "TaskID" of the last known to be green
   revision of Firefox, for each release channel (release, beta, nightly) and one for
   Optimized builds as well as Debug one.
   It also contains SHA to one of the `artifacts-$(firefox-channel)` branches, to download
   the test harness artifacts that are matching the specified Firefox builds.

* Files:

 * build-xpi.sh
   Script to build DevTools add-on

 * ci.sh
   Script used to run all the tests on each pull request

 * compute-ini.sh
   Script used while running xpcshell and mochitests, to find all xpcshell.ini or mochitest.ini
   files and report them to xpcshell/mochitest test harness

 * config.sh
   Script to setup virtual-env before running xpcshell or mochitests

 * create-dev-profile.sh
   Creates an empty profile folder with handy set of development preferences and with
   the DevTools add-on pre-registered

 * fetch-firefox.sh
   Used by update-artifacts.sh (isn't meant to be used independently).
   Download the artifacts file from mozilla-central CI and pick the files and folders
   that DevTools test harness need.

 * fetch-firefox.sh
   Download the last known to be valid version of Firefox for the targetted channel.
   (Read the build id/Task ID from deps/firefox/$(release-channel)/$(platform)-$(debug-or-optimized))

 * fetch-locales.sh
   Clone the `l10n` branch to `locales/others` folder in order to have a localized add-on

 * mozinfo
   Template of config file used by xpcshell and mochitest test harness to filter test by
   environment via xpcshell.ini and mochitest.ini files `skip-if=` rules

 * platform.sh
   Helper script executed first by almost all .sh files to ease common operation like:
   detecting the current operating system, check which firefox channel is targeted, ...

 * run-mochitests.sh
   Script to run mochitest tests

 * run-xpcshell.sh
   Script to run xpcshell tests

 * unpack-diskimage
   Helper script to extract files from a .dmg file on Mac

 * update-artifacts.sh
   Update the files from `deps` folders for a given firefox channel (Accept BRANCH environment variable
   with `mozilla-central`, 'mozilla-beta` and `mozilla-release` as value), while pushing
   new set of test artifacts to `artifacts-$(firefox-channel)` branch.

 * upload-screenshot.sh (not used yet by CI)
   CI script used to attach a screenshot to a github commit status

 * upload-status.sh (not used yet by CI)
   CI script used to attach a link to the DevTools add-on to a github commit status

 * zipignore
   Config file used by `build-xpi.sh` to package only the necessary files in the DevTools Add-on package
