/*global requirejs,define,fs*/
define([
  'superagent',
  'cli-table',
  '../../lib/config'
], function (request, Table, config) {

  var ls = {
    project: null,
    query: null,
    type: null,
    issues: null,
    table: null,

    getIssues: function (options) {
      var that = this,
        i = 0,
        drawText = function(issues){
          var text = "";
          issues.forEach(function(issue){
            text += '* ';
            issue.forEach(function(field, idx){
              text += field;  
              if (idx  < issue.length-1){
                text += ' - ';
              }
            });
            text += '\n';
          });
          return text;
        }
        
      request
        .get(config.auth.url + this.query)
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Basic ' + config.auth.token)
        .end(function (res) {
          if (!res.ok) {
            return console.log(res.body.errorMessages.join('\n'));
          }

          that.issues = res.body.issues;
          that.table = new Table({
            head: ['Key', 'Priority', 'Summary', 'Status']
          });

          for (i = 0; i < that.issues.length; i += 1) {
            var priority = that.issues[i].fields.priority,
              summary = that.issues[i].fields.summary,
              status = that.issues[i].fields.status;

            if (!priority) {
              priority = {
                name: ''
              };
            }
            if (summary.length > 80) {
              summary = summary.substr(0, 77) + '...';
            }
            if (options && options.compact && summary.length > 40) {
              summary = summary.substr(0, 37) + '...';
            }
            
            that.table.push([
              that.issues[i].key,
              priority.name,
              summary,
              status.name
            ]);
          }
          if (that.issues.length > 0) {
            if (options && options.text){
              console.log(drawText(that.table));
            }else{
              console.log(that.table.toString());  
            }
          } else {
            console.log('No issues');
          }
        });
    },

    showAll: function (type) {
      this.type = (type) ? '+AND+type="' + type + '"' : '';

      this.query = 'rest/api/2/search?jql='
        + 'assignee=' + config.auth.user
        + this.type
        + '+AND+status+in+(Open,"In+Progress",Reopened,"To+Do","In+Review", "Coding+In+Progress", "Pull+Request+Sent")'
        + '+order+by+priority+DESC,+key+ASC';
      return this.getIssues();
    },

    showAllWatching: function (type) {
      this.type = (type) ? '+AND+type="' + type + '"' : '';

      this.query = 'rest/api/2/search?jql='
        + 'watcher=' + config.auth.user
        + this.type
        + '+AND+status+in+(Open,"In+Progress",Reopened,"To+Do","In+Review", "Coding+In+Progress", "Pull+Request+Sent")'
        + '+order+by+priority+DESC,+key+ASC';
      return this.getIssues();
    },

    showAllMentioned: function (type) {
      this.type = (type) ? '+AND+type="' + type + '"' : '';

      this.query = 'rest/api/2/search?jql='
        + 'text ~ ' + config.auth.user
        + this.type
        + '+AND+status+in+(Open,"In+Progress",Reopened,"To+Do","In+Review", "Coding+In+Progress", "Pull+Request+Sent")'
        + '+order+by+priority+DESC,+key+ASC';
      return this.getIssues();
    },

    showAllCreated: function (type) {
      this.type = (type) ? '+AND+type="' + type + '"' : '';

      this.query = 'rest/api/2/search?jql='
        + 'reporter in (currentUser())'
        + this.type
        + '+AND+status+in+(Open,"In+Progress",Reopened,"To+Do","In+Review", "Coding+In+Progress", "Pull+Request+Sent")'
        + '+order+by+priority+DESC,+key+ASC';
      return this.getIssues();
    },

    showInProgress: function () {
      this.query = 'rest/api/2/search?jql='
        + 'assignee=' + config.auth.user
        + '+AND+status+in+("In+Progress")'
        + '+order+by+priority+DESC,+key+ASC';
      return this.getIssues();
    },

    showByProject: function (project, type) {
      this.type = (type) ? '+AND+type=' + type : '';

      this.query = 'rest/api/2/search?jql='
        + 'assignee=' + config.auth.user
        + this.type
        + '+AND+project=' + project
        + '+AND+status+in+(Open,"In+Progress",Reopened,"To+Do","In+Review", "Coding+In+Progress", "Pull+Request+Sent")'
        + '+order+by+priority+DESC,+key+ASC';
      return this.getIssues();
    },

    showProjectByRecentlyUpdated: function (project, type) {
      this.type = (type) ? '+AND+type=' + type : '';

      this.query = 'rest/api/2/search?jql='
        + 'project=' + project
        + this.type
        + '+AND+status+in+(Open,"In+Progress",Reopened,"To+Do","In+Review", "Coding+In+Progress", "Pull+Request+Sent")'
        + '+AND+updated+>=+-4d+'
        + '+order+by+priority+DESC,+key+ASC';
      return this.getIssues();
    },

    showWatchingByProject: function (project, type) {
      this.type = (type) ? '+AND+type=' + type : '';

      this.query = 'rest/api/2/search?jql='
        + 'watcher=' + config.auth.user
        + this.type
        + '+AND+project=' + project
        + '+AND+status+in+(Open,"In+Progress",Reopened,"To+Do","In+Review", "Coding+In+Progress", "Pull+Request+Sent")'
        + '+order+by+priority+DESC,+key+ASC';
      return this.getIssues();
    },

    showMentionByProject: function (project, type) {
      this.type = (type) ? '+AND+type=' + type : '';

      this.query = 'rest/api/2/search?jql='
        + 'text ~ ' + config.auth.user
        + this.type
        + '+AND+project=' + project
        + '+AND+status+in+(Open,"In+Progress",Reopened,"To+Do","In+Review", "Coding+In+Progress", "Pull+Request+Sent")'
        + '+order+by+priority+DESC,+key+ASC';
      return this.getIssues();
    },

    search: function (query) {
      this.query = 'rest/api/2/search?jql='
        + 'summary+~+"' + query + '"'
        + '+OR+description+~+"' + query + '"'
        + '+OR+comment+~+"' + query + '"'
        + '+order+by+priority+DESC,+key+ASC';
      return this.getIssues();
    },

    weeklyReport: function(options) {
      this.query = 'rest/api/2/search?jql='
      + 'assignee=' + config.auth.user
      + '+AND+status+in+(Resolved,Closed,Done)'
      + '+AND+resolved+>=+-6d+'
      + '+order+by+priority+DESC,+key+ASC';
      return this.getIssues(options);
    },

    jqlSearch: function (jql) {
      this.query = 'rest/api/2/search?jql=' + encodeURIComponent(jql);
      return this.getIssues();
    }
  };

  return ls;

});
