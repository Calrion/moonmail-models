import * as chai from 'chai';
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
import * as sinon from 'sinon';
import * as sinonAsPromised from 'sinon-as-promised';
import { Campaign } from '../src/models/campaign';

chai.use(chaiAsPromised);

describe('Campaign', () => {
  const tableName = 'Campaigns-table';
  const sentAtIndexName = 'sent-at-index';
  const campaignId = 'campaignId';
  const userId = 'thatUserId';
  let tNameStub;
  const campaignHashKey = 'userId';
  const campaignRangeKey = 'id';
  const readyToSentCampaign = {
    userId: 'user-id',
    body: 'a-body',
    subject: 'a-subject',
    listIds: ['a-list'],
    senderId: 'a-sender',
    name: 'some-name',
    id: 'some-id'
  };
  const incompleteCampaign = {
    userId: 'user-id',
    body: 'a-body',
    subject: 'a-subject',
    senderId: 'a-sender'
  };
  const incompleteCampaignWithEmptyList = {
    userId: 'user-id',
    body: 'a-body',
    subject: 'a-subject',
    senderId: 'a-sender',
    listIds: []
  };

  before(() => {
    sinon.stub(Campaign, '_client').resolves({Items: []});
    tNameStub = sinon.stub(Campaign, 'tableName', { get: () => tableName});
    tNameStub = sinon.stub(Campaign, 'sentAtIndex', { get: () => sentAtIndexName});
  });

  describe('#get', () => {
    it('calls the DynamoDB get method with correct params', done => {
      Campaign.get(userId, campaignId).then(() => {
        const args = Campaign._client.lastCall.args;
        expect(args[0]).to.equal('get');
        expect(args[1]).to.have.deep.property(`Key.${campaignHashKey}`, userId);
        expect(args[1]).to.have.deep.property(`Key.${campaignRangeKey}`, campaignId);
        expect(args[1]).to.have.property('TableName', tableName);
        done();
      });
    });
  });

  describe('#sentLastMonth()', () => {
    it('calls the DynamoDB query method with correct params', done => {
      Campaign.sentLastMonth(userId).then(() => {
        const args = Campaign._client.lastCall.args;
        expect(args[0]).to.equal('query');
        expect(args[1]).to.have.property('TableName', tableName);
        expect(args[1]).to.have.property('IndexName', sentAtIndexName);
        expect(args[1]).to.have.property('Select', 'COUNT');
        expect(args[1]).to.have.deep.property('ExpressionAttributeValues.:lastMonth');
        expect(args[1]).to.have.deep.property('ExpressionAttributeValues.:userId', userId);
        expect(args[1]).to.have.property('KeyConditionExpression', 'userId = :userId and sentAt > :lastMonth');
        done();
      });
    });
  });

  describe('#sentBy()', () => {
    it('calls the DynamoDB query method with correct params', done => {
      Campaign.sentBy(userId).then(() => {
        const args = Campaign._client.lastCall.args;
        expect(args[0]).to.equal('query');
        expect(args[1]).to.have.property('TableName', tableName);
        expect(args[1]).to.have.deep.property('ExpressionAttributeValues.:status', 'sent');
        expect(args[1]).to.have.deep.property('ExpressionAttributeNames.#status', 'status');
        done();
      })
      .catch(err => done(err));
    });
  });

  describe('#hashKey', () => {
    it('returns the hash key name', () => {
      expect(Campaign.hashKey).to.equal(campaignHashKey);
    });
  });

  describe('#rangeKey', () => {
    it('returns the range key name', () => {
      expect(Campaign.rangeKey).to.equal(campaignRangeKey);
    });
  });

  describe('#isReadyToBeSent', () => {
    it('succeds if all required fields are valid', () => {
      expect(Campaign.isValidToBeSent(readyToSentCampaign)).to.be.true;
    });

    it('fails if required fields are missing', () => {
      expect(Campaign.isValidToBeSent(incompleteCampaign)).to.be.false;
      expect(Campaign.isValidToBeSent(incompleteCampaignWithEmptyList)).to.be.false;
    });
  });

  after(() => {
    Campaign._client.restore();
    tNameStub.restore();
  });
});
