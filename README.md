Special branch, dedicated for scripts doing to fork from mozilla-central (mercurial/hg.mozilla.org) to devtools repo (git/github):

* clone github.com/mozilla/gecko-dev
* strips all but devtools, while keeping all /devtools changelog
* setup new folder layout for locales to match pontoon needs
* create the l10n branch for pontoon, containing all but en-US locale
* rewrite test urls for mochitest, as there is no longer /devtools/ folder
* remove useless files from firefox build system like moz.build or jar.mn
* Import all changeset tagged with "[GITHUB]" string in the changesets from "reference" branch
* update mochitest artifacts that are landed in the repo to ease running them
