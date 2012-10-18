/**
 * Sorted Fixed Array Class
 */
var SortedFixedArray = function(filter, size) {
    this.stack = [];
    this.size = size;
    this.insert = function(entry, i) {
        for(var j = Math.min(this.size - 1, this.stack.length); j > i; j--) {
            this.stack[j] = this.stack[j - 1];
        }
        this.stack[i] = entry;
    }
    this.put = function(entry) {
        if(this.stack.length) {
            for(var i = 0; i < this.stack.length; i++) {
                if(filter(entry, this.stack[i])) {
                    this.insert(entry, i);
                    break;
                }
            }
            if(
                (i == this.stack.length)
                && (this.stack.length < this.size)
            ) {
                this.insert(entry, i);
            }
        } else {
            this.insert(entry, 0);
        }
    };
};

var forp = function(stack) {
    var self = this;

    this.stack = stack; // RAW stack
    this.hstack = null; // hashed stack
    this.includes = null; // included files
    this.topCpu = null;
    this.topCalls = null;
    this.topMemory = null;
    this.console = null;
    this.found = {};

    // DOM Element wrapper
    var o = function(element)
    {
        this.element = element;
        this.bind = function(evType, fn) {
            if (this.element.addEventListener) {
                this.element.addEventListener(evType, fn, false);
            } else if (this.element.attachEvent) {
                var r = this.element.attachEvent("on"+evType, fn);
                return r;
            }
            return this;
        };
        this.append = function(o) {
            this.element.appendChild(o.element);
            return this;
        };
        this.appendTo = function(o) {
            o.append(this);
            return this;
        };
        this.addClass = function(c) {
            return this.attr("class", c)
        };
        this.text = function(t) {
            this.element.innerHTML = t;
            return this;
        };
        this.attr = function(attr, val) {
            var attr = document.createAttribute(attr);
            attr.nodeValue = val;
            this.element.setAttributeNode(attr);
            return this;
        };
        this.remove = function() {
            this.element.parentNode.removeChild(this.element);
        };
    };

    this.f = function(mixed)
    {
        if(typeof(mixed) == 'object') {
            return new o(mixed);
        } else {
            return new o(document.getElementById(id));
        }
    };

    this.c = function(tag, appendTo, inner, css)
    {
        var e = document.createElement(tag);
        if(inner) e.innerHTML = inner;
        if(appendTo) appendTo.append(new o(e));
        if(css) {
            var classAttr = document.createAttribute("class");
            classAttr.nodeValue = css;
            e.setAttributeNode(classAttr);
        }
        return new o(e);
    };

    this.aggregate = function()
    {
        if(!this.hstack) {
            // hashing stack
            var id;
            this.hstack = {};
            this.includes = {};
            for(var entry in this.stack) {
                id = (this.stack[entry].class) ? this.stack[entry].class + '::' : '';
                id += this.stack[entry].function;
                if(this.hstack[id]) {
                    this.hstack[id].calls ++;
                    this.hstack[id].usec =
                        parseInt(this.hstack[id].usec) +
                        (parseInt(this.stack[entry].usec) / 1000);
                    this.hstack[id].bytes += (Math.round((parseInt(this.stack[entry].bytes) / 1024)));// * 100) / 100);

                    var el = this.hstack[id].entries.length
                        ,filelineno = this.stack[entry].file
                        + (this.stack[entry].lineno ? ':' + this.stack[entry].lineno : '');
                    if(this.hstack[id].entries[filelineno]) {
                        this.hstack[id].entries[filelineno].calls++;
                        this.hstack[id].entries[filelineno].usec =
                            this.hstack[id].entries[filelineno].usec;
                            + (parseInt(this.stack[entry].usec) / 1000);
                        this.hstack[id].entries[filelineno].bytes += Math.round((parseInt(this.stack[entry].bytes) / 1024));
                    } else {
                        this.hstack[id].entries[filelineno] = {};
                        this.hstack[id].entries[filelineno].calls = 1;
                        this.hstack[id].entries[filelineno].usec =
                            (parseInt(this.stack[entry].usec) / 1000);
                        this.hstack[id].entries[filelineno].bytes = Math.round((parseInt(this.stack[entry].bytes) / 1024));
                        this.hstack[id].entries[filelineno].file = this.stack[entry].file;
                        this.hstack[id].entries[filelineno].filelineno = filelineno;
                        this.hstack[id].entries[filelineno].info = this.stack[entry].info ? this.stack[entry].info : '';
                    }

                } else {
                    this.hstack[id] = {};
                    this.hstack[id].id = id;
                    this.stack[entry].class &&
                        (this.hstack[id].class = this.stack[entry].class);
                    this.hstack[id].function = this.stack[entry].function;
                    this.hstack[id].level = this.stack[entry].level;
                    this.hstack[id].calls = 1;
                    this.hstack[id].usec = (parseInt(this.stack[entry].usec) / 1000);
                    this.hstack[id].bytes = (Math.round((parseInt(this.stack[entry].bytes) / 1024)));// * 100) / 100);

                    var filelineno = this.stack[entry].file
                        + (this.stack[entry].lineno ? ':' + this.stack[entry].lineno : '');
                    this.hstack[id].entries = [];
                    this.hstack[id].entries[filelineno] = {}
                    this.hstack[id].entries[filelineno].calls = 1;
                    this.hstack[id].entries[filelineno].usec = (parseInt(this.stack[entry].usec) / 1000);
                    this.hstack[id].entries[filelineno].bytes = Math.round((parseInt(this.stack[entry].bytes) / 1024));
                    this.hstack[id].entries[filelineno].file = this.stack[entry].file;
                    this.hstack[id].entries[filelineno].filelineno = filelineno;
                    this.hstack[id].entries[filelineno].info = this.stack[entry].info ? this.stack[entry].info : '';
                }

                if(!this.includes[this.stack[entry].file]) {
                    this.includes[this.stack[entry].file] = 1;
                } else {
                    this.includes[this.stack[entry].file]++;
                }
            }
        }
        return this;
    };

    this.getHStack = function()
    {
        return this.aggregate().hstack;
    }

    this.find = function(query)
    {
        if(!this.found[query]) {
            this.found[query] = [];
            for(var entry in this.getHStack()) {
                var r = new RegExp(query, "i");
                if(r.test(this.hstack[entry].id))
                this.found[query].push(this.hstack[entry]);
            }
        }
        return this.found[query];
    };

    this.getTopCalls = function()
    {
        if(!this.topCalls) {
            this.topCalls = new SortedFixedArray(
                function(a, b) {return (a.calls > b.calls);},
                20
            );

            for(var entry in this.getHStack()) {
                this.topCalls.put(this.hstack[entry]);
            }
        }
        return this.topCalls.stack;
    };

    this.getTopCpu = function()
    {
        if(!this.topCpu) {
            this.topCpu = new SortedFixedArray(
                function(a, b) {
                    a.usecavg = Math.round((a.usec / a.calls) * 1000) / 1000;
                    b.usecavg = Math.round((b.usec / b.calls) * 1000) / 1000;
                    return (a.usecavg > b.usecavg);
                },
                20
            );

            for(var entry in this.getHStack()) {
                this.topCpu.put(this.hstack[entry]);
            }
        }
        return this.topCpu.stack;
    };

    this.getTopMemory = function()
    {
        if(!this.topMemory) {
            this.topMemory = new SortedFixedArray(
                function(a, b) {
                    a.bytesavg = Math.round((a.bytes / a.calls) * 100) / 100;
                    b.bytesavg = Math.round((b.bytes / b.calls) * 100) / 100;
                    return (a.bytesavg > b.bytesavg);
                },
                20
            );

            for(var entry in this.getHStack()) {
                this.topMemory.put(this.hstack[entry]);
            }
        }
        return this.topMemory.stack;
    };

    this.getIncludes = function()
    {
        return this.aggregate().includes;
    };

    this.clear = function()
    {
        if(this.console) this.console.text("");
    };

    this.show = function(datas, func)
    {
        if(!this.console) {
            this.console = this.c("div").addClass("console");
            this.window.append(this.console);
            var aCollapse = this.c("a")
                .text("^")
                .attr("href", "#")
                .appendTo(this.nav)
                .bind(
                    'click',
                    function(e) {
                        self.console.remove();
                        self.console = null;
                        aCollapse.remove();
                    }
                );
        }
        this.console.append(func(datas));
    };

    // Init
    this.window = this
        .c("div")
        .attr("id", "forp");

    document.body.appendChild(this.window.element);

    this.nav = this
        .c("nav")
        .appendTo(this.window);

    var iSearch = this.c("input")
        , aFull = this.c("a")
        , aTopCpu = this.c("a")
        , aTopMemory = this.c("a")
        , aTopCalls = this.c("a")
        , aFiles = this.c("a");

    this.nav.append(new o(document.createTextNode(
        Math.round((this.stack[0].usec / 1000) * 100) / 100 + 'ms ')
    ));
    this.nav.append(new o(document.createTextNode(
        Math.round((this.stack[0].bytes / 1024) * 100) / 100 + 'Kb')
    ));

    aFull
        .text("Full stack")
        .attr("href", "#")
        .appendTo(this.nav)
        .bind(
            'click',
            function() {
                self.clear();
                self.show(
                    self.stack
                    , function(datas) {
                        var t = self.c("table").addClass("tree")
                            ,tr = self.c("tr", t);

                        self.c("th", tr, "ms");
                        self.c("th", tr, "Kb");
                        self.c("th", tr, "tree");

                        for(var i in datas) {
                            var id = ''
                                , tr = self.c("tr", t);

                            self.c("td", tr, (Math.round(100 * (datas[i].usec / 1000)) / 100) + '', 'numeric');
                            self.c("td", tr, (Math.round(1000 * datas[i].bytes / 1024) / 1000) + '', 'numeric');

                            for (var j = 0; j < datas[i].level; ++j) {
                                if (j == datas[i].level - 1) id += "&nbsp;&nbsp;|----&nbsp;&nbsp;";
                                else id += "&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;";
                            }
                            id += (datas[i].class) ? datas[i].class + '::' : '';
                            id += datas[i].function;

                            self.c("td", tr, id);
                        }
                        return t;
                    }
                );
            }
        );

    aTopCalls
        .text("Calls")
        .attr("href", "#")
        .appendTo(this.nav)
        .bind(
            'click',
            function(e) {
                self.clear();
                self.show(
                    self.getTopCalls()
                    , function(datas) {
                        var t = self.c("table")
                            ,tr = self.c("tr", t);
                        self.c("th", tr, "function");
                        self.c("th", tr, "calls");
                        self.c("th", tr, "ms");
                        self.c("th", tr, "Kb");
                        self.c("th", tr, "called from");
                        for(var i in datas) {
                            tr = self.c("tr", t);
                            self.c("td", tr, datas[i].id);
                            self.c("td", tr, datas[i].calls, "numeric");
                            self.c("td", tr, datas[i].usec, "numeric");
                            self.c("td", tr, datas[i].bytes + '', "numeric");

                            for(var j in datas[i].entries) {
                                tr = self.c("tr", t);
                                self.c("td", tr, datas[i].entries[j].info, "sub");
                                self.c("td", tr, datas[i].entries[j].calls, "sub numeric");
                                self.c("td", tr, datas[i].entries[j].usec, "sub numeric");
                                self.c("td", tr, datas[i].entries[j].bytes + '', "sub numeric");
                                self.c("td", tr, datas[i].entries[j].filelineno, "sub");
                            }
                        }
                        return t;
                    }
                );
            }
        );

    aTopCpu
        .text("CPU")
        .attr("href", "#")
        .appendTo(this.nav)
        .bind(
            'click',
            function() {
                self.clear();
                self.show(
                    self.getTopCpu()
                    , function(datas) {
                        var t = self.c("table")
                            ,tr = self.c("tr", t);
                        self.c("th", tr, "function");
                        self.c("th", tr, "avg&nbsp;ms");
                        self.c("th", tr, "calls");
                        self.c("th", tr, "ms");
                        self.c("th", tr, "called from");
                        for(var i in datas) {
                            tr = self.c("tr", t);
                            self.c("td", tr, datas[i].id);
                            self.c("td", tr, datas[i].usecavg, "numeric");
                            self.c("td", tr, datas[i].calls, "numeric");
                            self.c("td", tr, datas[i].usec, "numeric");
                            self.c("td", tr, datas[i].filelineno);

                            for(var j in datas[i].entries) {
                                tr = self.c("tr", t);
                                self.c("td", tr, datas[i].entries[j].info, "sub");
                                self.c("td", tr, Math.round((1000 * datas[i].entries[j].usec) / datas[i].entries[j].calls) / 1000, "sub numeric");
                                self.c("td", tr, datas[i].entries[j].calls, "sub numeric");
                                self.c("td", tr, datas[i].entries[j].usec, "sub numeric");
                                self.c("td", tr, datas[i].entries[j].filelineno, "sub");
                            }
                        }
                        return t;
                    }
                );
            }
        );

    aTopMemory
        .text("Memory")
        .attr("href", "#")
        .appendTo(this.nav)
        .bind(
            'click',
            function() {
                self.clear();
                self.show(
                    self.getTopMemory()
                    , function(datas) {
                        var t = self.c("table")
                            ,tr = self.c("tr", t);
                        self.c("th", tr, "function");
                        self.c("th", tr, "avg&nbsp;Kb");
                        self.c("th", tr, "calls");
                        self.c("th", tr, "Kb");
                        self.c("th", tr, "called from");
                        for(var i in datas) {
                            tr = self.c("tr", t);
                            self.c("td", tr, datas[i].id);
                            self.c("td", tr, datas[i].bytesavg, "numeric");
                            self.c("td", tr, datas[i].calls, "numeric");
                            self.c("td", tr, datas[i].bytes + '', "numeric");
                            self.c("td", tr, datas[i].filelineno);

                            for(var j in datas[i].entries) {
                                tr = self.c("tr", t);
                                self.c("td", tr, datas[i].entries[j].info, "sub");
                                self.c("td", tr, (Math.round((1000 * datas[i].entries[j].bytes) / datas[i].entries[j].calls) / 1000) + '', "sub numeric");
                                self.c("td", tr, datas[i].entries[j].calls, "sub numeric");
                                self.c("td", tr, datas[i].entries[j].bytes + '', "sub numeric");
                                self.c("td", tr, datas[i].entries[j].filelineno, "sub");
                            }
                        }
                        return t;
                    }
                );
            }
        );

    aFiles
        .text("Files")
        .attr("href", "#")
        .appendTo(this.nav)
        .bind(
            'click',
            function() {
                self.clear();
                self.show(
                    self.getIncludes()
                    , function(datas) {
                        var t = self.c("table").addClass("tree")
                            ,tr = self.c("tr", t);

                        self.c("th", tr, "usage");
                        self.c("th", tr, "path");

                        for(var i in datas) {
                            var tr = self.c("tr", t);
                            self.c("td", tr, datas[i], 'numeric');
                            self.c("td", tr, i);
                        }
                        return t;
                    }
                );
            }
        );

    iSearch
        .attr("type", "search")
        .attr("autosave", "forp")
        .attr("results", 5)
        .attr("name", "forpSearch")
        .attr("placeholder", "Search forp")
        .appendTo(this.nav)
        .bind(
            'keyup',
            function() {
                self.clear();
                self.show(
                    self.find(this.value)
                    , function(datas) {
                        var t = self.c("table")
                            ,tr = self.c("tr", t);
                        self.c("th", tr, "function");
                        self.c("th", tr, "calls");
                        self.c("th", tr, "ms");
                        self.c("th", tr, "Kb");
                        self.c("th", tr, "called from");
                        for(var i in datas) {
                            tr = self.c("tr", t);
                            self.c("td", tr, datas[i].id);
                            self.c("td", tr, datas[i].calls, "numeric");
                            self.c("td", tr, datas[i].usec, "numeric");
                            self.c("td", tr, datas[i].bytes + '', "numeric");
                            self.c("td", tr, datas[i].filelineno);

                            for(var j in datas[i].entries) {
                                tr = self.c("tr", t);
                                self.c("td", tr, datas[i].entries[j].info, "sub");
                                self.c("td", tr, datas[i].entries[j].calls, "sub numeric");
                                self.c("td", tr, datas[i].entries[j].usec, "sub numeric");
                                self.c("td", tr, datas[i].entries[j].bytes + '', "sub numeric");
                                self.c("td", tr, datas[i].entries[j].filelineno, "sub");
                            }
                        }
                        return t;
                    }
                );
            }
        );
};

