// Author: Alexander (mclander) Maksimenko
// Company: SberTech (www.sber-tech.xom)

"use strict";

const fs = require("fs");
const JSZip = require("jszip");
const mime = require('mime-types');
const isNode = require('is-node');

const isBrowser = !isNode; // this.window === this;


let defaultOptions = {
	removeSignature: null, // remove file if callback return signature exactly
	handleError: undefined,
	compression: 'DEFLATE',
	type: isBrowser ? 'blob' : 'nodebuffer',
	output: undefined,
	extendOptions : {},
	saveNonChanges: false
};

const defaultFilter = {
	string: stringFilter,
	unit8array: binaryFilter,
	binary: binaryFilter
}

const checkXML = /\+?xml$/;

// How we chesked for string file?
function stringFilter(file) {
	const type = mime.lookup(file);
	return type && (mime.charset(file) || checkXML.test(type));
}

function binaryFilter(file) {
	return !stringFilter(file); 
}


function process(file_or_content, options, callbacks) {
	if (typeof file_or_content === 'string') {
		return processFile(file_or_content, options, callbacks);
	} else {
		return processContent(file_or_content, options, callbacks);
	}
	
}

// function processZip(err, data){}

function processFile(file, options, callbacks) {

	fs.readFile(file, function(err, data) {

    	if (err) {
    		if      (options && options.handleError) return options.handleError();
    		else if (defaultOptions.handleError)     return defaultOptions.handleError();
    		else throw err;	
    	} 

    	processContent(data, options, callbacks).then( data => {
    		
    		const changed = !!data;

    		if (changed) {
    			// looking for output file name
    			let fileName = (options && (options.output || (options.replace ? options.fileName : undefined ))) || defaultOptions.output;

    			if (!fileName)
    				throw 'No output file specified';
    			
    			fs.writeFileSync(fileName, data);

    		}
    	
    	}).catch( e => {throw e}); // enf of processContent

    }); // end of fs.readFile
}


function processContent(content, process_options, callbacks) {

	// console.log(typeof content, content);

	var changed = false;

	const convertTypes = {
		// base64 : the result will be a string, the binary in a base64 form.
		// text (or string): the result will be an unicode string.
		// binarystring: the result will be a string in "binary" form, using 1 byte per char (2 bytes).
		// array: the result will be an Array of bytes (numbers between 0 and 255).
		// uint8array : the result will be a Uint8Array. This requires a compatible browser.
		// arraybuffer : the result will be a ArrayBuffer. This requires a compatible browser.
		// blob : the result will be a Blob. This requires a compatible browser.
		// nodebuffer : the result will be a nodejs Buffer. This requires nodejs.
		string : 'string',
		unit8array: 'unit8array',
		binary: 'unit8array',
	};

    return JSZip.loadAsync(content).then( zip => {

    	let allPromises = [];

		for (const type in callbacks) {

			if (!callbacks.hasOwnProperty(type)) continue;
		
			let { filter, callback, options } = callbacks[type];

			if (!filter) filter = process_options.defaultFilter || defaultFilter[type] || (() => true);
			if (!callback) callback = process_options.callback || ((...x) => (/* console.log(x) || */ (x && x.length && x[1])));
			if (!options) options = {};

			const promises = zip.filter(filter).map( zipFile => {

				const zipFileName = zipFile.name;

				return zipFile.async(convertTypes[type] || type).then( data => {

					let ret = callback(data, zipFileName);

					if (ret !== data ) {

						changed = true;

						zip.remove(zipFileName);

						if (
							('removeSignature'    in options         && ret === options.removeSignature )
							|| ('removeSignature' in process_options && ret === process_options.removeSignature) 
							|| ('removeSignature' in defaultOptions  && ret === defaultOptions.removeSignature)
						) { return zipFileName; }

						return zip.file(zipFileName, ret) && zipFileName;
					} 

				}); // .catch(e => console.warn(e));

			}); // end of promises = filter & map


			allPromises = allPromises.concat(promises);

		}


		return Promise.all(allPromises).then( values => {
			
			if (!changed) return undefined;
			
			const _process_options = process_options || {};
			
			return zip.generateAsync(
				Object.assign({
						type: _process_options.type || defaultOptions.type,
						compression:  _process_options.compression || defaultOptions.compression,
					}, 
					_process_options.extendOptions || defaultOptions.extendOptions
				)
			); // end of zip.generateAsync

		}); //.then('generated', x => console.log(x)); // end of Promise.all

	}).catch(e => {throw e}); // end of JSZip.loadAsync

}

module.exports = process;
module.exports.process = process;
module.exports.processFile = processFile;
module.exports.processContent = processContent;
module.exports.defaultOptions = defaultOptions;
