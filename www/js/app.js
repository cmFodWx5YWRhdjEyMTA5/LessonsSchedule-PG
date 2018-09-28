(function(){

var tag = "LessonsSchedule";
var appInfo = /*<APPINFO>*/{
	"name": "Lessons Schedule",
	"icon": "icon.png",
	"versionCode": 2, "version": "1.1",
	"updateCheckURI": "https://lessons.mhgk.tk/js/app.js",
	"updateURI": "https://lessons.mhgk.tk/"
}/*</APPINFO>*/;


var strs = R.getStrings();
var defaultItems = {
	lessons: strs.defLessons,
	times: [[500,540],[545,585],[600,640],[655,695],[705,745],[755,795],[805,845],[855,895]]
};

var storage = {
	customLessons: false,
	customTimes: false,
	table: [],
	days: 5,
	init_complete: false
};

var saveStorage = function() {
	L.info(tag, "Saving settings...");
	localStorage.scheduleData = JSON.stringify(storage);
};

if(localStorage.scheduleData) {
	try {
		storage = JSON.parse(localStorage.scheduleData);
	} catch(e) {
		Splash.message("Load settings error.");
	}
}

window.storage = storage;

var prettifyTime = function(time) {
	var h = Math.floor(time/60)+"";
	if(h.length < 2) h = "0"+h;
	var m = time-(h*60)+"";
	if(m.length < 2) m = "0"+m;
	return h+":"+m;
};

var Data = {
	save: function(){
		saveStorage();
	},
	getPrettyTableContents: function() {
		var out = [], times = this.getTimes(), names = this.getLessons();
		for(var i = 0; i < storage.days; i++) {
			if(!storage.table[i]) storage.table[i] = [];
			var day = [], iday = storage.table[i];

			for(var j = 0; j < times.length; j++) {
				var lesson = {};
				lesson.lessonNo = j+1;
				lesson.num = j;
				lesson.day = i;
				lesson.startTime = prettifyTime(times[j][0]);
				lesson.endTime = prettifyTime(times[j][1]);
				lesson.startTimeMins = times[j][0];
				lesson.endTimeMins = times[j][1];
				if(iday[j]) {
					lesson.name = names[iday[j][0]];
					lesson.nameID = iday[j][0];
					lesson.auditory = iday[j][1];
				}
				day[j] = lesson;
			}
			out[i] = day;
		}
		return out;
	},
	getLessons: function() {
		if(storage.customLessons) return storage.lessons;
		return defaultItems.lessons;
	},
	getTimes: function() {
		if(storage.customTimes) return storage.times;
		return defaultItems.times;
	},
	remLesson: function(id) {
		if(!storage.customLessons) {
			storage.lessons = defaultItems.lessons;
			storage.customLessons = true;
		}
		storage.lessons[id] = undefined;
		this.save();
	},
	setTableItem: function(day,num,lesson,audit) {
		if(!storage.table[day]) storage.table[day] = [];
		if(!storage.table[day][num]) storage.table[day][num] = [];
		storage.table[day][num] = [lesson, audit];
		this.save();
	},
	setTime: function(id,t1,t2) {
		if(!storage.customTimes) {
			storage.times = defaultItems.times;
			storage.customTimes = true;
		}
		storage.times[id] = [t1,t2];
		this.save();
	},
	setName: function(id,name) {
		if(!storage.customLessons) {
			storage.lessons = defaultItems.lessons;
			storage.customLessons = true;
		}
		storage.lessons[id] = name;
		this.save();
	},
	remTime: function(id) {
		if(!storage.customTimes) {
			storage.times = defaultItems.times;
			storage.customTimes = true;
		}
		storage.times[id] = null;
		
		var newTimes = [];
		for(var a in storage.times) if(storage.times[a]) newTimes[newTimes.length] = storage.times[a];
		storage.times = newTimes;
		this.save();
	}
};

var fillPagedTable = function(paged,styler,showClear) {
	var data = Data.getPrettyTableContents(showClear);
	for(var i = 0; i < data.length; i++) {
		var listview = new Layout.ListView();
		listview.setStyler(styler);
		
		var day = data[i];
		for(var j = 0; j < day.length; j++) {
			listview.add("lesson"+j, day[j]);
		}
		
		var page = paged.add(strs["day"+i]);
		page.appendChild(listview.container);
	}
};

var getWeekDay = function() {
	var days = [6,0,1,2,3,4,5];
	return days[(new Date()).getDay()];
}; 

var getTime = function() {
	var d = new Date();
	return d.getHours()*60+d.getMinutes();
};

var getFilteredLessonsToday = function() {
	var lessons = Data.getPrettyTableContents()[getWeekDay()],
		out = [];
		
	for(var a in lessons) {
		if(typeof lessons[a].name == "string") out[out.length] = lessons[a];
	}

	return out;
};

var isWeekEnd = function() {
	var d = getWeekDay();
	if(d >= storage.days) return true;
	if(getFilteredLessonsToday().length == 0) return true;
	else return false;
};

var getActiveLesson = function() {
	var t = getTime(), l = getFilteredLessonsToday();
	for(var a in l) if(t > l[a].startTimeMins && t < l[a].endTimeMins) return l[a].num;
	return false;
};

var getCompletedLessonsCount = function() {
	var i = 0, t = getTime(), l = Data.getPrettyTableContents()[getWeekDay()];
	for(var a in l) if(t < l[a].endTimeMins) break;
	return parseFloat(a);
};

var getNearestLesson = function() {
	var t = getTime(), l = getFilteredLessonsToday();
	for(var a in l) if(t < l[a].startTimeMins) return l[a].num;
	return false;
}

var getStatusString = function() {
	if(isWeekEnd()) return strs.status_weekend;

	var a = getActiveLesson()
	if(a !== false) {
		var l = Data.getPrettyTableContents()[getWeekDay()][a];
		var m = l.endTimeMins-getTime();
		return strs.status_active.replace("%ln", l.name).replace("%m", m);
	}
	
	var b = getCompletedLessonsCount(), c = getNearestLesson();
	if(c === false) return strs.status_complete;
	
	var l = Data.getPrettyTableContents()[getWeekDay()][c],
		ln = l.name, m = l.startTimeMins-getTime();
		
	return strs.status_before.replace("%ln", ln).replace("%m",m);
};

var shareStorage = function() {
	var h = "https://lessons.mhgk.tk/";
	if(h.indexOf("#") != -1) h = h.substr(0,h.indexOf("#"));
	if(h.indexOf("?") != -1) h = h.substr(0,h.indexOf("?"));
	var data = Base64.encode(JSON.stringify(storage));
	var link = h+"?a=import&d="+data;
	window.plugins.socialsharing.share(strs.share_info,null,null, link);
}

Layout.color = R.color.primary;

var importOverride = function() {
	Layout.Confirm(strs.importOverride, function() {
		delete localStorage.scheduleData;
		location.reload();
	});
}

C.new("MainActivity", {
	parent: "Activity",
	status: null,
	onCreate: function() {
		
		var t = this;
		this.setClosable(false);
		this.setTitle(strs.appName);

		var root = document.createElement("div");
		root.className = "flex-vertical";
		
		var statusBox = document.createElement("div");
		statusBox.className = "statusbox";
		statusBox.innerHTML = "<div><i class=\"material-icons\" style=\"color:"+Layout.color+"\">notifications</i></div>";
		var status = document.createElement("div");
		status.className = "status_text";
		status.innerHTML = "Error.";
		statusBox.appendChild(status);
		this.status = status;
		root.appendChild(statusBox);
		
		var pagerBox = document.createElement("div");
		pagerBox.style.flex = "1";
		root.appendChild(pagerBox);
		var pager = new Layout.PagedLayout();
		this.pager = pager;
		pager.container.style.flex = "1";
		pagerBox.appendChild(pager.container);

		this.update();
		this.pager.goTo(getWeekDay());
		this.setContentView(root);

		setInterval(function(){
			t.update();
		},30000);
		
		setTimeout(function(){
			var p = location.paramsObjectRead();
			if(p.a == "import") importOverride();
		},150);
	},
	update: function() {
		this.pager.wipe();
		this.status.innerHTML = getStatusString();
		fillPagedTable(this.pager, function(data) {
			if(!data.name) return false;
			var div = document.createElement("div");
			div.className = "viewer-item";
			div.innerHTML = "<a style=\"color:#555\">"+data.lessonNo+" "+data.startTime+"-"+data.endTime+"</a> "+data.name;
			if(data.auditory) div.innerHTML += "<a style=\"color:#555\"> ("+data.auditory+") </a>";
			if(data.day == getWeekDay()) if(getActiveLesson() != false) {
				if(data.num == getActiveLesson()) div.innerHTML += ' <i class="material-icons" style="font-size:12px;color:'+Layout.color+'">play_circle_outline</i>';
			} else if(getNearestLesson() != false) {
				if(data.num == getNearestLesson()) div.innerHTML += ' <i class="material-icons" style="font-size:12px;color:#777">play_circle_outline</i>';
			}
			
			return div;
		});
	},
	onBindMenu: function() {
		return [
			["share", strs.share, shareStorage],
			["settings", strs.settings, this.actionSettings]
		];
	},
	actionSettings: function() {
		C.SettingsActivity.exec();
	}
});

C.new("SettingsActivity", {
	parent: "Activity",
	onCreate: function() {
		var t = this;
		this.setTitle(strs.settings);
		this.setHomeAction("arrow_back", strs.back, function(){t.finish();});
		
		var boxed = new Layout.BoxedLayout(),
			list = new Layout.ListView();

		this.setContentView(boxed.container);
		boxed.add("settings_editor", strs.action_edit, list.container);
		
		list.add("edit_table",{title: strs.edit_table, onclick: this.action_edit_table});
		list.add("edit_times",{title: strs.edit_times, onclick: this.action_edit_times});
		list.add("edit_names",{title: strs.edit_names, onclick: this.action_edit_names});
		list.add("weekdays", {title: strs.settings_workdays, onclick: this.action_workdays})
		
		var list = new Layout.ListView();
		boxed.add("settings_advanced", strs.settings_other, list.container);
		
		list.add("wipe", {title: strs.wipe, onclick: this.action_wipe});
		list.add("about",{title: strs.about, onclick: function(){
			Mh.aboutDialog(appInfo);
		}});
	},
	action_edit_table: function() {
		C.TableEditorActivity.exec();
	},
	action_edit_times: function() {
		C.TimesEditActivity.exec();
	},
	action_edit_names: function() {
		C.NamesEditActivity.exec();
	},
	action_workdays: function() {
		var set = function(v) {
			storage.days = v;
			Data.save();
			C.MainActivity.update();
			f.close();
		};
		
		var f = new Layout.Frame();
		f.setHomeAction("close", "Close", function(){f.close();});
		var b = new Layout.BoxedLayout(), l = new Layout.ListView();
		b.add("main", strs.settings_workdays, l.container);
		
		l.add("5", {title: strs.wd_5, onclick: function() {set(5);}});
		l.add("6", {title: strs.wd_6, onclick: function() {set(6);}});
		l.add("7", {title: strs.wd_7, onclick: function() {set(7);}});
		
		f.setContentBox(b.container);
		f.show();
	},
	action_wipe: function(){
		Layout.Confirm(strs.wipeMessage, function() {
			delete localStorage.scheduleData;
			location.reload();
		})
	}
});

C.new("TableEditorActivity", {
	parent: "Activity",
	pager: null,
	onCreate: function() {
		var t = this;
		this.setTitle(strs.edit_table);
		this.frame.root.ontouchstart = null;
		this.frame.root.ontouchmove = null;
		this.frame.root.ontouchend = null;
		this.setHomeAction("arrow_back", strs.back, function(){t.finish();});
		this.update();
	},
	update: function() {
		var pager = new Layout.PagedLayout();
		fillPagedTable(pager, function(data) {
			var div = document.createElement("div");
			div.className = "editor-item unselectable";
			div.innerHTML = "<a style=\"color:#555\">"+data.lessonNo+" "+data.startTime+"-"+data.endTime+"</a> ";
			if(!data.name) div.innerHTML += "<a style=\"color:#555\">-- Nothing --</a>";
			else div.innerHTML += data.name;
			if(data.auditory) div.innerHTML += "<a style=\"color:#555\"> ("+data.auditory+") </a>";
			div.onclick = function() {
				C.TableItemEditActivity.exec(data);
			};
			return div;
		}, true);
		
		try {pager.goTo(this.pager.getCurrent());} catch(e) {L.warn(tag, e);}
		this.setContentView(pager.container);
		this.pager = pager;
	}
});

C.new("TimesEditActivity", {
	parent: "Activity",
	listbox: null,
	onCreate: function() {
		var t = this;
		this.setTitle(strs.edit_times);
		this.setHomeAction("arrow_back", strs.back, function(){t.finish();});

		var boxed = new Layout.BoxedLayout();
		this.listbox = boxed.add("list");
		var advanced = boxed.add("adv", strs.advanced_settings)

		this.setContentView(boxed.container);
		this.update();

		var list = new Layout.ListView();
		advanced.appendChild(list.container);
		list.add("new", {title: strs.addtime, onclick: function(){
			var id = Data.getTimes().length;
			Data.setTime(id,0,0);
			t.update();
		}});
	},
	update: function() {
		var add = function(a, data) {list.add(a, {
			title: (parseFloat(a)+1)+" "+prettifyTime(data[0])+"-"+prettifyTime(data[1]),
			onclick: function() {
				C.TimeEditor.exec(a);
			}, actions: [["delete",strs.delete,function() {
                Data.remTime(a);
                C.TimesEditActivity.update();
                C.MainActivity.update();
            }]]
		});};
		var list = new Layout.ListView(), times = Data.getTimes();

		for(var a in times) add(a, times[a]);

		this.listbox.innerHTML = "";
		this.listbox.appendChild(list.container);
	}
});

C.new("TableItemEditActivity",{
	parent: "Activity",
	lessonID: -1,
	lessonAuditory: -1,
	day: -1, num: -1,
	onCreate: function(data) {
		var t = this;
		console.log(data);
		this.day = data.day;
		this.num = data.num;
		this.lessonID = data.nameID;
		this.lessonAuditory = data.auditory;
		this.setHomeAction("check", strs.close, function(){t.saveAndExit();});

		var boxed = new Layout.BoxedLayout();
		var primary = boxed.add("primary", strs.select_cab);
		this.names = boxed.add("names",strs.select_name);
		this.setContentView(boxed.container);
		this.update();

		var input = document.createElement("input");
		if(data.auditory) input.value = data.auditory;
		input.className = "auditory_input";
		input.setAttribute("placeholder",strs.auditory_holder);
		input.onkeyup = function() {
			t.lessonAuditory = this.value;
		};
		primary.appendChild(input);
	},
	update: function() {
		var list = new Layout.ListView(), t = this,
			data = Data.getLessons();

		list.add("none", {title: strs.none, onclick: function() {
			t.setLesson(-1);
		}, color: (t.lessonID == -1 ? R.color.primary : null)});

		var addToList = function(id) {
			if(!data[id]) return;
			list.add("id"+id, {title: data[id], onclick: function() {
				t.setLesson(id);
			}, color: (t.lessonID == id ? R.color.primary : null)});
		};

		for(var a in data) addToList(a);

		this.names.innerHTML = "";
		this.names.appendChild(list.container);
	},
	setLesson: function(id) {
		this.lessonID = id;
		this.update();
	},
	saveAndExit: function() {
		Data.setTableItem(this.day, this.num, this.lessonID, this.lessonAuditory);
		this.finish();
		try {C.MainActivity.update();} catch(e) {console.warn(e);}
		try {C.TableEditorActivity.update();} catch(e) {console.warn(e);}
	}
});

C.new("TimeEditor", {
	exec: function(id) {
		var dialog = new Layout.Dialog();
		
		var line1 = document.createElement("div"),
			line2 = document.createElement("div"),
			line3 = document.createElement("div");

		// Line1
		line1.className = "timeedit_line";
		var l1title = document.createElement("a"),
			l1input = document.createElement("input");

		l1input.type = "time";
		l1title.innerHTML = strs.start_time;
		line1.appendChild(l1title);
		line1.appendChild(l1input);

		// Line2
		line2.className = "timeedit_line";
		var l2title = document.createElement("a"),
			l2input = document.createElement("input");

		l2input.type = "time";
		l2title.innerHTML = strs.end_time;
		line2.appendChild(l2title);
		line2.appendChild(l2input);

		var times = Data.getTimes(), time = times[id];
		l1input.value = prettifyTime(time[0]);
		l2input.value = prettifyTime(time[1]);

		// Line3 (Buttons)
		var cancel = Layout.FlatButton({text: strs.cancel, onclick: function() {
			dialog.close();
		}});
		var ok = Layout.FlatButton({text: strs.ok, onclick: function() {
			var t1 = l1input.value.split(":"), t2 = l2input.value.split(":");
			t1 = parseFloat(t1[0])*60+parseFloat(t1[1]);
			t2 = parseFloat(t2[0])*60+parseFloat(t2[1]);
			Data.setTime(id,t1,t2);
			C.TimesEditActivity.update();
			C.MainActivity.update();
			dialog.close();
		}});
		line3.appendChild(cancel);
		line3.appendChild(ok);

		var c = dialog.container;
		c.appendChild(line1);
		c.appendChild(line2);
		c.appendChild(line3);
		dialog.show();

		return true;
	}
});

C.new("NamesEditActivity", {
	parent: "Activity",
	listbox: null,
	onCreate: function() {
		var t = this;
		this.setTitle(strs.edit_names);
		this.setHomeAction("arrow_back", strs.back, function(){t.finish();});

		var boxed = new Layout.BoxedLayout();
		this.listbox = boxed.add("list");
 		var advanced = boxed.add("adv", strs.advanced_settings);

		this.setContentView(boxed.container);
		this.update();

		var list = new Layout.ListView();
		advanced.appendChild(list.container);
		
		list.add("add", {title: strs.addtime, onclick: function() {
			var id = Data.getLessons().length;
			var d = new Layout.Dialog(),
				input = document.createElement("input"),
				div = document.createElement("div");
				
			input.className = "textInput";
				
			var cancel = Layout.FlatButton({text: strs.cancel, onclick: function(){d.close();}}),
				ok = Layout.FlatButton({text: strs.ok, onclick: function() {
					var newName = input.value;
					Data.setName(id,newName);
					d.close();
					C.MainActivity.update();
					C.NamesEditActivity.update();
				}});
			
			div.appendChild(cancel);
			div.appendChild(ok);
			d.container.appendChild(input);
			d.container.appendChild(div);
			
			d.show();
		}});
	},
	update: function() {
        var add = function(id,name) {
        	if(!name) return;
            list.add(id,{title: name, onclick: function() {
				var d = new Layout.Dialog(),
					input = document.createElement("input"),
					div = document.createElement("div");
					
				input.value = name;
				input.className = "textInput";
				
				var cancel = Layout.FlatButton({text: strs.cancel, onclick: function(){d.close();}}),
					ok = Layout.FlatButton({text: strs.ok, onclick: function() {
						var newName = input.value;
						Data.setName(id,newName);
						d.close();
						C.MainActivity.update();
						C.NamesEditActivity.update();
					}});
				
				div.appendChild(cancel);
				div.appendChild(ok);
				d.container.appendChild(input);
				d.container.appendChild(div);
				
				d.show();

            }, actions: [["delete",strs.delete,function() {
				Data.remLesson(id);
				C.MainActivity.update();
				C.NamesEditActivity.update();
            }]]});
        }

        var list = new Layout.ListView(), names = Data.getLessons();
        for(var a in names) add(a, names[a]);
        this.listbox.innerHTML = "";
        this.listbox.appendChild(list.container);
	}
});













})();





