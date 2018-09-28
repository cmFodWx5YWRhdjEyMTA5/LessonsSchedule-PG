window.Layout = (function() {
	var Layout = {}, frameTrace = [];
	
	// Default style
	Layout.color = "#09F";
	Layout.useLocale = false;
	Layout.locale = null;

	// Utilites
	var addLTAction = function(b,f){
		var t = null;
		b.addEventListener("touchstart",function(){
			t = setTimeout(f,500);
		});
		b.addEventListener("touchend",function(){
			clearTimeout(t);
		});
	};
	
 	var mkBlock = function(params) {
		if(!params) return;
		var d = document.createElement(params.type);
		if(params.cn) d.className = params.cn;
		if(params.id) d.id = params.id;
		if(params.title) d.title = params.title;
		if(params.onclick) d.onclick = params.onclick;

		if(typeof params.inner == 'string') d.innerHTML = params.inner;
		else if(typeof params.inner == 'object' && params.inner != null) d.appendChild(params.inner);

		if(params.contents) for(var a in params.contents) {
			var b = mkBlock(params.contents[a]);
			d.appendChild(b);
			d[a] = b;
		}
		
		if(params.appendTo) params.appendTo.appendChild(d);

		return d;
	}

	// Some technical tools: touch blocker
	var touchLocker = mkBlock({type: "div", cn: "layout-locker"});
	var touchOff = function() { document.body.appendChild(touchLocker); };
	var touchOn = function() { touchLocker.remove(); };
	
	// ActionBack
	Layout.Back = function() {
		for(var i = frameTrace.length-1; i >= 0; i--) if(frameTrace[i] !== null) {
			if(!frameTrace[i].swipeToClose && !frameTrace[i].dialog) continue;
			frameTrace[i].close();
			return true;
		}
		navigator.app.exitApp();
		return false;
	};
	
	document.addEventListener("backbutton", Layout.Back, false);

	// Windows
	Layout.Frame = function() {
		var t = this;
		var td = {status: false};

		// Default config
		t.ioAnimation = true;
		t.swipeToClose = true;

		// Create frame block
		t.root = mkBlock({ type: "div", cn: "layout-frame-root hidden", contents: {
			container: {type: "div", cn: "layout-frame-container", contents: {
				header: {type: "div", cn: "layout-frame-header unselectable", contents: {
					lefthand: {type: "div", cn: "header-icobutton hidden"},
					titlebox: {type: "div", cn: "header-title"},
					righthand: {type: "div", cn: "header-box hidden"}
				}},
				main: {type: "div", cn: "layout-frame-main"},
				dragger: {type: "div", cn: "layout-dragger"}
			}}
		} });
		t.root.header = t.root.container.header;
		t.root.main = t.root.container.main;

		t.root.container.dragger.ontouchstart = function(e){
			if(!t.swipeToClose) return;
			var p = e.targetTouches[0];
			if(p.pageX < 30) {
				td.status = true;
			}
		};
		t.root.container.dragger.ontouchmove = function(e){
			if(!td.status) return;
			var p = e.targetTouches[0];
			t.root.style.left = p.pageX+"px";
		};
		t.root.container.dragger.ontouchend = function(e){
			var r = t.root;
			if(!td.status) return;
			td.status = false;
			var p = e.changedTouches[0];
			r.style.transition = "left .25s";
			if(p.pageX > 60) r.style.left = "110%";
			else r.style.left = "";
			setTimeout(function(){
				r.style.transition = "";
				if(p.pageX > 60) r.remove()
			},250);
		};
		
		// Show/Hide functions
		t.show = function() {
			touchOff();
			var r = this.root;
			if(this.ioAnimation) r.style.transition = "left 0.35s";
			else r.style.transition = "";
			document.body.appendChild(this.root);
			this.ftid = frameTrace.length;
			frameTrace[this.ftid] = this;
			setTimeout(function(){
				r.classList.remove("hidden");
				setTimeout(function(){
					touchOn();
	 			 	r.style.transition = "";
				},350);
			},15);
		};
		this.close = function() {
			touchOff();
			var r = this.root;
			if(this.ioAnimation) r.style.transition = "left 0.25s";
			else r.style.transition = "";
			r.style.left = "100%";
			frameTrace[this.ftid] = null;
			setTimeout(function(){
				r.remove();
				touchOn();
			}, 250);
		};
		
		// Header manipulations
		this.setTitle = function(title) {
			this.root.header.titlebox.innerHTML = title;
		};
		this.setHomeAction = function(icon, title, click) {
			var lefthand = this.root.header.lefthand;
			lefthand.style.color = Layout.color;
			lefthand.title = title;
			lefthand.classList.remove("hidden");
			lefthand.innerHTML = "<i class=\"material-icons\">"+icon+"</i>";
			lefthand.onclick = click;
			addLTAction(lefthand, function(){
				Layout.TopToast(lefthand.title);
			});
		};
		this.setContextActions = function(items) {
			var root = this.root.header.righthand;
			root.innerHTML = "";
			root.style.color = Layout.color;
			for(var a in items) {
				(function(){
					var b = mkBlock({type: "div", cn: "header-icobutton", appendTo: root,
						inner: "<i class=\"material-icons\">"+items[a][0]+"</i>",
						title: items[a][1], onclick: items[a][2]});
					
					addLTAction(b, function(){
						Layout.TopToast(b.title);
					});
				})();
			}
		};
		
		// Content manipulations
		this.setContentBox = function(box) {
			this.root.main.innerHTML = "";
			this.root.main.appendChild(box);
		}
	};
	Layout.Dialog = function() {
		var root = mkBlock({type: "div", cn: "layout-dialog hidden unselectable"});
		this.container = mkBlock({type: "div", cn: "dialog-root", appendTo: root});
		this.dialog = true;
		this.show = function() {
			touchOff();
			document.body.appendChild(root);
			this.ftid = frameTrace.length;
			frameTrace[this.ftid] = this;
			setTimeout(function(){
				root.classList.remove("hidden");
				setTimeout(function(){touchOn()}, 500);
			},50);
		};
		this.close = function() {
			root.classList.add("hidden");
			setTimeout(function(){root.remove();}, 500);
			frameTrace[this.ftid] = null;
		};
	};

	// Fast dialogs
	Layout.Alert = function(msg) {
		var dialog = new Layout.Dialog();
		dialog.container.appendChild(mkBlock({type: "p", inner: msg}));
		dialog.container.appendChild(Layout.FlatButton({text: (Layout.useLocale ? Layout.locale.ok : "Ok"), onclick: function(){dialog.close();}}));
		dialog.show();
	};
	Layout.Confirm = function(msg, f, nf) {
		var dialog = new Layout.Dialog();
		dialog.container.appendChild(mkBlock({type: "p", inner: msg}));
		dialog.container.appendChild(Layout.FlatButton({text: (Layout.useLocale ? Layout.locale.ok : "Ok"), onclick: function(){f();dialog.close();}}));
		dialog.container.appendChild(Layout.FlatButton({text: (Layout.useLocale ? Layout.locale.cancel : "Cancel"), onclick: function(){dialog.close();if(nf)nf();}}));
		dialog.show();
	};
	
	// Toasts
	Layout.TopToast = function(msg){
		var toast = mkBlock({type:"div",cn:"layout-toast-top unselectable", contents: {
			box: {type:"div", inner: msg}
		}});
		document.body.appendChild(toast);
		toast.onclick = function(){
			this.remove();
		};

		setTimeout(function(){
			toast.style.top = "0px";
			setTimeout(function(){
				toast.style.top = "";
				setTimeout(function(){toast.remove();},500);
			},5000);
		},50);
	};
	
	// Widgets
	Layout.FlatButton = function(data) {
		var b = mkBlock({type: "button", inner: data.text, onclick: data.onclick, cn: "layout-button-flat"});
		b.style.color = Layout.color;
		return b;
	};

	// Layouts
	Layout.BoxedLayout = function() {
		var boxes = {};
		var BoxedLayout = this;
		
		var rebuild = function() {
			var base = mkBlock({type: "div", cn: "boxed-container-small"});
			var large = mkBlock({type: "div", cn: "boxed-container-large", contents: {
				left: {type: "div"},
				right: {type: "div"}
			}});
			var sw = false;
			
			for(var a in boxes) {
				var box = mkBlock({type: "div", cn: "boxed-boxframe"});
				if(boxes[a].title) box.header = mkBlock({type: "div", cn: "layout-section-header",
														inner: boxes[a].title, appendTo: box});
				
				box.container = mkBlock({type: "div", cn: "layout-section", inner: boxes[a].content,
										appendTo: box});
				
				base.appendChild(box);

				if(sw) large.right.appendChild(box.cloneNode(true));
				else large.left.appendChild(box.cloneNode(true));
				sw = !sw;
			}
			
			BoxedLayout.container.innerHTML = "";
			BoxedLayout.container.appendChild(base);
//			BoxedLayout.container.appendChild(large);
		}
		
		this.container = mkBlock({type: "div", cn: "layout-boxed unselectable"});
		this.add = function(id, title, content) {
			if(!content) content = mkBlock({type: "div"});
			var box = {title: title, content: content};
			boxes[id] = box;
			rebuild();
			return content;
		};
		this.remove = function(id) {
			delete boxes[id];
			rebuild();
		}
	};
	Layout.PagedLayout = function() {
		var T = this;
		var current = 0;
		var pages = [];
		var touchData = {};
		
		this.container = mkBlock({type: "div", cn: "layout-paged-root", contents: {
			roller: {type: "div", cn: "layout-paged-roller"}
		}});
		
		this.container.roller.ontouchstart = function(e) {
			touchData.direction = null;
			touchData.startX = e.targetTouches[0].pageX;
			touchData.startY = e.targetTouches[0].pageY;
			touchData.startPos = this.getBoundingClientRect().left;
		};
		this.container.roller.ontouchmove = function(e) {
			var rx = e.targetTouches[0].pageX-touchData.startX;
			var ry = e.targetTouches[0].pageY-touchData.startY;
			if(touchData.direction == null) {
				if( rx > 30 || rx < -30) touchData.direction = "h";
				else if( ry > 30 || ry < -30) touchData.direction = "v";
			}
			if(touchData.direction == "h") {
				e.stopPropagation();
				e.preventDefault();
				this.style.left = touchData.startPos+rx+"px";
			}
		};
		this.container.roller.ontouchend = function(e) {
			if(touchData.direction != "h") return;
			var ex = e.changedTouches[0].pageX;
			var newPage = current;
			if(ex < touchData.startX-75) newPage = current+1;
			else if(ex > touchData.startX+75) newPage = current-1;

			if(newPage == -1) newPage = 0;
			else if(newPage > pages.length-1) newPage = pages.length-1;
			openPage(newPage);
		}
	
		this.getCurrent = function() {return current;}
		this.add = function(title) {
			return mkPageBlock(title);
		};
		this.wipe = function() {
			pages = [];
			this.container.roller.innerHTML = "";
		};
		this.goTo = function(id) {openPage(id);}
		var openPage = function(id) {
			if(id < 0 || id > pages.length-1) return;
			var R = T.container.roller;
			R.style.transition = "left 0.25s";
			R.style.left = -(100*id)+"%";
			setTimeout(function(){
				R.style.transition = "";
			}, 250);
			current = id;
		};
		var mkPageBlock = function(title) {
			var id = pages.length;
			var b = mkBlock({type: "div", cn: "layout-paged-page", contents: {
				header: {type: "div", cn: "layout-paged-switch"},
				root: {type: "div", cn: "layout-paged-content"}
			}});
			b.header.appendChild(Layout.FlatButton({text: "<i class=\"material-icons\">keyboard_arrow_left</i>", onclick: function() {openPage(current-1);}}));
			b.header.appendChild(mkBlock({type: "div", cn: "layout-paged-titlebox", inner: title}))
			b.header.appendChild(Layout.FlatButton({text: "<i class=\"material-icons\">keyboard_arrow_right</i>", onclick: function() {openPage(current+1);}}));
			pages[id] = b;
			pagePosUpdate(id);
			T.container.roller.appendChild(b);
			return b.root;
		};
		var pagePosUpdate = function(id) {
			pages[id].style.left = (100*id)+"%";
		};
		
		openPage(0);
	};
	
	// ListView
	Layout.ListView = function() {
		var items = {};
		var view = this;
		var styler = Layout.ListStylers.Adaptive;
		
		var rebuild = function() {
			view.container.innerHTML = "";
			for(var a in items) {
				var i = styler(items[a]);
				if(i != false) view.container.appendChild(i);
			}
		}
		
		this.container = mkBlock({type: "div", cn: "layout-list-frame"});
		this.setStyler = function(s) {
			styler = s;
		}
		this.add = function(id, item) {
			items[id] = item;
			rebuild();
		};
		this.remove = function(id) {
			delete items[id];
			rebuild();
		};
	};
	Layout.ListStylers = {
		OneLineNoIcon: function(data) {
			var b = mkBlock({type: "div", onclick: data.onclick, inner: data.title, cn: "layout-list-one-noicon"});
			return b;
		},
		TwoLinesNoIcon: function(data) {
			return mkBlock({type: "div", cn: "layout-list-two-noicon", onclick: data.onclick, contents: {
				one: {type: "div", cn: "one", inner: data.title},
				two: {type: "div", cn: "two", inner: data.subtitle}
			}});
		},
        Adaptive: function(data) {
			var b = mkBlock({
                type: "div", 
                contents: {
                    icon: {type: "i", cn: "icon"},
                    main: {type: "div", cn: "main", contents: {
                        box_title: {type: "div", cn: "title", inner: data.title},
                        box_subtitle: {type: "div", cn: "subtitle", inner: data.subtitle},
                    }, onclick: data.onclick},
                    actions: {type: "div", cn: "actions"}
                },
                cn: "layout-list-adaptive"});

            if(data.actions) {
                for(var a in data.actions) mkBlock({type: "button", appendTo: b.actions,
                    inner: "<i class=\"material-icons\">"+data.actions[a][0]+"</i>",
                    title: data.actions[a][1],
                    onclick: data.actions[a][2]
                 });
            }
	    
	    if(data.color) {
		    b.main.box_title.style.color = data.color
	    }
            return b;
        }
	};

	// Context menu
	Layout.ContextMenu = function(data){
		var cm = mkBlock({type:"div",cn:"layout-contextmenu-root unselectable",contents:{
			menu: {type:"div"}
		}});

		cm.menu.classList.add(data.position);
		cm.onclick = function(){
			this.onclick = null;
			cm.style.opacity = 0;
			setTimeout(function(){
				cm.remove();
			},300);
		};
		
		for(var a in data.items) {
			var i = mkBlock({type:"div",cn:"cm-item", inner: data.items[a].name,
			onclick: data.items[a].click, appendTo: cm.menu});
		}
		
		document.body.appendChild(cm);
		setTimeout(function(){
			cm.style.opacity = 1;
		},100);
		return cm;
	};
	
	return Layout;
})();





















