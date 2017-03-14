# How to setup test harness before being able to run tests
```
$ ./update_artifact.sh
$ git add mochitest/ task_id artifacts/{bin,certs,config,modules,mozbase}
$ git commit
```

# How to run tests
```
$ . config.sh      # Setup python for mochitests
$ ./run-tests.sh                                                  # to run all tests
$ ./run-tests.sh client/framework/test/browser_toolbox_raise.js   # to run a diretory or a single test
```
