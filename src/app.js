go.app = function() {
    var vumigo = require('vumigo_v02');
    var App = vumigo.App;
    var EndState = vumigo.states.EndState;
    var Q = require('q');

    var GoApp = App.extend(function(self) {
        App.call(self, 'states_start');
        var $ = self.$;

        self.init = function() {
            self.env = self.im.config.env;
            self.metric_prefix = [self.env, self.im.config.name].join('.');
            self.store_name = [self.env, self.im.config.name].join('.');
        };


        self.states.add('states_start', function() {
            switch (self.im.msg.content.split(" ")[0].replace(/\W/g, '').toUpperCase()) {
                case "RUN":
                    return self.states.create("states_opt_out_run");
                default: // Logs a support ticket
                    return self.states.create("states_default");
            }
        });


        self.states.add('states_opt_out_run', function(name) {
            var msisdns = self.im.config.opt_outs;

            return Q.all(msisdns.map(function(msisdn) { self.im.api_request('optout.optout', {
                        address_type: "msisdn",
                        address_value: msisdn,
                        message_id: self.im.msg.message_id
                    });
                }))
                .then(function() {
                    return self.states.create('states_opt_out_complete');
                });
        });

        self.states.add('states_opt_out_complete', function(name) {
            return new EndState(name, {
                text: $('Thank you. Opt outs run.'),

                next: 'states_start'
            });
        });


        self.states.add('states_default', function(name) {
            return new EndState(name, {
                text: "Command not recognised",

                next: 'states_start'
            });
        });

    });

    return {
        GoApp: GoApp
    };
}();
