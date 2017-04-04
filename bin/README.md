# How to setup test harness before being able to run tests
```
$ ./update_artifact.sh
$ git add mochitest/ xpcshell/ task_id artifacts/{bin,certs,config,modules,mozbase}
$ git commit
```

# How to run tests
```
$ . config.sh      # Setup python for test runner
$ ./run-mochitests.sh                                                  # to run all tests
$ ./run-mochitests.sh client/framework/test/browser_toolbox_raise.js   # to run a diretory or a single test

$ ./run-xpcshell.sh                                           # to run all tests
$ ./run-xpcshell.sh server/tests/unit/test_frameactor-01.js   # to run a diretory or a single test
```
