function occurrences(string, subString, allowOverlapping) {
    
    string += "";
    subString += "";
    if (subString.length <= 0) return (string.length + 1);
    
    var n = 0,
    pos = 0,
    step = allowOverlapping ? 1 : subString.length;
    
    while (true) {
        pos = string.indexOf(subString, pos);
        if (pos >= 0) {
            ++n;
            pos += step;
        } else break;
    }
    return n;
}

function filesBetweenDates(start, end, files)
{
    if(start.year() != end.year())
    {
        for(var x = start.year()+1; x < end.year();x++)
        {//Add Gap Years
            files.push(x);
        }
        fillMinutes(start, files);
        fillHours(start, files);
        fillDays(start, files);
        fillMonths(start, files);
        //
        fillMinutes(end, files, true);
        fillHours(end, files, true);
        fillDays(end, files, true);
        fillMonths(end, files, true);
    }
    else if(start.month() != end.month())
    {//years match
        for(var x = start.month()+2; x <= end.month();x++)
        {//Add Gap Months
            files.push(start.year()+"/"+(x<10?"0"+x:x));
        }
        fillMinutes(start, files);
        fillHours(start, files);
        fillDays(start, files);
        //
        fillMinutes(end, files, true);
        fillHours(end, files, true);
        fillDays(end, files, true);
    }
    else if(start.date() != end.date())
    {//years match
        for(var x = start.date()+1; x < end.date();x++)
        {//Add Gap Days
            files.push(start.format("YYYY/MM/")+(x<10?"0"+x:x));
        }
        fillMinutes(start, files);
        fillHours(start, files);
        //
        fillMinutes(end, files, true);
        fillHours(end, files, true);
    }
    else if(start.hour() != end.hour())
    {//years match
        for(var x = start.hour()+1; x < end.hour();x++)
        {//Add Gap Hours
            files.push(start.format("YYYY/MM/DD/")+(x<10?"0"+x:x));
        }
        fillMinutes(start, files);
        fillMinutes(end, files, true);
    }
    else if(start.minute() != end.minute())
    {
        for(var x = start.minute(); x <= end.minute();x++)
        {//Add Gap Minutes
            files.push(start.format("YYYY/MM/DD/HH/")+(x<10?"0"+x:x));
        }
    }//Only select one minute
    else files.push(start.format("YYYY/MM/DD/HH/mm"));
}
//Fill functions
function fillMinutes(start, files, up)
{
    if(!up)
        for(var x = start.minute(); x < 60; x++)
        {
            files.push(start.format("YYYY/MM/DD/HH/"+(x<10?"0"+x:x)));
        }
    else
        for(var x = start.minute(); x >= 0; x--)
        {
            files.push(start.format("YYYY/MM/DD/HH/"+(x<10?"0"+x:x)));
        }
}
function fillHours(start, files, up)
{
    if(!up)
        for(var x = start.hour() + 1; x < 24; x++)
        {
            files.push(start.format("YYYY/MM/DD/"+(x<10?"0"+x:x)));
        }
    else
        for(var x = start.hour() + 1; x >= 0; x--)
        {
            files.push(start.format("YYYY/MM/DD/"+(x<10?"0"+x:x)));
        }
}
function fillDays(start, files, up)
{
    if(!up)
        for(var x = start.date() + 1; x <= 31; x++)
        {
            files.push(start.format("YYYY/MM/"+(x<10?"0"+x:x)));
        }
    else
        for(var x = start.date() + 1; x >= 0; x++)
        {
            files.push(start.format("YYYY/MM/"+(x<10?"0"+x:x)));
        }
}
function fillMonths(start, files, up)
{
    if(!up)
        for(var x = start.month() + 2; x <= 12; x++)
        {
            files.push(start.format("YYYY/"+(x<10?"0"+x:x)));
        }
    else
        for(var x = start.month() + 2; x >= 0; x--)
        {
            files.push(start.format("YYYY/"+(x<10?"0"+x:x)));
        }
}
