## Check if we want debug or optimized builds
MODE=opt
if [[ "$DEBUG" -eq 1 ]]; then
  MODE=debug
fi

## Check on what operating system we are running
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

PLATFORM=$OS-$MODE
echo "PLATFORM=$PLATFORM"
