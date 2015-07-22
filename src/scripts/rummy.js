/* Adding missing jQuery functions. TODO Move this to a common folder later*/
$.fn.serializeObject = function()
{
    var o = {};
    var a = this.serializeArray();
    $.each(a, function() {
        if (o[this.name] !== undefined) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });
    return o;
};


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

var rummy = {},
	$box = $("#page"),
	modelKey = 'rummyModel',
	fbi = false; 

rummy.fb = {};

rummy.init = function() {
	console.log(this);
	this.initModel();
	this.initPageNames();
	this.showPage();
	this.bindEvents();
	this.initFacebookAPI();
};


rummy.initModel = function() {
	//Init Data Model
	this.model  = this.getModel();
	if(this.model == null){
		this.model = {};
		this.model.settings = {};
		this.model.settings.gameScore = 251;
		this.model.settings.dropScore = 25;
		this.model.settings.middleDropScore = 50;
		this.model.players = [];
		this.model.roundNumber = 1;
		this.model.rounds = [];
	}
	//Init Data Template 
	this.template = Handlebars.compile($('#template').html());
};


rummy.initPageNames = function(){
	$box.html(this.template(this.model));
	rummy.pages = [];
	$box.find('.page').each(function(){rummy.pages.push('#'+this.id);});
};

rummy.showPage = function() {
	var pageName = window.location.hash,
		animationDelay = 400;	

	/* Unknown pageName reset to intro */
	if($.inArray(pageName, rummy.pages) == -1) {
		window.location.hash = "#intro";
		return;
	}

	/* No players so taking the user to intro page*/
	if(pageName == '#scoreCard' && rummy.model.players.length == 0){
		window.location.hash = "#intro";
		return;
	}

	/* Not enough players so taking the user to players page*/
	if(pageName == '#scoreCard' && rummy.model.players.length < 2){
		window.location.hash = "#players";
		return;
	}

	/*Update scores*/
	if(pageName == '#scoreCard'){
		rummy.updateScores();
	}

	$box.html(this.template(this.model))
		.find('.page')
		.fadeOut(animationDelay)
		.delay(animationDelay)
		.filter(pageName)
		.fadeIn(function(){
			window.scrollTo(0,0);
		});

};

rummy.updateScores = function(){
	var players = rummy.model.players,
		playersLength = players.length,
		i;

	for (i = 0; i < playersLength; i++) {
		player = players[i];
		console.log("Updating Player "+ player.name);
		rummy.updateDrops(player);
	};
};

rummy.updateDrops = function(player) {

	if(player.totalScore == undefined){
		player.totalScore = 0;
	}

	if(player.rounds == undefined){
		player.rounds = [];
	}

	player.dropsLeft = Math.floor((rummy.model.settings.gameScore - player.totalScore) / rummy.model.settings.dropScore);
	player.middleDropsLeft = Math.floor((rummy.model.settings.gameScore - player.totalScore) / rummy.model.settings.middleDropScore);

	player.dropsLeft = (player.dropsLeft < 0) ? 0 : player.dropsLeft;
	player.middleDropsLeft = (player.middleDropsLeft < 0) ? 0 : player.middleDropsLeft;

	console.log("Player: " + player.name);
	console.log(player);
}

rummy.sumScores = function(scores){
	if(scores && scores.length > 0){
		var evalString = scores.join('+');
		console.log("Evaluating "+evalString);
		return eval(evalString);
	}
	return 0;
}

rummy.addRoundScores = function(roundScores){

	//some error handling
	if(roundScores.length != this.model.players.length){
		console.error("Something went wrong.");
		return;
	}

	var players = this.model.players,
		playersLength = players.length,
		i,
		evalString;

	this.model.rounds.push(roundScores);
	this.model.roundNumber = this.model.rounds.length;

	for (i = 0; i < playersLength; i++) {
		console.log(roundScores[i])
		players[i].rounds.push(roundScores[i]);
		players[i].totalScore = rummy.sumScores(players[i].rounds);
		console.log("Player Round");
		console.log(players[i].rounds);
	};
};

rummy.resetScores = function(){
	this.model.rounds = [];
	var players = this.model.players,
		playersLength = players.length,
		i;
	for (i = 0; i < playersLength; i++) {
		players[i].totalScore = undefined;
		players[i].rounds = undefined;
		this.updateDrops(players[i]);
	}

	this.saveModel();
};

rummy.saveModel = function() {
	// Put the object into storage
	localStorage.setItem(modelKey, JSON.stringify(this.model));
};

rummy.getModel = function() {
	// Retrieve the object from storage
	var retrievedModel = localStorage.getItem(modelKey);
	if(retrievedModel){
		return JSON.parse(retrievedModel);
	}
	return null;
};

rummy.initFacebookAPI = function(){
	if(fbi){
		$.getScript('//connect.facebook.net/en_US/sdk.js', function(){
		    FB.init({
		      appId: '405642912973671',
		      status: true,
	    	  xfbml: true,
		      version: 'v2.4' // or v2.0, v2.1, v2.0
		    });
		});
	}
};

rummy.getFBFriendLists = function(name){
	/* make the API call */
	FB.api(
	    "/me/friendlists",
	    function (response) {
	    	console.log(response);
	      	if (response && !response.error) {
	        /* handle the result */
	      	}
	    }
	);
};

