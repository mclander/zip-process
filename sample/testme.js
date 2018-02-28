const zp = require('zip-process');

zp.process('./john.xlsx',            // file to process
	{	// Here the options
		output : './fedor.xlsx', // file to output
		saveNonChanged: true	 // we always need to rewrite output, not only on changes
	}, 
	{	// Here the processors
		string: { // We must split binary && text processing, for binary use key binary
			// aplly path filter we need to check all .xml && .xml.rels files
			filter: (relativePath) =>  !!/\.xml(\.rels)?$/.test(relativePath),
			// just change it, and return new value
			callback: (data, zipFileName) =>  data && data.replace(/\bJohn\b/g, 'Fedor')
		}
	}
);