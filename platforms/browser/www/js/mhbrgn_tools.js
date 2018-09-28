(function(){
	
	R.import({
		string: {
			show_log: "Show log", updateConfirm: "New version %vc aviable. Download it?"
		}
	});
	var strs = R.getStrings();
	
	var Mh = {};
	window.Mh = Mh;

	Mh.aboutDialog = function(appInfo) {
		var f = new Layout.Frame();
		f.setHomeAction("close","Close", function() {
			f.close();
		});
		
		var b = new Layout.BoxedLayout();
		f.setContentBox(b.container);
		
		// Create app box
		var appinfo = document.createElement("div");
		appinfo.className = "appinfo_about";
		
		var icon = document.createElement("img"),
			nameBox = document.createElement("header"),
			versionBox = document.createElement("div"),
			div = document.createElement("div");
		
		icon.src = appInfo.icon;
		nameBox.innerHTML = appInfo.name;
		versionBox.innerHTML = appInfo.version;
		
		div.appendChild(nameBox);
		div.appendChild(versionBox);
		
		appinfo.appendChild(icon);
		appinfo.appendChild(div);
		
		b.add("appinfo", null, appinfo);
		
		// Create tools box
		var tools = new Layout.ListView();
		tools.add("logcat", {title: strs.show_log, onclick:function() {
			var frame = new Layout.Frame();
			frame.setHomeAction("close","Close", function() {
				frame.close();
			});
			var code = document.createElement("pre");
			code.style.textSize = "10px";
			code.innerHTML = L.getLogcat();
			frame.setContentBox(code);
			frame.show();
		}});
		
		b.add("tools", "Tools", tools.container);
		
		f.show();
	};
	
})();

















