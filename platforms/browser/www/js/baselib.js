(function(){
	/*
	  Some tools.
	*/
	var cloneObject = function(i) {
		var o = {};
		for(var a in i) {
			o[a] = i[a];
			if(typeof a[i] == "object" && a[i] !== null) L.warn("CloneObject", "Cloning of object that contains subobjects. This can create some problems.");
		}
		return o;
	};
	
	/*
	  L - Log. Log recevier.
	*/
	var L = {}, logcat = "";
	window.L = L;
	L.getLogcat = function() {
		return logcat;
	};
	L.log = function(tag, msg) {
		var str = "L/"+tag+": "+msg;
		console.log(str);
		logcat += str+"\n";
	};
	L.info = function(tag, msg) {
		var str = "I/"+tag+": "+msg;
		console.info(str);
		logcat += str+"\n";
	};
	L.warn = function(tag, msg) {
		var str = "W/"+tag+": "+msg;
		console.warn(str);
		logcat += str+"\n";
	};
	L.err = function(tag, msg) {
		var str = "E/"+tag+": "+msg;
		console.error(str);
		logcat += str+"\n";
	};
	L.debug = function(tag, msg) {
		var str = "D/"+tag+": "+msg;
		logcat += str+"\n";
	};
	
	/*
	  C - Classes. Class subsystem for JS.
	*/
	var C = {};
	var CTag = "ClassSubsystem";
	window.C = C;
	
	C.new = function(name, contents) {
		L.debug(CTag, "Loading new class "+name+"...");
		if(C.name) L.warn(CTag, "Class "+name+" is already defined. Will be overrided.");
		
		// Read content properties
		var parent = contents.parent;
		
		// Remove properties from contents
		delete contents.parent;
		
		// Create new class root (or copy parent)
		var root = {};
		if(parent) {
			L.debug(CTag, "Class "+name+" uses parent class "+parent);
			if(!C[parent]) {
				L.err(CTag, "Parent class "+parent+" that is required by "+name+" not found. Class not imported!");
				return;
			}
			root = cloneObject(C[parent]);
		}
		
		// Copy items from contents to root
		for(var a in contents) root[a] = contents[a];
		
		// Add class to collection and exit
		C[name] = root;
	};
	
	/*
	  R - Resources. Strings, colors, configs
	*/
	var R = {};
	window.R = R;
	R.import = function(contents) {
		for(var a in contents) {
			if(!R[a]) R[a] = {};
			for(var b in contents[a]) R[a][b] = contents[a][b];
		}
	};
	R.getStrings = function(lang) {
		if(!lang) lang = navigator.language.substr(0,2);
		if(!R["string_"+lang]) return R.string;
		else return R["string_"+lang];
	};
	
	/*
		useLib - Load and start lib file
	*/
	window.useLib = function(libs) {return new Promise(function(resolve,reject) {
		var tag = "LibraryLoader";
		var i = 0, j = 0, ix = false, jx = false;
		if(typeof libs == "string") libs = [libs];
		L.info(tag, "Loading libraries: "+libs);
		
		var xhr = new XMLHttpRequest();
		var xhr2 = new XMLHttpRequest();
		xhr.onreadystatechange = function() {
			if(xhr.readyState == 4) {
				if(xhr.status == 200) {
					L.log(tag, "Loaded library "+libs[i]+". Executing...");
					eval(xhr.responseText);
					i++;
					if(i == libs.length) {
						ix = true;
						if(jx) resolve(1);
						return;
					}
					load();
				} else {
					L.err(tag, "Error loading library "+libs[i]);
					reject("Error loading library "+libs[i]);
				}
			}
		};
		xhr2.onreadystatechange = function() {
			if(xhr2.readyState == 4) {
				if(xhr2.status == 200) {
					L.log(tag, "Loaded stylesheet "+libs[j]+". Executing...");
					
					var css = xhr2.responseText;
				    var head = document.getElementsByTagName('head')[0];
				    var s = document.createElement('style');
				    s.setAttribute('type', 'text/css');
				    if (s.styleSheet) {   // IE
				        s.styleSheet.cssText = css;
				    } else {                // the world
				        s.appendChild(document.createTextNode(css));
				    }
				    head.appendChild(s);
    			}

				j++;
				if(j == libs.length) {
					jx = true;
					if(ix) resolve(1);
					return;
				}
				load2();
			}
		};

		var load = function() {
			xhr.open("GET", "lib/"+libs[i]+".js");
			xhr.send();
		};
		var load2 = function() {
			xhr2.open("GET", "lib/"+libs[j]+".css");
			xhr2.send();
		};
		
		load();
		load2();
	})};
	
	window.loadJS = function(libs) {return new Promise(function(resolve,reject) {
		var tag = "JSLoader";
		var i = 0;
		if(typeof libs == "string") libs = [libs];
		L.info(tag, "Loading files: "+libs);
		
		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function() {
			if(xhr.readyState == 4) {
				if(xhr.status == 200) {
					L.log(tag, "Loaded script "+libs[i]+". Executing...");
					eval(xhr.responseText);
					i++;
					if(i == libs.length) {
						resolve(1);
						return;
					}
					load();
				} else {
					L.err(tag, "Error loading script "+libs[i]);
					reject("Error loading script "+libs[i]);
				}
			}
		};

		var load = function() {
			xhr.open("GET", "js/"+libs[i]+".js");
			xhr.send();
		};

		load();
	})};

	window.loadCSS = function(libs) {return new Promise(function(resolve,reject) {
		var tag = "CSSLoader";
		var i = 0;
		if(typeof libs == "string") libs = [libs];
		L.info(tag, "Loading csses: "+libs);
		
		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function() {
			if(xhr.readyState == 4) {
				if(xhr.status == 200) {
					L.log(tag, "Loaded css "+libs[i]+". Executing...");
					var css = xhr.responseText;
				    var head = document.getElementsByTagName('head')[0];
				    var s = document.createElement('style');
				    s.setAttribute('type', 'text/css');
				    if (s.styleSheet) {   // IE
				        s.styleSheet.cssText = css;
				    } else {                // the world
				        s.appendChild(document.createTextNode(css));
				    }
				    head.appendChild(s);
					i++;
					if(i == libs.length) {
						resolve(1);
						return;
					}
					load();
				} else {
					L.err(tag, "Error loading css "+libs[i]);
					reject("Error loading css "+libs[i]);
				}
			}
		};

		var load = function() {
			xhr.open("GET", "css/"+libs[i]+".css");
			xhr.send();
		};

		load();
	})};})();


















