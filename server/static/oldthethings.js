(function() {
    function getAllTheThings() {
        var seenSeed = 0;
        var seenKey = ('Symbol' in window) ? Symbol("we've seen this object") : ("__FAUX_SYMBOL__::" + Math.random());

        function hasSeen(object) {
            return object.hasOwnProperty(seenKey)
        }

        function seeObject(object) {
            var id = ++seenSeed;
            Object.defineProperty(object, seenKey, {
                configurable: false,
                enumerable: false,
                writable: false,
                value: id,
            })
            return id;
        }

        function objectId(object) {
            return object.hasOwnProperty(seenKey) ? object[seenKey] : undefined;
        }

        function getOwnPropertyDescriptors(object) {
            var pmap = Object.create(null);
            var pnames = Object.getOwnPropertyNames(object);
            var psymbols = ('getOwnPropertySymbols' in Object) ? Object.getOwnPropertySymbols(object) : [];
            pnames = pnames.concat(psymbols);

            for (var i = 0; i < pnames.length; ++i) {
                var name = pnames[i];
                var d = Object.getOwnPropertyDescriptor(object, name);
                pmap[name] = d;
            }

            return pmap;
        }

        function walkObject(object, prefix) {
            if (hasSeen(object)) {
                return { cycle: objectId(object) };
            } else {
                var id = seeObject(object);

                var vals = {};
                var props = getOwnPropertyDescriptors(object);
                for (var name in props) {
                    var newName = prefix + '.' + name;
                    var d = props[name],
                        result;
                    if ('value' in d) {
                        var v = d.value;
                        if (typeof v === 'object' && v) {
                            if (hasSeen(v)) {
                                result = { cycle: objectId(v) };
                            } else {
                                result = { 'object': walkObject(v, newName) };
                            }
                        } else if (typeof v == 'function') {
                            if (hasSeen(v)) {
                                result = { cycle: objectId(v) };
                            } else {
                                result = { 'function': walkObject(v, newName) };
                            }
                        } else {
                            result = v;
                        }
                    } else {
                        result = { 'function': walkObject(d.get, prefix + '.get ' + name) };
                    }
                    vals[prefix + '.' + name] = result;
                }
                vals.id = id;
                return vals;
            }
        }

        // We walk the global object of an injected iframe, to avoid any polyfill-polution from _our_ namespace
        var iframe = document.createElement('iframe');
        document.body.appendChild(iframe);
        var tree = { 'globalObject': walkObject(iframe.contentWindow, 'window') };

        var output = document.getElementById('results');
        if (output) {
            output.appendChild(document.createTextNode(JSON.stringify(tree, null, 2)));
        } else {
            console.error('unable to find output element');
        }

        var script = document.getElementById('allthethings');
        if (script && script.hasAttribute('data-brid')) {
            var brid = script.getAttribute('data-brid');

            var xhr = new XMLHttpRequest();
            xhr.open("POST", "report", true);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.addEventListener("readystatechange", function() {
                if (this.readyState === XMLHttpRequest.DONE) {
                    if (this.status === 200) {
                        var permaLink = document.createElement("a");
                        permaLink.href = "report/" + brid;
                        permaLink.innerText = "Browserprint " + brid + " saved; click here for permalink";
                        document.getElementById("success-banner").appendChild(permaLink);
                        //console.log(brid);
                    } else {
                        var oopsie = document.createElement("p");
                        oopsie.innerText = "Failed to save browserprint " + brid + " --- " + err.toString();
                        document.getElementById("failure-banner").appendChild(oopsie);
                        //console.error("error", err);
                    }
                }
            });
            xhr.send(JSON.stringify({
                brid: brid,
                browser: {
                    vendor: navigator.vendor,
                    platform: navigator.platform,
                    userAgent: navigator.userAgent,
                },
                features: tree,
            }));
        } else {
            var oopsie2 = document.createElement("p");
            oopsie2.innerText = "Unable to find job UUID in markup";
            document.getElementById("failure-banner").appendChild(oopsie2);
            //console.error('unable to find job UUID');
        }
    }
    window.addEventListener('load', getAllTheThings);
})();