//assertion library
import  should from "should";
import  async from "async";
import  _ from "lodash";
import  util from "util";
import  moment from "moment";
import * as transac  from '../src/server/helpers/transac';
import * as DB from './helpers/db';
import params from "./params";

const TRANSAC = {
    label: 'T2' 
  , valueDate: new Date(2015, 5, 22)
  , processId: 42
  , server: 'bigBrother'
  , user: 'justMe'
};

const INFO = {level: 'info', label: 'labelInfo', messages: ['messageInfo']};
const WARNING = {level: 'warning', label: 'labelWarning', messages: ['messageWarning']};
const ERROR = {level: 'error', label: 'labelError', messages: ['messageError']};

let CONN, foundTransac1, foundTransac2;

describe('Transac Helper', () => {
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
      should(transac.children.length).eql(0);
      foundTransac1 = transac;
      cb();
    });
  });

  it('findOne', (cb) => {
    let data = {label: TRANSAC.label, valueDate: TRANSAC.valueDate};
    transac.findOne(CONN, data, (err, transac) => {
      should(err).be.null;
      foundTransac1.id.should.eql(transac.id);
      cb();
    });
  });

  it('Load', (cb) => {
    transac.load(CONN, foundTransac1.id, (err, transac) => {
      should(err).be.null;
      transac.id.should.eql(foundTransac1.id);
      cb();
    });
  });


  it('Re Create', (cb) => {
    let data = {label: TRANSAC.label, valueDate: TRANSAC.valueDate};
    transac.loadOrCreate(CONN, data, (err, transac) => {
      should(err).be.null;
      foundTransac1.id.should.not.eql(transac.id);
      foundTransac2 = transac;
      cb();
    });
  });

  it('findAll', (cb) => {
    transac.loadAll(CONN,  {label: TRANSAC.label, from: moment(TRANSAC.valueDate).startOf('day').toDate(), dateMode: 'valueDate'}, (err, transacs) => {
      should(err).be.null;
      should(_.pluck(transacs, 'id').sort()).eql([foundTransac1.id, foundTransac2.id].sort());
      cb();
    });
  });

  it('Add Info Event', (cb) => {
    transac.addEvent(CONN, foundTransac1.id, INFO, (err, transac) => {
      should(err).be.null;
      should(transac.children[0].label).eql(INFO.label);
      should(transac.children[0].children[0].label).eql(INFO.messages[0]);
      should(transac.status).eql('ok');
      cb();
    });
  });

   it('Re Load', (cb) => {
    transac.load(CONN, foundTransac1.id, (err, transac) => {
      should(err).be.null;
      transac.id.should.eql(foundTransac1.id);
      should(transac.children[0].label).eql(INFO.label);
      should(transac.children[0].children[0].label).eql(INFO.messages[0]);
      should(transac.status).eql('ok');
      cb();
    });
  });

 
  it('Add Warning Event', (cb) => {
    transac.addEvent(CONN, foundTransac1.id, WARNING, (err, transac) => {
      should(err).be.null;
      should(transac.status).eql('warning');
      cb();
    });
  });

  it('Add Error Event', (cb) => {
    transac.addEvent(CONN, foundTransac1.id, ERROR, (err, transac) => {
      should(err).be.null;
      should(transac.status).eql('error');
      cb();
    });
  });


});
