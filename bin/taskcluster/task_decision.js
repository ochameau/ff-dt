let taskcluster = require("taskcluster-client");
let YAML = require("yamljs");

let TaskDefinitions = YAML.load("task-definitions.yml");

// List of environment variable exported to sub tasks
let ExportedEnvs = [
  "GITHUB_HEAD_USER_EMAIL",
  "GITHUB_HEAD_REPO_URL",
  "GITHUB_HEAD_REPO_SHA",
  "GITHUB_HEAD_REPO_BRANCH"
];

let queue = new taskcluster.Queue({
  baseUrl: "http://taskcluster/queue/v1"
});

function createTask(name, yml) {
  if (typeof(yml.payload) != "object") {
    throw new Error("Task defined in yml file have to define the `payload` object");
  }
  if (typeof(yml.metadata) != "object" ||
      typeof(yml.metadata.name) != "string" ||
      typeof(yml.metadata.description) != "string") {
    throw new Error("Task defined in yml file have to define the `metadata` object with name and description attriutes");
  }
  if (yml.scopes && !Array.isArray(yml.scopes)) {
    throw new Error("'scopes' in task defined in yml file should be an array");
  }
  if (yml["only-branches"]) {
    let branches = yml["only-branches"];
    if (!Array.isArray(branches)) {
      throw new Error("'only-branches' in task defined in yml file should be an array");
    }
    let branch = process.env.GITHUB_HEAD_REPO_BRANCH;
    if (!branches.includes(branch)) {
      console.log("Prevent running", name, "task on branch", branch, "by following only-branches attribute");
      return;
    }
  }

  let dependencies = [process.env.TASK_ID];

  // `task.dependencies` should contain task ids,
  // so, map task names to task ids
  if (yml.dependencies) {
    for (let dep of yml.dependencies) {
      dependencies.push(TaskDefinitions[dep].id);
    }
  }

  // Inject some environment variable from the decison task scope
  if (!yml.payload.env) {
    yml.payload.env = {};
  }
  let env = yml.payload.env;
  for (let name of ExportedEnvs) {
    env[name] = process.env[name];
  }

  // We need to convert Windows artifact expires attribute
  // (which is mandatory on windows)
  if (Array.isArray(yml.payload.artifacts)) {
    yml.payload.artifacts.forEach(artifact => {
      let m = artifact.expires.match(/{{ '(.+)' \| \$fromNow }}/);
      if (m && m[1]) {
        artifact.expires = taskcluster.fromNowJSON(m[1]);
      }
    });
  }

  // Default task values:
  let task = {
    provisionerId:  "aws-provisioner-v1",
    workerType:     yml.workerType || "github-worker",
    schedulerId:    "taskcluster-github",
    taskGroupId:    process.env.TASK_ID,

    created:        (new Date()).toJSON(),
    deadline:       taskcluster.fromNowJSON('6 hours'),
    retries:        0,

    metadata:       {
      name:         yml.metadata.name,
      description:  yml.metadata.description,
      owner:        process.env.GITHUB_HEAD_USER_EMAIL,
      source:       process.env.GITHUB_HEAD_REPO_URL
    },

    routes: [
      "index.project.devtools.branches." + process.env.GITHUB_HEAD_REPO_BRANCH + "." + name,
      "index.project.devtools.branches." + process.env.GITHUB_HEAD_REPO_SHA + "." + name
    ],

    scopes:         yml.scopes,

    payload:        yml.payload,

    // all-completed waits for all dependencies to succeed
    // all-resolved also accept running the task if deps failed
    requires:       "all-completed",
    dependencies:   dependencies
  };

  // Create the task
  let taskId = TaskDefinitions[name].id;
  return queue.createTask(taskId, task).then(result => {
    console.log("Task", name, "created", result);
  }, error => {
    console.log("error while creating the task", error);
  });
}

// First set the task id.
// Needed by createTask in order to correctly set the dependencies.
for (let name in TaskDefinitions) {
  TaskDefinitions[name].id = taskcluster.slugid();
}

for (let name in TaskDefinitions) {
  createTask(name, TaskDefinitions[name]);
}

setTimeout(() => {
  console.log("end of timeout");
}, 20000);
