
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.38.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/components/school/SchoolEditor.svelte generated by Svelte v3.38.2 */
    const file$3 = "src/components/school/SchoolEditor.svelte";

    function create_fragment$3(ctx) {
    	let section;
    	let div0;
    	let input0;
    	let input0_value_value;
    	let t0;
    	let div1;
    	let input1;
    	let input1_value_value;
    	let t1;
    	let div2;
    	let input2;
    	let input2_value_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			section = element("section");
    			div0 = element("div");
    			input0 = element("input");
    			t0 = space();
    			div1 = element("div");
    			input1 = element("input");
    			t1 = space();
    			div2 = element("div");
    			input2 = element("input");
    			attr_dev(input0, "id", "name");
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "placeholder", "Enter school name");
    			input0.value = input0_value_value = /*school*/ ctx[0] ? /*school*/ ctx[0].name : "";
    			attr_dev(input0, "class", "svelte-opby0r");
    			add_location(input0, file$3, 20, 8, 505);
    			attr_dev(div0, "class", "school-editor__input svelte-opby0r");
    			add_location(div0, file$3, 19, 4, 462);
    			attr_dev(input1, "id", "city");
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "placeholder", "Enter city");
    			input1.value = input1_value_value = /*school*/ ctx[0] ? /*school*/ ctx[0].city : "";
    			attr_dev(input1, "class", "svelte-opby0r");
    			add_location(input1, file$3, 29, 8, 760);
    			attr_dev(div1, "class", "school-editor__input svelte-opby0r");
    			add_location(div1, file$3, 28, 4, 717);
    			attr_dev(input2, "id", "country");
    			attr_dev(input2, "type", "text");
    			attr_dev(input2, "placeholder", "Enter country");
    			input2.value = input2_value_value = /*school*/ ctx[0] ? /*school*/ ctx[0].country : "";
    			attr_dev(input2, "class", "svelte-opby0r");
    			add_location(input2, file$3, 38, 8, 1008);
    			attr_dev(div2, "class", "school-editor__input svelte-opby0r");
    			add_location(div2, file$3, 37, 4, 965);
    			attr_dev(section, "class", "school-editor svelte-opby0r");
    			add_location(section, file$3, 18, 0, 426);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div0);
    			append_dev(div0, input0);
    			append_dev(section, t0);
    			append_dev(section, div1);
    			append_dev(div1, input1);
    			append_dev(section, t1);
    			append_dev(section, div2);
    			append_dev(div2, input2);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*onSchoolDataChanged*/ ctx[1], false, false, false),
    					listen_dev(input1, "input", /*onSchoolDataChanged*/ ctx[1], false, false, false),
    					listen_dev(input2, "input", /*onSchoolDataChanged*/ ctx[1], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*school*/ 1 && input0_value_value !== (input0_value_value = /*school*/ ctx[0] ? /*school*/ ctx[0].name : "") && input0.value !== input0_value_value) {
    				prop_dev(input0, "value", input0_value_value);
    			}

    			if (dirty & /*school*/ 1 && input1_value_value !== (input1_value_value = /*school*/ ctx[0] ? /*school*/ ctx[0].city : "") && input1.value !== input1_value_value) {
    				prop_dev(input1, "value", input1_value_value);
    			}

    			if (dirty & /*school*/ 1 && input2_value_value !== (input2_value_value = /*school*/ ctx[0] ? /*school*/ ctx[0].country : "") && input2.value !== input2_value_value) {
    				prop_dev(input2, "value", input2_value_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("SchoolEditor", slots, []);
    	let { school } = $$props;
    	const dispatch = createEventDispatcher();

    	const onSchoolDataChangedHandler = data => {
    		dispatch("onSchoolDataChanged", data);
    	};

    	function onSchoolDataChanged(e) {
    		const changedData = {};
    		changedData[e.target.id] = e.target.value;
    		onSchoolDataChangedHandler(changedData);
    	}

    	const writable_props = ["school"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SchoolEditor> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("school" in $$props) $$invalidate(0, school = $$props.school);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		school,
    		dispatch,
    		onSchoolDataChangedHandler,
    		onSchoolDataChanged
    	});

    	$$self.$inject_state = $$props => {
    		if ("school" in $$props) $$invalidate(0, school = $$props.school);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [school, onSchoolDataChanged];
    }

    class SchoolEditor extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { school: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SchoolEditor",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*school*/ ctx[0] === undefined && !("school" in props)) {
    			console.warn("<SchoolEditor> was created without expected prop 'school'");
    		}
    	}

    	get school() {
    		throw new Error("<SchoolEditor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set school(value) {
    		throw new Error("<SchoolEditor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/school/SchoolList.svelte generated by Svelte v3.38.2 */
    const file$2 = "src/components/school/SchoolList.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	child_ctx[11] = i;
    	return child_ctx;
    }

    // (32:4) {#each schools as school, i}
    function create_each_block(ctx) {
    	let div4;
    	let div0;
    	let t0_value = /*school*/ ctx[9].name + "";
    	let t0;
    	let t1;
    	let div1;
    	let t2_value = /*school*/ ctx[9].city + "";
    	let t2;
    	let t3;
    	let div2;
    	let t4_value = /*school*/ ctx[9].country + "";
    	let t4;
    	let t5;
    	let div3;
    	let span;
    	let mounted;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[3](/*school*/ ctx[9], ...args);
    	}

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[4](/*school*/ ctx[9]);
    	}

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			div1 = element("div");
    			t2 = text(t2_value);
    			t3 = space();
    			div2 = element("div");
    			t4 = text(t4_value);
    			t5 = space();
    			div3 = element("div");
    			span = element("span");
    			span.textContent = "Delete";
    			attr_dev(div0, "class", "school-list__item__cell svelte-i59ryu");
    			add_location(div0, file$2, 33, 12, 1024);
    			attr_dev(div1, "class", "school-list__item__cell svelte-i59ryu");
    			add_location(div1, file$2, 34, 12, 1093);
    			attr_dev(div2, "class", "school-list__item__cell svelte-i59ryu");
    			add_location(div2, file$2, 35, 12, 1162);
    			attr_dev(span, "class", "svelte-i59ryu");
    			add_location(span, file$2, 37, 16, 1288);
    			attr_dev(div3, "class", "school-list__item__cell svelte-i59ryu");
    			add_location(div3, file$2, 36, 12, 1234);
    			attr_dev(div4, "class", "school-list__item svelte-i59ryu");
    			add_location(div4, file$2, 32, 8, 941);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div0);
    			append_dev(div0, t0);
    			append_dev(div4, t1);
    			append_dev(div4, div1);
    			append_dev(div1, t2);
    			append_dev(div4, t3);
    			append_dev(div4, div2);
    			append_dev(div2, t4);
    			append_dev(div4, t5);
    			append_dev(div4, div3);
    			append_dev(div3, span);

    			if (!mounted) {
    				dispose = [
    					listen_dev(span, "click", click_handler, false, false, false),
    					listen_dev(div4, "click", click_handler_1, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*schools*/ 1 && t0_value !== (t0_value = /*school*/ ctx[9].name + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*schools*/ 1 && t2_value !== (t2_value = /*school*/ ctx[9].city + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*schools*/ 1 && t4_value !== (t4_value = /*school*/ ctx[9].country + "")) set_data_dev(t4, t4_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(32:4) {#each schools as school, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let section;
    	let div4;
    	let div0;
    	let t1;
    	let div1;
    	let t3;
    	let div2;
    	let t5;
    	let div3;
    	let t7;
    	let t8;
    	let div5;
    	let mounted;
    	let dispose;
    	let each_value = /*schools*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			section = element("section");
    			div4 = element("div");
    			div0 = element("div");
    			div0.textContent = "School name";
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "City";
    			t3 = space();
    			div2 = element("div");
    			div2.textContent = "Country";
    			t5 = space();
    			div3 = element("div");
    			div3.textContent = "Action";
    			t7 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t8 = space();
    			div5 = element("div");
    			div5.textContent = "Add new";
    			attr_dev(div0, "class", "school-list__item__cell svelte-i59ryu");
    			add_location(div0, file$2, 26, 8, 661);
    			attr_dev(div1, "class", "school-list__item__cell svelte-i59ryu");
    			add_location(div1, file$2, 27, 8, 724);
    			attr_dev(div2, "class", "school-list__item__cell svelte-i59ryu");
    			add_location(div2, file$2, 28, 8, 780);
    			attr_dev(div3, "class", "school-list__item__cell svelte-i59ryu");
    			add_location(div3, file$2, 29, 8, 839);
    			attr_dev(div4, "class", "school-list__item header svelte-i59ryu");
    			add_location(div4, file$2, 25, 4, 614);
    			attr_dev(div5, "class", "add-new-school svelte-i59ryu");
    			add_location(div5, file$2, 43, 4, 1443);
    			attr_dev(section, "class", "school-list");
    			add_location(section, file$2, 24, 0, 580);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div4);
    			append_dev(div4, div0);
    			append_dev(div4, t1);
    			append_dev(div4, div1);
    			append_dev(div4, t3);
    			append_dev(div4, div2);
    			append_dev(div4, t5);
    			append_dev(div4, div3);
    			append_dev(section, t7);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(section, null);
    			}

    			append_dev(section, t8);
    			append_dev(section, div5);

    			if (!mounted) {
    				dispose = listen_dev(div5, "click", /*click_handler_2*/ ctx[5], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*onItemClicked, schools, onDeleteSchool*/ 7) {
    				each_value = /*schools*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(section, t8);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("SchoolList", slots, []);
    	let { schools } = $$props;
    	const dispatch = createEventDispatcher();

    	const onItemSelectedEventHandler = data => {
    		dispatch("onItemSelected", data);
    	};

    	const onDeleteSchoolEventHandler = schoolId => {
    		dispatch("onDeleteItem", schoolId);
    	};

    	function onItemClicked(selectedSchool) {
    		onItemSelectedEventHandler(selectedSchool);
    	}

    	function onDeleteSchool(e, schoolId) {
    		e.stopPropagation();
    		onDeleteSchoolEventHandler(schoolId);
    	}

    	const writable_props = ["schools"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SchoolList> was created with unknown prop '${key}'`);
    	});

    	const click_handler = (school, e) => onDeleteSchool(e, school.id);
    	const click_handler_1 = school => onItemClicked(school);
    	const click_handler_2 = () => onItemClicked();

    	$$self.$$set = $$props => {
    		if ("schools" in $$props) $$invalidate(0, schools = $$props.schools);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		schools,
    		dispatch,
    		onItemSelectedEventHandler,
    		onDeleteSchoolEventHandler,
    		onItemClicked,
    		onDeleteSchool
    	});

    	$$self.$inject_state = $$props => {
    		if ("schools" in $$props) $$invalidate(0, schools = $$props.schools);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		schools,
    		onItemClicked,
    		onDeleteSchool,
    		click_handler,
    		click_handler_1,
    		click_handler_2
    	];
    }

    class SchoolList extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { schools: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SchoolList",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*schools*/ ctx[0] === undefined && !("schools" in props)) {
    			console.warn("<SchoolList> was created without expected prop 'schools'");
    		}
    	}

    	get schools() {
    		throw new Error("<SchoolList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set schools(value) {
    		throw new Error("<SchoolList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/school/School.svelte generated by Svelte v3.38.2 */

    const { Object: Object_1, console: console_1 } = globals;
    const file$1 = "src/components/school/School.svelte";

    // (92:0) {#if currentSchool}
    function create_if_block(ctx) {
    	let schooleditor;
    	let t0;
    	let section;
    	let div0;
    	let input0;
    	let t1;
    	let div1;
    	let input1;
    	let current;
    	let mounted;
    	let dispose;

    	schooleditor = new SchoolEditor({
    			props: { school: /*currentSchool*/ ctx[1] },
    			$$inline: true
    		});

    	schooleditor.$on("onSchoolDataChanged", /*onSchoolDataChanged*/ ctx[4]);

    	const block = {
    		c: function create() {
    			create_component(schooleditor.$$.fragment);
    			t0 = space();
    			section = element("section");
    			div0 = element("div");
    			input0 = element("input");
    			t1 = space();
    			div1 = element("div");
    			input1 = element("input");
    			attr_dev(input0, "type", "button");
    			input0.value = "Cancel";
    			attr_dev(input0, "class", "svelte-lubhtz");
    			add_location(input0, file$1, 98, 12, 2401);
    			attr_dev(div0, "class", "button-row svelte-lubhtz");
    			add_location(div0, file$1, 97, 8, 2364);
    			attr_dev(input1, "type", "button");
    			input1.value = "Save";
    			attr_dev(input1, "class", "svelte-lubhtz");
    			add_location(input1, file$1, 102, 12, 2521);
    			attr_dev(div1, "class", "button-row svelte-lubhtz");
    			add_location(div1, file$1, 101, 8, 2484);
    			attr_dev(section, "class", "button-wrapper svelte-lubhtz");
    			add_location(section, file$1, 96, 4, 2323);
    		},
    		m: function mount(target, anchor) {
    			mount_component(schooleditor, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, section, anchor);
    			append_dev(section, div0);
    			append_dev(div0, input0);
    			append_dev(section, t1);
    			append_dev(section, div1);
    			append_dev(div1, input1);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "click", /*onCancel*/ ctx[5], false, false, false),
    					listen_dev(input1, "click", /*onSave*/ ctx[6], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			const schooleditor_changes = {};
    			if (dirty & /*currentSchool*/ 2) schooleditor_changes.school = /*currentSchool*/ ctx[1];
    			schooleditor.$set(schooleditor_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(schooleditor.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(schooleditor.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(schooleditor, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(section);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(92:0) {#if currentSchool}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let schoollist;
    	let t;
    	let if_block_anchor;
    	let current;

    	schoollist = new SchoolList({
    			props: { schools: /*schools*/ ctx[0] },
    			$$inline: true
    		});

    	schoollist.$on("onItemSelected", /*onSchoolSelected*/ ctx[3]);
    	schoollist.$on("onDeleteItem", /*deleteSchool*/ ctx[2]);
    	let if_block = /*currentSchool*/ ctx[1] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			create_component(schoollist.$$.fragment);
    			t = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(schoollist, target, anchor);
    			insert_dev(target, t, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const schoollist_changes = {};
    			if (dirty & /*schools*/ 1) schoollist_changes.schools = /*schools*/ ctx[0];
    			schoollist.$set(schoollist_changes);

    			if (/*currentSchool*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*currentSchool*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(schoollist.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(schoollist.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(schoollist, detaching);
    			if (detaching) detach_dev(t);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const endPoint = "http://localhost:3000";

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("School", slots, []);
    	let schools = [];
    	let currentSchool;

    	onMount(async () => {
    		await loadSchoolData();
    	});

    	async function loadSchoolData() {
    		await fetch(`${endPoint}/school/findAll`).then(r => r.json()).then(data => {
    			$$invalidate(1, currentSchool = null);
    			$$invalidate(0, schools = data);
    		});
    	}

    	function createSchool() {
    		fetch(`${endPoint}/school/create`, {
    			method: "POST",
    			headers: {
    				Accept: "application/json",
    				"Content-Type": "application/json"
    			},
    			body: JSON.stringify(currentSchool)
    		}).then(loadSchoolData);
    	}

    	function updateSchool() {
    		fetch(`${endPoint}/school/update/${currentSchool.id}`, {
    			method: "PUT",
    			headers: {
    				Accept: "application/json",
    				"Content-Type": "application/json"
    			},
    			body: JSON.stringify(currentSchool)
    		}).then(loadSchoolData);
    	}

    	function deleteSchool(param) {
    		fetch(`${endPoint}/school/delete/${param.detail}`, { method: "DELETE" }).then(loadSchoolData);
    	}

    	function onSchoolSelected(param) {
    		if (!param.detail) {
    			$$invalidate(1, currentSchool = { id: "", name: "", city: "", country: "" });
    			return;
    		}

    		$$invalidate(1, currentSchool = schools.find(s => s.id === param.detail.id));
    	}

    	function onSchoolDataChanged(param) {
    		$$invalidate(1, currentSchool = Object.assign(currentSchool, param.detail));
    		console.log(currentSchool);
    	}

    	function onCancel() {
    		$$invalidate(1, currentSchool = null);
    	}

    	function onSave() {
    		if (!currentSchool.id) {
    			return createSchool();
    		}

    		updateSchool();
    	}

    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<School> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		SchoolEditor,
    		SchoolList,
    		endPoint,
    		schools,
    		currentSchool,
    		loadSchoolData,
    		createSchool,
    		updateSchool,
    		deleteSchool,
    		onSchoolSelected,
    		onSchoolDataChanged,
    		onCancel,
    		onSave
    	});

    	$$self.$inject_state = $$props => {
    		if ("schools" in $$props) $$invalidate(0, schools = $$props.schools);
    		if ("currentSchool" in $$props) $$invalidate(1, currentSchool = $$props.currentSchool);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		schools,
    		currentSchool,
    		deleteSchool,
    		onSchoolSelected,
    		onSchoolDataChanged,
    		onCancel,
    		onSave
    	];
    }

    class School extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "School",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.38.2 */
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let school;
    	let current;

    	school = new School({
    			props: { class: "school" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(school.$$.fragment);
    			attr_dev(main, "class", "svelte-g49lqz");
    			add_location(main, file, 5, 0, 95);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(school, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(school.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(school.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(school);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let { name } = $$props;
    	const writable_props = ["name"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    	};

    	$$self.$capture_state = () => ({ School, name });

    	$$self.$inject_state = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [name];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { name: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[0] === undefined && !("name" in props)) {
    			console.warn("<App> was created without expected prop 'name'");
    		}
    	}

    	get name() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
