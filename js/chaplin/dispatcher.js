
define(['underscore', 'mediator', 'chaplin/lib/utils', 'chaplin/lib/subscriber'], function(_, mediator, utils, Subscriber) {
  'use strict';
  var Dispatcher;
  return Dispatcher = (function() {

    _(Dispatcher.prototype).extend(Subscriber);

    Dispatcher.prototype.previousControllerName = null;

    Dispatcher.prototype.currentControllerName = null;

    Dispatcher.prototype.currentController = null;

    Dispatcher.prototype.currentAction = null;

    Dispatcher.prototype.currentParams = null;

    Dispatcher.prototype.url = null;

    function Dispatcher() {
      this.initialize();
    }

    Dispatcher.prototype.initialize = function() {
      /*console.debug 'Dispatcher#initialize'
      */      this.subscribeEvent('matchRoute', this.matchRoute);
      return this.subscribeEvent('!startupController', this.startupController);
    };

    Dispatcher.prototype.matchRoute = function(route, params) {
      return this.startupController(route.controller, route.action, params);
    };

    Dispatcher.prototype.startupController = function(controllerName, action, params) {
      var controllerFileName, handler, isSameController;
      if (action == null) action = 'index';
      if (params == null) params = {};
      /*console.debug 'Dispatcher#startupController', controllerName, action, params
      */
      if (params.changeURL !== false) params.changeURL = true;
      if (params.forceStartup !== true) params.forceStartup = false;
      isSameController = !params.forceStartup && this.currentControllerName === controllerName && this.currentAction === action && (!this.currentParams || _(params).isEqual(this.currentParams));
      if (isSameController) return;
      controllerFileName = utils.underscorize(controllerName) + '_controller';
      handler = _(this.controllerLoaded).bind(this, controllerName, action, params);
      return require(['controllers/' + controllerFileName], handler);
    };

    Dispatcher.prototype.controllerLoaded = function(controllerName, action, params, ControllerConstructor) {
      var controller, currentController, currentControllerName;
      currentControllerName = this.currentControllerName || null;
      currentController = this.currentController || null;
      if (currentController) {
        mediator.publish('beforeControllerDispose', currentController);
        currentController.dispose(params, controllerName);
      }
      controller = new ControllerConstructor(params, currentControllerName);
      controller[action](params, currentControllerName);
      this.previousControllerName = currentControllerName;
      this.currentControllerName = controllerName;
      this.currentController = controller;
      this.currentAction = action;
      this.currentParams = params;
      this.adjustURL(controller, params);
      return mediator.publish('startupController', {
        previousControllerName: this.previousControllerName,
        controller: this.currentController,
        controllerName: this.currentControllerName,
        params: this.currentParams
      });
    };

    Dispatcher.prototype.adjustURL = function(controller, params) {
      var url;
      if (params.path) {
        url = params.path;
      } else if (typeof controller.historyURL === 'function') {
        url = controller.historyURL(params);
      } else if (typeof controller.historyURL === 'string') {
        url = controller.historyURL;
      } else {
        throw new Error('Dispatcher#adjustURL: controller for ' + ("" + this.currentControllerName + " does not provide a historyURL"));
      }
      if (params.changeURL) mediator.publish('!router:changeURL', url);
      return this.url = url;
    };

    Dispatcher.prototype.disposed = false;

    Dispatcher.prototype.dispose = function() {
      /*console.debug 'Dispatcher#dispose
      */      if (this.disposed) return;
      this.unsubscribeAllEvents();
      this.disposed = true;
      return typeof Object.freeze === "function" ? Object.freeze(this) : void 0;
    };

    return Dispatcher;

  })();
});
