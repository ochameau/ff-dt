/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

/**
 * This module defines the sorted list of menuitems inserted into the
 * "Web Developer" menu.
 * It also defines the key shortcuts that relates to them.
 *
 * Various fields are necessary for historical compatiblity with XUL/addons:
 * - id:
 *   used as <xul:menuitem> id attribute
 * - l10nKey:
 *   prefix used to locale localization strings from menus.properties
 * - oncommand:
 *   function called when the menu item or key shortcut are fired
 * - key:
 *    - id:
 *      prefixed by 'key_' to compute <xul:key> id attribute
 *    - modifiers:
 *      optional modifiers for the key shortcut
 *    - keytext:
 *      boolean, to set to true for key shortcut using regular character
 * - additionalKeys:
 *   Array of additional keys, see `key` definition.
 * - disabled:
 *   If true, the menuitem and key shortcut are going to be hidden and disabled
 *   on startup, until some runtime code eventually enable them.
 * - checkbox:
 *   If true, the menuitem is prefixed by a checkbox and runtime code can
 *   toggle it.
 */

const Services = require("Services");
const isMac = Services.appinfo.OS === "Darwin";

loader.lazyRequireGetter(this, "gDevToolsBrowser", "devtools/client/framework/devtools-browser", true);
loader.lazyRequireGetter(this, "CommandUtils", "devtools/client/shared/developer-toolbar", true);
loader.lazyRequireGetter(this, "TargetFactory", "devtools/client/framework/target", true);

loader.lazyImporter(this, "BrowserToolboxProcess", "resource://devtools/client/framework/ToolboxProcess.jsm");
loader.lazyImporter(this, "ResponsiveUIManager", "resource://devtools/client/responsivedesign/responsivedesign.jsm");
loader.lazyImporter(this, "ScratchpadManager", "resource://devtools/client/scratchpad/scratchpad-manager.jsm");

