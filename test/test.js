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
  ListenableMap = require('..')(Map,EventEmitter,Inherit,Timeout.runNext,Checks.isArray,Checks.defined,Checks.isDefinedAndNotNull,Destruction.containerDestroyDeep,Destruction.arryDestroyAll);

describe('\'Listenable Map\' lib testing: listenFor', function(){
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

  it('Basic 1: destroying onlywhennotnull = false listener', function(){
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

    lMap.destroy();
  });

  it('Basic 2: destroying onlywhennotnull = true listener', function(){
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

    lMap.destroy();
  });

  it('Basic 3: listening for 2 different properties', function(){
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
    expect(myObj.count).to.be.equal(1);
    expect(myObj.lastValue).to.be.equal(1);

    lMap.add('second',2);
    expect(myObj.count).to.be.equal(0);
    expect(myObj.lastValue).to.be.equal(2);

    meh1.destroy();

    lMap.replace('first',-1);
    expect(myObj.count).to.be.equal(0);
    expect(myObj.lastValue).to.be.equal(2);

    lMap.replace('second',-2);
    expect(myObj.count).to.be.equal(-1);
    expect(myObj.lastValue).to.be.equal(-2);

    lMap.remove('first');
    expect(myObj.count).to.be.equal(-1);
    expect(myObj.lastValue).to.be.equal(-2);

    lMap.remove('second');
    expect(myObj.count).to.be.equal(-1);
    expect(myObj.lastValue).to.be.equal(-2);
    lMap.destroy();
  });

  it('Modifying map on callback (TODO)', function(){
    //TODO forbid to modify map on callback!
    var lMap = new ListenableMap();
    var myObj = {count : 0,lastValue : null};
    var meh1,meh2;

    function modifyFn(myObj, map, meh){
      myObj.count++;
      //map.replace('first',myObj.count++);
      if (myObj.count === 3){
        meh.destroy();
      }
    }

    meh1 = lMap.listenFor('first',modifyFn.bind(null,myObj,lMap,meh1),true,false);
    expect(myObj.count).to.be.equal(0);
    expect(myObj.lastValue).to.be.null;

    lMap.add('first',1);
    expect(myObj.count).to.be.equal(1);
    //TODO fix this
    //expect(myObj.lastValue).to.be.equal(1);

    lMap.destroy();
  });
});

describe('\'Listenable Map\' lib testing: listenForMulti', function(){
  function triggerFn(myObj,vals,mew){
    vals.forEach(function(val,index){
      if (!isNaN(val)){
        myObj.count += val;
      }
    });
  }
  it('Basic tests: (acceptnulls = false)', function(){
    var lMap = new ListenableMap();
    var myObj = {count:0};
    var mew1 = lMap.listenForMulti(['first','second'],triggerFn.bind(null,myObj),false);
    lMap.add('first',1); //not triggering!
    expect(myObj.count).to.be.equal(0);
    lMap.add('second',2); //triggering when every val isDefinedAndNotNull
    expect(myObj.count).to.be.equal(3);
    lMap.add('third',3); //not triggering because we are not listening for this property
    expect(myObj.count).to.be.equal(3);
    lMap.replace('first',null);
    expect(myObj.count).to.be.equal(3);
    lMap.destroy();
  });
  it('Basic tests: (acceptnulls = true)', function(){
    var lMap = new ListenableMap();
    var myObj = {count:0};
    var mew1 = lMap.listenForMulti(['first','second'],triggerFn.bind(null,myObj),true);
    lMap.add('first',1); //not triggering!
    expect(myObj.count).to.be.equal(0);
    lMap.add('second',2); //triggering when every val isDefinedAndNotNull
    expect(myObj.count).to.be.equal(3);
    lMap.add('third',3); //not triggering because we are not listening for this property
    expect(myObj.count).to.be.equal(3);
    lMap.replace('first',null);
    expect(myObj.count).to.be.equal(5);
    lMap.destroy();
  });
});

describe('\'Listenable Map\' lib testing: spread', function(){
  function triggerFn(myObj,firstVal,secondVal){
    if (!isNaN(firstVal) && !(isNaN(secondVal)) && firstVal !== null && secondVal !== null){
      myObj.count = (firstVal > secondVal) ? myObj.count + firstVal : myObj.count - secondVal;
    }else{
      myObj.count = -myObj.count;
    }
  }
  it('Basic tests: (acceptnulls = false)', function(){
    var lMap = new ListenableMap();
    var myObj = {count:0};
    var mew1 = lMap.spread(['first','second'],triggerFn.bind(null,myObj),false);
    lMap.add('first',1); //not triggering!
    expect(myObj.count).to.be.equal(0);
    lMap.add('second',2); //triggering when every val isDefinedAndNotNull
    expect(myObj.count).to.be.equal(-2);
    lMap.add('third',3); //not triggering because we are not listening for this property
    expect(myObj.count).to.be.equal(-2);
    lMap.replace('first',null);
    expect(myObj.count).to.be.equal(-2);
    lMap.destroy();
  });
  it('Basic tests: (acceptnulls = true)', function(){
    var lMap = new ListenableMap();
    var myObj = {count:0};
    var mew1 = lMap.spread(['first','second'],triggerFn.bind(null,myObj),true);
    lMap.add('first',1); //not triggering!
    expect(myObj.count).to.be.equal(0);
    lMap.add('second',2); //triggering when every val isDefinedAndNotNull
    expect(myObj.count).to.be.equal(-2);
    lMap.add('third',3); //not triggering because we are not listening for this property
    expect(myObj.count).to.be.equal(-2);
    lMap.replace('first',null);
    expect(myObj.count).to.be.equal(2);
    lMap.destroy();
  });
});

