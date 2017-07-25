/* Any copyright is dedicated to the Public Domain.
  http://creativecommons.org/publicdomain/zero/1.0/ */
/* eslint-disable max-len */

"use strict";

/*
 * THIS FILE IS AUTOGENERATED. DO NOT MODIFY BY HAND. RUN TESTS IN FIXTURES/ TO UPDATE.
 */

const { NetworkEventMessage } =
  require("devtools/client/webconsole/new-console-output/types");

let stubPreparedMessages = new Map();
let stubPackets = new Map();
stubPreparedMessages.set("GET request", new NetworkEventMessage({
  "id": "1",
  "actor": "server1.conn0.child1/netEvent30",
  "level": "log",
  "isXHR": false,
  "request": {
    "url": "http://example.com/browser/client/webconsole/new-console-output/test/fixtures/stub-generators/inexistent.html",
    "method": "GET"
  },
  "response": {},
  "source": "network",
  "type": "log",
  "groupId": null,
  "timeStamp": 1487022056850,
  "indent": 0
}));

stubPreparedMessages.set("GET request update", new NetworkEventMessage({
  "id": "1",
  "actor": "server1.conn0.child1/netEvent30",
  "level": "log",
  "request": {
    "url": "http://example.com/browser/client/webconsole/new-console-output/test/fixtures/stub-generators/inexistent.html",
    "method": "GET",
    "headersSize": 489
  },
  "response": {
    "httpVersion": "HTTP/1.1",
    "status": "404",
    "statusText": "Not Found",
    "headersSize": 160,
    "remoteAddress": "127.0.0.1",
    "remotePort": 8888,
    "content": {
      "mimeType": "text/html; charset=utf-8"
    },
    "bodySize": 904,
    "transferredSize": 904
  },
  "source": "network",
  "type": "log",
  "groupId": null,
  "totalTime": 16,
  "indent": 0
}));

stubPreparedMessages.set("XHR GET request", new NetworkEventMessage({
  "id": "1",
  "actor": "server1.conn1.child1/netEvent30",
  "level": "log",
  "isXHR": true,
  "request": {
    "url": "http://example.com/browser/client/webconsole/new-console-output/test/fixtures/stub-generators/inexistent.html",
    "method": "GET"
  },
  "response": {},
  "source": "network",
  "type": "log",
  "groupId": null,
  "timeStamp": 1487022057746,
  "indent": 0
}));

stubPreparedMessages.set("XHR GET request update", new NetworkEventMessage({
  "id": "1",
  "actor": "server1.conn0.child1/netEvent31",
  "level": "log",
  "request": {
    "url": "http://example.com/browser/client/webconsole/new-console-output/test/fixtures/stub-generators/inexistent.html",
    "method": "GET",
    "headersSize": 489
  },
  "response": {
    "httpVersion": "HTTP/1.1",
    "status": "404",
    "statusText": "Not Found",
    "headersSize": 160,
    "remoteAddress": "127.0.0.1",
    "remotePort": 8888,
    "content": {
      "mimeType": "text/html; charset=utf-8"
    },
    "bodySize": 904,
    "transferredSize": 904
  },
  "source": "network",
  "type": "log",
  "groupId": null,
  "totalTime": 16,
  "indent": 0
}));

stubPreparedMessages.set("XHR POST request", new NetworkEventMessage({
  "id": "1",
  "actor": "server1.conn2.child1/netEvent30",
  "level": "log",
  "isXHR": true,
  "request": {
    "url": "http://example.com/browser/client/webconsole/new-console-output/test/fixtures/stub-generators/inexistent.html",
    "method": "POST"
  },
  "response": {},
  "source": "network",
  "type": "log",
  "groupId": null,
  "timeStamp": 1487022058414,
  "indent": 0
}));

stubPreparedMessages.set("XHR POST request update", new NetworkEventMessage({
  "id": "1",
  "actor": "server1.conn0.child1/netEvent32",
  "level": "log",
  "request": {
    "url": "http://example.com/browser/client/webconsole/new-console-output/test/fixtures/stub-generators/inexistent.html",
    "method": "POST",
    "headersSize": 509
  },
  "response": {
    "httpVersion": "HTTP/1.1",
    "status": "404",
    "statusText": "Not Found",
    "headersSize": 160,
    "remoteAddress": "127.0.0.1",
    "remotePort": 8888,
    "content": {
      "mimeType": "text/html; charset=utf-8"
    },
    "bodySize": 904,
    "transferredSize": 904
  },
  "source": "network",
  "type": "log",
  "groupId": null,
  "totalTime": 10,
  "indent": 0
}));

stubPackets.set("GET request", {
  "_type": "NetworkEvent",
  "timeStamp": 1487022056850,
  "node": null,
  "actor": "server1.conn0.child1/netEvent30",
  "discardRequestBody": true,
  "discardResponseBody": true,
  "startedDateTime": "2017-02-13T21:40:56.850Z",
  "request": {
    "url": "http://example.com/browser/client/webconsole/new-console-output/test/fixtures/stub-generators/inexistent.html",
    "method": "GET"
  },
  "isXHR": false,
  "cause": {
    "type": "img",
    "loadingDocumentUri": "http://example.com/browser/client/webconsole/new-console-output/test/fixtures/stub-generators/test-network-event.html",
    "stacktrace": [
      {
        "filename": "http://example.com/browser/client/webconsole/new-console-output/test/fixtures/stub-generators/test-network-event.html",
        "lineNumber": 3,
        "columnNumber": 1,
        "functionName": "triggerPacket",
        "asyncCause": null
      },
      {
        "filename": "resource://testing-common/content-task.js line 52 > eval",
        "lineNumber": 8,
        "columnNumber": 9,
        "functionName": null,
        "asyncCause": null
      },
      {
        "filename": "resource://testing-common/content-task.js",
        "lineNumber": 53,
        "columnNumber": 20,
        "functionName": null,
        "asyncCause": null
      }
    ]
  },
  "response": {},
  "timings": {},
  "updates": [],
  "private": false,
  "from": "server1.conn0.child1/consoleActor2"
});

