# zip-process

Tiny module for easy modify & repack files in zip archives and zip-containers like Excel files.
Based on [JSZip](https://stuk.github.io/jszip/).

## Install

This is a [Node.js](https://nodejs.org/en/) module available through the
[npm registry](https://www.npmjs.com/). Installation is done using the
[`npm install` command](https://docs.npmjs.com/getting-started/installing-npm-packages-locally):

```sh
$ npm install zip-process
```

## API

Imagine that we have .xlsx file (zip container). And need to change all occurences 'John' to 'Fedor'. 
!Don't do that if not sure for avoid side-effects.

Node.js
```js

const zipProcess = require('zip-process');
const fs = require(fs);

// zipProcess options
const options = {}; // All default

// zipProcess calbacks (processors)
const callbacks = {	
  // We split binary && text processing, for binary use key 'binary', for text files 'string'
  string: { 
    // aplly path filter we need to check all .xml && .xml.rels files
    filter: relativePath =>  !!/\.xml(\.rels)?$/.test(relativePath),
			
    // just change it, and return new value
    callback: (data, zipFileName) =>  data && data.replace(/\bJohn\b/g, 'Fedor')
  }
}


fs.readFile('./john.xlsx', function(err, source) {

  if (err) { throw err; }

  zipProcess(source, options, callbacks).then( out => {

    const changed = source !== out;

    if (changed) {
      fs.writeFileSync('./fedor.xlsx', out);
    }

  }) ; // enf of zipProcess

}); // end of fs.readFile

```

VanillaJS with [FileSaver](https://github.com/eligrey/FileSaver.js/)
``` js

var xhr = new XMLHTTPRequest();
xhr.open("GET", './john.xlsx', true);
xhr.responseType = 'arraybuffer';
xhr.addEventListener('load',function(){
if (xhr.status === 200){
  zipProcess(xhr.response, {}, {
    string: {
      filter: relativePath =>  !!/\.xml(\.rels)?$/.test(relativePath),
      callback: data =>  data && data.replace(/\bJohn\b/g, 'Fedor')
    }
  }).then((result) => {

   FileSaver.saveAs(
    result 
    'fedor.xlsx',
    true
   );

});
  }
})
xhr.send();
```

As your might guess, I wrote this module special for work with Excel files, but other types of zip works fine too ;)


## function `zipProcess(content, options, callbacks)`

Process zip content (binary) and returns promise. Where promise get in parameter new packed content. 

### content parameter

Zip file content (readed as binary).

### options parameter

If ommited, blank or undefined default options used.

Awailable options:
* removeSignature: Remove file if callback return exactly signature (default null)
* compression: compress file 'DEFLATE' or not 'STORE' (default 'DEFLATE') as options.compession in [JSZip.generateAsync](https://stuk.github.io/jszip/documentation/api_jszip/generate_async.html)
* extendOptions : all other options for options in [JSZip.generateAsync](https://stuk.github.io/jszip/documentation/api_jszip/generate_async.html) (default {})
* type: (default: for Node application 'nodebuffer', for browser 'blob' ) as options.type in [JSZip.generateAsync](https://stuk.github.io/jszip/documentation/api_jszip/generate_async.html)

### callbacks parameter

Hash of {string, binary, ...} with same structure {filter, callback, options}:

``` js
{
  string: {
    filter: function(relativePath, fileInfo){ ... },
      callback: function(fileContent, relativePath, zipObject){ ... },
      options: { ... }
    },
    binary: {
      filter: ...
      callback: ...
      options: ...
    },
}
```


#### Section keys: `{string}`, `{binary}` and others

String section used for work with text files. This mean that this files will be decoded 
by [zipObject.async('string')](https://stuk.github.io/jszip/documentation/api_zipobject/async.html). So binary 
files will be decoded by [zipObject.async('unit8array')](https://stuk.github.io/jszip/documentation/api_zipobject/async.html). Hint! you can use any other key for section, it will be translated to [zipObject.async(<my section key>)](https://stuk.github.io/jszip/documentation/api_zipobject/async.html). Available types you can see in [JSZip documentation](https://stuk.github.io/jszip/documentation/api_zipobject/async.html).

Warning! I dont know how national encoded files will works. I prefer to use UTF8 any way. 

#### Section structure

##### `filter: function(relativePath, fileInfo)`

This function allow process only files within zip that you want. Realized directly by [JSZip.filter](https://stuk.github.io/jszip/documentation/api_jszip/filter.html).

If ommited, behaviour defined by section keys:
* string - files with extension where defined mime-charset ( [mime.lookup(mime.charset(fileName))](https://www.npmjs.com/package/mime-types) ) or xml or xml based extensions
* binary - all files which not string
* any other key - all files in archive

##### `callback: function(fileContent, relativePath, zipObject)`

If ommited, nothing changed.

This call back must return changed or unchanged content, undefined or signature for remove this file from archive. 
* If content changed, target file will be repacked with new content. 
* If content unchanged or undefined will nothing changed.
* If `content === options.removeSignature` (default null), target file will be removed from archive.

##### `options: {removeSignature: ...}`

Can override option removeSignature.

# webpack 1.x troubles

I use `mime-types`, which use `mime-db`, which includes json file directly to code. So If you have not
configure `json-loader` yet, just do it. 

# Author

Alexander (mclander) Maksimenko , Sbertech, Moscow, Russia. 

Any comments and pull request will be appreciated.