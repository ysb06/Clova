const waitingMusic = 'https://www.sample-videos.com/audio/mp3/crowd-cheering.mp3'
const uuid = require('uuid').v4;
const timeUtil = require('date-utils');
const { DOMAIN } = require('../config');

exports.clovaFulfillment = function (req, res) {
	let cDate = new Date();
	let attributes = {
		"formerIntent": 'NaN',
		"recommendation": 0,
		"recipe": "NaN",
		"step": 0
	}
	let params = req.body;
	console.log('Request in -->');
	console.log(params);
	
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
	
	//intent request와 event Request는 다르게 처리해야 함
	
	console.log('\nTime: ' + cDate.toFormat('YYYY-MM-DD HH24:MI:SS'));	
	console.log('Intent: ' + attributes.formerIntent);	
	
	let result = initializeJSON(attributes);
	//----------------- intent 및 event 처리 -------------------//
	
	result.response.outputSpeech.values.push(getSpeech('테스트 중입니다.'));
	//result.response.outputSpeech.values.push(getURL(waitingMusic));
	
	result.response.directives.push(getPlayDirective(waitingMusic));
	
	//----처리 완료----//
	console.log('Response out -->');
	console.log(result);
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
	let plainText = {
        type: 'PlainText',
        lang: 'ko',
        value: text,
	}
	
	return plainText;
}

function getURL(url) {
	let urlObj = {
        type: 'URL',
        lang: '',
        value: url,
	}
	
	return urlObj;
}

function getPlayDirective(url) {
	let directive = {
		namespace: 'AudioPlayer',
		name: 'Play',
		payload: {
			audioItem: {
				audioItemId: uuid(),
				stream: {
					beginAtInMilliseconds: 0,
					episodeId: 22346122,
					playType: "NONE",
					token: uuid(),
					url: url,
					urlPlayable: true
				},
				titleText: 'Waiting...',
				titleSubText1: 'ysb',
				type: 'custom'
			},
			playBehavior: "REPLACE_ALL",
			source: {
				name: "모두요리"
			}
		}
	}
	
	return directive;
}