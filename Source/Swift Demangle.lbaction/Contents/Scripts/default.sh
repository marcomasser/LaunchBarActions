#!/bin/sh
#
# LaunchBar Action Script
#

# Check for empty string because swift-demangle would
# then enter an interactive mode, which we dont want:
if [ -z $1 ]; then
    exit
fi

xcrun swift-demangle -compact $@
