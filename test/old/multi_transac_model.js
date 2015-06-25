//assertion library
import  should from "should";
import  async from "async";
import  _ from "lodash";
import {Event, MultiTransac}  from '../src/server/models';

describe('MultiTransac Model', () => {
  it('Create one', () => {
    let data = {name: 'T1', valueDate: new Date(), locked: true, server: 'rp2', user: 'eric', processId: 1}
      , t = new MultiTransac(data);
    t.should.containEql(_.pick(data, 'name', 'valueDate', 'locked'));
    t.toJSON().should.containEql(_.pick(data, 'name', 'locked'));
    t.should.have.property('processingTime');
    t.should.be.an.instanceOf(MultiTransac);
    should(t.status).equal('ok');
    should(t.delay).equal(0);
    should(t.lastEvent).be.undefined;
  });
});
