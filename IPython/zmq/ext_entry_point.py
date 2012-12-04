""" Defines helper functions for creating kernel entry points and process
launchers.
"""

# Standard library imports.
import atexit
import json
import os
import socket
from subprocess import Popen, PIPE
import sys
import tempfile

# System library imports

# IPython imports
from IPython.utils.localinterfaces import LOCALHOST
from IPython.utils.py3compat import bytes_to_str

# Local imports.
from parentpoller import ParentPollerWindows


def bin_launch_kernel(executable, fname, stdin=None, stdout=None, stderr=None,
                      independent=False, extra_arguments=[],
                      cwd=None):
    """ Launches a localhost kernel, binding to the specified ports.

    Parameters
    ----------
    code : str,
        A string of Python code that imports and executes a kernel entry point.

    stdin, stdout, stderr : optional (default None)
        Standards streams, as defined in subprocess.Popen.

    fname : unicode, optional
        The JSON connector file, containing ip/port/hmac key information.

    key : str, optional
        The Session key used for HMAC authentication.

    executable : str, optional (default sys.executable)
        The Python executable to use for the kernel process.

    independent : bool, optional (default False)
        If set, the kernel process is guaranteed to survive if this process
        dies. If not set, an effort is made to ensure that the kernel is killed
        when this process dies. Note that in this case it is still good practice
        to kill kernels manually before exiting.

    extra_arguments : list, optional
        A list of extra arguments to pass when executing the launch code.

    cwd : path, optional
        The working dir of the kernel process (default: cwd of this process).

    Returns
    -------
    A tuple of form:
        (kernel_process, shell_port, iopub_port, stdin_port, hb_port)
    where kernel_process is a Popen object and the ports are integers.
    """

    # Build the kernel launch command.
    arguments = [ executable, '-f', fname ]
    arguments.extend(extra_arguments)
    print("entry_point - launching kernel %s" % arguments)
    # Popen will fail (sometimes with a deadlock) if stdin, stdout, and stderr
    # are invalid. Unfortunately, there is in general no way to detect whether
    # they are valid.  The following two blocks redirect them to (temporary)
    # pipes in certain important cases.

    # If this process has been backgrounded, our stdin is invalid. Since there
    # is no compelling reason for the kernel to inherit our stdin anyway, we'll
    # place this one safe and always redirect.
    redirect_in = True
    redirect_out = False
    _stdin = PIPE if stdin is None else stdin
    _stdout, _stderr = stdout, stderr
    # If this process in running on pythonw, we know that stdin, stdout, and
    # stderr are all invalid.

    # Spawn a kernel.
    if sys.platform == 'win32':
        # Create a Win32 event for interrupting the kernel.
        interrupt_event = ParentPollerWindows.create_interrupt_event()
        arguments += [ '--interrupt=%i'%interrupt_event ]

        # If the kernel is running on pythonw and stdout/stderr are not been
        # re-directed, it will crash when more than 4KB of data is written to
        # stdout or stderr. This is a bug that has been with Python for a very
        # long time; see http://bugs.python.org/issue706263.
        # A cleaner solution to this problem would be to pass os.devnull to
        # Popen directly. Unfortunately, that does not work.
        if executable.endswith('pythonw.exe'):
            if stdout is None:
                arguments.append('--no-stdout')
            if stderr is None:
                arguments.append('--no-stderr')

        # Launch the kernel process.
        if independent:
            proc = Popen(arguments,
                         creationflags=512, # CREATE_NEW_PROCESS_GROUP
                         stdin=_stdin, stdout=_stdout, stderr=_stderr)
        else:
            try:
                from _winapi import DuplicateHandle, GetCurrentProcess, \
                    DUPLICATE_SAME_ACCESS
            except:
                from _subprocess import DuplicateHandle, GetCurrentProcess, \
                    DUPLICATE_SAME_ACCESS
            pid = GetCurrentProcess()
            handle = DuplicateHandle(pid, pid, pid, 0,
                                     True, # Inheritable by new processes.
                                     DUPLICATE_SAME_ACCESS)
            proc = Popen(arguments + ['--parent=%i'%int(handle)],
                         stdin=_stdin, stdout=_stdout, stderr=_stderr)

        # Attach the interrupt event to the Popen objet so it can be used later.
        proc.win32_interrupt_event = interrupt_event

    else:
        if independent:
            proc = Popen(arguments, preexec_fn=lambda: os.setsid(),
                         stdin=_stdin, stdout=_stdout, stderr=_stderr, cwd=cwd)
        else:
            proc = Popen(arguments + ['--parent=1'],
                         stdin=_stdin, stdout=_stdout, stderr=_stderr, cwd=cwd)

    # Clean up pipes created to work around Popen bug.
    if redirect_in:
        if stdin is None:
            proc.stdin.close()
    if redirect_out:
        if stdout is None:
            proc.stdout.close()
        if stderr is None:
            proc.stderr.close()

    return proc


def launch_kernel(*args, **kwargs):
    """Launches a localhost IPython kernel, binding to the specified ports.

    This function simply calls entry_point.base_launch_kernel with the right
    first command to start an ipkernel.  See base_launch_kernel for arguments.

    Returns
    -------
    A tuple of form:
        (kernel_process, shell_port, iopub_port, stdin_port, hb_port)
    where kernel_process is a Popen object and the ports are integers.
    """
    print("ipkernel launch_kernel: args %s, kwargs %s" % (args, kwargs))
    return bin_launch_kernel('/Users/jakob/src/projects/ipython-xlang-kernel/src/kernel',
                             *args, **kwargs)