exports.menuitems = [
  { id: "menu_devToolbox",
    l10nKey: "devToolboxMenuItem",
    oncommand(event) {
      let window = event.target.ownerDocument.defaultView;
      gDevToolsBrowser.toggleToolboxCommand(window.gBrowser);
    },
    key: {
      id: "devToolboxMenuItem",
      modifiers: isMac ? "accel,alt" : "accel,shift",
      // This is the only one with a letter key
      // and needs to be translated differently
      keytext: true,
    },
    additionalKeys: [{
      id: "devToolboxMenuItemF12",
      l10nKey: "devToolsCmd",
    }],
    checkbox: true
  },
  { id: "menu_devtools_separator",
    separator: true },
  { id: "menu_devToolbar",
    l10nKey: "devToolbarMenu",
    disabled: true,
    oncommand(event) {
      let window = event.target.ownerDocument.defaultView;
      // Distinguish events when selecting a menuitem, where we either open
      // or close the toolbar and when hitting the key shortcut where we just
      // focus the toolbar if it doesn't already has it.
      if (event.target.tagName.toLowerCase() == "menuitem") {
        window.DeveloperToolbar.toggle();
      } else {
        window.DeveloperToolbar.focusToggle();
      }
    },
    key: {
      id: "devToolbar",
      modifiers: "shift"
    },
    checkbox: true
  },
  { id: "menu_webide",
    l10nKey: "webide",
    disabled: true,
    oncommand() {
      gDevToolsBrowser.openWebIDE();
    },
    key: {
      id: "webide",
      modifiers: "shift"
    }
  },
  { id: "menu_browserToolbox",
    l10nKey: "browserToolboxMenu",
    disabled: true,
    oncommand() {
      BrowserToolboxProcess.init();
    },
    key: {
      id: "browserToolbox",
      modifiers: "accel,alt,shift",
      keytext: true
    }
  },
  { id: "menu_browserContentToolbox",
    l10nKey: "browserContentToolboxMenu",
    disabled: true,
    oncommand(event) {
      let window = event.target.ownerDocument.defaultView;
      gDevToolsBrowser.openContentProcessToolbox(window.gBrowser);
    }
  },
  { id: "menu_browserConsole",
    l10nKey: "browserConsoleCmd",
    oncommand() {
      let HUDService = require("devtools/client/webconsole/hudservice");
      HUDService.openBrowserConsoleOrFocus();
    },
    key: {
      id: "browserConsole",
      modifiers: "accel,shift",
      keytext: true
    }
  },
  { id: "menu_responsiveUI",
    l10nKey: "responsiveDesignMode",
    oncommand(event) {
      let window = event.target.ownerDocument.defaultView;
      ResponsiveUIManager.toggle(window, window.gBrowser.selectedTab);
    },
    key: {
      id: "responsiveUI",
      modifiers: isMac ? "accel,alt" : "accel,shift",
      keytext: true
    },
    checkbox: true
  },
  { id: "menu_eyedropper",
    l10nKey: "eyedropper",
    oncommand(event) {
      let window = event.target.ownerDocument.defaultView;
      let target = TargetFactory.forTab(window.gBrowser.selectedTab);

      CommandUtils.executeOnTarget(target, "eyedropper --frommenu");
    },
    checkbox: true
  },
  { id: "menu_scratchpad",
    l10nKey: "scratchpad",
    oncommand() {
      ScratchpadManager.openScratchpad();
    },
    key: {
      id: "scratchpad",
      modifiers: "shift"
    }
  },
  { id: "menu_devtools_serviceworkers",
    l10nKey: "devtoolsServiceWorkers",
    disabled: true,
    oncommand(event) {
      let window = event.target.ownerDocument.defaultView;
      gDevToolsBrowser.openAboutDebugging(window.gBrowser, "workers");
    }
  },
  { id: "menu_devtools_connect",
    l10nKey: "devtoolsConnect",
    disabled: true,
    oncommand(event) {
      let window = event.target.ownerDocument.defaultView;
      gDevToolsBrowser.openConnectScreen(window.gBrowser);
    }
  },
  { separator: true,
    id: "devToolsEndSeparator"
  },
  { id: "getMoreDevtools",
    l10nKey: "getMoreDevtoolsCmd",
    oncommand(event) {
      let window = event.target.ownerDocument.defaultView;
      window.openUILinkIn("https://addons.mozilla.org/firefox/collections/mozilla/webdeveloper/", "tab");
    }
  },
  {
    id: "dev-edition-profile",
    l10nKey: "devEditionProfile",
    oncommand(event) {
      let profileName = "dev-edition";
      let { Cc, Ci, Cu } = require("chrome");
      // Create dev-edition profile and get path to it
      let profileService = Cc["@mozilla.org/toolkit/profile-service;1"]
        .getService(Ci.nsIToolkitProfileService);

      let profile;
      try {
        // getProfileByName throws if it doesn't exists yet
        profile = profileService.getProfileByName(profileName);
      } catch(e) {}
      if (!profile) {
        profile = profileService.createProfile(null, profileName);
        profileService.flush();
      }
      let profilePath = profile.rootDir.path;

      let firefox_bin = Services.dirsvc.get("XREExeF", Ci.nsIFile);

      if (Services.appinfo.OS == "WINNT") {
        let linkName = "Mozilla Developer Edition.lnk";

        // Create shortcut file to current firefox binary
        // and with -profile command line argument refering to dev-edition profile
        let shortcut = Services.dirsvc.get("TmpD", Ci.nsIFile);
        shortcut.append(linkName);

        // Previous failure may have let some junk
        if (shortcut.exists()) {
          try {
            shortcut.remove(false);
          } catch(e) {}
        }
        shortcut.createUnique(Ci.nsIFile.NORMAL_FILE_TYPE, 0o666);

        /* function nsILocalFileWin.setShortcut(targetFile, workingDir, args,
                                                description, iconFile, iconIndex) */
        shortcut.QueryInterface(Ci.nsILocalFileWin);
        shortcut.setShortcut(firefox_bin,
          firefox_bin.parent,
          "-profile \""+profilePath+"\" -no-remote",
          "Mozilla Developer Edition",
          firefox_bin,
          0);

        // Copy the shortcut to Desktop and Start menu
        let desktop = Services.dirsvc.get("Desk", Ci.nsIFile);
        let progs = Services.dirsvc.get("Progs", Ci.nsIFile);
        shortcut.copyTo(desktop, shortcut.leafName);
        shortcut.copyTo(progs, shortcut.leafName);

        // Remove the temporary shortcut file
        shortcut.remove(false);
      } else if (Services.appinfo.OS == "Darwin") {
        Cu.import("resource://gre/modules/FileUtils.jsm");
        function writeToFile(file, contents) {
         let outputStream = FileUtils.openFileOutputStream(file);
         outputStream.write(contents, contents.length);
         outputStream.close();
        }
        let appName = "Mozilla Developer Edition";
        let app = Services.dirsvc.get("TmpD", Ci.nsIFile);
        if (app.exists())
          app.remove(true);
        app.append(appName + ".app");
        let script = app.clone();
        script.create(Ci.nsIFile.DIRECTORY_TYPE, 0o755);
        script.append("Contents");
        script.create(Ci.nsIFile.DIRECTORY_TYPE, 0o755);
        script.append("MacOS");
        script.create(Ci.nsIFile.DIRECTORY_TYPE, 0o755);
        script.append(appName);
        script.create(Ci.nsIFile.NORMAL_FILE_TYPE, 0o755);
        let shellScript = [
          "#!/usr/bin/env bash",
          firefox_bin.path + " -profile \"" + profilePath.replace("\\", "\\\\") + "\" -no-remote"
        ];
        writeToFile(script, shellScript.join("\n"));

        // Move it to /applications
        let applications = Services.dirsvc.get("LocApp", Ci.nsIFile);
        let window = event.target.ownerDocument.defaultView;
        if (!applications.isWritable()) {
          window.alert("Not enough privileges to install it in /Applications");
          return;
        }
        let dest = applications.clone();
        dest.append(app.leafName);
        if (dest.exists())
          dest.remove(true);
        app.moveTo(applications, app.leafName);

        // On latest Mac only signed application can be opened
        // so ask user to manually flag security exception
        window.alert("Right click on '"+appName+"' to select 'Open' and accept the security exception.");
        app.reveal();

        // Return to prevent automatic opening of dev edition on Mac
        return;
      } else {
        let xdg_data_home = Cc["@mozilla.org/process/environment;1"].
                            getService(Ci.nsIEnvironment).
                            get("XDG_DATA_HOME");
        let desktop;
        if (!xdg_data_home) {
          desktop = Services.dirsvc.get("Home", Ci.nsIFile);
          desktop.append(".local");
          desktop.append("share");
        } else {
          desktop = Cc["@mozilla.org/file/local;1"]
                      .createInstance(Ci.nsILocalFile);
          desktop.initWithPath(xdg_data_home);
        }
        desktop.append("applications");
        desktop.append("dev-edition.desktop");

        // TODO: robustify icon retrieval
        let icon = firefox_bin.clone().parent;
        icon.append("browser");
        icon.append("icons");
        icon.append("mozicon128.png");

        let writer = Cc["@mozilla.org/xpcom/ini-processor-factory;1"].
               getService(Ci.nsIINIParserFactory).
               createINIParser(desktop).
               QueryInterface(Ci.nsIINIParserWriter);
        writer.setString("Desktop Entry", "Name", "Mozilla Developer Edition");
        writer.setString("Desktop Entry", "Comment", "Mozilla Developer Edition");
        writer.setString("Desktop Entry", "Exec", '"' + firefox_bin.path + '" -profile "' + profilePath.replace("\\", "\\\\") + '" -no-remote');
        writer.setString("Desktop Entry", "Icon", icon.path);
        writer.setString("Desktop Entry", "Type", "Application");
        writer.setString("Desktop Entry", "Terminal", "false");
        writer.writeFile();
      }
      // Finally, open dev edition!
      // (shortcut.launch() doesn't work as it doesn't pass the shortcut command line arguments)
      let p = Cc["@mozilla.org/process/util;1"].createInstance(Ci.nsIProcess);
      p.init(firefox_bin);
      p.run(false, ["-profile", profilePath, "-no-remote"], 3);
    }
  }
];
