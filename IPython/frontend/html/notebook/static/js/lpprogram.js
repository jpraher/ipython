//----------------------------------------------------------------------------
//  Copyright (C) 2008-2011  The IPython Development Team
//
//  Distributed under the terms of the BSD License.  The full license is in
//  the file COPYING, distributed as part of this software.
//----------------------------------------------------------------------------

//============================================================================
// CodeCell
//============================================================================
/**
 * An extendable module that provide base functionnality to create cell for notebook.
 * @module IPython
 * @namespace IPython
 * @submodule CodeCell
 */

var IPython = (function (IPython) {
    "use strict";

    var utils = IPython.utils;
    var key   = IPython.utils.keycodes;
    var IDCHAR_RE = /[a-zA-Z0-9+\-*\/\^<>=`\?@#$&!_~]/

    function trival_escape(str) {
        if (!str || str.length == 0) return "";

        // lcase idchar*
        var output = "";
        var c = str.charAt(0);
        if (c >= "a" && c <= "z")
            otuput += c
        else if (c >= "A" && c <= "Z") {
            output += c.toLowerCase();
        }
        else {
            output += "x_"
        }
        //
        for (var i = 1; i < str.length; ++i) {
            c = str.charAt(i);
            if (IDCHAR_RE.test(c)) {
                output += c;
            }
            else {
                output += "_";
            }
        }
        return output;
    }

    /**
     * A Cell conceived to write code.
     *
     * The kernel doesn't have to be set at creation time, in that case
     * it will be null and set_kernel has to be called later.
     * @class CodeCell
     * @extends IPython.Cell
     *
     * @constructor
     * @param {Object|null} kernel
     */
    var LPProgram = function (notebook, kernel) {
        this.kernel = kernel || null;
        this.notebook = notebook || null;
        this.update_module_name();
    };

    LPProgram.prototype.update_module_name = function() {
        this.module_name = trival_escape(this.notebook.get_notebook_name());
        console.log("module name: " + this.module_name);
    }

    LPProgram.prototype.get_module_name = function() {
        return this.module_name;
    }

    /**
     * Execute current code cell to the kernel
     * @method execute
     */
    LPProgram.prototype.compile = function (origin_cell) {
        /* TODO: compile the program by gathering all the cells.
                 where to write the output into.
         */
        /*
        this.output_area.clear_output(true, true, true);
        this.set_input_prompt('*');
        this.element.addClass("running");
        */
        var receiver = origin_cell;
        // TODO on rename ...
        var code = this.module_name + ".\n"
        var ncells = this.notebook.ncells();
        for (var i=0; i<ncells; ++i) {
            var cell = this.notebook.get_cell(i);
            if (cell instanceof IPython.LPProgramCell) {
                code += cell.get_text();
                // get all the new lines in the code
                // dispatch the error messages to the
                code += "\n";
            }
        }
        code += "end"

        var sigandmod = "sig " + code + "\n" +
                        "module " + code + "\n"
        code = sigandmod;

        console.log("executing\n" + code);


        var callbacks = {
            'execute_reply': $.proxy(receiver._handle_execute_reply, receiver),
            'output': $.proxy(receiver.output_area.handle_output, receiver.output_area),
            // do this for all others as well...
            'clear_output': $.proxy(receiver.output_area.handle_clear_output, receiver.output_area),
            'set_next_input': $.proxy(receiver._handle_set_next_input, receiver)
        };

        var msg_id = this.kernel.execute(code, callbacks,
                                         {input: "program",
                                          module: this.module_name,
                                          silent: false});
    };

    IPython.LPProgram = LPProgram;

    return IPython;
}(IPython));
