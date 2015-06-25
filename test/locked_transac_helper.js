//assertion library
import  should from "should";
import  async from "async";
import  _ from "lodash";
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
  , locked: 'true'
};

let CONN, foundTransac1, foundTransac2;

describe('Locked Transac Helper', () => {
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


  it('Re Create', (cb) => {
    let data = {label: TRANSAC.label, valueDate: TRANSAC.valueDate};
    transac.loadOrCreate(CONN, data, (err, transac) => {
      err.code.should.eql('locked');
      cb();
    });
  });

});
