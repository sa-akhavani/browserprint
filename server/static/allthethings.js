(function() {
    function getAllTheThings() {
        var seenSeed = 0;
        var seen = new WeakMap();

        function walkObject(object, prefix) {
            if (seen.has(object)) {
                return { cycle: seen.get(object) };
            } else {
                var id = ++seenSeed;
                seen.set(object, id);

                var vals = {};
                var props = Object.getOwnPropertyDescriptors(object);
                for (var name in props) {
                    var newName = prefix + '.' + name;
                    var d = props[name],
                        result;
                    if ('value' in d) {
                        var v = d.value;
                        if (typeof v === 'object' && v) {
                            if (seen.has(v)) {
                                result = { cycle: seen.get(v) };
                            } else {
                                result = { 'object': walkObject(v, newName) };
                            }
                        } else if (typeof v == 'function') {
                            if (seen.has(v)) {
                                result = { cycle: seen.get(v) };
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
        var tree = { 'globalObject': walkObject(window, 'window') };

        var output = document.getElementById('results');
        if (output) {
            output.appendChild(document.createTextNode(JSON.stringify(tree, null, 2)));
        } else {
            console.error('unable to find output element');
        }

        var script = document.getElementById('allthethings');
        if (script && script.hasAttribute('data-brid')) {
            var brid = script.getAttribute('data-brid');
            fetch("report", {
                method: "POST",
                body: JSON.stringify({
                    brid: brid,
                    browser: {
                        vendor: navigator.vendor,
                        platform: navigator.platform,
                        userAgent: navigator.userAgent,
                    },
                    features: tree,
                }),
            }).then(function(response) {
                var ok = (Math.floor(response.status / 100) == 2);
                return response.text().then(function(body) {
                    if (ok) {
                        var permaLink = document.createElement("a");
                        permaLink.href = "report/" + brid;
                        permaLink.innerText = "Browserprint " + brid + " saved; click here for permalink";
                        document.getElementById("success-banner").appendChild(permaLink);
                        console.log(brid);
                    } else {
                        throw new Error(body);
                    }
                });
            }).catch(function(err) {
                console.error("error", err);

                var oopsie = document.createElement("p");
                oopsie.innerText = "Failed to save browserprint " + brid + " --- " + err.toString();
                document.getElementById("failure-banner").appendChild(oopsie);
            })
        } else {
            console.error('unable to find job UUID');
        }
    }
    window.addEventListener('load', getAllTheThings);
})();