rummy.addPlayer = function(player){
	console.log("Adding new player " + player.name);
	if(rummy.model.gameInProgress) {
		console.log("Game is currently in progress. Retrieving active player round score who has the max totalScore");
		player.rounds = rummy.getNewReentryPlayersRoundScores();
		player.totalScore = rummy.sumScores(player.rounds);
		rummy.updateDrops(player);
		rummy.updateRoundScoresForNewPlayer(player.rounds);
	}

	rummy.model.players.push(player);
	rummy.saveModel();
	rummy.showPage();
};

rummy.updateRoundScoresForNewPlayer = function(roundScores){
	if(roundScores){
		var roundsLength = roundScores.length;
		for (var i = 0; i < roundsLength; i++) {
			rummy.model.rounds[i].push(roundScores[i]);
		};
	}
};

rummy.getNewReentryPlayersRoundScores = function(){
	var rounds,
		maxScore = 0,
		players = this.model.players,
		playersLength = players.length,
		i,
		lastRoundScore;
	for (i = 0; i < playersLength; i++) {
		if(players[i].totalScore < this.model.settings.gameScore){
			if(players[i].totalScore > maxScore){
				rounds = JSON.parse(JSON.stringify(players[i].rounds));
				maxScore = players[i].totalScore;
			}
		}
	}

	if(rounds && rounds.length > 0) {
		console.log("Incrementing the last round score by 1 ");
		lastRoundScore = +rounds[rounds.length - 1];
		rounds[rounds.length - 1] = (lastRoundScore + 1) + "";
	}

	return rounds;
};

rummy.removePlayer = function(index){
	var rounds = this.model.rounds,
		roundsLength = rounds.length,
		i;

	console.log("Removing player " + rummy.model.players[index]);

	for (var i = 0; i < roundsLength; i++) {
		rounds[i].splice(index, 1);
	};

	rummy.model.players.splice(index, 1);
	rummy.saveModel();
	rummy.showPage();
};

rummy.reEnterPlayer = function(index) {
	console.log("Re entering player " + rummy.model.players[index]);
	var name = rummy.model.players[index].name
		player = {'name': name};
	this.removePlayer(index);
	this.addPlayer(player);
};

rummy.startGame = function() {
	rummy.model.gameInProgress = true;
	rummy.saveModel();
	window.location.hash = '#scoreCard';	
};

rummy.bindEvents = function() {
	
	$(window).on('hashchange', function(){
		rummy.showPage();
	});

	$box.on('submit', 'form[name="scoreSettings"]', function(e){
		e.preventDefault();
		rummy.model.settings = $(this).serializeObject();
		rummy.saveModel();
		var $button = $(this).find('button');
		$button.text("Saved");
		setTimeout(function(){
			$button.text("Save Game Settings");
		}, 1000);
	});

	$box.on('submit', 'form[name="newGame"]', function(e){
		e.preventDefault();
		if(rummy.model.players.length < 2){
			if(fbi){
				FB.getLoginStatus(function(response) {
				  	if (response.status === 'connected') {
				    	rummy.fb.userId = response.authResponse.userID;
				    	rummy.fb.accessToken = response.authResponse.accessToken;
				    	console.log('User['+rummy.fb.userId+'] is logged into facebook.');
				    	/* make the API call */
						FB.api('/me', function(response) {
							rummy.model.players.push(response.name);
							rummy.saveModel();
							window.location.hash = '#players';
						});
				  	} else {
				  		console.log('You are currently not logged in to facebook.');
				  		window.location.hash = '#loginToFB';
				  	}
				});
			}else{
				window.location.hash = '#players';
			}
		}else{
			rummy.startGame();
		}
	});

	if(fbi){
		$box.on('click', '#loginToFB button.cta', function(){
			FB.login(function(response) {
			   if (response.authResponse) {
			   		console.log('Welcome!  Fetching your information.... ');
			     	window.location.hash = '#newGame';
			   } else {
			   		console.log('User cancelled login or did not fully authorize.');
			   		//TODO handle this scenario
			   }
			});
		});
	}

	if(fbi){
		$box.on('blur','input[name="playerName"]', function(){
			rummy.getFBFriendLists($(this).val());
		});
	}

	$box.on('submit', 'form[name="addPlayer"]', function(e){
		e.preventDefault();
		var data = $(this).serializeObject();
		rummy.addPlayer(data);
	});

	$box.on('submit', 'form[name=saveRoundScore]', function(e){
		e.preventDefault();
		var data = $(this).serializeObject();
		console.log("Saving round score");
		console.log(data.roundScores);
		// var roundScores = [];
		// var scoresLength = data.roundScores.length;

		// for (var i = 0; i < scoresLength; i++) {
		// 	roundScores.push(+data.roundScores[i]);
		// };
		// console.log("Converting serialized text scores to numbers");
		// console.log(roundScores);

		rummy.addRoundScores(data.roundScores);
		rummy.saveModel();
		window.location.hash = '#scoreCard';
	});

	$box.on('click', 'button.remove', function(e){
		e.preventDefault();
		var index = $(this).data('playerIndex');
		rummy.removePlayer(index);
	});

	$box.on('click', 'button.re-enter', function(e){
		e.preventDefault();
		var index = $(this).data('playerIndex');
		rummy.reEnterPlayer(index);
	});

	$box.on('click', 'button.hash', function(e){
		e.preventDefault();
		window.location.hash = $(this).data('hash');
	});

	$box.on('click', '#js-abandon', function(e){
		console.log("Abandoning current game");
		rummy.resetScores();
		if(rummy.model.players.length < 2){ 
			window.location.hash = '#players'
		} else {
			rummy.startGame();
		}
	});

	$('#box').on('click', 'ul.hamburger', function(){
		$('#box').toggleClass('menu-open');
	});

};

