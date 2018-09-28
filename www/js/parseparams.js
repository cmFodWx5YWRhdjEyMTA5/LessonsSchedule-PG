/*
 * [jsGoodies/Other]
 * 
 * HashControl
 * Manage parameters in PHP (After ?) and in JS
 * 
 * [WARRING] After any modification of PHP parameters, 
 *           page will be reloaded! I can't fix it!
 *
 * EXAMPLE:
 * |-- http:\\localhost:80\index.htm?id=674124&theme=dark -----|
 * |-----------------------------------------------------------|
 * | {                                                         |
 * | 	"id":"674124",                                         |
 * | 	"theme":"dark"                                         |
 * | }                                                         |
 * |-----------------------------------------------------------|
 *
 * location
 * |- (...) 								- Basic JS variables and methods
 * |- paramsPhpMode							- boolean, Use PHP Mode if true
 * |- paramsObjectRead()					- Return object of parameters
 * |- paramsObjectWrite(object params)		- Write object to URI
 * |- setParam(string param, string value)	- Set parameter and write object
 * |- getParam(string param)				- Return parameter value
 * |- removeParam(string param)				- Remove parameter and write object
 *
 * Michael Bergen (2017, update 2018)
 * https://github.com/bergen-miha
 */

location.paramsPhpMode = false;

location.paramsObjectRead = function(){
	// Check PHP Mode status
	var prefix = (location.paramsPhpMode ? '?' : '#');
	// Get hashes
	if(location.href.lastIndexOf(prefix) == -1) return {};
	var hash = location.href.substr(location.href.lastIndexOf(prefix)+1);
	// Checkout
	if(hash === '') return {};
	if(hash.indexOf('=') == -1) return {not_a_hash:true};
	if(location.paramsPhpMode && hash.indexOf("#") != -1) hash = hash.substr(0,hash.indexOf("#"));

	// Create object
	var arr = hash.split('&');
	var o = {};

	for(var i = 0; i < arr.length; i++) {
		var d = arr[i].split('=');
		o[d[0]] = d[1];
	}

	return o;
};

location.paramsObjectWrite = function(a){
	// Check PHP mode status
	var prefix = (location.paramsPhpMode ? '?' : '#');
	try {
		var line = '';

		for(var i in a) {
			line += i+'='+a[i]+'&';
		}

		line = line.substr(0,line.length-1);
		location.replace(prefix+line);
	} catch(e) {}
};

location.setParam = function(p,v) {
	var o = location.paramsObjectRead();
	o[p] = v;
	location.paramsObjectWrite(o);
};

location.getParam = function(p) {
	return location.paramsObjectRead()[p];
};

location.removeParam = function(p) {
	var o = location.paramsObjectRead();
	delete o[p];
	location.paramsObjectWrite(o);
};

