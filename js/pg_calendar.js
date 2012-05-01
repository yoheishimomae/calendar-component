function PGCalendar(url, opts) {
    var that = this;
    this.currentYear;
    this.currentMonth;
    this.events = [];
    this.opts = opts;
    this.detailContainer = $(opts.event_detail);
    this.calendarContainer = $(opts.calendar);
    this.hash = document.location.hash.replace('#', '');

    jQuery.getJSON(url,
    function(r) {
        that.calendarContainer.html('<div class="cal-header"><a class="left prev"></a><span></span><a class="right next"></a></div><table ></table>')
        that.onJsonLoad(r, that);
    });
}

var PGCalendarUtil = {

    sortByDate: function(a, b) {
        var da = new Date(a.time),
        db = new Date(b.time);
        return da.valueOf() - db.valueOf();
    },

    parseDate: function(gDate) {
        var s = gDate.split(/-|T/)
        if (gDate.length < 12 || !s[4]) {
            var date = new Date(s[0], parseInt(s[1], 10) - 1, s[2]);
            return date;
        }
        else {
            var time = s[3].split(':'),
            hour = parseInt(time[0], 10),
            offset = s[4].split(':'),
            difHour = parseInt(offset[0], 10),
            day = parseInt(s[2], 10);
            var date = new Date(s[0], parseInt(s[1], 10) - 1, day, time[0], time[1]);
            return date;
        }
    },

    getLocalTimeZone: function() {
        return 'PDT';
        // return new Date().toString().replace(/^.*\(|\)$/g, "").replace(/[^A-Z]/g, "");
    },

    titleToID: function(str) {
        return str.replace(/[^\w\s]+/g, '').replace(/\s/g, '_').toLowerCase();
    },
    
    getMonthText: function(month) {
        switch (month) {
        case 1:
            text = 'February';
            break;
        case 2:
            text = 'March';
            break;
        case 3:
            text = 'April';
            break;
        case 4:
            text = 'May';
            break;
        case 5:
            text = 'June';
            break;
        case 6:
            text = 'July';
            break;
        case 7:
            text = 'August';
            break;
        case 8:
            text = 'September';
            break;
        case 9:
            text = 'October';
            break;
        case 10:
            text = 'November';
            break;
        case 11:
            text = 'December';
            break;

        default:
            text = 'January';
            break;
        }
        return text
    },

    getTimeText: function(time) {
        var hour = time.getHours();
        var pm = false;
        if (hour > 12) {
            hour -= 12;
            pm = true;
        } else if (hour == 12) {
            pm = true;
        }
        var min = time.getMinutes().toString();
        if (min.length == 1) min = '0' + min;
        return hour + ':' + min + (pm ? 'PM': 'AM');
    },

    getTimeTextBundle: function(start, end) {
        var start = PGCalendarUtil.getTimeText(start);
        var end = PGCalendarUtil.getTimeText(end);

        if (start == end) {
            return 'TBA';
        } else {
            return start + '~' + end + ' ' + PGCalendarUtil.getLocalTimeZone();
        }
    }
}

PGCalendar.prototype.generateUpcomingEventList = function(events, that) {
    if (!that) that = this;
    var container = $('#upcoming-events');
    var today = new Date(),
    limit = 5,
    item = null,
    title = '',
    upcoming = [],
    date = null,
    dateString = '',
    hash = '',
    htmlAr = ['<ul class="event-list">'],
    upcomingEvent,
    i = 0;
    events = events.sort(PGCalendarUtil.sortByDate);
    for (i = 0; i < that.events.length; i++) {
        item = events[i];
        date = item.time;
        if (date > today) {
            upcoming.push(item);
            limit--;
            if (limit <= 0) break;
        }
    }
    var charLimit = 34;

    for (i = 0; i < upcoming.length; i++) {
        item = upcoming[i];
        title = item.title.length > charLimit ? item.title.slice(0, charLimit) + '...': item.title;
        date = item.time;
        hash = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + '-' + PGCalendarUtil.titleToID(item.title);
        if (i == 0) upcomingEvent = hash;
        dateString = '<b>' + PGCalendarUtil.getMonthText(date.getMonth()) + ' ' + date.getDate() + '</b>';
        htmlAr.push('<li><a href="#' + hash + '">' + dateString + ' - ' + title + '</a></li>');
    }
    if (upcoming.length == 0) {
        $('.upcoming-events-container').css('display', 'none');
    }
    htmlAr.push('</ul>');
    container.html(htmlAr.join(''));
    
    $('#upcoming-events a').click(function(r){that.onUpcomingLinkClick(that, r)});
    
    return upcomingEvent;
}

