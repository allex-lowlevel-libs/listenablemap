var expect = require('chai').expect,
  Checks = require('allex_checkslowlevellib'),
  Destruction = require('allex_destructionlowlevellib')(Checks.isFunction,Checks.isArray,Checks.isNumber,Checks.isString),
  DListBase = require('allex_doublelinkedlistbaselowlevellib'),
  Inherit = require('allex_inheritlowlevellib')(Checks.isFunction,Checks.isString).inherit,
  Avl = require('allex_avltreelowlevellib')(DListBase,Inherit),
  Map = require('allex_maplowlevellib')(Avl,Inherit),
  EventEmitter = require('allex_eventemitterlowlevellib')(DListBase,Inherit,Checks.isFunction,Checks.isArrayOfFunctions),
  Fifo = require('allex_fifolowlevellib')(DListBase,Inherit),
  Timeout = require('allex_timeoutlowlevellib')(Checks.isFunction,Fifo),
  ListenableMap = require('..')(Map,EventEmitter,Inherit,Timeout.runNext,Checks.isArray,Checks.isDefined,Checks.isDefinedAndNotNull,Destruction.containerDestroyDeep,Destruction.arryDestroyAll);

describe('Basic \'Listenable Map\' lib testing', function(){
  function incFn(myObj,val){
    myObj.count++;
    if (!!val){
      myObj.lastValue = val;
    }else{
      myObj.lastValue = null;
    }
  }
  function decFn(myObj,val){
    myObj.count--;
    if (!!val){
      myObj.lastValue = val;
    }else{
      myObj.lastValue = null;
    }
  }

  it('listenFor (destroying onlywhennotnull = false listener)', function(){
    var lMap = new ListenableMap();
    var myObj = {count : 0,lastValue : null};
    var meh1,meh2;

    meh1 = lMap.listenFor('first',incFn.bind(null,myObj),true,false);
    expect(myObj.count).to.be.equal(0);
    expect(myObj.lastValue).to.be.null;

    meh2 = lMap.listenFor('first',incFn.bind(null,myObj),false,false);
    expect(myObj.count).to.be.equal(1);
    expect(myObj.lastValue).to.be.null;

    lMap.add('first',1);
    expect(myObj.count).to.be.equal(3); //!!!, +2 for 2 listeners!
    expect(myObj.lastValue).to.be.equal(1);

    meh2.destroy(); //only 1 listener now

    lMap.replace('first',2);
    expect(myObj.count).to.be.equal(4); //!!!, +1 for 1 listener!
    expect(myObj.lastValue).to.be.equal(2);

    lMap.replace('first',3);
    expect(myObj.count).to.be.equal(5); //!!!, +1 for 1 listener!
    expect(myObj.lastValue).to.be.equal(3);

    lMap.remove('first');
    expect(myObj.count).to.be.equal(5); //because listener is onlywhennotnull (true) !
    expect(myObj.lastValue).to.be.equal(3);

  });

  it('listenFor (destroying onlywhennotnull = true listener)', function(){
    var lMap = new ListenableMap();
    var myObj = {count : 0,lastValue : null};
    var meh1,meh2;

    meh1 = lMap.listenFor('first',incFn.bind(null,myObj),true,false);
    expect(myObj.count).to.be.equal(0);
    expect(myObj.lastValue).to.be.null;

    meh2 = lMap.listenFor('first',incFn.bind(null,myObj),false,false);
    expect(myObj.count).to.be.equal(1);
    expect(myObj.lastValue).to.be.null;

    lMap.add('first',1);
    expect(myObj.count).to.be.equal(3); //!!!, +2 for 2 listeners!
    expect(myObj.lastValue).to.be.equal(1);

    meh1.destroy(); //destroying onlywhennotnull=true listener now

    lMap.replace('first',2);
    expect(myObj.count).to.be.equal(4); //!!!, +1 for 1 listener!
    expect(myObj.lastValue).to.be.equal(2);

    lMap.replace('first',3);
    expect(myObj.count).to.be.equal(5); //!!!, +1 for 1 listener!
    expect(myObj.lastValue).to.be.equal(3);

    lMap.remove('first');
    expect(myObj.count).to.be.equal(6); //because listener is onlywhennotnull (true) !
    expect(myObj.lastValue).to.be.null;

  });

  it('listenFor (listening for 2 different properties)', function(){
    var lMap = new ListenableMap();
    var myObj = {count : 0,lastValue : null};
    var meh1,meh2;

    meh1 = lMap.listenFor('first',incFn.bind(null,myObj),true,false);
    expect(myObj.count).to.be.equal(0);
    expect(myObj.lastValue).to.be.null;

    meh2 = lMap.listenFor('second',decFn.bind(null,myObj),true,false);
    expect(myObj.count).to.be.equal(0);
    expect(myObj.lastValue).to.be.null;

    lMap.add('first',1);
    expect(myObj.count).to.be.equal(1); //!!!, +2 for 2 listeners!
    expect(myObj.lastValue).to.be.equal(1);

    lMap.add('second',2);
    expect(myObj.count).to.be.equal(0); //!!!, +2 for 2 listeners!
    expect(myObj.lastValue).to.be.equal(2);

    meh1.destroy(); //destroying onlywhennotnull=true listener now

    lMap.replace('first',-1);
    expect(myObj.count).to.be.equal(0); //!!!, +1 for 1 listener!
    expect(myObj.lastValue).to.be.equal(2);

    lMap.replace('second',-2);
    expect(myObj.count).to.be.equal(-1); //!!!, +1 for 1 listener!
    expect(myObj.lastValue).to.be.equal(-2);

    lMap.remove('first');
    expect(myObj.count).to.be.equal(-1); //because listener is onlywhennotnull (true) !
    expect(myObj.lastValue).to.be.equal(-2);

    lMap.remove('second');
    expect(myObj.count).to.be.equal(-1); //because listener is onlywhennotnull (true) !
    expect(myObj.lastValue).to.be.equal(-2);
  });
});
