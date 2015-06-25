import r from 'rethinkdb';
import moment from 'moment';
import _ from 'lodash';
import uuid from 'uuid';
import async from 'async';
import {Transac, Event, Message, bless} from '../models';
import {TransacError} from '../helpers';

export function loadOrCreate(conn, options, cb){
  findOne(conn, options, (err, transac) => {
    if(err) return cb(err);
    if(!transac) return insertOne(conn, options, cb);
    if(transac.isLocked()) return cb(new TransacError('Transaction already locked', 'locked'));
    if(transac.isCompound() && options.compound){ options.transacId = transac.transacId }
    insertOne(conn, options, cb);
  });
}

// export to be tested
export function findOne(conn, options, cb){
  let query = r.table(Transac.collection).filter({label: options.label, type: 'transac'});

  if(options.valueDate){
    let from = moment(options.valueDate).startOf('day').toDate()
      , to = moment(options.valueDate).endOf('day').toDate();

    query = query.filter( t => {
      return t('valueDate').during(from, to, {leftBound: "closed", rightBound: "closed"});
    });
  }

  if(options.compound) query = query.orderBy(r.asc('createdAt'));
  else query = query.orderBy(r.desc('createdAt'));

  query.run(conn, (err, cursor) => {
    if(err) return cb(err);
    cursor.toArray((err, transacs) => {
      if(err) return cb(err);
      let transac = transacs[0];
      if(!transac)return cb();
      cb(null, bless(transac));
    });
  });
}

export function loadAll(conn, {label, from=moment().startOf('day').toDate(), to=moment().endOf('day').toDate(), dateMode='valueDate'} = {}, cb){
  function findAll(cb){
    let query =  r.table(Transac.collection).filter( 
      r.row(dateMode === 'valueDate' ? 'valueDate' : 'createdAt').during(from, to, {leftBound: "closed", rightBound: "closed"}) 
    );
    if(label) query = query.filter({label: label});

    query.run(conn, (err, cursor) => {
      if(err) return cb(err);
      cursor.toArray((err, transacs) => {
        if(err) return cb(err);
        let transacIds = _.inject(transacs, (res, transac) => { res[transac.transacId] = transac.transacId; return res}, {});
        cb(null, _.keys(transacIds));
      });
    });
  }
  function loadTransacs(transacIds, cb){
    async.map(transacIds, load.bind(null, conn), cb);
  }

  async.waterfall([findAll, loadTransacs], cb);
}  

export function load(conn, id, cb){
  r.table(Transac.collection).filter({transacId: id}).orderBy(r.asc('createdAt')).run(conn, (err, nodes) => {
    if(err)return cb(err);
    let root
      , hnodes = _.inject(nodes, (res, node) => { res[node.id] = node; return res}, {});

    _.each(nodes, node => {
      let tnode = bless(node);
      if(tnode.isTransac() && tnode.isCompound()){
          if(!root) root = new Transac.makeCompoundRoot(tnode);
          root.addChild(tnode);
      }else{
        if(!tnode.parentId) root = tnode;
        else{
          let parent = hnodes[tnode.parentId];
          if(!parent){
            console.log(tnode)
            return cb(new Error("Wrong Transac Tree"));
          }
          parent.addChild(tnode);
        }
      }
    });
    cb(null, root);
  })
}

function insertOne(conn, options, cb){
  let transac = new Transac(options);
  r.table(Transac.collection).insert( transac, {returnChanges: true} ).run(conn, (err, res) => {
    if(err)return cb(err);
    cb(null, transac);
  });
}

export function addEvent(conn, id, options, cb){
  async.waterfall([
    load.bind(null, conn, id),
    (transac, cb) => {
      if(!transac) return setImmediate(cb, new Error("Unknown transaction"));
      addEventTransac(conn, transac, options, (err, event, transac)=>{
        if(err)return cb(err);
        addMessage(conn, transac, event, options, cb);
      });
    }
  ], cb); 
}

function addEventTransac(conn, transac, options, cb){
  try{
    options.transacId = transac.id;
    let event = new Event(options);
    transac.addEvent(event);
    r.table(Transac.collection).insert( event, {returnChanges: true} ).run(conn, (err, res) => {
      if(err)return cb(err);
      cb(null, event, transac);
    });
  }catch(e){
    setImmediate(cb, e);
  }
}

function addMessage(conn, transac, event, options, cb){
  try{
    let message = new Message({label: options.message, transacId: options.transacId});
    event.addChild(message);
    r.table(Transac.collection).insert( message, {returnChanges: true} ).run(conn, (err, res) => {
      if(err)return cb(err);
      cb(null, event, transac);
    });
  }catch(e){
    setImmediate(cb, e);
  }
}
