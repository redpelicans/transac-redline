//assertion library
import  should from "should";
import  async from "async";
import  _ from "lodash";
import {Event, PlainTransac}  from '../src/server/models';

describe('PlainTransac Model', () => {
  it('Create one', () => {
    let data = {name: 'T1', locked: true, server: 'rp2', user: 'eric', processId: 1}
      , t = new PlainTransac(data);
    t.should.containEql(data);
    t.toJSON().should.containEql(data);
    t.should.have.property('processingTime');
    t.should.be.an.instanceOf(PlainTransac);
    should(t.status).equal('ok');
    should(t.delay).equal(0);
    should(t.lastEvent).be.undefined;
  });
});
