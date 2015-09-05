/*!
 * Redmine.js
 * @license GPLv2
 */
(function(){
  'use strict';

  angular
       .module('rmProjects')
       .controller('FavProjectController', [
          'projectService',
          'debounce',
          'settingsService',
          '$log',
          '$location',
          '$localStorage',
          '$q',
          FavProjectController
       ]);

  function FavProjectController( projectService, debounce, settingsService, $log, $location, $localStorage, $q ) {
    var self = this;

    self.projectId = null;
    self.loading = false;
    self.lookFor = lookFor;
    self.addFav = addFav;
    self.canAddFav = canAddFav;
    self.favIds = [];

    if (settingsService.isConfigured())
        loadLocal();
    else
        $location.path('/settings');

    function alreadyFav() {
        return self.favIds.indexOf(self.project.id) > -1;
    }

    function canAddFav() {
        return (self.project && !alreadyFav());
    }

    function addFav() {
        if (canAddFav()) {
            $log.debug("add to fav");
            self.projects.items.push(self.project);
            saveLocal();
            self.favIds.push(self.project.id);
        }
    }

    function lookFor() {
        self.project = null;
        self.errorMessage = null;

        if (self.projectId) {
            self.loading = true;
            getProject().then(function() {
                self.loading = false;
            });
        }
    }

    function loadLocal() {
        var _projects = $localStorage.projects;
        if (_projects) {
            self.projects = _projects;
            _projects.items.forEach(function(i) {
                self.favIds.push(i.id);
            });
        } else {
            self.projects = {items: []};
        }

        $log.debug(self.favIds);
    }

    function saveLocal() {
        $localStorage.projects = self.projects;
    }

    function getProject() {
        if (!self.projectId){
            $log.error("no project id");
            return $q.when(true);
        }

        var q = projectService.query({
            'project_id': self.projectId
        }).$promise.then(function(data) {
            $log.debug(data);
            self.project = data.project;
        }).catch(function(e) {
            $log.debug(e);
            self.errorMessage = e.status + ' ' + e.statusText;
        });

        return q;
    }

    /**
     * XXX: Load all projects.
     * Not being used. too slow to load all projects and use angular filter
     * in view. maybe use pagination if projects are sorted by name.
     */
    // refresh();
    // self.projects = [];
    // self.loading = 100;
    // self.total_count = 0;

    function refresh() {
        projectService.query({limit: 1000}).$promise.then(function(data) {
            $log.debug(data);
            self.projects = data.projects;
            self.total_count = data.total_count;
            self.limit = data.limit;
            self.offset = data.offset + data.limit;
            loadMore();
        });
    }

    function loadMore() {
        if (!angular.isNumber(self.offset) || self.offset >= self.total_count) {
            self.loading = 100;
            saveLocal();
            return;
        }
        $log.debug("load from offset " + self.offset);
        self.loading = self.offset * 100 / self.total_count;
        projectService.query({offset: self.offset, limit: self.limit}).$promise.then(function(data) {
            self.projects = self.projects.concat(data.projects);
            self.offset += data.limit;
            loadMore();
        });
    }

  }

})();
