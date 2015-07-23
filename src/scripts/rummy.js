var rummy =  rummy || {},
	$box = $('#box'),
	$page = $('#page'),
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
	this.template = this["src/templates/rummy.hbs"];
};


rummy.initPageNames = function(){
	$page.html(this.template(this.model));
	rummy.pages = [];
	$page.find('.page').each(function(){rummy.pages.push('#'+this.id);});
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

	$page.html(this.template(this.model))
		.find('.page')
		.fadeOut(animationDelay)
		.delay(animationDelay)
		.filter(pageName)
		.fadeIn(function(){
			window.scrollTo(0,0);
			var title = $page.find('h1:visible').text();
			if(title !== "Rummy"){
				title = "Rummy " + title;
			}
			$('title').text(title);
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

	if(rummy.model.players.length < 2) {
		rummy.resetScores();
		rummy.model.gameInProgress = false;
		rummy.model.winner = undefined;
	}
	
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
	rummy.model.winner = undefined;
	rummy.saveModel();
	window.location.hash = '#scoreCard';	
};

rummy.isThereAWinner = function() {
	var players = this.model.players,
		playersLength = players.length,
		i,
		activePlayers = [];
	for (i = 0; i < playersLength; i++){
		if(players[i].totalScore < this.model.settings.gameScore){
			activePlayers.push(players[i]);
		}
	}
	if(activePlayers.length == 1){
		rummy.model.winner = activePlayers[0];
		rummy.model.gameInProgress = false;
		rummy.saveModel();
		return true;
	}
	return false;
};

rummy.bindEvents = function() {
	
	var hashMenuOpen = undefined;

	$(window).on('hashchange', function(){
		if(window.location.hash != '#menu') {
			if($box.hasClass('menu-open')){
				$('ul.hamburger').trigger('click');
			}
			rummy.showPage();
		}
	});

	$(document).on('click', '.js-hash', function(e){
		e.preventDefault();
		if($(this).parent().attr('class') == 'menu'){
			$(this).closest('.menu-open').removeClass('menu-open');
		}
		window.location.hash = $(this).data('hash');
	});

	$page.on('submit', 'form[name="scoreSettings"]', function(e){
		e.preventDefault();
		rummy.model.settings = $(this).serializeObject();
		rummy.saveModel();
		var $button = $(this).find('button');
		$button.text("Saved");
		setTimeout(function(){
			$button.text("Save Game Settings");
		}, 1000);
	});

	$page.on('submit', 'form[name="newGame"]', function(e){
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
		$page.on('click', '#loginToFB button.cta', function(){
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
		$page.on('blur','input[name="playerName"]', function(){
			rummy.getFBFriendLists($(this).val());
		});
	}

	$page.on('submit', 'form[name="addPlayer"]', function(e){
		e.preventDefault();
		var data = $(this).serializeObject();
		rummy.addPlayer(data);
	});

	$page.on('submit', 'form[name=saveRoundScore]', function(e){
		e.preventDefault();
		var data = $(this).serializeObject();
		console.log("Saving round score");
		console.log(data.roundScores);
		rummy.addRoundScores(data.roundScores);
		rummy.saveModel();
		if(rummy.isThereAWinner()){
			window.location.hash = '#winner';
		}else{
			window.location.hash = '#scoreCard';
		}
	});

	$page.on('click', '.js-remove', function(e){
		e.preventDefault();
		var index = $(this).data('playerIndex');
		rummy.removePlayer(index);
	});

	$page.on('click', '.js-re-enter', function(e){
		e.preventDefault();
		var index = $(this).data('playerIndex');
		rummy.reEnterPlayer(index);
	});

	$page.on('click', '#js-abandon', function(e){
		e.preventDefault();
		console.log("Abandoning current game");
		rummy.resetScores();
		if(rummy.model.players.length < 2){ 
			window.location.hash = '#players'
		} else {
			rummy.startGame();
		}
	});

	$box.on('click', 'ul.hamburger', function(){
		$box.toggleClass('menu-open');
		if(hashMenuOpen == undefined){
			hashMenuOpen = window.location.hash;
			window.location.hash = '#menu';
		}else{
			hashMenuOpen = undefined;
		}
	});

};

