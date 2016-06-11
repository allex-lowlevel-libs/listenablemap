function createListenableMap(Map, _EventEmitter, inherit, runNext, isArray, isDefinedAndNotNull, containerDestroyDeep, arryDestroyAll) {
  'use strict';

  function MapEventHandler(name, cb, onlywhennotnull, singleshot) {
    this.name = name;
    this.cb = cb;
    this.onlywhennotnull = onlywhennotnull;
    this.singleshot = singleshot;
    this.listener = null;
  }
  MapEventHandler.prototype.destroy = function () {
    if (this.listener) {
      runNext(this.listener.destroy.bind(this.listener));
    }
    this.listener = null;
    this.singleshot = null;
    this.onlywhennotnull = null;
    this.cb = null;
    this.name = null;
  };
  MapEventHandler.prototype.trigger = function (name, val) {
    if (!this.cb) {
      return;
    }
    if (this.name === name) {
      if (!val && this.onlywhennotnull) {
        return;
      }
      this.cb(val);
      if (this.singleshot) {
        this.destroy();
      }
    }
  };

  function MultiEventWaiter (listenablemap, names, cb, data, index) {
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
    return this.vals.every(isDefinedAndNotNull);
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
    var isval = isDefinedAndNotNull(val);
    //console.log(val, '(', name, ') updates index', index);
    this.vals[index] = val;
    if (isval && this.satisfied()) {
      this.cb(this.vals, this);
    }
    name = null;
    index = null;
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
    this.multis[index] = (new MultiEventWaiter(multidesc.map, multidesc.names, this.trigger.bind(this), this.data, startindex));
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
    if (ret && this.changed) {
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
    if (!name) {
      throw Error("name must be a string");
    }
    var meh = new MapEventHandler(name, cb, onlywhennotnull, singleshot);
    meh.trigger(name, this.get(name));
    meh.listener = this.changed.attach(meh.trigger.bind(meh));
    return meh;
  };
  ListenableMap.prototype.listenForMulti = function (names, cb) {
    if (!isArray(names)) {
      throw Error("names must be an Array");
    }
    return new MultiEventWaiter(this, names, cb);
  };
  ListenableMap.multiListenForMulti = function (listendescriptors, cb) { 
    /*
    listendescriptors = [{map: map1, names: names1}, {map: map2, names: names2}]
    */
    return new MultiMultiEventWaiter(listendescriptors, cb);
  };
  
  return ListenableMap;
}

module.exports = createListenableMap;
