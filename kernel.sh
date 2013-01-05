#! /bin/sh
export DYLD_LIBRARY_PATH=../ipython-xlang-kernel/src
export KERNEL_BIN=../teyjus/tjipython
${KERNEL_BIN} $@
