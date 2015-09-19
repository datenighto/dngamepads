/**
 * @preserve DNGamepads: A unified interface to web browser gamepad API's.
 *
 * @version 0.5.0
 * @copyright Date Nighto LLC [All Rights Reserved]
 * @license MIT License (see LICENSE.txt)
 */
(function(window, navigator, Object) {
    'use strict';

    // Javascript Object De”construct”ion pattern
    // http://davidwalsh.name/javascript-objects-deconstruction
    function emptyInit() {}

    function inheritWith(extensionMethods, properties) {
        extensionMethods = extensionMethods || {};
        properties = properties || {};

        var proto = this;
        if( !proto.init ) {
            proto.init = emptyInit;
        }

        var fullExtension = {};

        // transform methods into property definitions!
        for( var k in extensionMethods ) {
            fullExtension[k] = {value:extensionMethods[k],writable:true};
        }

        // use property definitions wholesale
        for( var k in properties ) {
            fullExtension[k] = properties[k];
        }

        return Object.create(proto,fullExtension);
    }

    function isa(klass) {
        return klass.isPrototypeOf(this);
    }

    function Instantiate(proto) {
        var instance = Object.create(proto);
        var init = instance.init;
        if( init && typeof init === 'function' ) {  
            init.apply(instance, Array.prototype.slice.call(arguments,1));
        }
        return instance;
    }

    function ClassDefine(definition){
        if( !definition.init ) {
            definition.init = emptyInit;
        }
        definition.isa = isa;
        definition.inheritWith = inheritWith;
        return definition;
    }

    //EventTarget Copyright (c) 2010 Nicholas C. Zakas. All rights reserved.
    //MIT License
    //http://www.nczonline.net/blog/2010/03/09/custom-events-in-javascript/
    var EventTarget = ClassDefine({
        init: function EventTarget_init() {
            this._listeners = {};
        },
        on: function EventTarget_on() { return this.addEventListener.apply(this,arguments); }, 
        addEventListener: function EventTarget_addEventListener(type,listener) {
            if (typeof this._listeners[type] === "undefined"){
                this._listeners[type] = [];
            }

            this._listeners[type].push(listener);
        },

        fire: function EventTarget_fire(type, event){ 
            event.type = type;
            return this.dispatchEvent(event);
        },
        dispatchEvent: function EventTarget_dispatchEvent(event) {
            if (typeof event == "string"){
                event = { type: event };
            }
            if (!event.target){
                event.target = this;
            }

            if (!event.type){  //falsy
                throw new Error("Event object missing 'type' property.");
            }

            if (this._listeners[event.type] instanceof Array){
                var listeners = this._listeners[event.type];
                for (var i=0, len=listeners.length; i < len; i++){
                    listeners[i].call(this, event);
                }
            }
        },

        off: function EventTarget_off() { return this.removeEventListener.apply(this,arguments); }, 
        removeEventListener: function EventTarget_removeEventListener(type,listener){
            if (this._listeners[type] instanceof Array){
                var listeners = this._listeners[type];
                for (var i=0, len=listeners.length; i < len; i++){
                    if (listeners[i] === listener){
                        listeners.splice(i, 1);
                        break;
                    }
                }
            }
        }
    });

    var ANALOGUE_BUTTON_THRESHOLD = 0.5;
    var AXIS_THRESHOLD = 0.75;

    function GetRawGamepads() {
        return  (navigator.getGamepads       && navigator.getGamepads()) || 
                (navigator.webkitGetGamepads && navigator.webkitGetGamepads()) || 
                (navigator.mozGetGamepads    && navigator.mozGetGamepads()) || 
                 navigator.webkitGamepads || 
                 [];
    };

    function GetRawGamepad(idx) {
        var pads = GetRawGamepads();
        if( idx < pads.length ) {
            return pads[idx];
        }
        return null;
    };

    var DNPad = EventTarget.inheritWith({

        /**
         * @internal
         * @param {integer} index The internal index of this gamepad
         */
        init: function DNPad_init(index) {
            var self = this;
            self.__index = index;
            var rawPad = self.__raw;
            var buttonTime = self.__buttonDownTime = [];
            var axisTime = self.__axisDownTime = [];

            self.__id = rawPad.id;
            self.__numButtons = rawPad.buttons.length;
            self.__numAxes = rawPad.axes.length;

            for( var i = 0; i < self.__numButtons; ++i ) {
                buttonTime.push(0);
            }
            for( var i = 0; i < self.__numAxes; ++i ) {
                axisTime.push(0);
            }

            EventTarget.init.call(self);
        },

        /**
         * Gets the analog value of a button with a given index.
         *
         * @param {integer} idx The index of the button
         * @returns {number} Returns a value from 0-1, indicating how depressed the button is
         */
        getButton: function DNPad_getButton(idx) { var raw = this.__raw; return !!raw ? raw.buttons[idx].value : 0; },

        /**
         * Gets the time (in the unit provided to DNGamepads#update) that the given button has been depressed, or 0 if the button is not pushed.
         *
         * @param {integer} idx The index of the button
         * @returns {number} Returns the time (in the unit provided to DNGamepads#update) that the given button has been depressed, or 0 if the button is not pushed.
         */
        getButtonDownTime: function DNPad_getButtonDownTime(idx) { return this.__buttonDownTime[idx]; },

        /**
         * Gets the analog value of an axis with a given index.
         *
         * @param {integer} idx The index of the axis
         * @returns {number} Returns a value from 0-1, indicating how depressed the axis is
         */
        getAxis: function DNPad_getAxis(idx) { var raw = this.__raw; return !!raw ? raw.axes[idx] : 0; },

        /**
         * Gets the time (in the unit provided to DNGamepads#update) that the given axis has been depressed, or 0 if the axis is not pushed.
         *
         * @param {integer} idx The index of the axis
         * @returns {number} Returns the time (in the unit provided to DNGamepads#update) that the given axis has been depressed, or 0 if the axis is not pushed.
         */
        getAxisDownTime: function DNPad_getButtonDownTime(idx) { return this.__axisDownTime[idx]; },

        /**
         * Returns true if the given axis is considered "pushed", otherwise false.
         *
         * @param {integer} idx The index of the axis
         * @returns {boolean} Returns true if the given axis is considered "pushed", otherwise false.
         */
        isAxisPushed: function DNPad_isAxisPushed(idx) { return this.getAxis(idx) > AXIS_THRESHOLD; },

        /**
         * Returns true if the given button is considered "pushed", otherwise false.
         *
         * @param {integer} idx The index of the button
         * @returns {boolean} Returns true if the given button is considered "pushed", otherwise false.
         */
        isButtonPushed: function DNPad_isButtonPushed(idx) { return this.getButton(idx) > ANALOGUE_BUTTON_THRESHOLD; },

        /**
         * @internal
         */
        _update: function DNPad__update(dt) {
            var self = this;
            var raw = self.__raw;
            var buttonDownTime = self.__buttonDownTime;
            var axisDownTime = self.__axisDownTime;

            // disconnected; forget it!
            if( !raw ) {
                return;
            }

            var i, currentState, rawValue;
            for( i = 0; i < raw.buttons.length; ++i ) {
                rawValue = self.getButton(i);
                currentState = self.isButtonPushed(i);
                if( currentState ) {
                    if( buttonDownTime[i] === 0 ) {
                        self.fire('buttondown', { target:self, gamepad:self, controllerIndex: raw.index, button: i, value: rawValue });
                    }
                    buttonDownTime[i] += dt;
                } else {
                    if( buttonDownTime[i] !== 0 ) {
                        self.fire('buttonup',   { target:self, gamepad:self, controllerIndex: raw.index, button: i, value: rawValue, time: buttonDownTime[i] });
                        buttonDownTime[i] = 0;
                    }
                }
            }

            for( i = 0; i < raw.axes.length; ++i ) {
                rawValue = self.getAxis(i);
                currentState = self.isAxisPushed(i);
                if( currentState ) {
                    if( axisDownTime[i] === 0 ) {
                        self.fire('axisdown', { target:self, gamepad:self, controllerIndex: raw.index, button: i, value: rawValue });
                    } else {
                        axisDownTime[i] += dt;
                    }
                } else {
                    if( axisDownTime[i] !== 0 ) {
                        self.fire('axisup',   { target:self, gamepad:self, controllerIndex: raw.index, button: i, value: rawValue, time: axisDownTime[i] });
                        axisDownTime[i] = 0;
                    }
                }
            }
        },

        /**
         * @internal
         */
        _didDisconnect: function DNPad__didDisconnect() {
            var self = this;
            var raw = self.__raw;
            var buttonDownTime = self.__buttonDownTime;
            var axisDownTime = self.__axisDownTime;
            var i;
            for( i = 0; i < buttonDownTime.length; ++i ) {
                if( buttonDownTime[i] !== 0 ) {
                    self.fire('buttonup',   { target:self, controllerIndex: raw.index, button: i, value: rawValue, time: buttonDownTime[i] });
                    buttonDownTime[i] = 0;
                }
            }
            for( i = 0; i < axisDownTime.length; ++i ) {
                if( axisDownTime[i] !== 0 ) {
                    self.fire('axisup', { target:self, controllerIndex: raw.index, button: i, value: rawValue, time: axisDownTime[i] });
                    axisDownTime[i] = 0;
                }
            }
        }
    }, {
        id: { 
            /**
             * @returns {string} the string ID associated with this gamepad.
             */
            get: function DNPad_id_get(){ return this.__id; } 
        },

        index: { 
            /**
             * @returns {integer} the internal index of this controller.
             */
            get: function DNPad_index_get(){ var raw = this.__raw; return !!raw ? raw.index : this.__index; } 
        },

        numButtons: { 
            /**
             * @returns {integer} the number of buttons this controller supports.
             */
            get: function DNPad_numButtons_get() { return this.__numButtons; } 
        },

        numAxes: { 
            /**
             * @returns {integer} the number of axes this controller supports.
             */
            get: function DNPad_numAxes_get() { return this.__numAxes; } 
        },

        connected: { 
            /**
             * @returns {boolean} true if this controller is connected, otherwise false.
             */
            get: function DNPad_connected_get() { var raw = this.__raw; return !!raw ? raw.connected : false; }
        },

        __raw: { 
            /**
             * @private
             */
            get: function DNPad___raw_get(){ return GetRawGamepad(this.__index); } 
        }
    });


    var Gamepads = EventTarget.inheritWith({
        init: function Gamepads_init() {
            var self = this;
            self.__lastTime = 0;
            self.__gamepads = [];
            self.__hasSupport = !!navigator.mozGetGamepads || !!navigator.webkitGetGamepads || !!navigator.getGamepads;
            self.__lastTypes = [];

            var needsPoll = self.__needsPoll = !('gamepadconnected' in window);
            if( !needsPoll ){
                $(window).on('gamepadconnected', self.__onGamepadConnect.bind(self));
                $(window).on('gamepaddisconnected', self.__onGamepadDisconnect.bind(self));
            }

            self.__tick = self.__tick.bind(self);

            EventTarget.init.call(self);
        },

        /**
         * Requests that DNGamepads start maintaining its own update loop. Button pushed time in DNPad's will be in ms.
         */
        startPolling: function Gamepads_startPolling() {
            var self = this;
            if( !self.__hasSupport ) {
                return;
            }

            if (!self.__ticking) {
                self.__ticking = true;
                self.__tick();
            }
        },

        /**
         * Requests that DNGamepads stop maintaining its own update loop. A no-op if startPolling was never called.
         */
        stopPolling: function Gamepads_stopPolling() {
            self.__lastTime = 0;
            self.__ticking = false;
        },

        /**
         * For use with external update loops. Must be called once a frame to properly maintain pushed time in DNPad's. Will
         * also call the polling loop requred to track connect/disconnects on Chrome.
         *
         * @param {number} dt The amount of time that has passed since the last update. Could be in any unit.
         */
        update: function Gamepads_update(dt) {
            var self = this;
            if( !self.__hasSupport ) {
                return;
            }

            if( self.__needsPoll ) {
                self.__pollGamepads();
            }

            var pads = self.__gamepads;
            for( var i = 0; i < pads.length; ++i ) {
                var pad = pads[i];
                if( pad ) {
                    pads[i]._update(dt);
                }
            }
        },

        /**
         * Returns the DNPad for a given index, or null if one not registered.
         *
         * @param {integer} idx The index of the requested pad
         * @returns {DNPad|null} Returns the DNPad for a given index, or null if one not registered.
         */
        getPad: function Gamepads_getPad(idx) {
            var self = this;
            var pads = self.__getPads();
            if( idx < pads.length ) {
                return pads[idx];
            }
            return null;
        },

        /**
         * @returns {Array.<DNPad>} Returns an array of all DNPad's currently registered with the system.
         */
        getPads: function Gamepads_getPads() {
            return this.__gamepads;
        },

        /**
         * @private
         */
        __pollGamepads: function Gamepads___pollGamepads() {
            var self = this;
            var rawGamepads = GetRawGamepads();
            var dnPads = self.__gamepads;
            var prevRawGamepadTypes = self.__lastTypes;
            if (rawGamepads) {

                // We only refresh the display when we detect some gamepads are new
                // or removed; we do it by comparing raw gamepad table entries to
                // “undefined.”
                var gamepadsChanged = false;

                for (var i = 0; i < rawGamepads.length; i++) {
                    var rawGamepad = rawGamepads[i];
                    var rawType = typeof rawGamepad;
                    if (rawType != prevRawGamepadTypes[i]) {
                        gamepadsChanged = true;
                        prevRawGamepadTypes[i] = rawType;
                        if( !!rawGamepad ) {
                            // added 
                            self.__addPad(rawGamepad);
                        } else {
                            //removed
                            self.__removePad(i);
                        }
                    }
                }
            }
        },

        __onGamepadConnect: function Gamepads___onGamepadConnect(event) {
            var rawPad = event.gamepad;
            this.__addPad( rawPad );
        },

        __onGamepadDisconnect: function Gamepads___onGamepadDisconnect(event) {
            this.__removePad(event.gamepad.index);
        },

        __addPad: function Gamepads___addPad(rawPad) {
            var self = this;
            var idx = rawPad.index;
            var dnPads = self.__gamepads;
            if( idx >= dnPads.length ) {
                dnPads[idx] = Instantiate(DNPad, idx);
            } else {
                // we should already have this registered .... check??
                var dnPad = dnPads[idx];
                if( dnPad.id != rawPad.id ) {
                    console.warn('ID mismatch: "' + dnPad.id + '" vs "' + rawPad.id + '"; replacing!!!' );
                    dnPads[idx] = Instantiate(DNPad, idx);
                }
            }
            self.fire('gamepadconnected', {gamepad: dnPads[idx]});
        },

        __removePad: function Gamepads___removePad(idx) {
            var self = this;
            var dnPad = self.__gamepads[idx];
            if( !!dnPad ) {
                dnPad._didDisconnect();
                self.fire('gamepaddisconnected', {gamepad: dnPad});
            }
        },

        __tick: function Gamepads___tick(time) {
            var self = this;
            var dt = 0;
            if(self.__lastTime !== 0 ) {
                dt = time - self.__lastTime;
            }
            self.__lastTime = time;
            self.update(dt);
            self.__scheduleNextTick();
        },

        __scheduleNextTick: function Gamepads___scheduleNextTick() {
            var self = this;
            // Only schedule the next frame if we haven’t decided to stop via
            // stopPolling() before.
            if (self.__ticking) {
                if (window.requestAnimationFrame) {
                    window.requestAnimationFrame(self.__tick);
                } else if (window.mozRequestAnimationFrame) {
                    window.mozRequestAnimationFrame(self.__tick);
                } else if (window.webkitRequestAnimationFrame) {
                    window.webkitRequestAnimationFrame(self.__tick);
                }
            }
        }
    }, {
        polling: {
            /**
             * @return {boolean} true if this Gamepads instance is maintaining its own update loop, otherwise false.
             */
            get: function Gamepads_polling_get() { return this.__ticking; }
        },

        supported: {
            /**
             * @return {boolean} true if this browser supports gamepads, otherwise false.
             */
            get: function Gamepads_supported_get() { return this.__hasSupport; }
        },

        axisThreshold: { 
            /**
             * @return {number} the minimum value an axis must pass before it is considered "pushed".
             */
            get: function Gamepads_axisThreshold_get() { return AXIS_THRESHOLD; },

            /**
             * @param {number} value the minimum value an axis must pass before it is considered "pushed".
             */
            set: function Gamepads_axisThreshold_set(value) { AXIS_THRESHOLD = value; }
        },

        buttonThreshold: { 
            /**
             * @return {number} the minimum value a button must pass before it is considered "pushed".
             */
            get: function Gamepads_buttonThreshold_get() { return ANALOGUE_BUTTON_THRESHOLD; },
            
            /**
             * @param {number} value the minimum value a button must pass before it is considered "pushed".
             */
            set: function Gamepads_buttonThreshold_set(value) { ANALOGUE_BUTTON_THRESHOLD = value; }
        }
    });

    if (typeof define !== 'undefined' && define.amd) {
        // AMD. Register as an anonymous module.
        define(function() {
            'use strict';
            return Instantiate(Gamepads);
        });
    } else if (typeof module !== 'undefined' && module.exports) {
        module.exports = Instantiate(Gamepads);
    } else {
        window.DNGamepads = Instantiate(Gamepads);
    }

})(window, navigator, Object);
