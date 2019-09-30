'use strict';

// version: 0.1.1

function pad(num, size=2){
    let s = String(num);
    while(s.length < size){s = '0' + s;}
    return s;
}

export default
function formatDate(format, date = new Date()){
    function r(...args){format = format.replace(...args);}
    
    r(/%T/g, '%H:%M:%S');
    r(/%R/g, '%H:%M');
    r(/%D/g, '%m/%d/%y');
    r(/%F/g, '%Y-%m-%d');
    r(/%iso/g, date.toISOString());
    r(/%ms/g, pad(date.getTime() % 1000, 3));
    r(/%-ms/g, (date.getTime() % 1000));
    r(/%H/g, pad(date.getHours()));
    r(/%-H/g, (date.getHours()));
    r(/%I/g, pad(date.getHours() % 12 || 12));
    r(/%-I/g, (date.getHours() % 12 || 12));
    r(/%M/g, pad(date.getMinutes()));
    r(/%-M/g, (date.getMinutes()));
    r(/%S/g, pad(date.getSeconds()));
    r(/%-S/g, (date.getSeconds()));
    r(/%s/g, date.getTime() / 1000);
    r(/%Y/g, pad(date.getFullYear(), 4));
    r(/%y/g, pad(date.getFullYear() % 100));
    r(/%C/g, pad(date.getFullYear() / 100));
    r(/%m/g, pad(date.getMonth() + 1));
    r(/%-m/g, (date.getMonth() + 1));
    r(/%d/g, pad(date.getDate()));
    r(/%-d/g, pad(date.getDate()));
    r(/%u/g, date.getDay() || 7);
    r(/%w/g, date.getDay());
    r(/%t/g, '\t');
    return format;
}
