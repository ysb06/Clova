const waitingMusic = 'https://www.sample-videos.com/audio/mp3/crowd-cheering.mp3'
const uuid = require('uuid').v4;
const timeUtil = require('date-utils');
const { DOMAIN } = require('../config');

class ClovaResult {
	constructor (request) {
		let attributes = {
			"formerIntent": 'NaN',
			"recommendation": 0,
			"recipe": "NaN",
			"step": 0
		}
		// Attribute 초기화, Attribute가 없으면 에러로 인한 무시
		try {
			attributes.recommendation = request.body.session.sessionAttributes.recommendation;
			attributes.recipe = request.body.session.sessionAttributes.recipe;
			attributes.step = request.body.session.sessionAttributes.step;
		} catch (e) {
			console.log(e);
		}
		// Result 속성 정의
		this.result = {
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
		}
	}
	
	addSimpleSpeech(text) {
		let plainText = {
			type: 'PlainText',
			lang: 'ko',
			value: text,
		};
		
		this.result.response.outputSpeech.values.push(plainText);
	}
	
	addPlayDirective(url) {
		let directive = {
			header: {
				namespace: "AudioPlayer",
				name: "Play"
			},
			payload: {
				audioItem: {
					audioItemId: uuid(),
					episodeId: 22346122,
					stream: {
						beginAtInMilliseconds: 0,
						episodeId: 22346122,
						playType: "NONE",
						token: uuid(),
						url: url,
						urlPlayable: true
					},
					titleSubText1: 'Yori',
					titleText: 'Waiting...',
					type: 'custom'
				},
				playBehavior: "REPLACE_ALL",
				source: {
					name: "모두의 요리사"
				}
			}
		};
		
		this.result.response.directives.push(directive);
	}
}

exports.clovaFulfillment = function (req, res) {
	let cDate = new Date();
	console.log('Time: ' + cDate.toFormat('YYYY-MM-DD HH24:MI:SS'));
	let params = req.body;
	console.log('Request in -->\n' + params);
	
	let clovaReq = 'NaN';
	
	try {
		clovaReq = params.request.type;
	} catch (e) {
		console.log(e);
	}
	
	let clovaResponse = new ClovaResult(req);
	//----------------- intent 및 event 처리 -------------------//
	console.log('\n\n');
	switch(clovaReq) {
		case 'LaunchRequest':
			clovaResponse.addSimpleSpeech('아무 말이나 해보세요.');
			break;
		case 'EventRequest':
			let clovaEvent = params.request.event.name;
			console.log('Event --> ' + clovaEvent);
			clovaResponse.addSimpleSpeech('아직 뭘 해야 할지 모르겠네요.');
			break;
		case 'IntentRequest':
			let intent = params.request.intent.name;
			clovaResponse.addSimpleSpeech(intent + ' 인텐트. 샘플 노래를 재생합니다.');
			clovaResponse.addPlayDirective(waitingMusic);
			break;
		default:
			clovaResponse.addSimpleSpeech('에러가 발생했습니다.');
			console.log('Request --> ' + clovaReq);
			break;
	}	
	//----처리 완료----//

	console.log('Response out -->');
	console.log(clovaResponse.result);
	/*
	console.log(result.response.outputSpeech.values);
	console.log('<-- Directives -->');
	console.log(result.response.directives);
	console.log(result.response.directives[0].payload);
	*/
	res.json(clovaResponse.result);
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
		header: {
			namespace: "AudioPlayer",
			name: "Play"
		},
		payload: {
			audioItem: {
				audioItemId: uuid(),
				episodeId: 22346122,
				stream: {
					beginAtInMilliseconds: 0,
					episodeId: 22346122,
					playType: "NONE",
					token: uuid(),
					url: url,
					urlPlayable: true
				},
				titleSubText1: 'ysb',
				titleText: 'Waiting...',
				type: 'custom'
			},
			playBehavior: "REPLACE_ALL",
			source: {
				name: "모두의 요리사"
			}
		}
	}
	
	return directive;
}