PGCalendar.prototype.onUpcomingLinkClick = function(that, r) {
    if (!that) that = this;
    setTimeout(function() {
        var hash = document.location.hash.replace('#', '');

        if (hash && hash.length > 6) {
            var date = PGCalendarUtil.parseDate(hash);
            that.renderCalendar(date);
            that.selectDate(date);
            var anchor = hash.split('-');
            if (anchor && anchor[3]) {
                var p = $('#' + anchor[3]).position();
                if (p.top) {
                    setTimeout(function() {
                        $("html, body").clearQueue().animate({
                            scrollTop: p.top + 100
                        },
                        "slow");
                    },
                    50);
                }
            }

        }
    },
    10);
}

PGCalendar.prototype.selectDate = function(date, that) {
    if (!that) that = this;
    var year = date.getFullYear();
    var month = date.getMonth();
    var day = date.getDate();

    $(that.opts.calendar + ' a.selected').removeClass('selected');
    $('a[href="#' + year + '-' + (month + 1) + '-' + day + '"]').addClass('selected');
    var eventItem,
    startTime,
    endTime,
    description,
    location;
    var eventsToday = [];
    var htmlAr = [];
    var today = new Date();
    var isToday = today.getMonth() == month && today.getDate() == day && today.getFullYear() == year;
    htmlAr.push('<h2>' + PGCalendarUtil.getMonthText(month) + ' ' + day + ', ' + year + (isToday ? ' (Today)': '') + '</h2><hr/>');

    for (var j = 0; j < this.events.length; j++) {
        eventItem = this.events[j];
        time = eventItem.time;
        if (time.getDate() == day && time.getFullYear() == year
        && time.getMonth() == month) {
            eventsToday.push(eventItem);
        }
    }

    if (eventsToday.length > 0) {
        for (var i = 0; i < eventsToday.length; i++) {

            if (i > 0) htmlAr.push('<hr/>');

            eventItem = eventsToday[i];

            htmlAr.push('<div><h2 id="' + PGCalendarUtil.titleToID(eventItem.title) + '">' + eventItem.title + '</h2><br/>');

            location = (eventItem.location && eventItem.location.length > 0) ? eventItem.location: "TBA";
            timeText = PGCalendarUtil.getTimeTextBundle(eventItem.time, eventItem.timeEnd);
            htmlAr.push('<p style="font-size: 12px">');
            htmlAr.push('<strong>Date</strong>: ' + eventItem.time.toDateString() + '<br/>');
            htmlAr.push('<strong>Where</strong>: ' + location + '<br/>');
            htmlAr.push('<strong>Time</strong>: ' + timeText + '<br/>');
            htmlAr.push('</p><br/>');

            description = eventItem.description.replace(/\n/gi, '<br/>');
            htmlAr.push('<p>' + description + '</p></div>');
        }

    } else {
        htmlAr.push('<p style="height:500px;">No event for this day</p>');
    }
    that.detailContainer.html(htmlAr.join(''));
}

