// VB clean up

export const routes = (app) => {
  app.config(function ($routeProvider, $locationProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'login.html'
      })
      .when('/select-teams', {
        templateUrl: 'select-teams.html'
      })
      .when('/edit-team/:teamId', {
        templateUrl: 'edit-team.html'
      })
      .when('/edit-user/:userId', {
        templateUrl: 'edit-user.html'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
};
