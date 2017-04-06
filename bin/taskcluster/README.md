Small node application to implement a "Task Decision" Task for Taskcluster.
This script is the one defining and running all DevTools Tasks on Taskcluster.

We have to use a Task Decision Task in order to define dependencies between tasks.
This is not possible by just writing a .taskcluster.yml file.
