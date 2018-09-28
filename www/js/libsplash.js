(function(){
	var css = ".splash {position: fixed; top: 0px; left: 0px; width: 100%; height: 100%; background: #fff; display: flex;"+
		"justify-content: center; align-items: center; font-family: Arial;}";
	
    var head = document.getElementsByTagName('head')[0];
    var s = document.createElement('style');
    s.setAttribute('type', 'text/css');
    if (s.styleSheet) {   // IE
        s.styleSheet.cssText = css;
    } else {                // the world
        s.appendChild(document.createTextNode(css));
    }
    head.appendChild(s);

	var Splash = {};
	window.Splash = Splash;

	Splash.image = function(src) {
		var s = document.createElement('div');
		s.className = "splash";
		s.innerHTML = '<img src="'+src+'"/>';
		document.body.appendChild(s);
	};
	
	Splash.message = function(msg) {
		var s = document.createElement('div');
		s.className = "splash";
		s.innerHTML = msg;
		document.body.appendChild(s);
	};
	
})();
