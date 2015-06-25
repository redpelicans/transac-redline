//assertion library
import  should from "should";
import  async from "async";
import  _ from "lodash";
import {Event}  from '../src/server/models';

describe('Event Model', () => {
  it('Create one', () => {
    let data = {label: 'event', type: 'event', message: 'gogo'}
      , event = new Event(data);
    event.should.containEql(data);
    event.toJSON().should.containEql(data);
    event.should.have.property('time');
    event.should.be.an.instanceOf(Event);
  });
});