stubPackets.set("GET request update", {
  "networkInfo": {
    "_type": "NetworkEvent",
    "actor": "server1.conn0.child1/netEvent30",
    "request": {
      "url": "http://example.com/browser/client/webconsole/new-console-output/test/fixtures/stub-generators/inexistent.html",
      "method": "GET",
      "headersSize": 489
    },
    "response": {
      "httpVersion": "HTTP/1.1",
      "status": "404",
      "statusText": "Not Found",
      "headersSize": 160,
      "remoteAddress": "127.0.0.1",
      "remotePort": 8888,
      "content": {
        "mimeType": "text/html; charset=utf-8"
      },
      "bodySize": 904,
      "transferredSize": 904
    },
    "totalTime": 16
  }
});

stubPackets.set("XHR GET request", {
  "_type": "NetworkEvent",
  "timeStamp": 1487022057746,
  "node": null,
  "actor": "server1.conn1.child1/netEvent30",
  "discardRequestBody": true,
  "discardResponseBody": true,
  "startedDateTime": "2017-02-13T21:40:57.746Z",
  "request": {
    "url": "http://example.com/browser/client/webconsole/new-console-output/test/fixtures/stub-generators/inexistent.html",
    "method": "GET"
  },
  "isXHR": true,
  "cause": {
    "type": "xhr",
    "loadingDocumentUri": "http://example.com/browser/client/webconsole/new-console-output/test/fixtures/stub-generators/test-network-event.html",
    "stacktrace": [
      {
        "filename": "http://example.com/browser/client/webconsole/new-console-output/test/fixtures/stub-generators/test-network-event.html",
        "lineNumber": 4,
        "columnNumber": 1,
        "functionName": "triggerPacket",
        "asyncCause": null
      },
      {
        "filename": "resource://testing-common/content-task.js line 52 > eval",
        "lineNumber": 8,
        "columnNumber": 9,
        "functionName": null,
        "asyncCause": null
      },
      {
        "filename": "resource://testing-common/content-task.js",
        "lineNumber": 53,
        "columnNumber": 20,
        "functionName": null,
        "asyncCause": null
      }
    ]
  },
  "response": {},
  "timings": {},
  "updates": [],
  "private": false,
  "from": "server1.conn1.child1/consoleActor2"
});

stubPackets.set("XHR GET request update", {
  "networkInfo": {
    "_type": "NetworkEvent",
    "actor": "server1.conn0.child1/netEvent31",
    "request": {
      "url": "http://example.com/browser/client/webconsole/new-console-output/test/fixtures/stub-generators/inexistent.html",
      "method": "GET",
      "headersSize": 489
    },
    "response": {
      "httpVersion": "HTTP/1.1",
      "status": "404",
      "statusText": "Not Found",
      "headersSize": 160,
      "remoteAddress": "127.0.0.1",
      "remotePort": 8888,
      "content": {
        "mimeType": "text/html; charset=utf-8"
      },
      "bodySize": 904,
      "transferredSize": 904
    },
    "totalTime": 16
  }
});

stubPackets.set("XHR POST request", {
  "_type": "NetworkEvent",
  "timeStamp": 1487022058414,
  "node": null,
  "actor": "server1.conn2.child1/netEvent30",
  "discardRequestBody": true,
  "discardResponseBody": true,
  "startedDateTime": "2017-02-13T21:40:58.414Z",
  "request": {
    "url": "http://example.com/browser/client/webconsole/new-console-output/test/fixtures/stub-generators/inexistent.html",
    "method": "POST"
  },
  "isXHR": true,
  "cause": {
    "type": "xhr",
    "loadingDocumentUri": "http://example.com/browser/client/webconsole/new-console-output/test/fixtures/stub-generators/test-network-event.html",
    "stacktrace": [
      {
        "filename": "http://example.com/browser/client/webconsole/new-console-output/test/fixtures/stub-generators/test-network-event.html",
        "lineNumber": 4,
        "columnNumber": 1,
        "functionName": "triggerPacket",
        "asyncCause": null
      },
      {
        "filename": "resource://testing-common/content-task.js line 52 > eval",
        "lineNumber": 8,
        "columnNumber": 9,
        "functionName": null,
        "asyncCause": null
      },
      {
        "filename": "resource://testing-common/content-task.js",
        "lineNumber": 53,
        "columnNumber": 20,
        "functionName": null,
        "asyncCause": null
      }
    ]
  },
  "response": {},
  "timings": {},
  "updates": [],
  "private": false,
  "from": "server1.conn2.child1/consoleActor2"
});

stubPackets.set("XHR POST request update", {
  "networkInfo": {
    "_type": "NetworkEvent",
    "actor": "server1.conn0.child1/netEvent32",
    "request": {
      "url": "http://example.com/browser/client/webconsole/new-console-output/test/fixtures/stub-generators/inexistent.html",
      "method": "POST",
      "headersSize": 509
    },
    "response": {
      "httpVersion": "HTTP/1.1",
      "status": "404",
      "statusText": "Not Found",
      "headersSize": 160,
      "remoteAddress": "127.0.0.1",
      "remotePort": 8888,
      "content": {
        "mimeType": "text/html; charset=utf-8"
      },
      "bodySize": 904,
      "transferredSize": 904
    },
    "totalTime": 10
  }
});

module.exports = {
  stubPreparedMessages,
  stubPackets,
};
