(function(){

var tag = "Activity";
C.new("Activity", {
	frame: null,
	exec: function(data) {
		var t = this;
		return new Promise(function(r,e) {
			t.frame = new Layout.Frame();
			t.onCreate(data);
			
			var menuData = t.onBindMenu();
			t.frame.setContextActions(menuData);
			
			t.frame.show();
		});
	},
	onCreate: function(bundle) {
		L.warn(tag,"OnCreate not overrided. Nothing to do.");
	},
	onBindMenu: function() {
		return [];
	},
	setClosable: function(bool) {
		this.frame.swipeToClose = bool;
	},
	setHomeAction: function(icon, title, click) {
		this.frame.setHomeAction(icon,title,click);
	},
	setTitle: function(title) {
		this.frame.setTitle(title);
	},
	setContentView: function(view) {
		this.frame.setContentBox(view);
	},
	finish: function() {
		this.frame.close();
	}
});

})();