describe('\'Listenable Map\' lib testing: multiListenForMulti', function(){
  function triggerFnNotNull(myObj,vals,mmew){
    var i;
    for (i=0; i<vals.length; i++){
      myObj.count += vals[i];
    }
  }
  function triggerFnNull(myObj,vals,mmew){
    var i;
    for (i=0; i<vals.length; i++){
      if (!!vals[i] && !isNaN(vals[i])){
        myObj.count += vals[i];
      }
    }
  }
  it('Basic tests (acceptnulls = false)', function(){
    var lMap = new ListenableMap();
    var myObj = {count:0};
    // listendescriptors = 
    //   [
    //     {map: map1, names: names1, acceptnulls:true},
    //     {map: map2, names: names2 /*acceptnulls:false*/}
    //   ]
    var listendescriptors =
    [
      {map: lMap, names: ['first','second'], acceptnulls: false},
      {map: lMap, names: ['third','fourth'], acceptnulls: false}
    ];
    var mmew = ListenableMap.multiListenForMulti(listendescriptors,triggerFnNotNull.bind(null,myObj));
    lMap.add('first',1);
    expect(myObj.count).to.be.equal(0);
    lMap.add('second',2);
    expect(myObj.count).to.be.equal(0);
    lMap.add('third',3);
    expect(myObj.count).to.be.equal(0);
    lMap.add('fourth',4);
    expect(myObj.count).to.be.equal(10);
    lMap.destroy();
  });
  it('Basic tests (acceptnulls = true)', function(){
    var lMap = new ListenableMap();
    var myObj = {count:0};
    // listendescriptors = 
    //   [
    //     {map: map1, names: names1, acceptnulls:true},
    //     {map: map2, names: names2 /*acceptnulls:false*/}
    //   ]
    var listendescriptors =
    [
      {map: lMap, names: ['first','second'], acceptnulls: true},
      {map: lMap, names: ['third','fourth'], acceptnulls: true}
    ];
    var mmew = ListenableMap.multiListenForMulti(listendescriptors,triggerFnNull.bind(null,myObj));
    lMap.add('first',1);
    expect(myObj.count).to.be.equal(0);
    lMap.add('second',2);
    expect(myObj.count).to.be.equal(0);
    lMap.add('third',3);
    expect(myObj.count).to.be.equal(0);
    lMap.add('fourth',null);
    expect(myObj.count).to.be.equal(6);
    lMap.destroy();
  });
  it('Basic tests (acceptnulls = mixed)', function(){
    var lMap = new ListenableMap();
    var myObj = {count:0};
    // listendescriptors = 
    //   [
    //     {map: map1, names: names1, acceptnulls:true},
    //     {map: map2, names: names2 /*acceptnulls:false*/}
    //   ]
    var listendescriptors =
    [
      {map: lMap, names: ['first','second'], acceptnulls: false},
      {map: lMap, names: ['third','fourth'], acceptnulls: true}
    ];
    var mmew = ListenableMap.multiListenForMulti(listendescriptors,triggerFnNull.bind(null,myObj));
    lMap.add('first',1);
    expect(myObj.count).to.be.equal(0);
    lMap.add('second',2);
    expect(myObj.count).to.be.equal(0);
    lMap.add('third',3);
    expect(myObj.count).to.be.equal(0);
    lMap.add('fourth',null);
    expect(myObj.count).to.be.equal(6);
    lMap.destroy();
  });
  it('Basic tests (acceptnulls = mixed, different maps)', function(){
    var lMap = new ListenableMap();
    var lMap2 = new ListenableMap();
    var myObj = {count:0};
    // listendescriptors = 
    //   [
    //     {map: map1, names: names1, acceptnulls:true},
    //     {map: map2, names: names2 /*acceptnulls:false*/}
    //   ]
    var listendescriptors =
    [
      {map: lMap, names: ['first','second'], acceptnulls: false},
      {map: lMap2, names: ['third','fourth'], acceptnulls: true}
    ];
    var mmew = ListenableMap.multiListenForMulti(listendescriptors,triggerFnNull.bind(null,myObj));
    lMap.add('first',1);
    expect(myObj.count).to.be.equal(0);
    lMap.add('second',2);
    expect(myObj.count).to.be.equal(0);
    lMap2.add('third',3);
    expect(myObj.count).to.be.equal(0);
    lMap2.add('fourth',null);
    expect(myObj.count).to.be.equal(6);
    lMap.destroy();
    lMap2.destroy();
  });
});

describe('\'Listenable Map\' lib testing: destroying', function(){
  it('Destroying inserted element (HINT)', function(){
    //TODO wiki: you should never do this. Ever.
    //Purpose of returning an element is to pass it to container when you need to remove it.
    //var lMap = new ListenableMap();
    //var elem = lMap.add('first',1); 
    //elem.destroy();
  });
});
