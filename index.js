function createListenableMap(Map, _EventEmitter, inherit, runNext, isArray, isDefined, isDefinedAndNotNull, containerDestroyDeep, arryDestroyAll) {
  'use strict';

  function MapEventHandlerBase(name, cb, onlywhennotnull, singleshot) {
    this.name = name;
    this.cb = cb;
    this.onlywhennotnull = onlywhennotnull;
    this.singleshot = singleshot;
    this.listener = null;
  }
  MapEventHandlerBase.prototype.destroy = function () {
    if (this.listener) {
      runNext(this.listener.destroy.bind(this.listener));
    }
    this.listener = null;
    this.singleshot = null;
    this.onlywhennotnull = null;
    this.cb = null;
    this.name = null;
  };
  MapEventHandlerBase.prototype.trigger = function (name, val) {
    if (!this.cb) {
      return;
    }
    if (this.isNameOK(name)) {
      if (!isDefinedAndNotNull(val) && this.onlywhennotnull) {
        return;
      }
      this.emitData(name, val);
      if (this.singleshot) {
        this.destroy();
      }
    }
  };

  function StringMapEventHandler(name, cb, onlywhennotnull, singleshot) {
    MapEventHandlerBase.call(this, name, cb, onlywhennotnull, singleshot);
  }
  inherit(StringMapEventHandler, MapEventHandlerBase);
  StringMapEventHandler.prototype.isNameOK = function (name) {
    return this.name === name;
  };
  StringMapEventHandler.prototype.emitData = function (name, val) {
    if (this.cb) {
      this.cb(val);
    }
  };

  function RegexMapEventHandler(name, cb, onlywhennotnull, singleshot) {
    MapEventHandlerBase.call(this, name, cb, onlywhennotnull, singleshot);
  }
  inherit(RegexMapEventHandler, MapEventHandlerBase);
  RegexMapEventHandler.prototype.isNameOK = function (name) {
    return this.name.test(name);
  };
  RegexMapEventHandler.prototype.emitData = function (name, val) {
    if (this.cb) {
      this.cb(name, val);
    }
  };

  function MultiEventWaiter (listenablemap, names, cb, acceptnulls, data, index) {
    this.acceptnulls = acceptnulls;
    this.cb = cb;
    this.vals = data || new Array(names.length);
    this.index = index || 0;
    this.listeners = new Map();
    if (!this.cb) {
      this.destroy();
    } else {
      names.forEach(this.buildListener.bind(this, listenablemap));
      if (this.satisfied()) {
        runNext(this.cb.bind(null, this.vals, this));
      }
    }
    listenablemap = null;
  }
  MultiEventWaiter.prototype.destroy = function () {
    if (this.listeners) {
      runNext(containerDestroyDeep.bind(null,this.listeners));
    }
    this.listeners = null;
    this.index = null;
    this.vals = null;
    this.cb = null;
    this.acceptnulls = null;
  };
  MultiEventWaiter.prototype.buildListener = function (listenablemap, name, index) {
    if (!listenablemap) {
      this.destroy();
      return;
    }
    index += this.index;
    //console.log(listenablemap.get(name), '(', name, ') goes to index', index);
    this.vals[index] = listenablemap.get(name);
    this.listeners.add(name, listenablemap.changed.attach(this.satisfyName.bind(this, name, index)));
  };
  MultiEventWaiter.prototype.satisfied = function () {
    var checker, i;
    if (!this.listeners) {
      return false;
    }
    checker = this.acceptnulls ? isDefined : isDefinedAndNotNull;
    for (i=this.index; i<this.index + this.listeners.count; i++){
      if (!checker(this.vals[i])){
        return false;
      }
    }
    return true;
    //return this.acceptnulls ? this.vals.every(isDefined) : this.vals.every(isDefinedAndNotNull);
  };
  MultiEventWaiter.prototype.satisfyName = function (name, index, valname, val) {
    if (!this.cb) {
      name = null;
      index = null;
      return;
    }
    if (name !== valname) {
      name = null;
      index = null;
      return;
    }
    var isval = this.acceptnulls ? isDefined(val) : isDefinedAndNotNull(val);
    //console.log(val, '(', name, ') updates index', index);
    this.vals[index] = val;
    if (isval && this.satisfied()) {
      this.cb(this.vals, this);
    }
    name = null;
    index = null;
  };

  function EventSpreader(listenablemap, names, cb, acceptnulls) {
    this.cb = cb;
    this.waiter = new MultiEventWaiter(listenablemap, names, this.onMulti.bind(this), acceptnulls);
  }
  EventSpreader.prototype.destroy = function () {
    if (this.waiter) {
      this.waiter.destroy();
    }
    this.waiter = null;
    this.cb = null;
  };
  EventSpreader.prototype.onMulti = function (multis, waiter) {
    this.cb.apply(null, multis);
  };

  function MultiMultiEventWaiter (multis, cb) {
    this.cb = cb;
    this.data = [];
    this.multis = multis.map(function() {return null;});
    multis.forEach(this.buildMulti.bind(this));
    //this.trigger();
  }
  MultiMultiEventWaiter.prototype.destroy = function () {
    if (this.multis) {
      runNext(arryDestroyAll.bind(null,this.multis));
    }
    this.multis = null;
    this.data = null;
    this.cb = null;
  };
  MultiMultiEventWaiter.prototype.buildMulti = function (multidesc, index) {
    var nameslen = multidesc.names.length, startindex = this.data.length;
    this.data.push.apply(this.data, new Array(nameslen));
    this.multis[index] = (new MultiEventWaiter(multidesc.map, multidesc.names, this.trigger.bind(this), multidesc.acceptnulls, this.data, startindex));
  };
  function satisfied(m) {
    return m && m.satisfied();
  }
  MultiMultiEventWaiter.prototype.trigger = function () {
    if (!this.multis) {
      return;
    }
    if (this.multis.every(satisfied)){
      //console.log('MultiMultiEventWaiter finds all ok on', this.multis);
      this.cb(this.data, this);
    }
  };


  function ListenableMap() {
    Map.call(this);
    this.changed = new _EventEmitter();
  }
  inherit(ListenableMap, Map);
  ListenableMap.prototype.destroy = function () {
    if (this.changed) {
      this.changed.destruct();
    }
    this.changed = null;
    Map.prototype.destroy.call(this);
  };
  ListenableMap.prototype.add = function (name, val) {
    var ret = Map.prototype.add.call(this, name, val);
    if (this.changed) {
      this.changed.fire(name, val);
    }
    return ret;
  };
  ListenableMap.prototype.replace = function (name, val) {
    var ret = Map.prototype.replace.call(this, name, val);
    if (isDefined(ret) && this.changed) {
      this.changed.fire(name, val);
    }
    return ret;
  };
  ListenableMap.prototype.remove = function (name) {
    var ret = Map.prototype.remove.call(this, name);
    if (this.changed) {
      this.changed.fire(name);
    }
    return ret;
  };
  ListenableMap.prototype.listenFor = function (name, cb, onlywhennotnull, singleshot) {
    //TODO only a String? what about Number?
    //TODO integrate checks
    if (!name) {
      throw new Error("name must be a string");
    }
    //TODO more type checking
    var meh = (name instanceof RegExp) ?
      new RegexMapEventHandler(name, cb, onlywhennotnull, singleshot)
      :
      new StringMapEventHandler(name, cb, onlywhennotnull, singleshot);
    meh.trigger(name, this.get(name));
    //TODO if not singleshot?
    meh.listener = this.changed.attach(meh.trigger.bind(meh));
    return meh;
  };
  ListenableMap.prototype.listenForMulti = function (names, cb, acceptnulls) {
    if (!isArray(names)) {
      throw new Error("names must be an Array");
    }
    //TODO more type checking
    return new MultiEventWaiter(this, names, cb, acceptnulls);
  };
  ListenableMap.multiListenForMulti = function (listendescriptors, cb) { 
    // listendescriptors = 
    //   [
    //     {map: map1, names: names1, acceptnulls:true},
    //     {map: map2, names: names2 /*acceptnulls:false*/}
    //   ]
    return new MultiMultiEventWaiter(listendescriptors, cb);
  };
  ListenableMap.prototype.spread = function (names, cb, acceptnulls) {
    return new EventSpreader(this, names, cb, acceptnulls);
  };
  
  return ListenableMap;
}

module.exports = createListenableMap;
