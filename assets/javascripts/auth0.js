/* global Auth0Lock */
(function () {
  function appendScript(src, callback) {
    var new_script = document.createElement('script');
    new_script.setAttribute('src',src);
    new_script.onload = callback;
    document.head.appendChild(new_script);
  }

  var webAuth;

  var script_url = '//cdn.auth0.com/js/auth0/8.8/auth0.min.js';

  appendScript(script_url, function () {
    var checkInterval = setInterval(function () {
      if (!Discourse.SiteSettings) {
        return;
      }

      clearInterval(checkInterval);

      if (!Discourse.SiteSettings.auth0_client_id) {
        return;
      }

      var client_id = Discourse.SiteSettings.auth0_client_id;
      var domain = Discourse.SiteSettings.auth0_domain;

      webAuth = new auth0.WebAuth({
        domain: domain,
        clientID: client_id,
        scope: 'openid email profile',
        responseType: 'code token id_token',
        audience: Discourse.SiteSettings.auth0_audience,
        redirectUri: Discourse.SiteSettings.auth0_callback_url
      });

      webAuth.renewAuth({
        redirectUri: Discourse.SiteSettings.auth0_silent_redirect_uri,
        postMessageDataType: 'brewperfect-type',
        usePostMessage: true
      }, function(err, authToken) {
        console.log(err);
        console.log(authToken);
      });

    }, 300);
  });

  var LoginController = require('discourse/controllers/login').default;
  LoginController.reopen({
    authenticationComplete: function () {
      return this._super.apply(this, arguments);
    }
  });

  var ApplicationRoute = require('discourse/routes/application').default;
  ApplicationRoute.reopen({
    actions: {
      showLogin: function() {
        if (!Discourse.SiteSettings.auth0_client_id || Discourse.SiteSettings.auth0_connection !== '') {
          return this._super();
        }

        webAuth.authorize();
      },
      showCreateAccount: function () {
        if (!Discourse.SiteSettings.auth0_client_id || Discourse.SiteSettings.auth0_connection !== '') {
          return this._super();
        }

        var createAccountController = Discourse.__container__.lookup('controller:createAccount');

        if (createAccountController && createAccountController.accountEmail) {
          this._super();
        } else {
          webAuth.authorize();
        }
      }
    }
  });

})();
