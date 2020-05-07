
# CIFLoader3
**CIF-File Loader for Three.js**  
[![npm version](https://badge.fury.io/js/cifloader3.svg)](https://badge.fury.io/js/cifloader3)

CIF-Files are file containing crystallographic information about molecules (which can be obtained here: [CCDC](https://www.ccdc.cam.ac.uk/))

## Install

    npm install cifloader3

 ***Notice:***
If you're using it in Nuxt.js like me don't forget to transpile three and cifloader3

    build: {
    transpile: ['three', 'cifloader3']
    }

## Usage
```javascript
	import  *  as  THREE  from  'three'
	import { CIFLoader } from  'cifloader3'
	var loader = new CIFLoader();
	loader.load(filename, function(cif) {
		//do stuff here
	},
	function(xhr) {
		//show loading progress here
	},
	function(error) {
		//handle errors here
	});
```
For further information have a look at the three.js examples directory: [THREE](https://github.com/mrdoob/three.js)
	

