//assertion library
import  should from "should";
import  async from "async";
import  _ from "lodash";
import  moment from "moment";
import * as transac  from '../src/server/helpers/transac';
import * as DB from './helpers/db';
import params from "./params";
//import 'better-log/install';


const TRANSAC = {
    label: 'T2' 
  , valueDate: new Date(2015, 5, 22)
  , processId: 42
  , server: 'bigBrother'
  , user: 'justMe'
  , compound: true
};

let CONN, foundTransac1;

describe('Compound Transac Helper', () => {
  before(cb => DB.init(params, (err, conn) => {
    CONN = conn;
    cb();
  }));

  it('Create', (cb) => {
    transac.loadOrCreate(CONN, TRANSAC, (err, transac) => {
      should(err).be.null;
      foundTransac1 = transac;
      transac.should.containEql(TRANSAC);
      should(transac.status).equal('ok');
      should(transac.isCompound()).equal(true);
      transac.should.have.ownProperty('id');
      should(transac.children.length).eql(0);
      cb();
    });
  });

  it('FindOne', (cb) => {
    let data = {label: TRANSAC.label, valueDate: TRANSAC.valueDate};
    transac.findOne(CONN, data, (err, transac) => {
      should(err).be.null;
      foundTransac1.id.should.eql(transac.id);
      cb();
    });
  });


  it('Re Create', (cb) => {
    let data = {label: TRANSAC.label, compound: true, valueDate: TRANSAC.valueDate};
    transac.loadOrCreate(CONN, data, (err, transac) => {
      should(err).be.null;
      should(transac.isCompound()).equal(true);
      transac.transacId.should.eql(foundTransac1.id);
      cb();
    });
  });

  it('Load', (cb) => {
    transac.load(CONN, foundTransac1.id, (err, transac) => {
      should(err).be.null;
      should(transac.status).equal('ok');
      transac.children[0].id.should.eql(foundTransac1.id);
      cb();
    });
  });


  it('LoadAll', (cb) => {
    transac.loadAll(CONN,  {label: TRANSAC.label, from: moment(TRANSAC.valueDate).startOf('day').toDate(), dateMode: 'valueDate'}, (err, transacs) => {
      should(err).be.null;
      should(transacs.length).eql(1);
      let transac = transacs[0];
      transac.children[0].id.should.eql(foundTransac1.id);
      should(transac.transacId).eql(foundTransac1.id);
      cb();
    });
  });

  it('Iterate', (cb) => {
    transac.loadAll(CONN,  {label: TRANSAC.label, from: moment(TRANSAC.valueDate).startOf('day').toDate(), dateMode: 'valueDate'}, (err, transacs) => {
      should(err).be.null;
      let ts = [...transacs[0]];
      should(ts.length).eql(3);
      cb();
    });
  });
  // it('Add Info Event', (cb) => {
  //   let data = {type: 'info', label: 'label', message: 'message'};
  //   transac.addEvent(CONN, foundTransac1.id, data, (err, event, transac) => {
  //     should(err).be.null;
  //     should(transac.children[0].label).eql(data.label);
  //     should(transac.children[0].message).eql(data.message);
  //     should(transac.status).eql('ok');
  //     cb();
  //   });
  // });
  //
  // it('Add Warning Event', (cb) => {
  //   let data = {type: 'warning', label: 'label', message: 'message'};
  //   transac.addEvent(CONN, foundTransac1.id, data, (err, event, transac) => {
  //     should(err).be.null;
  //     should(transac.status).eql('warning');
  //     cb();
  //   });
  // });
  //
  // it('Add Error Event', (cb) => {
  //   let data = {type: 'error', label: 'label', message: 'message'};
  //   transac.addEvent(CONN, foundTransac1.id, data, (err, event, transac) => {
  //     should(err).be.null;
  //     should(transac.status).eql('error');
  //     cb();
  //   });
  // });


});
