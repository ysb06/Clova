exports.clovaFulfillment = function (req, res) {
	let timeUtil = require('date-utils');
	let cDate = new Date();
	
	let attributes = {
		"formerIntent": 'NaN',
		"recommendation": 0,
		"recipe": "NaN",
		"step": 0
	}
	let params = req.body;
	
	try {
		let formerAttributes = params.session.sessionAttributes;
		
		attributes.recommendation = formerAttributes.recommendation;
		attributes.recipe = formerAttributes.recipe;
		attributes.step = formerAttributes.step;
	} catch (e) {
		console.log(e);
	}
	
	try {
		let intent = params.request.intent.name;
		
		attributes.formerIntent = intent;
	} catch (e) {
		console.log(e);
	}
	
	
	console.log('Time: ' + cDate.toFormat('YYYY-MM-DD HH24:MI:SS'));	
	console.log('Intent: ' + attributes.formerIntent);	
	
	result = initializeJSON(attributes);
	result.response.outputSpeech.values.push(getSpeech('테스트 중입니다.'));
	result.response.outputSpeech.values.push(getURL('테스트 중입니다.'));
	
	res.json(result);
};

function initializeJSON(attributes) {
	let result = {
		"version": "0.1.0",
		"sessionAttributes": attributes,
		"response": {
			"outputSpeech": {
				"type": "SpeechList",
				"values": []
			},
			"card": {},
			"directives": [],
			"shouldEndSession": false
		}
	};
	
	return result;
}


function getSpeech(text) {
	return {
        type: 'PlainText',
        lang: 'ko',
        value: text,
	};
}

function getURL(url) {
	return {
        type: 'URL',
        lang: '',
        value: 'https://www.sample-videos.com/audio/mp3/crowd-cheering.mp3',
	};
}

