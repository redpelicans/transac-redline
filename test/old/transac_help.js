//assertion library
import  should from "should";
import  async from "async";
import  _ from "lodash";
import  moment from "moment";
import * as transac  from '../src/server/helpers/transac';
import * as DB from './helpers/db';
import params from "./params";

const TRANSAC = {
    name: 'T2' 
  , valueDate: new Date(2015, 5, 22)
  , locked: false
  , processId: 42
  , server: 'bigBrother'
  , user: 'justMe'
};

let CONN, foundTransac1, foundTransac2;

describe('PlainTransac Helper', () => {
  before(cb => DB.init(params, (err, conn) => {
    CONN = conn;
    cb();
  }));

  it('Create', (cb) => {
    transac.loadOrCreate(CONN, TRANSAC, (err, transac) => {
      should(err).be.null;
      transac.should.containEql(TRANSAC);
      should(transac.status).equal('ok');
      transac.should.have.ownProperty('id');
      should(transac.events.length).eql(0);
      foundTransac1 = transac;
      cb();
    });
  });

  it('findOne', (cb) => {
    let data = {name: TRANSAC.name, valueDate: TRANSAC.valueDate};
    transac.findOne(CONN, data, (err, transac) => {
      should(err).be.null;
      foundTransac1.id.should.eql(transac.id);
      cb();
    });
  });

  it('Load', (cb) => {
    transac.load(CONN, foundTransac1.id, (err, transac) => {
      should(err).be.null;
      foundTransac1.id.should.eql(foundTransac1.id);
      cb();
    });
  });


  it('Re Create', (cb) => {
    let data = {name: TRANSAC.name, valueDate: TRANSAC.valueDate};
    transac.loadOrCreate(CONN, data, (err, transac) => {
      should(err).be.null;
      foundTransac1.id.should.not.eql(transac.id);
      foundTransac2 = transac;
      cb();
    });
  });

  it('findAll', (cb) => {
    transac.findAll(CONN,  {name: TRANSAC.name, from: moment(TRANSAC.valueDate).startOf('day').toDate(), dateMode: 'valueDate'}, (err, transacs) => {
      should(err).be.null;
      should(_.pluck(transacs, 'id').sort()).eql([foundTransac1.id, foundTransac2.id].sort());
      cb();
    });
  });

  it('Add Info Event', (cb) => {
    let data = {type: 'info', label: 'label', message: 'message'};
    transac.addEvent(CONN, foundTransac1.id, data, (err, event, transac) => {
      should(err).be.null;
      should(transac.events[0].label).eql(data.label);
      should(transac.events[0].message).eql(data.message);
      should(transac.status).eql('ok');
      cb();
    });
  });

  it('Add Warning Event', (cb) => {
    let data = {type: 'warning', label: 'label', message: 'message'};
    transac.addEvent(CONN, foundTransac1.id, data, (err, event, transac) => {
      should(err).be.null;
      should(transac.status).eql('warning');
      cb();
    });
  });

  it('Add Error Event', (cb) => {
    let data = {type: 'error', label: 'label', message: 'message'};
    transac.addEvent(CONN, foundTransac1.id, data, (err, event, transac) => {
      should(err).be.null;
      should(transac.status).eql('error');
      cb();
    });
  });


});
