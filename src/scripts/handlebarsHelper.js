Handlebars.registerHelper('ifCond', function (v1, operator, v2, options) {

    switch (operator) {
        case 'eq':
            return (v1 == v2) ? options.fn(this) : options.inverse(this);
        case 'teq':
            return (v1 === v2) ? options.fn(this) : options.inverse(this);
        case 'lt':
            return (v1 < v2) ? options.fn(this) : options.inverse(this);
        case 'lteq':
            return (v1 <= v2) ? options.fn(this) : options.inverse(this);
        case 'gt':
            return (v1 > v2) ? options.fn(this) : options.inverse(this);
        case 'gteq':
            return (v1 >= v2) ? options.fn(this) : options.inverse(this);
        case 'and':
            return (v1 && v2) ? options.fn(this) : options.inverse(this);
        case 'or':
            return (v1 || v2) ? options.fn(this) : options.inverse(this);
        default:
            return options.inverse(this);
    }
});

Handlebars.registerHelper("inc", function(value, options) {
    return parseInt(value) + 1;
});


Handlebars.registerHelper("gameInProgress", function(options) {
    if(rummy.model.rounds.length > 0 && rummy.model.winner == undefined){
        return options.fn(this);
    }else{
        return options.inverse(this);
    }
});

