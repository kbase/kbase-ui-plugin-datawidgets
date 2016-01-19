/*global define*/
/*jslint white: true*/

define([
    'kb/service/client/catalog'
], function (Catalog) {
    function factory(config) {
        var parent, container, runtime = config.runtime;
      
        function attach(node) {
            parent = node;
            container = node.appendChild(document.createElement('div'));            
        }
        
        function run(params) {
            var catalog = new Catalog(runtime.getConfig('services.catalog.url'), {
                token: runtime.service('session').getAuthToken()
            });
            return catalog.version()
                .then(function (version) {
                    container.innerHTML = 'Catalog version is ' + version;
                })
                .catch(function (err) {
                    container.innerHTML = 'ERROR (check console)';
                    console.log('ERROR');
                    console.log(err);
                });
            
        }
        
        function detach() {
            parent.removeChild(container);
        }
        
        return {
            attach: attach,
            run: run,
            detach: detach
        };        
    }
    
    return {
        make: function (config) {
            return factory(config);
        }
    };        
});