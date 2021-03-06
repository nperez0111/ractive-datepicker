require( './styles.styl' );

var localeStringOptions = {
    month: {
        month: 'long'
    },
    weekday: {
        weekday: 'short'
    },
    time: {
        hour: '2-digit',
        minute: '2-digit'
    },
};

var debounce = require( 'lodash/debounce' );
var animate = require( './util/animate' );
var isUndefined = require( 'lodash/isUndefined' );

module.exports = Ractive.extend( {

    template: require( './template.html' ),

    isolated: true,

    decorators: {
        preventOverscroll: require( './decorators/prevent-overscroll.js' ),
    },

    data: function () {
        return {

            // the selected date
            date: new Date(),

            // currently viewed year/month
            current: {
                year: 0,
                month: 0,
            },

            mode: 'datetime',
            editing: 'date',

            format: '',

            years: Array.apply( 0, Array( 201 ) ).map( function ( a, i ) {
                return 1900 + i
            } ),
            hours: [ 12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 ],

            /**
             * Increment minutes by this interval when setting time.
             * @default 1
             * @type integer
             */
            minuteIncrement: 1,
        }
    },

    computed: {

        // date computations

        year: function () {
            var d = this.date();
            if ( d )
                return d.getFullYear();
        },

        month: function () {
            var d = this.date();
            if ( d )
                return d.toLocaleString( navigator.language, localeStringOptions.month );
        },

        currentMonth: function () {
            var current = this.get( 'current' );
            return new Date( current.year, current.month ).toLocaleString( navigator.language, localeStringOptions.month );
        },

        currentYear: function () {
            return this.get( 'current.year' );
        },

        weekday: function () {
            var d = this.date();
            if ( d )
                return d.toLocaleString( navigator.language, localeStringOptions.weekday );
        },

        meridiem: function () {
            var d = this.date();
            if ( d )
                return d.getHours() < 12;
        },

        daysOfWeek: function () {

            var dow = [ 'S', 'M', 'T', 'W', 'T', 'F', 'S' ];

            var firstDayOfWeek = this.get( 'firstDayOfWeek' ); // default 0, Sunday, configurable

            if ( firstDayOfWeek > 0 && firstDayOfWeek < 7 ) {
                return Array.prototype.concat( dow.slice( firstDayOfWeek ), dow.slice( 0, firstDayOfWeek ) );
            }

            return dow;
        },

        dates: function () {

            var current = this.get( 'current' );
            var totalDays = new Date( current.year, current.month, 0 ).getDate(); // of month
            var firstDayOfMonth = new Date( current.year, current.month, 1 ).getDay(); // day of week the 1st is on
            var firstDayOfWeek = this.get( 'firstDayOfWeek' ); // default 0, Sunday, configurable

            var days = [];

            if ( firstDayOfWeek > 0 && firstDayOfWeek < 7 ) {
                firstDayOfMonth = firstDayOfMonth - firstDayOfWeek;
                firstDayOfMonth = firstDayOfMonth < 0 ? 7 + firstDayOfMonth : firstDayOfMonth;
            }

            for ( var i = 0, j = 1 - firstDayOfMonth; i < 42; i++, j++ )
                days.push( ( i >= firstDayOfMonth & i < firstDayOfMonth + totalDays ? j : ' ' ) );

            return days;

        },


        // time computations

        time: function () {
            var d = this.date();
            if ( d )
                return d.toLocaleTimeString( navigator.language, localeStringOptions.time );
        },

        hour: function () {
            var d = this.date();
            if ( d )
                return d.getHours();
        },

        minute: function () {
            var d = this.date();
            if ( d )
                return d.getMinutes();
        },

        // 0 - 60
        minutes: function () {
            var n = this.get( 'minuteIncrement' );
            return Array.apply( 0, Array( 60 / n ) ).map( function ( a, i ) {
                return n * i
            } );
        },

        meridiem: function () {
            var d = this.date();
            if ( d )
                return d.getHours() < 12 ? 'am' : 'pm';
        }


    },

    oninit: function () {
        var self = this;

        var date = self.get( 'date' );

        if ( !date ) {
            date = new Date();
            self.set( 'date', date );
        }

        // update current
        self.set( 'current.month', date.getMonth() );
        self.set( 'current.year', date.getFullYear() );

        self.on( 'decrementMonth', function ( details ) {
            var current = this.get( 'current' );
            current.month--;
            if ( current.month < 0 ) {
                current.month = 11;
                current.year--;
            }
            this.set( 'current', current );
        } );

        self.on( 'incrementMonth', function ( details ) {
            var current = this.get( 'current' );
            current.month++;
            if ( current.month > 11 ) {
                current.month = 0;
                current.year++;
            }
            this.set( 'current', current );
        } );

        self.on( 'decrementYear', function ( details ) {
            var current = this.get( 'current' );
            current.year--;
            this.set( 'current', current );
            this.fire( 'setDate' );
        } );

        self.on( 'incrementYear', function ( details ) {
            var current = this.get( 'current' );
            current.year++;
            this.set( 'current', current );
            this.fire( 'setDate' );
        } );

        self.on( 'setDate', function ( details ) {
            var date = this.get( 'date' );
            var current = this.get( 'current' );
            date.setYear( current.year );
            date.setMonth( current.month );
            details && date.setDate( details.context );
            self.set( 'date', date );
        } );

        self.on( 'setYear', function ( details ) {
            var date = this.get( 'date' );
            date.setFullYear( details.context );
            self.set( 'date', date );
            self.set( 'current.year', details.context );
            self.set( 'editing', 'date' );
        } );

        self.on( 'setMeridiem', function ( details, meridiem ) {
            var date = this.get( 'date' );
            var hours = date.getHours();
            if ( hours <= 12 && meridiem == 'pm' )
                date.setHours( hours + 12 );
            else if ( hours >= 12 && meridiem == 'am' )
                date.setHours( hours - 12 );
            self.set( 'date', date );
        } );



        self.observe( 'mode', function ( newMode ) {

            var editing = self.get( 'editing' );

            if ( newMode == 'date' && editing == 'time' )
                editing = 'date';

            if ( newMode == 'time' && ( editing == 'date' || editing == 'year' ) )
                editing = 'time';

            self.set( 'editing', editing );

        }, {
            defer: true
        } );


        /* --------------------- */
        // time editor stuff
        /* --------------------- */

        var animating = {};

        function snap( node, method, value ) {
            // no node, nothing to do
            if ( !node ) {
                return;
            }
            // block the animation on subsequent calls
            // from the scroll event handler
            // but don't block is we're calling it direclty
            // with a value but do block if that value is the same as the last value
            if ( animating[ method ] && value == animating[ method ].lastValue ) {
                return;
            }
            var startY = node.scrollTop;
            // grab the first div and use to size
            var div = node.querySelector( 'div' );

            // the dom has been destroyed by the time the debounce
            // has happened, so just return
            if ( !div ) {
                return;
            }

            var styles = window.getComputedStyle( div );
            var divHeight = div.offsetHeight + parseFloat( styles.marginBottom );
            var index;
            var meridiem = self.get( 'meridiem' );

            if ( !isUndefined( value ) ) {

                // we're scrolling to a specific value passed in
                // if that value is a year then subtract 1900 to get its index
                index = ( method == 'setYear' && value ? value - 1900 : value );
                // account for > 12 hours (pm)
                if ( method == 'setHours' && meridiem == 'pm' && value >= 12 )
                    index -= 12;

            } else {
                // figure out the closest div to where we scrolled
                index = Math.round( startY / divHeight );
            }


            if ( index >= node.children.length )
                index = node.children.length - 1;
            div = node.children[ index ];

            var endY = div.offsetTop - ( divHeight * ( ( method == 'setYear' ) && !isUndefined( value ) ? 3 : 1 ) ) - parseFloat( styles.marginTop ) / 2 - parseFloat( styles.marginBottom ) / 2;
            var deltaY = endY - startY;




            animating[ method ] = animate( {
                duration: 0.3,
                step: function ( p ) {
                    node.scrollTop = startY + deltaY * p;
                },
                complete: function () {
                    var date = self.get( 'date' );
                    var value = parseInt( div.textContent );
                    if ( method == 'setHours' ) {
                        var meridiem = self.get( 'meridiem' );
                        if ( meridiem == 'pm' && value !== 12 )
                            value += 12;
                        if ( meridiem == 'am' && value == 12 )
                            value = 0;
                    }

                    date[ method ]( value );

                    self.set( 'date', date );
                    animating[ method ] = {
                        lastValue: value
                    };
                }
            } );

            animating[ method ].animating = true;

        }

        // needs to be debounced so that the UI is fully updated
        // defer: true doesn't count it on the obserer
        updateTimeEditors = debounce( updateTimeEditors, 10 );

        // update scroll positions of clock editors when first viewed
        self.observe( 'editing', updateTimeEditors, {
            init: false,
            defer: true
        } );
        // update scroll positions of clock editors when date changes
        self.observe( 'date', updateTimeEditors, {
            init: false
        } );

        function updateTimeEditors( changeOfView ) {
            var cur = {
                setHours: self.get( 'hour' ),
                setMinutes: self.get( 'minute' ),
                setYear: self.get( 'year' )
            };
            if ( changeOfView == 'year' ) {
                //now in the change year view so we delete hours and minutes animatition
                delete animating.setHours;
                delete animating.setMinutes;
            }
            if ( changeOfView == 'time' ) {
                delete animating.setYear;
            }

            for ( var key in animating ) {
                if ( animating[ key ].animating === true || animating[ key ].lastValue == cur[ key ] ) {
                    return;
                }
            }
            if ( changeOfView == 'time' ) {
                snap( self.find( '.clock .hours' ), 'setHours', self.get( 'hour' ) );
                snap( self.find( '.clock .minutes' ), 'setMinutes', self.get( 'minute' ) );
                return;
            }
            if ( changeOfView == 'year' ) {
                snap( self.find( '.years' ), 'setYear', self.get( 'year' ) );
                return;
            }


        }


        var debouncedSnap = debounce( snap, 250 );

        self.on( 'clockwheel', function ( details, method ) {
            for ( var key in animating )
                if ( animating[ key ].cancel )
                    animating[ key ].cancel()

            animating = {};

            debouncedSnap( details.node, method );
        } );

    },

    // prevent computation errors for weird 
    date: function () {
        var d = this.get( 'date' );
        if ( d instanceof Date )
            return d
    }

} );
