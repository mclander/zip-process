// Author: Alexander (mclander) Maksimenko
// Company: SberTech (www.sber-tech.xom)

"use strict";

var JSZip = require("jszip");
var mime = require('mime-types');
var isNode = require('is-node');

var isBrowser = !isNode; // this.window === this;


var defaultOptions = {
    removeSignature: null, // remove file if callback return signature exactly
    handleError: undefined,
    compression: 'DEFLATE',
    type: isBrowser ? 'blob' : 'nodebuffer',
    output: undefined,
    extendOptions: {},
    saveNonChanges: false
};

var defaultFilter = {
    string: stringFilter,
    unit8array: binaryFilter,
    binary: binaryFilter
};

var checkXML = /\+?xml$/;

// How we chesked for string file?
function stringFilter(file) {
    var type = mime.lookup(file);
    return type && (mime.charset(file) || checkXML.test(type));
}

function binaryFilter(file) {
    return !stringFilter(file);
}

function process(content, process_options, callbacks) {

    // console.log(typeof content, content);

    var changed = false;

    var convertTypes = {
        // base64 : the result will be a string, the binary in a base64 form.
        // text (or string): the result will be an unicode string.
        // binarystring: the result will be a string in "binary" form, using 1 byte per char (2 bytes).
        // array: the result will be an Array of bytes (numbers between 0 and 255).
        // uint8array : the result will be a Uint8Array. This requires a compatible browser.
        // arraybuffer : the result will be a ArrayBuffer. This requires a compatible browser.
        // blob : the result will be a Blob. This requires a compatible browser.
        // nodebuffer : the result will be a nodejs Buffer. This requires nodejs.
        string: 'string',
        unit8array: 'unit8array',
        binary: 'unit8array'
    };

    return JSZip.loadAsync(content).then(function (zip) {

        var allPromises = [];

        var _loop = function _loop(type) {

            if (!callbacks.hasOwnProperty(type)) return "continue";

            var _callbacks$type = callbacks[type],
                filter = _callbacks$type.filter,
                callback = _callbacks$type.callback,
                options = _callbacks$type.options;


            if (!filter) filter = process_options.defaultFilter || defaultFilter[type] || function () {
                return true;
            };
            if (!callback) callback = process_options.callback || function () {
                for (var _len = arguments.length, x = Array(_len), _key = 0; _key < _len; _key++) {
                    x[_key] = arguments[_key];
                }

                return (/* console.log(x) || */x && x.length && x[1]
                );
            };
            if (!options) options = {};

            var promises = zip.filter(filter).map(function (zipFile) {

                var zipFileName = zipFile.name;

                return zipFile.async(convertTypes[type] || type).then(function (data) {

                    var ret = callback(data, zipFileName);

                    if (ret !== data) {

                        changed = true;

                        zip.remove(zipFileName);

                        if ('removeSignature' in options && ret === options.removeSignature || 'removeSignature' in process_options && ret === process_options.removeSignature || 'removeSignature' in defaultOptions && ret === defaultOptions.removeSignature) {
                            return zipFileName;
                        }

                        return zip.file(zipFileName, ret, zip) && zipFileName;
                    }
                }); // .catch(e => console.warn(e));
            }); // end of promises = filter & map


            allPromises = allPromises.concat(promises);
        };

        for (var type in callbacks) {
            var _ret = _loop(type);

            if (_ret === "continue") continue;
        }

        return Promise.all(allPromises).then(function (values) {

            if (!changed) return content;

            var _process_options = process_options || {};

            return zip.generateAsync(Object.assign({
                type: _process_options.type || defaultOptions.type,
                compression: _process_options.compression || defaultOptions.compression
            }, _process_options.extendOptions || defaultOptions.extendOptions)); // end of zip.generateAsync
        }); // end of Promise.all
    }); // end of JSZip.loadAsync
}

module.exports = process;
                         