// static functions
var dom = {};
dom.ready = function(callback) {
    /* Internet Explorer */
    /*@cc_on
    @if (@_win32 || @_win64)
        document.write('<script id="ieScriptLoad" defer src="//:"><\/script>');
        document.getElementById('ieScriptLoad').onreadystatechange = function() {
            if (this.readyState == 'complete') {
                callback();
            }
        };
    @end @*/
    if (document.addEventListener) {
        /* Mozilla, Chrome, Opera */
        document.addEventListener('DOMContentLoaded', callback, false);
    } else if (/KHTML|WebKit|iCab/i.test(navigator.userAgent)) {
        /* Safari, iCab, Konqueror */
        var DOMLoadTimer = setInterval(function () {
            if (/loaded|complete/i.test(document.readyState)) {
                callback();
                clearInterval(DOMLoadTimer);
            }
        }, 10);
    } else {
        /* Other web browsers */
        window.onload = callback;
    }
};

dom.ready(
    function(){
        var s = document.createElement('style'),
            t = document.createTextNode('\n\
#forp {\n\
    margin: 10px;\n\
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;\n\
    font-weight: 300;\n\
    text-rendering: optimizelegibility;\n\
    background-color: #EEE;\n\
    position:absolute; top:0px; right:0px; left:0px;\n\
    font-size : 13px;\n\
    border-radius: 5px;\n\
}\n\
#forp nav{\n\
    padding: 10px;\n\
}\n\
#forp a{\n\
    margin: 0px 5px;\n\
    padding: 5px;\n\
    background-color: #777;\n\
    color: #FFF;\n\
    text-decoration: none;\n\
    border-radius: 5px;\n\
}\n\
#forp table{\n\
    width: 100%;\n\
    border-collapse:collapse;\n\
}\n\
#forp .console{\n\
    border-top: 1px solid #999;\n\
}\n\
#forp th, #forp td{\n\
    padding: 5px\n\
}\n\
#forp th{\n\
    background-color : #DDD\n\
}\n\
#forp td{\n\
    text-align: right;\n\
    text-overflow: ellipsis;\n\
    text-align: left;\n\
    border: 1px solid #DDD;\n\
}\n\
#forp td.sub{\n\
    color:#009\n\
}\n\
#forp td.numeric{\n\
    text-align: right;\n\
}\n\\n\
');
        s.appendChild(t);
        (document.getElementsByTagName('head')[0]
            || document.getElementsByTagName('body')[0]).appendChild(s);

        new forp(forp.stack);
    }
);