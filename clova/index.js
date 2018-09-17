const waitingMusic = 'https://www.sample-videos.com/audio/mp3/crowd-cheering.mp3'
const uuid = require('uuid').v4;
const timeUtil = require('date-utils');
const { DOMAIN } = require('../config');

const sessionExpireTime = 600000;

let fullfilmentsResult = new Array();		//기억 중인 세션, 10분 후 저장된 세션은 Disable 됨

class ClovaResult {
	constructor (request, timeStamp) {
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
				"card": {},
				"directives": [],
				"shouldEndSession": false
			}
		}
		
		this.sessionID = 'NaN';
		this.audioToken = 'NaN';
		this.timeID = timeStamp;
		try {
			this.sessionID = request.body.session.sessionId;
			this.audioToken = request.body.context.AudioPlayer.token;
		} catch (e) {
			console.log(e);
		}
		
		this.intent = 'NaN';
		this.clovaEvent = 'NaN';
		try {
			this.intent = request.body.request.intent.name;
		} catch (e) {
			console.log(e);
		}
		try {
			this.clovaEvent = request.body.request.event.name;
		} catch (e) {
			console.log(e);
		}
	}
	
	initializeResult() {
		this.result.response = {
				"card": {},
				"directives": [],
				"shouldEndSession": false
			}
	}
	
	addSimpleSpeech(text) {
		let plainText = {
			type: 'PlainText',
			lang: 'ko',
			value: text,
		};
		
		if(this.result.response.outputSpeech === undefined) {
			this.result.response.outputSpeech = {
					"type": "SpeechList",
					"values": []
				};
		}
		
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
					stream: {
						beginAtInMilliseconds: 0,
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
	
	//'Pause', 'Resume', 'Stop'
	addPlayControllerDirective(text) {
		let directive = {
			header: {
				namespace: "PlaybackController",
				name: text,
				dialogRequestId: uuid(),
				messageId: uuid()
			},
			"payload": {}
		};
		
		this.result.response.directives.push(directive);
	}
	
	setDialogueEnd() {
		this.result.response.shouldEndSession = true;
	}
}

exports.clovaFulfillment = function (req, res) {
	//현 함수에서는 다음과 같은 기능을 정의하고 있음
	//대화 처리 준비, 대화 세션 저장 및 불러오기, 새 대화일 경우 대화 생성, 최종 Result를 Response, 수신 및 송신 로그 출력
	let cDate = new Date();
	console.log('\n--------------------- ' + cDate.toFormat('YYYY-MM-DD HH24:MI:SS') + ' (' +cDate.getTime() + ') ---------------------');
	let params = req.body;
	console.log('Request in -->\n');
	console.log(params);
	let clovaReq = 'NaN';
	let isIntent = true;
	
	try {
		clovaReq = params.request.type;
	} catch (e) {
		console.log(e);
	}
	
	let sessionID = 'NaN';
	let audioToken = 'NaN';
	try {
		sessionID = params.session.sessionId;
		audioToken = params.context.AudioPlayer.token;
	} catch (e) {
		console.log(e);
	}
	
	console.log('\n');
	let clovaResponse;		//현재 대화
	let newResults = new Array();
	fullfilmentsResult.forEach(result => {
		if((sessionID == result.sessionID || audioToken == result.audioToken) && !(audioToken == 'NaN')) {
			clovaResponse = result;
			result.sessionID = sessionID;
		}
		if(cDate.getTime() - result.timeID < sessionExpireTime) {
			result.initializeResult();
			newResults.push(result);
		}
	});
	if(clovaResponse === undefined) {
		clovaResponse = new ClovaResult(req, cDate.getTime());
		console.log('New Dialogue');
		newResults.push(clovaResponse);
	}
	console.log('Current Dialogue--> ' + clovaResponse.sessionID + ', ' + clovaResponse.audioToken);
	fullfilmentsResult = newResults;
	console.log('Active --> ' + fullfilmentsResult.length)

	//----------------- intent 및 event 처리 -------------------//
	clovaResponse = detectIntent(clovaReq, clovaResponse);
	//----처리 완료----//

	console.log('\nResponse out -->');
	console.log(clovaResponse.result);
	/*
	console.log(result.response.outputSpeech.values);
	console.log('<-- Directives -->');
	console.log(result.response.directives);
	console.log(result.response.directives[0].payload);
	*/
	if(isIntent)
		res.json(clovaResponse.result);
	console.log('-------------------------------------------------------------------------------\n');
};

//-------------------- Intent 처리 --------------------//

function detectIntent(requestType, clovaResponse) {
	switch(requestType) {
		case 'LaunchRequest':
			clovaResponse.addSimpleSpeech('아무 말이나 해보세요.');
			clovaResponse.addPlayDirective(waitingMusic);
			console.log('LaunchRequest --> ');
			clovaResponse.setDialogueEnd();
			break;
		case 'EventRequest':
			let clovaEvent = clovaResponse.clovaEvent;
			console.log('Event --> ' + clovaEvent);
			isIntent = false;
			break;
		case 'IntentRequest':
			let intent = clovaResponse.intent;
			clovaResponse.addSimpleSpeech(intent + ' 인텐트. 샘플 노래를 재생합니다.');
			clovaResponse.addPlayDirective(waitingMusic);
			console.log('Intent --> ' + intent);
			break;
		default:
			clovaResponse.addSimpleSpeech('에러가 발생했습니다.');
			console.log('Other Request --> ' + requestType);
			break;
	}
	
	return clovaResponse;
}
//-------------------- 사용 되지 않는 코드 --------------------//

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

//코멘트
//하나의 방법은 노래를 들려주고 정지(또는 일시정지) 이벤트 발생 시 계속 진행, 진행 사항은 글로벌로 저장
//추후 로그인도 구현하여 개인별로 동작 가능하도록 설계