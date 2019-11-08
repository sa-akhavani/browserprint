(function() {
    function getAllTheThings() {
        var seenSeed = 0;
        var seen = new Map();

        function walkObject(object, prefix) {
            if (seen.has(object)) {
                return `<cycle>`
            } else {
                var id = ++seenSeed;
                seen.set(object, id);
                var props = Object.getOwnPropertyDescriptors(object);
                var vals = [];
                for (var name in props) {
                    var d = props[name];
                    var v = ('value' in d) ? d.value : `${d.get.name}()`;
                    if (typeof v === 'object') {
                        vals.push([`${prefix}.${name}`, walkObject(v, prefix + '.' + name)]);
                    } else if (typeof v === 'function') {
                        if ('prototype' in v && (v.prototype !== object)) {
                            vals.push([`${prefix}.${name}`, `${v.name}()`, walkObject(v.prototype, `${prefix}.${name}.prototype`)]);
                        } else {
                            vals.push([`${prefix}.${name}`, `${v.name}()`]);
                        }
                    } else {
                        vals.push([`${prefix}.${name}`, v]);
                    }
                }
                vals.sort();
                return vals;
            }
        }
        var wat = walkObject(window, '');
        console.log(wat);
        document.body.appendChild(document.createTextNode(JSON.stringify(wat)));
    }
    window.addEventListener('load', getAllTheThings);
})();