PGCalendar.prototype.renderCalendar = function(date, that) {
    if (!that) that = this;
    var cal = $('.calendar table')[0];
    var htmlAr = ['<tr><th><span class="first">Sun</span></th><th><span>Mon</span></th><th><span>Tue</span></th><th><span>Wed</span></th><th><span>Thu</span></th><th><span>Fri</span></th><th><span class="last">Sun</span></th></tr>'];
    var item,
    selected,
    current,
    isToday,
    isEventDay,
    className,
    eventItem,
    hash;
    var year = date.getFullYear();
    var month = date.getMonth();
    var today = new Date();
    var counter = 0;
    var iscurrentMonth = month == today.getMonth() && year == today.getFullYear();
    that.currentYear = year;
    that.currentMonth = month;
    
    var lastDay = 28,
    weekOfDay = 0;
    for (var i = 28; i < 32; i++) {
        if (month == new Date(year, month, i).getMonth()) {
            lastDay = i;
        }
        else {
            break;
        }
    }
    weekOfDay = new Date(year, month, 1).getDay();
    var index = weekOfDay - 1;

    for (var i = 0; i < Math.ceil((lastDay + weekOfDay) / 7) * 7; i++) {
        if (counter == 0) htmlAr.push('<tr>')

        selected = isToday = isEventDay = false;
        className = '';
        var day = i - index;

        if (iscurrentMonth && day == today.getDate()) {
            isToday = true;
            className += ' today';
        }
        for (var j = 0; j < that.events.length; j++) {
            eventItem = that.events[j];
            time = eventItem.time;
            if (time.getDate() == day && time.getFullYear() == that.currentYear
            && time.getMonth() == that.currentMonth) {
                isEventDay = true;
                break;
            }
        }
        hash = that.currentYear + '-' + (that.currentMonth + 1) + '-' + day;
        htmlAr.push('<td' + (className.length > 0 ? ' class="' + className + '"': '') + '>'
        + (i > index && day < lastDay + 1 ? '<a href="#' + hash + '"'
        + ' data-date="' + day + '" >'
        + day + (isEventDay ? '<span class="event-day">•</span>': '')
        + '</a>': '<span class="empty"></span>') + '</td>');

        counter++;
        if (counter == 7) {
            counter = 0;
            htmlAr.push('</tr>')
        }
    }

    $(cal).html(htmlAr.join(''));
    var header = $(that.opts.calendar + ' .cal-header span')[0];
    var text = PGCalendarUtil.getMonthText(date.getMonth());
    header.innerHTML = text + ' ' + year;
    $(that.opts.calendar + ' table a').click(function(){that.onCellClick(this, that)});
}

PGCalendar.prototype.onCellClick = function(r, that) {
    if (!that) that = this;
    var day = $(r).attr('data-date');
    that.selectDate(new Date(that.currentYear, that.currentMonth, day))
}

PGCalendar.prototype.nextMonth = function(that) {
    if (!that) that = this;
    var month = that.currentMonth + 1;
    if (month > 11) {
        that.currentYear++;
        month = 0;
    }
    that.renderCalendar(new Date(that.currentYear, month, 1), that)
}

PGCalendar.prototype.prevMonth = function(that) {
    if (!that) that = this;
    var month = that.currentMonth - 1;
    if (month < 0) {
        that.currentYear--;
        month = 11;
    }
    that.renderCalendar(new Date(that.currentYear, month, 1), that)
}

PGCalendar.prototype.onJsonLoad = function(json, that) {
    var calData = json.data.items;
    var today = new Date();
    var hash = that.hash;
    
    for (var i = 0; i < calData.length; i++) {
        var item = calData[i];
        var obj = {
            time: PGCalendarUtil.parseDate(item.when[0].start),
            timeEnd: PGCalendarUtil.parseDate(item.when[0].end),
            location: item.location,
            title: item.title,
            URL: '#',
            description: item.details
        }
        that.events.push(obj);
    }

    that.upcomingEvent = that.generateUpcomingEventList(that.events, that);
    
    $('#calendar .prev').click(function(r){that.prevMonth(that)});
    $('#calendar .next').click(function(r){that.nextMonth(that)});
    
    if (hash && hash.length > 6) {
        var date = PGCalendarUtil.parseDate(hash);
        that.renderCalendar(date);
        that.selectDate(date, that);

        var anchor = hash.split('-');
        if (anchor && anchor[3]) {
            var p = $('#' + anchor[3]).position();
            if (p.top) {
                setTimeout(function() {
                    $("html, body").clearQueue().animate({
                        scrollTop: p.top + 100
                    },
                    "slow");
                },
                50);
            }
        }
    }
    else if (that.upcomingEvent) {
        var date = PGCalendarUtil.parseDate(that.upcomingEvent);
        that.renderCalendar(date);
        that.selectDate(date, that);
    } else {
        that.renderCalendar(today);
        that.selectDate(today, that);
    }
}
