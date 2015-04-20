var vumigo = require('vumigo_v02');
var optoutstore = require('./optoutstore');
var DummyOptoutResource = optoutstore.DummyOptoutResource;
var fixtures = require('./fixtures');
var assert = require('assert');
var AppTester = vumigo.AppTester;


describe("app", function() {
    describe("GoApp", function() {
        var app;
        var tester;

        beforeEach(function() {
            app = new go.app.GoApp();

            tester = new AppTester(app);

            tester
                .setup(function(api) {
                    api.resources.add(new DummyOptoutResource());
                    api.resources.attach(api);
                })
                .setup.config.app({
                    name: 'test_app',
                    opt_outs: ["27003", "27004", "27005"]
                })
                .setup(function(api) {
                    fixtures().forEach(api.http.fixtures.add);
                });
        });

        describe("when the user starts a session to run opt outs", function() {
            it("should complete and return thanks", function() {
                return tester
                    .setup(function(api) {
                        api.contacts.add({
                            msisdn: '+27001',
                            key: "63ee4fa9-6888-4f0c-065a-939dc2473a99",
                            user_account: "4a11907a-4cc4-415a-9011-58251e15e2b4"
                        });
                    })
                    .setup.user.addr('27001')
                    .input('RUN')
                    .check.interaction({
                        state: 'states_opt_out_complete',
                        reply:
                            'Thank you. Opt outs run.'
                    })
                    .check(function(api) {
                        // var optouts = _.find(api.optout.optout_store, { msisdn: '27003' });
                        var optoutstore = api.optout.optout_store;
                        assert.equal(optoutstore[0], "msisdn:+27831112222");
                        assert.equal(optoutstore[1], "msisdn:27003");
                        assert.equal(optoutstore[2], "msisdn:27004");
                        assert.equal(optoutstore[3], "msisdn:27005");
                    })
                    .check.reply.ends_session()
                    .run();
            });
        });


        describe("when the user asks for unsupported command", function() {
            it("should warn not supported", function() {
                return tester
                    .setup(function(api) {
                        api.contacts.add({
                            msisdn: '+27001',
                            key: "63ee4fa9-6888-4f0c-065a-939dc2473a99",
                            user_account: "4a11907a-4cc4-415a-9011-58251e15e2b4"
                        });
                    })
                    .setup.user.addr('27001')
                    .input('DELETEALL')
                    .check.interaction({
                        state: 'states_default',
                        reply: 'Command not recognised'
                    })
                    .check.reply.ends_session()
                    .run();
            });
        });
    });
});
