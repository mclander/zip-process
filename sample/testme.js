const fs = require('fs');
const zipProcess = require('../src/zip-process');

// zipProcess options
const options = {}; // All default

// zipProcess calbacks (processors)
const callbacks = {	
		// We split binary && text processing, for binary use key 'binary', for text files 'string'
		string: { 
			
			// aplly path filter we need to check all .xml && .xml.rels files
			filter: (relativePath) =>  !!/\.xml(\.rels)?$/.test(relativePath),
			
			// just change it, and return new value
			callback: (data, zipFileName) =>  data && data.replace(/\bJohn\b/g, 'Fedor')
		}
	};


fs.readFile('./john.xlsx', function(err, source) {

        if (err) { throw err; }

        zipProcess(source, options, callbacks).then( out => {

	    const changed = source !== out;

            if (changed) {
                 fs.writeFileSync('./fedor.xlsx', out);
            }

        }) ; // enf of zipProcess

    }); // end of fs.readFile


