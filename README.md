# process-zip

Tiny module for easy modify & repack files in zip archives and zip-containers like Excel files.
Based on [JSZip](https://stuk.github.io/jszip/).

## Install

This is a [Node.js](https://nodejs.org/en/) module available through the
[npm registry](https://www.npmjs.com/). Installation is done using the
[`npm install` command](https://docs.npmjs.com/getting-started/installing-npm-packages-locally):

```sh
$ npm install process-zip
```

## API

Imagine we have .xlsx file (zip container) there we want change all occurences 'John' to 'Fedor'. 
!Don't do that if not sure for avoid side-effects.

```js

const zp = require('zip-process');

zp.process('jonh.xlsx',            // file to process
	{	// Here the options
		//   file to output
		output : './fedor.xlsx',
		//   we always need to rewrite output, not only on changes
		saveNonChanged: true	 
	}, 
	{	// Here the processors
		// We must split binary && text processing, for binary use key binary
		string: { 
			
			// aplly path filter we need to check all .xml && .xml.rels files
			filter: (relativePath) =>  !!/\.xml(\.rels)?$/.test(relativePath),
			
			// just change it, and return new value
			callback: (data, zipFileName) =>  data && data.replace(/\bJohn\b/g, 'Fedor')
		}
	}
);
```

As your might guess, I wrote this module special for work with Excel files, but other types of zip works fine too ;)

## function `process(file_or_content, options, callbacks)`

Process zip file or zip content. 

### file_or_content parameter

File name or if content (readed in memory by any way).

### options parameter

Awailable options:
*	output : output file name (only for process & processFile functions, no default)
*	saveNonChanges: (default false)
*	removeSignature: Remove file if callback return exactly signature (default null)
*	handleError: callback wich called on fileread error (only for process & processFile functions, no default)
*	compression: compress file 'DEFLATE' or not 'STORE' (default 'DEFLATE') as options.compession in [JSZip.generateAsync](https://stuk.github.io/jszip/documentation/api_jszip/generate_async.html)
*	extendOptions : all other options for options in [JSZip.generateAsync](https://stuk.github.io/jszip/documentation/api_jszip/generate_async.html) (default {})
*	type: (default: for Node application 'nodebuffer', for browser 'blob' ) as options.type in [JSZip.generateAsync](https://stuk.github.io/jszip/documentation/api_jszip/generate_async.html)

### callbacks parameter

Hash of {string, binary} with same structure {filter, callback, options}:

```
{
	string: {
		filter: function(relativePath, fileInfo){ ... },
		callback: function(content, relativePath){ ...},
		options: {...}
	},
	binary: {
		filter: ...
		callback: ...
		options: ...
	},
}
```


#### Section keys: `{string}` vs `{binary}`

String section used for work with text files. This mean that this files will be decoded by [zipObject.async('string')](https://stuk.github.io/jszip/documentation/api_zipobject/async.html. So binary files will be decoded by [zipObject.async('unit8array')](https://stuk.github.io/jszip/documentation/api_zipobject/async.html). Hint! you can use any other key for section, it will be translated to [zipObject.async(<my section key>)](https://stuk.github.io/jszip/documentation/api_zipobject/async.html). Available types you can see in [JSZip documentation](https://stuk.github.io/jszip/documentation/api_zipobject/async.html).

Warning! I dont know how national encoded files will works. I prefer to use UTF8 any way. 

#### Section structure

##### *filter* key: `function(relativePath, fileInfo)`

This function allow process only files within zip that you want. Realized directly by [JSZip.filter](https://stuk.github.io/jszip/documentation/api_jszip/filter.html).


If ommited: for section keys:
* string - files with extension where defined mime-charset ([mime.lookup(mime.charset(fileName))](https://www.npmjs.com/package/mime-types)) or xml or xml based extensions
* binary - all files which not string
* any other key - all files in archive

##### *callback* key: `function(content, relativePath)`

This call back must return changed or unchanged content, undefined or signature for remove this file from archive. 
* If content changed, target file will be repacked with new content. 
* If content unchanged or undefined will nothing changed.
* If `content === options.removeSignature` (default null), target file will be removed from archive.

If ommited, nothing changed.

##### *options* key : `{removeSignature: ...}`

Can override option removeSignature.

## function `processFile(file, options, callbacks)`

Works exactly like `process` function that received file name in first parameter: process zip archive file, and save result if nessesary.

## function `processContent(zipContent, options, callbacks)`

Received `zipContent` as binary and returns promise, where promise parameter is new packed content. Example will be added soon.

# Author

Alexander (mclander) Maksimenko , Sbertech, Moscow, Russia. 

Any comments and pull request will be appreciated.