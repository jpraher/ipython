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
    CodeMirror.modeURL = "/static/codemirror/mode/%N/%N.js";

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
    var LPProgramCell = function (lpprogram) {
        // this.kernel = kernel || null;
        this.lpprogram = lpprogram || null;
        this.code_mirror = null;
        this.input_prompt_number = null;
        this.tooltip_on_tab = true;
        this.collapsed = false;
        this.default_mode = 'lpprolog';
        IPython.Cell.apply(this, arguments);

        var that = this;
        this.element.focusout(
            function() { that.auto_highlight(); }
        );
        this.cell_type = "lpprogram";
    };

    LPProgramCell.prototype = new IPython.CodeCell();

    LPProgramCell.prototype.set_lpprogram = function (lpprogram) {
        this.lpprogram = lpprogram
    }

    /**
     * Execute current code cell to the kernel
     * @method execute
     */
    LPProgramCell.prototype.execute = function () {
        this.output_area.clear_output(true, true, true);
        this.set_input_prompt('*');
        this.element.addClass("running");
        /*
        var callbacks = {
            'execute_reply': $.proxy(this._handle_execute_reply, this),
            'output': $.proxy(this.output_area.handle_output, this.output_area),
            'clear_output': $.proxy(this.output_area.handle_clear_output, this.output_area),
            'set_next_input': $.proxy(this._handle_set_next_input, this)
        };
        var msg_id = this.kernel.execute(this.get_text(), callbacks,
                                         {input: "program", silent:
                                         /*false});
        */
        this.lpprogram.compile(this /*, {input: "program", silent:false} */);
    };


    LPProgramCell.prototype.fromJSON = function (data) {
        IPython.Cell.prototype.fromJSON.apply(this, arguments);
        if (data.cell_type === 'lpprogram') {
            if (data.input !== undefined) {
                this.set_text(data.input);
                // make this value the starting point, so that we can only undo
                // to this state, instead of a blank cell
                this.code_mirror.clearHistory();
                this.auto_highlight();
            }
            if (data.prompt_number !== undefined) {
                this.set_input_prompt(data.prompt_number);
            } else {
                this.set_input_prompt();
            };
            this.output_area.fromJSON(data.outputs);
            if (data.collapsed !== undefined) {
                if (data.collapsed) {
                    this.collapse();
                } else {
                    this.expand();
                };
            };
        };
    };


    LPProgramCell.prototype.toJSON = function () {
        var data = IPython.Cell.prototype.toJSON.apply(this);
        data.input = this.get_text();
        data.cell_type = 'lpprogram';
        if (this.input_prompt_number) {
            data.prompt_number = this.input_prompt_number;
        };
        var outputs = this.output_area.toJSON();
        data.outputs = outputs;
        data.language = 'prolog';
        data.collapsed = this.collapsed;
        return data;
    };


    IPython.LPProgramCell = LPProgramCell;

    return IPython;
}(IPython));
