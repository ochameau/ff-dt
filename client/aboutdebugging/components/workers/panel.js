/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/* globals window */
"use strict";

loader.lazyImporter(this, "PrivateBrowsingUtils",
  "resource://gre/modules/PrivateBrowsingUtils.jsm");

const { Ci } = require("chrome");
const { createClass, createFactory, DOM: dom } =
  require("devtools/client/shared/vendor/react");
const { getWorkerForms } = require("../../modules/worker");
const Services = require("Services");

const PanelHeader = createFactory(require("../panel-header"));
const TargetList = createFactory(require("../target-list"));
const WorkerTarget = createFactory(require("./target"));
const ServiceWorkerTarget = createFactory(require("./service-worker-target"));

const Strings = Services.strings.createBundle(
  "chrome://devtools/locale/aboutdebugging.properties");

const WorkerIcon = "chrome://devtools/skin/images/debugging-workers.svg";
const MORE_INFO_URL = "https://developer.mozilla.org/en-US/docs/Tools/about%3Adebugging";

module.exports = createClass({
  displayName: "WorkersPanel",

  getInitialState() {
    return {
      workers: {
        service: [],
        shared: [],
        other: []
      }
    };
  },

  componentDidMount() {
    let client = this.props.client;
    client.addListener("workerListChanged", this.update);
    client.addListener("serviceWorkerRegistrationListChanged", this.update);
    client.addListener("processListChanged", this.update);
    this.update();
  },

  componentWillUnmount() {
    let client = this.props.client;
    client.removeListener("processListChanged", this.update);
    client.removeListener("serviceWorkerRegistrationListChanged", this.update);
    client.removeListener("workerListChanged", this.update);
  },

  update() {
    let workers = this.getInitialState().workers;

    getWorkerForms(this.props.client).then(forms => {
      forms.registrations.forEach(form => {
        workers.service.push({
          icon: WorkerIcon,
          name: form.url,
          url: form.url,
          scope: form.scope,
          registrationActor: form.actor
        });
      });

      forms.workers.forEach(form => {
        let worker = {
          icon: WorkerIcon,
          name: form.url,
          url: form.url,
          workerActor: form.actor
        };
        switch (form.type) {
          case Ci.nsIWorkerDebugger.TYPE_SERVICE:
            for (let registration of workers.service) {
              if (registration.scope === form.scope) {
                // XXX: Race, sometimes a ServiceWorkerRegistrationInfo doesn't
                // have a scriptSpec, but its associated WorkerDebugger does.
                if (!registration.url) {
                  registration.name = registration.url = form.url;
                }
                registration.workerActor = form.actor;
                break;
              }
            }
            break;
          case Ci.nsIWorkerDebugger.TYPE_SHARED:
            workers.shared.push(worker);
            break;
          default:
            workers.other.push(worker);
        }
      });

      // XXX: Filter out the service worker registrations for which we couldn't
      // find the scriptSpec.
      workers.service = workers.service.filter(reg => !!reg.url);

      this.setState({ workers });
    });
  },

  render() {
    let { client, id } = this.props;
    let { workers } = this.state;

    let isWindowPrivate = PrivateBrowsingUtils.isContentWindowPrivate(window);
    let isPrivateBrowsingMode = PrivateBrowsingUtils.permanentPrivateBrowsing;
    let isServiceWorkerDisabled = !Services.prefs
                                    .getBoolPref("dom.serviceWorkers.enabled");
    let errorMsg = isWindowPrivate || isPrivateBrowsingMode ||
           isServiceWorkerDisabled ?
      dom.p({ className: "service-worker-disabled" },
        dom.div({ className: "warning" }),
        Strings.GetStringFromName("configurationIsNotCompatible"),
        " (",
        dom.a({ href: MORE_INFO_URL, target: "_blank" },
          Strings.GetStringFromName("moreInfo")),
        ")"
      ) : "";

    return dom.div({
      id: id + "-panel",
      className: "panel",
      role: "tabpanel",
      "aria-labelledby": id + "-header"
    },
    PanelHeader({
      id: id + "-header",
      name: Strings.GetStringFromName("workers")
    }),
    dom.div({ id: "workers", className: "inverted-icons" },
      TargetList({
        client,
        error: errorMsg,
        id: "service-workers",
        name: Strings.GetStringFromName("serviceWorkers"),
        sort: true,
        targetClass: ServiceWorkerTarget,
        targets: workers.service
      }),
      TargetList({
        client,
        id: "shared-workers",
        name: Strings.GetStringFromName("sharedWorkers"),
        sort: true,
        targetClass: WorkerTarget,
        targets: workers.shared
      }),
      TargetList({
        client,
        id: "other-workers",
        name: Strings.GetStringFromName("otherWorkers"),
        sort: true,
        targetClass: WorkerTarget,
        targets: workers.other
      })
    ));
  }
});
