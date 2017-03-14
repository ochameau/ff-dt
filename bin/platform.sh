## Check if we want debug or optimized builds
MODE=opt
if [[ "$DEBUG" -eq 1 ]]; then
  MODE=debug
fi

## Check on what operating system we are running
if [[ "$OS" != "win32" && "$OS" != "linux64" && "$OS" != "macosx64" ]]; then
  SYS=$(uname -a)
# Cygwin, mingw32 or ubuntu for windows
  if [[ "$SYS" =~ "CYGWIN" || "$SYS" =~ "MINGW32_NT" || "$SYS" =~ "MINGW64_NT" ]] || grep -q Microsoft /proc/version ; then
    OS=win32
  elif [[ "$SYS" =~ "Linux" ]]; then
    OS=linux64
  elif [[ "$SYS" =~ "Darwin" ]]; then
    OS=macosx64
  else
    echo "Unable to detect operating system type"
    echo "uname: $SYS"
    exit
  fi
fi

PLATFORM=$OS-$MODE
echo "Platform=$PLATFORM"

if [[ "$BRANCH" == "" ]]; then
  BRANCH=mozilla-central
fi

echo "Firefox branch=$BRANCH"

SCRIPT_DIR=$(dirname $0)
mkdir -p $SCRIPT_DIR/deps/firefox/$BRANCH
TASK_ID_PATH=$(readlink -f $SCRIPT_DIR/deps/firefox/$BRANCH/$PLATFORM)

mkdir -p $SCRIPT_DIR/artifacts/tests/
ARTIFACTS_DIR=$(readlink -f $SCRIPT_DIR/artifacts/tests/)
